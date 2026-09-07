"""CV analysis: evaluate a CV (optionally against a job) and store the result."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Analysis, User
from app.schemas.analysis import AnalysisResult
from app.schemas.job import JobDescriptionResponse
from app.services import ai_service, cv_service, job_service
from app.services.prompt_builder import GUARDRAILS, build_context

_BASE_TASK = (
    "Evaluate the CV above against common recruiter and ATS expectations{job_clause}. "
    "Return an overall score from 0 to 100, specific strengths, specific weaknesses, "
    "concrete recommendations to improve it, and important missing information or "
    "keywords. Base every point only on the CV{job_ref} content provided — do not "
    "assume facts that are not present."
)


def _task_text(*, with_job: bool) -> str:
    return _BASE_TASK.format(
        job_clause=" and the target job" if with_job else "",
        job_ref=" and job description" if with_job else "",
    )


def analyze_cv(
    db: Session,
    user: User,
    ai: ai_service.AIClient,
    cv_id: int,
    job_description_id: int | None = None,
) -> Analysis:
    cv = cv_service.get_cv(db, user, cv_id)
    version = cv_service.get_current_version(db, cv)
    content = version.content if version is not None else {}

    job_data = None
    if job_description_id is not None:
        job = job_service.get_job(db, user, job_description_id)
        job_data = JobDescriptionResponse.model_validate(job).model_dump(mode="json")

    prompt = build_context(
        cv_content=content,
        job=job_data,
        task=_task_text(with_job=job_data is not None),
    )
    result: AnalysisResult = ai.generate_structured(prompt, AnalysisResult, system=GUARDRAILS)

    analysis = Analysis(
        user_id=user.id,
        cv_id=cv.id,
        cv_version_number=version.version_number if version is not None else None,
        score=result.score,
        results=result.model_dump(mode="json"),
        recommendations=list(result.recommendations),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


def list_analyses_for_cv(db: Session, user: User, cv_id: int) -> list[Analysis]:
    cv_service.get_cv(db, user, cv_id)  # ownership check
    return list(
        db.scalars(
            select(Analysis)
            .where(Analysis.cv_id == cv_id, Analysis.user_id == user.id)
            .order_by(Analysis.created_at.desc(), Analysis.id.desc())
        ).all()
    )
