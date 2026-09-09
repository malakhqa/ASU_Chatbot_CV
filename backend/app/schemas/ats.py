"""ATS (Applicant Tracking System) optimization check schemas.

The check is stateless — it evaluates the current CV (optionally against a job)
and returns the result without persisting it.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ATSCategory = Literal["keywords", "sections", "formatting", "relevance", "content"]
ATSSeverity = Literal["high", "medium", "low"]


class ATSCheckRequest(BaseModel):
    cv_id: int
    job_description_id: int | None = None


class ATSFinding(BaseModel):
    """A single potential ATS problem."""

    category: ATSCategory
    severity: ATSSeverity = "medium"
    message: str


class ATSResult(BaseModel):
    """Shape the AI service is asked to return, and what the endpoint returns."""

    score: int | None = Field(default=None, ge=0, le=100)
    passed: list[str] = Field(default_factory=list)
    findings: list[ATSFinding] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
