"""ATS optimization check: evaluate how well a CV will parse in an Applicant
Tracking System, optionally against a specific job. Stateless — nothing is
stored; the caller gets an :class:`ATSResult` back.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import User
from app.schemas.ats import ATSResult
from app.schemas.job import JobDescriptionResponse
from app.services import ai_service, cv_service, job_service
from app.services.prompt_builder import GUARDRAILS, build_context

_BASE_TASK = (
    "Assess how well the CV above would be parsed and ranked by an Applicant "
    "Tracking System (ATS){job_clause}. Check these areas and use the matching "
    "category slug for each finding: 'keywords' (missing role-relevant terms{job_ref}), "
    "'sections' (standard, clearly-labelled headings like Experience, Education, "
    "Skills), 'formatting' (no tables/columns/graphics/headers-footers that ATS "
    "parsers drop; plain dates), 'relevance' (content aimed at the target role), "
    "'content' (filler or information that adds no value). "
    "Return an overall ATS-readiness score from 0 to 100, a list of checks the CV "
    "already passes, a list of findings (each with category, severity of high|"
    "medium|low, and a specific message), and concrete recommendations. "
    "Base every point only on the material provided — never invent details."
)


def _task_text(*, with_job: bool) -> str:
    return _BASE_TASK.format(
        job_clause=" for the target job" if with_job else "",
        job_ref=" from the job description" if with_job else "",
    )


def check_ats(
    db: Session,
    user: User,
    ai: ai_service.AIClient,
    cv_id: int,
    job_description_id: int | None = None,
) -> ATSResult:
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
    return ai.generate_structured(prompt, ATSResult, system=GUARDRAILS)
