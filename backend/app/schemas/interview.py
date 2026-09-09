"""Interview preparation schemas.

Generates likely interview questions from the candidate's profile + CV, optionally
tailored to a target job. Stateless — the result is returned, not persisted.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

QuestionCategory = Literal[
    "behavioral",
    "technical",
    "experience",
    "role_specific",
    "motivation",
]


class InterviewPrepRequest(BaseModel):
    cv_id: int
    job_description_id: int | None = None


class InterviewQuestion(BaseModel):
    category: QuestionCategory
    question: str
    guidance: str = ""
    """What a strong answer covers — grounded in the candidate's own material."""


class InterviewPrepResult(BaseModel):
    """Shape the AI service is asked to return, and what the endpoint returns."""

    questions: list[InterviewQuestion] = Field(default_factory=list)
    focus_areas: list[str] = Field(default_factory=list)
    """Topics the candidate should be ready to talk about in depth."""
    tips: list[str] = Field(default_factory=list)
