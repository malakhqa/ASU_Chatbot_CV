"""Integration tests for the auth endpoints."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models import Profile, User

REGISTER = "/api/auth/register"
LOGIN = "/api/auth/login"
REFRESH = "/api/auth/refresh"
ME = "/api/auth/me"

CREDS = {"email": "student@example.com", "password": "hunter2pw"}


def test_register_returns_tokens_and_creates_profile(
    client: TestClient, db_session: Session
) -> None:
    resp = client.post(REGISTER, json=CREDS)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"] and body["refresh_token"]

    user = db_session.scalar(select(User).where(User.email == CREDS["email"]))
    assert user is not None
    assert db_session.scalar(select(Profile).where(Profile.user_id == user.id)) is not None
    assert user.password_hash != CREDS["password"]


def test_register_duplicate_email_conflicts(client: TestClient) -> None:
    assert client.post(REGISTER, json=CREDS).status_code == 201
    resp = client.post(REGISTER, json={"email": "STUDENT@example.com", "password": "another1pw"})
    assert resp.status_code == 409


def test_register_short_password_rejected(client: TestClient) -> None:
    resp = client.post(REGISTER, json={"email": "a@b.com", "password": "short"})
    assert resp.status_code == 422


def test_login_success_and_wrong_password(client: TestClient) -> None:
    client.post(REGISTER, json=CREDS)

    ok = client.post(LOGIN, json=CREDS)
    assert ok.status_code == 200
    assert ok.json()["access_token"]

    bad = client.post(LOGIN, json={"email": CREDS["email"], "password": "nope12345"})
    assert bad.status_code == 401


def test_login_unknown_email(client: TestClient) -> None:
    resp = client.post(LOGIN, json={"email": "ghost@example.com", "password": "whatever1"})
    assert resp.status_code == 401


def test_me_requires_valid_token(client: TestClient) -> None:
    assert client.get(ME).status_code == 401
    assert client.get(ME, headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_me_returns_current_user(auth_client: TestClient) -> None:
    resp = auth_client.get(ME)
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == CREDS["email"]
    assert body["is_active"] is True
    assert "password_hash" not in body


def test_refresh_rotates_tokens(client: TestClient) -> None:
    tokens = client.post(REGISTER, json=CREDS).json()
    resp = client.post(REFRESH, json={"refresh_token": tokens["refresh_token"]})
    assert resp.status_code == 200
    assert resp.json()["access_token"]


def test_refresh_rejects_access_token(client: TestClient) -> None:
    tokens = client.post(REGISTER, json=CREDS).json()
    resp = client.post(REFRESH, json={"refresh_token": tokens["access_token"]})
    assert resp.status_code == 401


def test_access_token_not_accepted_as_refresh_and_vice_versa(client: TestClient) -> None:
    tokens = client.post(REGISTER, json=CREDS).json()
    # refresh token used as a bearer access token on /me
    resp = client.get(ME, headers={"Authorization": f"Bearer {tokens['refresh_token']}"})
    assert resp.status_code == 401


def test_token_for_deleted_user_rejected(client: TestClient) -> None:
    token = create_access_token(9999)  # no such user
    resp = client.get(ME, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401
