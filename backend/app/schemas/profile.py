"""Career profile schemas.

The section item models (``EducationItem`` etc.) are the shared shapes reused by
the CV content schema. Dates are free-form strings because CV data is often
imprecise ("2023", "Jan 2023", "Present").
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class EducationItem(BaseModel):
    institution: str | None = None
    degree: str | None = None
    field_of_study: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    gpa: str | None = None
    description: str | None = None


class ExperienceItem(BaseModel):
    title: str | None = None
    company: str | None = None
    location: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    current: bool = False
    description: str | None = None
    highlights: list[str] = Field(default_factory=list)


class ProjectItem(BaseModel):
    name: str | None = None
    description: str | None = None
    technologies: list[str] = Field(default_factory=list)
    link: str | None = None
    highlights: list[str] = Field(default_factory=list)


class CertificationItem(BaseModel):
    name: str | None = None
    issuer: str | None = None
    issue_date: str | None = None
    credential_id: str | None = None
    link: str | None = None


class LanguageItem(BaseModel):
    name: str
    proficiency: str | None = None


class AwardItem(BaseModel):
    title: str
    issuer: str | None = None
    date: str | None = None
    description: str | None = None


class ProfileBase(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    location: str | None = None
    summary: str | None = None
    linkedin: str | None = None
    github: str | None = None
    website: str | None = None

    education: list[EducationItem] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)
    certifications: list[CertificationItem] = Field(default_factory=list)
    languages: list[LanguageItem] = Field(default_factory=list)
    awards: list[AwardItem] = Field(default_factory=list)


class ProfileUpdate(ProfileBase):
    """Full upsert of the profile (PUT /api/profile)."""


class ProfileResponse(ProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
