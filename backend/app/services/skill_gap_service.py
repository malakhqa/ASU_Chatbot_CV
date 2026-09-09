"""Skill gap analysis: compare the user's skills (profile + current CV) against a
target job description. Stateless — returns a :class:`SkillGapResult`.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import User
from app.schemas.job import JobDescriptionResponse
from app.schemas.profile import ProfileResponse
from app.schemas.skill_gap import SkillGapResult
from app.services import ai_service, cv_service, job_service, profile_service
from app.services.prompt_builder import GUARDRAILS, build_context

_TASK = (
    "Compare the candidate's skills — from their profile and current CV — against "
    "the target job. Read the job description for the skills and tools it requires. "
    "Return: 'required' (key skills the job asks for), 'have' (job-relevant skills "
    "the candidate already clearly demonstrates), 'missing' (required skills not "
    "evidenced anywhere in the profile or CV), 'improve' (skills the candidate has "
    "but that are thin and should be strengthened or evidenced better), a "
    "'match_score' from 0 to 100 for overall coverage of the requirements, and a "
    "one- or two-sentence 'summary'. Use only skills that actually appear in the "
    "candidate's material or the job description — never invent capabilities."
)


def analyze_skill_gap(
    db: Session,
    user: User,
    ai: ai_service.AIClient,
    cv_id: int,
    job_description_id: int,
) -> SkillGapResult:
    cv = cv_service.get_cv(db, user, cv_id)
    version = cv_service.get_current_version(db, cv)
    content = version.content if version is not None else {}

    job = job_service.get_job(db, user, job_description_id)
    profile = profile_service.get_or_create_profile(db, user)

    prompt = build_context(
        profile=ProfileResponse.model_validate(profile).model_dump(mode="json"),
        cv_content=content,
        job=JobDescriptionResponse.model_validate(job).model_dump(mode="json"),
        task=_TASK,
    )
    return ai.generate_structured(prompt, SkillGapResult, system=GUARDRAILS)
