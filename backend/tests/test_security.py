"""Unit tests for password hashing and JWT helpers."""

from __future__ import annotations

import pytest

from app.core.config import settings
from app.core.security import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_hash_roundtrip() -> None:
    hashed = hash_password("hunter2pw")
    assert hashed != "hunter2pw"
    assert verify_password("hunter2pw", hashed) is True
    assert verify_password("wrong", hashed) is False


def test_verify_password_handles_garbage_hash() -> None:
    assert verify_password("x", "not-a-real-hash") is False


def test_access_token_roundtrip() -> None:
    token = create_access_token(42)
    claims = decode_token(token, expected_type="access")
    assert claims["sub"] == "42"
    assert claims["type"] == "access"
    assert "exp" in claims and "jti" in claims


def test_wrong_token_type_rejected() -> None:
    refresh = create_refresh_token(1)
    with pytest.raises(TokenError):
        decode_token(refresh, expected_type="access")


def test_tampered_token_rejected() -> None:
    token = create_access_token(1)
    with pytest.raises(TokenError):
        decode_token(token + "x")


def test_expired_token_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "jwt_access_token_expire_minutes", -1)
    token = create_access_token(1)
    with pytest.raises(TokenError):
        decode_token(token)


def test_token_signed_with_other_secret_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    token = create_access_token(1)
    other_secret = "a-different-secret-that-is-also-long-enough-000000"
    monkeypatch.setattr(settings, "jwt_secret_key", other_secret)
    with pytest.raises(TokenError):
        decode_token(token)
