"""CV endpoints: list, create, AI-generate, read, update."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import AI, CurrentUser
from app.database import get_db
from app.models import CV, User
from app.schemas.cv import CVCreateRequest, CVResponse, CVSummary, CVUpdateRequest
from app.services import cv_service
from app.services.ai_service import AIError

router = APIRouter(prefix="/cv", tags=["cv"])

DbSession = Annotated[Session, Depends(get_db)]


def _get_or_404(db: Session, user: User, cv_id: int) -> CV:
    try:
        return cv_service.get_cv(db, user, cv_id)
    except cv_service.CVNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found") from None


@router.get("", response_model=list[CVSummary])
def list_cvs(current_user: CurrentUser, db: DbSession) -> list[CVSummary]:
    return [CVSummary.model_validate(cv) for cv in cv_service.list_cvs(db, current_user)]


@router.post("", response_model=CVResponse, status_code=status.HTTP_201_CREATED)
def create_cv(payload: CVCreateRequest, current_user: CurrentUser, db: DbSession) -> CVResponse:
    cv = cv_service.create_cv(db, current_user, title=payload.title, template=payload.template)
    return cv_service.to_response(db, cv)


@router.post("/generate", response_model=CVResponse, status_code=status.HTTP_201_CREATED)
def generate_cv(
    payload: CVCreateRequest, current_user: CurrentUser, db: DbSession, ai: AI
) -> CVResponse:
    try:
        cv = cv_service.generate_cv(
            db, current_user, ai, title=payload.title, template=payload.template
        )
    except AIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"CV generation failed: {exc}",
        ) from exc
    return cv_service.to_response(db, cv)


@router.get("/{cv_id}", response_model=CVResponse)
def get_cv(cv_id: int, current_user: CurrentUser, db: DbSession) -> CVResponse:
    cv = _get_or_404(db, current_user, cv_id)
    return cv_service.to_response(db, cv)


@router.put("/{cv_id}", response_model=CVResponse)
def update_cv(
    cv_id: int, payload: CVUpdateRequest, current_user: CurrentUser, db: DbSession
) -> CVResponse:
    _get_or_404(db, current_user, cv_id)
    cv = cv_service.update_cv(
        db,
        current_user,
        cv_id,
        title=payload.title,
        template=payload.template,
        content=payload.content,
        note=payload.note,
    )
    return cv_service.to_response(db, cv)
