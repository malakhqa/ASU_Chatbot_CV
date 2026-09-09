"""Skill gap analysis schemas.

Compares the user's skills (profile + current CV) against a target job. Stateless
— the result is computed and returned, not persisted.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class SkillGapRequest(BaseModel):
    cv_id: int
    job_description_id: int


class SkillGapResult(BaseModel):
    """Shape the AI service is asked to return, and what the endpoint returns."""

    match_score: int | None = Field(default=None, ge=0, le=100)
    have: list[str] = Field(default_factory=list)
    """Job-relevant skills the user already demonstrates."""
    missing: list[str] = Field(default_factory=list)
    """Skills the job asks for that the user does not show."""
    improve: list[str] = Field(default_factory=list)
    """Skills the user has but should strengthen or evidence better."""
    required: list[str] = Field(default_factory=list)
    """Key skills the job requires, as read from the description."""
    summary: str = ""
