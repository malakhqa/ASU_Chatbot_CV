"""Job description endpoints and job-specific CV customization."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.errors import ai_http_exception
from app.core.dependencies import AI, CurrentUser
from app.database import get_db
from app.schemas.cv import CVResponse
from app.schemas.job import CustomizeRequest, JobDescriptionCreate, JobDescriptionResponse
from app.services import cv_service, job_service
from app.services.ai_service import AIError
from app.services.job_service import JobNotFoundError

router = APIRouter(prefix="/jobs", tags=["jobs"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[JobDescriptionResponse])
def list_jobs(current_user: CurrentUser, db: DbSession) -> list[JobDescriptionResponse]:
    jobs_ = job_service.list_jobs(db, current_user)
    return [JobDescriptionResponse.model_validate(j) for j in jobs_]


@router.post("", response_model=JobDescriptionResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobDescriptionCreate, current_user: CurrentUser, db: DbSession
) -> JobDescriptionResponse:
    return JobDescriptionResponse.model_validate(job_service.create_job(db, current_user, payload))


@router.post("/customize", response_model=CVResponse)
def customize_cv(
    payload: CustomizeRequest, current_user: CurrentUser, db: DbSession, ai: AI
) -> CVResponse:
    try:
        cv, _job = job_service.customize_cv(db, current_user, ai, payload)
    except cv_service.CVNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found") from None
    except JobNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job description not found"
        ) from None
    except AIError as exc:
        raise ai_http_exception(exc) from exc
    return cv_service.to_response(db, cv)


@router.get("/{job_id}", response_model=JobDescriptionResponse)
def get_job(job_id: int, current_user: CurrentUser, db: DbSession) -> JobDescriptionResponse:
    try:
        return JobDescriptionResponse.model_validate(job_service.get_job(db, current_user, job_id))
    except JobNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job description not found"
        ) from None


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_job(job_id: int, current_user: CurrentUser, db: DbSession) -> Response:
    try:
        job_service.delete_job(db, current_user, job_id)
    except JobNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job description not found"
        ) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
