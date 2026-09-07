"""Integration tests for the career profile endpoints."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Profile, User

PROFILE = "/api/profile"

FULL_PAYLOAD = {
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1 555 0100",
    "location": "Amman, Jordan",
    "summary": "CS student focused on backend engineering.",
    "linkedin": "https://linkedin.com/in/janedoe",
    "github": "https://github.com/janedoe",
    "website": None,
    "education": [
        {
            "institution": "ASU",
            "degree": "BSc",
            "field_of_study": "Computer Science",
            "start_date": "2021",
            "end_date": "2025",
            "gpa": "3.8",
        }
    ],
    "experience": [
        {
            "title": "Backend Intern",
            "company": "Acme",
            "start_date": "2024-06",
            "end_date": "2024-09",
            "current": False,
            "highlights": ["Built REST APIs", "Wrote tests"],
        }
    ],
    "skills": ["Python", "FastAPI", "SQL"],
    "projects": [{"name": "CV Bot", "technologies": ["Python", "Gemini"]}],
    "certifications": [{"name": "AWS CCP", "issuer": "Amazon"}],
    "languages": [{"name": "English", "proficiency": "Fluent"}],
    "awards": [{"title": "Dean's List", "date": "2023"}],
}


def test_profile_requires_auth(client: TestClient) -> None:
    assert client.get(PROFILE).status_code == 401
    assert client.put(PROFILE, json={}).status_code == 401


def test_get_returns_empty_profile_after_register(auth_client: TestClient) -> None:
    resp = auth_client.get(PROFILE)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["id"] and body["user_id"]
    assert body["full_name"] is None
    for section in ("education", "experience", "skills", "projects", "certifications", "languages"):
        assert body[section] == []
    assert "created_at" in body and "updated_at" in body


def test_put_replaces_and_get_reflects(auth_client: TestClient, db_session: Session) -> None:
    put = auth_client.put(PROFILE, json=FULL_PAYLOAD)
    assert put.status_code == 200, put.text
    body = put.json()
    assert body["full_name"] == "Jane Doe"
    assert body["skills"] == ["Python", "FastAPI", "SQL"]
    assert body["education"][0]["field_of_study"] == "Computer Science"
    assert body["experience"][0]["highlights"] == ["Built REST APIs", "Wrote tests"]

    got = auth_client.get(PROFILE).json()
    assert got == body

    row = db_session.scalar(select(Profile))
    assert row is not None
    assert row.skills == ["Python", "FastAPI", "SQL"]
    assert row.email == "jane@example.com"


def test_put_is_full_replace(auth_client: TestClient) -> None:
    auth_client.put(PROFILE, json=FULL_PAYLOAD)
    cleared = auth_client.put(PROFILE, json={"full_name": "Only Name"})
    assert cleared.status_code == 200
    body = cleared.json()
    assert body["full_name"] == "Only Name"
    assert body["skills"] == []
    assert body["education"] == []
    assert body["summary"] is None


def test_put_rejects_invalid_email(auth_client: TestClient) -> None:
    resp = auth_client.put(PROFILE, json={"email": "not-an-email"})
    assert resp.status_code == 422


def test_profiles_are_per_user(client: TestClient, db_session: Session) -> None:
    a = client.post(
        "/api/auth/register", json={"email": "a@example.com", "password": "passw0rd1"}
    ).json()["access_token"]
    b = client.post(
        "/api/auth/register", json={"email": "b@example.com", "password": "passw0rd1"}
    ).json()["access_token"]

    client.put(PROFILE, json={"full_name": "User A"}, headers={"Authorization": f"Bearer {a}"})
    client.put(PROFILE, json={"full_name": "User B"}, headers={"Authorization": f"Bearer {b}"})

    a_body = client.get(PROFILE, headers={"Authorization": f"Bearer {a}"}).json()
    b_body = client.get(PROFILE, headers={"Authorization": f"Bearer {b}"}).json()
    assert a_body["full_name"] == "User A"
    assert b_body["full_name"] == "User B"
    assert a_body["user_id"] != b_body["user_id"]

    users = db_session.scalars(select(User)).all()
    assert {u.email for u in users} == {"a@example.com", "b@example.com"}
