"""Career profile retrieval and full-replace update logic."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Profile, User
from app.schemas.profile import ProfileUpdate

_SCALAR_FIELDS = (
    "full_name",
    "phone",
    "location",
    "summary",
    "linkedin",
    "github",
    "website",
)
_LIST_OF_OBJECTS = ("education", "experience", "projects", "certifications", "languages", "awards")


def get_or_create_profile(db: Session, user: User) -> Profile:
    profile = db.scalar(select(Profile).where(Profile.user_id == user.id))
    if profile is None:
        profile = Profile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def update_profile(db: Session, user: User, data: ProfileUpdate) -> Profile:
    """Replace every profile field (PUT semantics). Missing lists become empty."""
    profile = get_or_create_profile(db, user)

    for field in _SCALAR_FIELDS:
        setattr(profile, field, getattr(data, field))
    # EmailStr -> plain str for storage
    profile.email = str(data.email) if data.email else None

    for field in _LIST_OF_OBJECTS:
        items = getattr(data, field)
        setattr(profile, field, [item.model_dump(mode="json") for item in items])
    profile.skills = list(data.skills)

    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile
