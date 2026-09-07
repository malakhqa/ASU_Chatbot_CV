"""CV analysis schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class AnalyzeRequest(BaseModel):
    cv_id: int
    job_description_id: int | None = None


class AnalysisResult(BaseModel):
    """Shape the AI service is asked to return for an analysis."""

    score: int | None = Field(default=None, ge=0, le=100)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    missing: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class AnalysisResponse(ORMModel):
    id: int
    cv_id: int | None = None
    cv_version_number: int | None = None
    score: int | None = None
    results: dict[str, Any] = Field(default_factory=dict)
    recommendations: list[Any] = Field(default_factory=list)
    created_at: datetime
