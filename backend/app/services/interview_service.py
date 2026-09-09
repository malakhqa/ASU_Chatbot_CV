"""Interview preparation: generate likely interview questions from the
candidate's profile + current CV, optionally tailored to a target job.
Stateless — returns an :class:`InterviewPrepResult`.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import User
from app.schemas.interview import InterviewPrepResult
from app.schemas.job import JobDescriptionResponse
from app.schemas.profile import ProfileResponse
from app.services import ai_service, cv_service, job_service, profile_service
from app.services.prompt_builder import GUARDRAILS, build_context

_BASE_TASK = (
    "Prepare this candidate for a job interview{job_clause}. Using only their real "
    "background, experience, projects, and skills, produce a set of interview "
    "questions they are likely to be asked. Give each question a 'category' — one "
    "of behavioral, technical, experience, role_specific, motivation — the "
    "'question' text, and short 'guidance' on what a strong answer covers (point "
    "to their own experience; suggest the STAR structure for behavioral ones). "
    "Also return 'focus_areas' (topics they should be ready to discuss in depth) "
    "and practical 'tips'. Cover a mix of categories. Never invent experience the "
    "candidate does not have — base questions on their actual material{job_ref}."
)


def _task_text(*, with_job: bool) -> str:
    return _BASE_TASK.format(
        job_clause=" for the target job" if with_job else "",
        job_ref=" and the job description" if with_job else "",
    )


def prepare_interview(
    db: Session,
    user: User,
    ai: ai_service.AIClient,
    cv_id: int,
    job_description_id: int | None = None,
) -> InterviewPrepResult:
    cv = cv_service.get_cv(db, user, cv_id)
    version = cv_service.get_current_version(db, cv)
    content = version.content if version is not None else {}

    job_data = None
    if job_description_id is not None:
        job = job_service.get_job(db, user, job_description_id)
        job_data = JobDescriptionResponse.model_validate(job).model_dump(mode="json")

    profile = profile_service.get_or_create_profile(db, user)

    prompt = build_context(
        profile=ProfileResponse.model_validate(profile).model_dump(mode="json"),
        cv_content=content,
        job=job_data,
        task=_task_text(with_job=job_data is not None),
    )
    return ai.generate_structured(prompt, InterviewPrepResult, system=GUARDRAILS)
