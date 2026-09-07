"""Password hashing and JWT token helpers.

Pure functions only — no database access. Argon2 is the password hashing scheme
(via ``pwdlib``); tokens are signed with the HS256 secret from settings.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

_password_hash = PasswordHash.recommended()

TokenType = Literal["access", "refresh"]


class TokenError(Exception):
    """Raised when a JWT cannot be decoded or fails validation."""


# --- Passwords ---------------------------------------------------------------


def hash_password(plain: str) -> str:
    return _password_hash.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _password_hash.verify(plain, hashed)
    except Exception:
        return False


# --- JWT -------------------------------------------------------------------


def _create_token(subject: str, token_type: TokenType, expires_delta: timedelta) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": subject,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str | int) -> str:
    return _create_token(
        str(subject),
        "access",
        timedelta(minutes=settings.jwt_access_token_expire_minutes),
    )


def create_refresh_token(subject: str | int) -> str:
    return _create_token(
        str(subject),
        "refresh",
        timedelta(days=settings.jwt_refresh_token_expire_days),
    )


def decode_token(token: str, expected_type: TokenType | None = None) -> dict[str, Any]:
    """Decode and verify a JWT. Raises :class:`TokenError` on any problem."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.PyJWTError as exc:
        raise TokenError("Invalid or expired token") from exc

    if expected_type is not None and payload.get("type") != expected_type:
        raise TokenError(f"Expected a {expected_type} token")
    return payload
