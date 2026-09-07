"""User registration and authentication logic."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models import Profile, User


class EmailAlreadyExistsError(Exception):
    """Raised when registering an email that is already taken."""


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == _normalize_email(email)))


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def register_user(db: Session, email: str, password: str) -> User:
    email = _normalize_email(email)
    if get_user_by_email(db, email) is not None:
        raise EmailAlreadyExistsError(email)

    user = User(email=email, password_hash=hash_password(password))
    user.profile = Profile()  # empty profile so GET /api/profile always works
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user
