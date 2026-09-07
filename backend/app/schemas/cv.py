"""CV schemas: the structured content contract plus request/response models."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CVVersionSource
from app.schemas.common import ORMModel
from app.schemas.profile import (
    CertificationItem,
    EducationItem,
    ExperienceItem,
    LanguageItem,
    ProjectItem,
)


class CVPersonalInfo(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin: str | None = None
    github: str | None = None
    website: str | None = None


class CVContent(BaseModel):
    """Structured CV body stored on each ``CVVersion`` (technical doc section 13)."""

    model_config = ConfigDict(extra="ignore")

    personal_info: CVPersonalInfo = Field(default_factory=CVPersonalInfo)
    summary: str = ""
    education: list[EducationItem] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)
    certifications: list[CertificationItem] = Field(default_factory=list)
    languages: list[LanguageItem] = Field(default_factory=list)


class CVCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    template: str = "professional"


class CVUpdateRequest(BaseModel):
    """Partial update. Providing ``content`` creates a new version."""

    title: str | None = Field(default=None, max_length=200)
    template: str | None = Field(default=None, max_length=50)
    content: CVContent | None = None
    note: str | None = Field(default=None, max_length=255)


class CVVersionResponse(ORMModel):
    id: int
    version_number: int
    source: CVVersionSource
    note: str | None = None
    content: CVContent
    created_at: datetime


class CVSummary(ORMModel):
    id: int
    title: str
    template: str
    current_version_number: int | None = None
    created_at: datetime
    updated_at: datetime


class CVResponse(CVSummary):
    current_version: CVVersionResponse | None = None
