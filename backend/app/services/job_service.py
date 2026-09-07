"""Job descriptions and job-specific CV customization."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CV, JobDescription, User
from app.models.enums import CVVersionSource
from app.schemas.cv import CVContent
from app.schemas.job import CustomizeRequest, JobDescriptionCreate, JobDescriptionResponse
from app.services import ai_service, cv_service
from app.services.prompt_builder import GUARDRAILS, build_context

CUSTOMIZE_TASK = (
    "Rewrite the CV above so it targets the job description. Reorder and rephrase to "
    "emphasize the experience, skills, and projects most relevant to this role, and "
    "surface keywords from the job that the CV genuinely supports. Keep the same "
    "factual content — do NOT add skills, experience, dates, or achievements the CV "
    "does not already contain. Return the full CV as structured JSON."
)


class JobNotFoundError(Exception):
    """Raised when a job description does not exist or is not owned by the caller."""


# --- CRUD -----------------------------------------------------------------------


def create_job(db: Session, user: User, data: JobDescriptionCreate) -> JobDescription:
    job = JobDescription(
        user_id=user.id,
        title=data.title,
        company=data.company,
        description=data.description,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def list_jobs(db: Session, user: User) -> list[JobDescription]:
    return list(
        db.scalars(
            select(JobDescription)
            .where(JobDescription.user_id == user.id)
            .order_by(JobDescription.created_at.desc(), JobDescription.id.desc())
        ).all()
    )


def get_job(db: Session, user: User, job_id: int) -> JobDescription:
    job = db.scalar(
        select(JobDescription).where(
            JobDescription.id == job_id,
            JobDescription.user_id == user.id,
        )
    )
    if job is None:
        raise JobNotFoundError(job_id)
    return job


def delete_job(db: Session, user: User, job_id: int) -> None:
    db.delete(get_job(db, user, job_id))
    db.commit()


# --- Customization ------------------------------------------------------------


def _resolve_job(db: Session, user: User, req: CustomizeRequest) -> JobDescription:
    if req.job_description_id is not None:
        return get_job(db, user, req.job_description_id)
    # schema guarantees job_description is set when the id is not
    return create_job(db, user, req.job_description)  # type: ignore[arg-type]


def customize_cv(
    db: Session,
    user: User,
    ai: ai_service.AIClient,
    req: CustomizeRequest,
) -> tuple[CV, JobDescription]:
    cv = cv_service.get_cv(db, user, req.cv_id)
    job = _resolve_job(db, user, req)

    version = cv_service.get_current_version(db, cv)
    current = CVContent.model_validate(version.content) if version is not None else CVContent()

    job_data = JobDescriptionResponse.model_validate(job).model_dump(mode="json")
    prompt = build_context(
        cv_content=current.model_dump(mode="json"),
        job=job_data,
        task=CUSTOMIZE_TASK,
    )
    tailored: CVContent = ai.generate_structured(prompt, CVContent, system=GUARDRAILS)
    # Contact block is not a tailoring target — keep the CV's existing one.
    tailored.personal_info = current.personal_info

    cv = cv_service.append_version(
        db,
        user,
        cv.id,
        tailored,
        CVVersionSource.JOB_CUSTOMIZATION,
        note=f"Tailored for {job.title}",
    )
    return cv, job
