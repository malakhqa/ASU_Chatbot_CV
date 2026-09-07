"""Job description schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class JobDescriptionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    company: str | None = Field(default=None, max_length=255)
    description: str = Field(min_length=1)


class JobDescriptionResponse(ORMModel):
    id: int
    title: str
    company: str | None = None
    description: str
    created_at: datetime


class CustomizeRequest(BaseModel):
    """Customize a CV for a job. Supply an existing job id or an inline description."""

    cv_id: int
    job_description_id: int | None = None
    job_description: JobDescriptionCreate | None = None
