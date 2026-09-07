"""Job description schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Self

from pydantic import BaseModel, Field, model_validator

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

    @model_validator(mode="after")
    def _require_a_job(self) -> Self:
        if self.job_description_id is None and self.job_description is None:
            raise ValueError("Provide either job_description_id or job_description")
        return self
