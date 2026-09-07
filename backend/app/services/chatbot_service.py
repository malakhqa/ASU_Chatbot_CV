"""AI career chatbot: conversation persistence, context assembly, and the
structured CV-action protocol.

The model returns a :class:`ChatTurn` (reply + optional ``cv_action``). The
chatbot never touches CV data directly — a valid action is applied through
``cv_service.append_version`` as a new ``chat_edit`` version, which keeps the
change reviewable and reversible.
"""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import ChatMessage, Conversation, User
from app.models.enums import CVVersionSource, MessageRole
from app.schemas.chat import (
    ChatMessageResponse,
    ChatSendRequest,
    ChatSendResponse,
    ChatTurn,
    CVAction,
)
from app.schemas.cv import CVContent
from app.schemas.job import JobDescriptionResponse
from app.schemas.profile import ProfileResponse
from app.services import ai_service, cv_service, job_service, profile_service
from app.services.prompt_builder import GUARDRAILS, build_context

_HISTORY_LIMIT = 20
_LIST_SECTIONS = {"skills", "education", "experience", "projects", "certifications", "languages"}

CHATBOT_SYSTEM = (
    GUARDRAILS + "\n\nYou are the in-app AI Career Assistant chatbot. Answer career questions "
    "and help the user improve their CV. Be concise and practical."
)

CHATBOT_TASK = (
    "Respond to the user's latest message. If — and only if — the user is asking to "
    "change their CV, set cv_action to a structured action: section is one of "
    "summary, skills, education, experience, projects, certifications, languages; "
    "action is one of add, remove, replace, update; content is the value to apply "
    "and must be drawn only from information the user has actually provided. "
    "Otherwise leave cv_action null. Always write a helpful reply."
)


class ConversationNotFoundError(Exception):
    """Raised when a conversation does not exist or is not owned by the caller."""


class InvalidCVActionError(Exception):
    """Raised when a proposed CV action cannot be validated/applied."""


# --- conversation reads -----------------------------------------------------


def list_conversations(db: Session, user: User) -> list[Conversation]:
    return list(
        db.scalars(
            select(Conversation)
            .where(Conversation.user_id == user.id)
            .order_by(Conversation.updated_at.desc(), Conversation.id.desc())
        ).all()
    )


def get_conversation(db: Session, user: User, conversation_id: int) -> Conversation:
    conv = db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id,
        )
    )
    if conv is None:
        raise ConversationNotFoundError(conversation_id)
    return conv


def delete_conversation(db: Session, user: User, conversation_id: int) -> None:
    db.delete(get_conversation(db, user, conversation_id))
    db.commit()


# --- action application -------------------------------------------------------


def _match_key(payload: object) -> str:
    if isinstance(payload, dict):
        for field in ("name", "title", "institution", "company"):
            if payload.get(field):
                return str(payload[field]).strip().lower()
        return ""
    return str(payload).strip().lower()


def _item_matches(item: object, key: str) -> bool:
    if not key:
        return False
    if isinstance(item, dict):
        return any(
            str(item.get(f, "")).strip().lower() == key
            for f in ("name", "title", "institution", "company")
        )
    return str(item).strip().lower() == key


def apply_cv_action(content: CVContent, action: CVAction) -> CVContent:
    """Return a new CVContent with ``action`` applied. Raises on invalid actions."""
    data = content.model_dump(mode="json")
    section, verb, payload = action.section, action.action, action.content

    if section == "summary":
        data["summary"] = "" if verb == "remove" else str(payload or "")
        return _validate(data)

    if section not in _LIST_SECTIONS:
        raise InvalidCVActionError(f"Unsupported section: {section!r}")

    items = list(data.get(section) or [])
    if verb == "replace":
        if not isinstance(payload, list):
            raise InvalidCVActionError("'replace' requires a list as content")
        items = payload
    elif verb == "add":
        if payload is None:
            raise InvalidCVActionError("'add' requires content")
        items.append(payload)
    elif verb == "update":
        if isinstance(payload, list):
            items = payload
        elif payload is not None:
            items.append(payload)
    elif verb == "remove":
        key = _match_key(payload)
        items = [it for it in items if not _item_matches(it, key)]

    data[section] = items
    return _validate(data)


def _validate(data: dict) -> CVContent:
    try:
        return CVContent.model_validate(data)
    except Exception as exc:  # pydantic ValidationError and friends
        raise InvalidCVActionError(str(exc)) from exc


# --- main entry point -------------------------------------------------------


def _get_or_create_conversation(
    db: Session, user: User, req: ChatSendRequest
) -> tuple[Conversation, bool]:
    if req.conversation_id is not None:
        return get_conversation(db, user, req.conversation_id), False
    title = " ".join(req.message.split())[:60] or "New conversation"
    conv = Conversation(user_id=user.id, title=title)
    db.add(conv)
    db.flush()
    return conv, True


def send_message(
    db: Session,
    user: User,
    ai: ai_service.AIClient,
    req: ChatSendRequest,
) -> ChatSendResponse:
    conv, _created = _get_or_create_conversation(db, user, req)

    cv = cv_service.get_cv(db, user, req.cv_id) if req.cv_id is not None else None
    job = job_service.get_job(db, user, req.job_description_id) if req.job_description_id else None

    db.add(ChatMessage(conversation_id=conv.id, role=MessageRole.USER, content=req.message))
    db.flush()

    profile = profile_service.get_or_create_profile(db, user)
    current_version = cv_service.get_current_version(db, cv) if cv is not None else None
    cv_content = current_version.content if current_version is not None else None
    history = [
        {"role": m.role.value, "content": m.content}
        for m in db.scalars(
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conv.id)
            .order_by(ChatMessage.id)
        ).all()
    ][-_HISTORY_LIMIT:]

    prompt = build_context(
        profile=ProfileResponse.model_validate(profile).model_dump(mode="json"),
        cv_content=cv_content,
        job=JobDescriptionResponse.model_validate(job).model_dump(mode="json") if job else None,
        history=history,
        task=CHATBOT_TASK,
    )
    turn: ChatTurn = ai.generate_structured(prompt, ChatTurn, system=CHATBOT_SYSTEM)

    reply = turn.reply
    applied = False
    cv_version_number: int | None = None

    if turn.cv_action is not None and cv is not None and current_version is not None:
        try:
            new_content = apply_cv_action(
                CVContent.model_validate(current_version.content), turn.cv_action
            )
            updated = cv_service.append_version(
                db,
                user,
                cv.id,
                new_content,
                CVVersionSource.CHAT_EDIT,
                note=f"Chat: {turn.cv_action.action} {turn.cv_action.section}",
            )
            applied = True
            cv_version_number = updated.current_version_number
        except InvalidCVActionError:
            reply = (
                f"{turn.reply}\n\n(Note: I could not apply that change automatically — "
                "please edit the CV directly.)"
            )

    assistant_msg = ChatMessage(
        conversation_id=conv.id,
        role=MessageRole.ASSISTANT,
        content=reply,
        action=turn.cv_action.model_dump(mode="json") if turn.cv_action is not None else None,
    )
    db.add(assistant_msg)
    conv.updated_at = func.now()  # bump so recent conversations sort first
    db.add(conv)
    db.commit()
    db.refresh(assistant_msg)

    return ChatSendResponse(
        conversation_id=conv.id,
        message=ChatMessageResponse.model_validate(assistant_msg),
        proposed_action=turn.cv_action,
        applied=applied,
        cv_version_number=cv_version_number,
    )
