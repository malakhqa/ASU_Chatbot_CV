"""Career profile endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import CurrentUser
from app.database import get_db
from app.models import Profile
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.services import profile_service

router = APIRouter(prefix="/profile", tags=["profile"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=ProfileResponse)
def read_profile(current_user: CurrentUser, db: DbSession) -> Profile:
    return profile_service.get_or_create_profile(db, current_user)


@router.put("", response_model=ProfileResponse)
def replace_profile(payload: ProfileUpdate, current_user: CurrentUser, db: DbSession) -> Profile:
    return profile_service.update_profile(db, current_user, payload)
