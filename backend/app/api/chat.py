"""AI career chatbot endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.errors import ai_http_exception
from app.core.dependencies import AI, CurrentUser
from app.database import get_db
from app.schemas.chat import (
    ChatSendRequest,
    ChatSendResponse,
    ConversationResponse,
    ConversationSummary,
)
from app.services import chatbot_service, cv_service, job_service
from app.services.ai_service import AIError

router = APIRouter(prefix="/chat", tags=["chat"])

DbSession = Annotated[Session, Depends(get_db)]


@router.post("/message", response_model=ChatSendResponse)
def send_message(
    payload: ChatSendRequest, current_user: CurrentUser, db: DbSession, ai: AI
) -> ChatSendResponse:
    try:
        return chatbot_service.send_message(db, current_user, ai, payload)
    except chatbot_service.ConversationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        ) from None
    except cv_service.CVNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found") from None
    except job_service.JobNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job description not found"
        ) from None
    except AIError as exc:
        raise ai_http_exception(exc) from exc


@router.get("/conversations", response_model=list[ConversationSummary])
def list_conversations(current_user: CurrentUser, db: DbSession) -> list[ConversationSummary]:
    convs = chatbot_service.list_conversations(db, current_user)
    return [ConversationSummary.model_validate(c) for c in convs]


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: int, current_user: CurrentUser, db: DbSession
) -> ConversationResponse:
    try:
        conv = chatbot_service.get_conversation(db, current_user, conversation_id)
    except chatbot_service.ConversationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        ) from None
    return ConversationResponse.model_validate(conv)


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_conversation(conversation_id: int, current_user: CurrentUser, db: DbSession) -> Response:
    try:
        chatbot_service.delete_conversation(db, current_user, conversation_id)
    except chatbot_service.ConversationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        ) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
