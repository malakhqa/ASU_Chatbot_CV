"""CV creation, generation, retrieval, and section editing.

All CV content lives in ``CVVersion`` rows. ``CV.current_version_number`` points
at the active one; every content change adds a new version and moves the pointer.
The chatbot never calls into the database directly — it comes through here.
"""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import CV, CVVersion, User
from app.models.enums import CVVersionSource
from app.schemas.cv import CVContent, CVPersonalInfo, CVResponse, CVVersionResponse
from app.schemas.profile import ProfileResponse
from app.services import ai_service, profile_service
from app.services.prompt_builder import GUARDRAILS, build_context

GENERATION_TASK = (
    "Produce a complete, professional CV as structured JSON from the career profile "
    "above. Rephrase the user's real information into strong, concise CV wording and "
    "a professional summary. Include every section for which the profile has data; "
    "leave a section empty if the profile has none. Do not add any information, "
    "skill, role, date, or achievement that is not present in the profile."
)


class CVNotFoundError(Exception):
    """Raised when a CV does not exist or is not owned by the caller."""


class CVVersionNotFoundError(Exception):
    """Raised when a CV has no version with the requested number."""


# --- internals ------------------------------------------------------------------


def _next_version_number(db: Session, cv: CV) -> int:
    highest = db.scalar(select(func.max(CVVersion.version_number)).where(CVVersion.cv_id == cv.id))
    return (highest or 0) + 1


def _add_version(
    db: Session,
    cv: CV,
    content: CVContent,
    source: CVVersionSource,
    *,
    note: str | None = None,
) -> CVVersion:
    number = _next_version_number(db, cv)
    version = CVVersion(
        cv_id=cv.id,
        version_number=number,
        content=content.model_dump(mode="json"),
        source=source,
        note=note,
    )
    db.add(version)
    cv.current_version_number = number
    db.add(cv)
    return version


def _personal_info_from_profile(profile: object) -> CVPersonalInfo:
    """Contact block is taken verbatim from the profile, never from the model."""
    return CVPersonalInfo(
        full_name=getattr(profile, "full_name", None),
        email=getattr(profile, "email", None),
        phone=getattr(profile, "phone", None),
        location=getattr(profile, "location", None),
        linkedin=getattr(profile, "linkedin", None),
        github=getattr(profile, "github", None),
        website=getattr(profile, "website", None),
    )


# --- reads --------------------------------------------------------------------


def list_cvs(db: Session, user: User) -> list[CV]:
    return list(
        db.scalars(select(CV).where(CV.user_id == user.id).order_by(CV.updated_at.desc())).all()
    )


def get_cv(db: Session, user: User, cv_id: int) -> CV:
    cv = db.scalar(select(CV).where(CV.id == cv_id, CV.user_id == user.id))
    if cv is None:
        raise CVNotFoundError(cv_id)
    return cv


def get_current_version(db: Session, cv: CV) -> CVVersion | None:
    if cv.current_version_number is None:
        return None
    return db.scalar(
        select(CVVersion).where(
            CVVersion.cv_id == cv.id,
            CVVersion.version_number == cv.current_version_number,
        )
    )


def list_versions(db: Session, cv: CV) -> list[CVVersion]:
    """All versions of a CV, newest first."""
    return list(
        db.scalars(
            select(CVVersion)
            .where(CVVersion.cv_id == cv.id)
            .order_by(CVVersion.version_number.desc())
        ).all()
    )


def get_version(db: Session, cv: CV, version_number: int) -> CVVersion:
    version = db.scalar(
        select(CVVersion).where(
            CVVersion.cv_id == cv.id,
            CVVersion.version_number == version_number,
        )
    )
    if version is None:
        raise CVVersionNotFoundError(version_number)
    return version


def to_response(db: Session, cv: CV) -> CVResponse:
    version = get_current_version(db, cv)
    return CVResponse(
        id=cv.id,
        title=cv.title,
        template=cv.template,
        current_version_number=cv.current_version_number,
        created_at=cv.created_at,
        updated_at=cv.updated_at,
        current_version=CVVersionResponse.model_validate(version) if version else None,
    )


# --- writes -------------------------------------------------------------------


def create_cv(db: Session, user: User, *, title: str, template: str) -> CV:
    cv = CV(user_id=user.id, title=title, template=template)
    db.add(cv)
    db.flush()
    _add_version(db, cv, CVContent(), CVVersionSource.MANUAL_EDIT, note="Created")
    db.commit()
    db.refresh(cv)
    return cv


def generate_cv(
    db: Session,
    user: User,
    ai: ai_service.AIClient,
    *,
    title: str,
    template: str,
) -> CV:
    profile = profile_service.get_or_create_profile(db, user)
    profile_data = ProfileResponse.model_validate(profile).model_dump(mode="json")
    prompt = build_context(profile=profile_data, task=GENERATION_TASK)

    content = ai.generate_structured(prompt, CVContent, system=GUARDRAILS)
    content.personal_info = _personal_info_from_profile(profile)

    cv = CV(user_id=user.id, title=title, template=template)
    db.add(cv)
    db.flush()
    _add_version(db, cv, content, CVVersionSource.GENERATED, note="AI generated")
    db.commit()
    db.refresh(cv)
    return cv


def update_cv(
    db: Session,
    user: User,
    cv_id: int,
    *,
    title: str | None = None,
    template: str | None = None,
    content: CVContent | None = None,
    note: str | None = None,
) -> CV:
    cv = get_cv(db, user, cv_id)
    if title is not None:
        cv.title = title
    if template is not None:
        cv.template = template
    if content is not None:
        _add_version(db, cv, content, CVVersionSource.MANUAL_EDIT, note=note)
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return cv


def append_version(
    db: Session,
    user: User,
    cv_id: int,
    content: CVContent,
    source: CVVersionSource,
    *,
    note: str | None = None,
) -> CV:
    """Owner-checked public wrapper around ``_add_version`` for other services."""
    cv = get_cv(db, user, cv_id)
    _add_version(db, cv, content, source, note=note)
    db.commit()
    db.refresh(cv)
    return cv


def restore_version(db: Session, user: User, cv_id: int, version_number: int) -> CV:
    """Append a new version whose content is copied from ``version_number``."""
    cv = get_cv(db, user, cv_id)
    target = get_version(db, cv, version_number)
    content = CVContent.model_validate(target.content)
    _add_version(
        db,
        cv,
        content,
        CVVersionSource.RESTORE,
        note=f"Restored from v{version_number}",
    )
    db.commit()
    db.refresh(cv)
    return cv
