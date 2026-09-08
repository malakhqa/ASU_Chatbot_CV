"""CV endpoints: list, create, AI-generate, read, update, analyze, PDF."""

from __future__ import annotations

import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import AI, CurrentUser
from app.database import get_db
from app.models import CV, User
from app.schemas.analysis import AnalysisResponse, AnalyzeRequest
from app.schemas.cv import (
    CVContent,
    CVCreateRequest,
    CVResponse,
    CVSummary,
    CVUpdateRequest,
    CVVersionResponse,
)
from app.services import analysis_service, cv_service, pdf_service
from app.services.ai_service import AIError
from app.services.job_service import JobNotFoundError

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


@router.post("/analyze", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
def analyze_cv(
    payload: AnalyzeRequest, current_user: CurrentUser, db: DbSession, ai: AI
) -> AnalysisResponse:
    try:
        analysis = analysis_service.analyze_cv(
            db, current_user, ai, payload.cv_id, payload.job_description_id
        )
    except cv_service.CVNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found") from None
    except JobNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job description not found"
        ) from None
    except AIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"CV analysis failed: {exc}",
        ) from exc
    return AnalysisResponse.model_validate(analysis)


@router.get("/{cv_id}", response_model=CVResponse)
def get_cv(cv_id: int, current_user: CurrentUser, db: DbSession) -> CVResponse:
    cv = _get_or_404(db, current_user, cv_id)
    return cv_service.to_response(db, cv)


def _pdf_filename(title: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9._-]+", "-", (title or "").strip()).strip("-") or "cv"
    return f"{slug[:80]}.pdf"


@router.get(
    "/{cv_id}/pdf",
    response_class=Response,
    responses={200: {"content": {"application/pdf": {}}}},
)
def download_cv_pdf(cv_id: int, current_user: CurrentUser, db: DbSession) -> Response:
    cv = _get_or_404(db, current_user, cv_id)
    version = cv_service.get_current_version(db, cv)
    content = CVContent.model_validate(version.content) if version is not None else CVContent()
    pdf_bytes = pdf_service.render_cv_pdf(cv_title=cv.title, content=content, template=cv.template)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{_pdf_filename(cv.title)}"'},
    )


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


@router.get("/{cv_id}/versions", response_model=list[CVVersionResponse])
def list_versions(cv_id: int, current_user: CurrentUser, db: DbSession) -> list[CVVersionResponse]:
    cv = _get_or_404(db, current_user, cv_id)
    return [CVVersionResponse.model_validate(v) for v in cv_service.list_versions(db, cv)]


@router.get("/{cv_id}/versions/{version_number}", response_model=CVVersionResponse)
def get_version(
    cv_id: int, version_number: int, current_user: CurrentUser, db: DbSession
) -> CVVersionResponse:
    cv = _get_or_404(db, current_user, cv_id)
    try:
        version = cv_service.get_version(db, cv, version_number)
    except cv_service.CVVersionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="CV version not found"
        ) from None
    return CVVersionResponse.model_validate(version)


@router.post("/{cv_id}/versions/{version_number}/restore", response_model=CVResponse)
def restore_version(
    cv_id: int, version_number: int, current_user: CurrentUser, db: DbSession
) -> CVResponse:
    _get_or_404(db, current_user, cv_id)
    try:
        cv = cv_service.restore_version(db, current_user, cv_id, version_number)
    except cv_service.CVVersionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="CV version not found"
        ) from None
    return cv_service.to_response(db, cv)


@router.get("/{cv_id}/analyses", response_model=list[AnalysisResponse])
def list_cv_analyses(
    cv_id: int, current_user: CurrentUser, db: DbSession
) -> list[AnalysisResponse]:
    _get_or_404(db, current_user, cv_id)
    return [
        AnalysisResponse.model_validate(a)
        for a in analysis_service.list_analyses_for_cv(db, current_user, cv_id)
    ]
