"""Reusable FastAPI dependencies: auth and authorization."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import TokenError, decode_token
from app.database import get_db
from app.models import User

bearer_scheme = HTTPBearer(auto_error=False, description="JWT access token")

_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    if credentials is None:
        raise _CREDENTIALS_EXCEPTION
    try:
        payload = decode_token(credentials.credentials, expected_type="access")
    except TokenError:
        raise _CREDENTIALS_EXCEPTION from None

    subject = payload.get("sub")
    if subject is None:
        raise _CREDENTIALS_EXCEPTION
    try:
        user_id = int(subject)
    except (TypeError, ValueError):
        raise _CREDENTIALS_EXCEPTION from None

    user = db.get(User, user_id)
    if user is None:
        raise _CREDENTIALS_EXCEPTION
    return user


def get_current_active_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return user


CurrentUser = Annotated[User, Depends(get_current_active_user)]


def verify_ownership(owner_id: int, user: User) -> None:
    """Raise 403 unless ``user`` owns the resource identified by ``owner_id``."""
    if owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this resource",
        )
