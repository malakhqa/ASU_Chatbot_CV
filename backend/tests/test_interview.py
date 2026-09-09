"""Integration tests for interview preparation."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import JobDescription, User
from app.services import ai_service
from tests._fakes import FakeAIClient

PREP = "/api/cv/interview-prep"

RESULT = {
    "questions": [
        {
            "category": "behavioral",
            "question": "Tell me about a time you handled a tight deadline.",
            "guidance": "Use STAR; draw on the internship project.",
        },
        {
            "category": "technical",
            "question": "How would you design a REST API for this feature?",
            "guidance": "Mention your FastAPI experience.",
        },
    ],
    "focus_areas": ["The Acme internship", "Your capstone project"],
    "tips": ["Prepare two STAR stories", "Re-read the job description the night before"],
}


def _use_fake() -> None:
    ai_service.set_ai_client(FakeAIClient(structured={"InterviewPrepResult": RESULT}))


def _make_cv(auth_client: TestClient) -> int:
    return auth_client.post("/api/cv", json={"title": "CV"}).json()["id"]


def test_interview_prep_requires_auth(client: TestClient) -> None:
    assert client.post(PREP, json={"cv_id": 1}).status_code == 401


def test_interview_prep_returns_503_without_ai(auth_client: TestClient) -> None:
    cv_id = _make_cv(auth_client)
    assert auth_client.post(PREP, json={"cv_id": cv_id}).status_code == 503


def test_interview_prep_returns_structured_result(auth_client: TestClient) -> None:
    cv_id = _make_cv(auth_client)
    _use_fake()

    resp = auth_client.post(PREP, json={"cv_id": cv_id})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert len(body["questions"]) == 2
    assert {q["category"] for q in body["questions"]} == {"behavioral", "technical"}
    assert body["questions"][0]["guidance"].startswith("Use STAR")
    assert body["focus_areas"] == RESULT["focus_areas"]
    assert body["tips"] == RESULT["tips"]


def test_interview_prep_missing_cv_is_404(auth_client: TestClient) -> None:
    _use_fake()
    assert auth_client.post(PREP, json={"cv_id": 8765}).status_code == 404


def test_interview_prep_against_job(auth_client: TestClient, db_session: Session) -> None:
    cv_id = _make_cv(auth_client)
    user = db_session.scalar(select(User).where(User.email == "student@example.com"))
    job = JobDescription(
        user_id=user.id,
        title="Backend Engineer",
        company="Acme",
        description="Python, FastAPI, SQL",
    )
    db_session.add(job)
    db_session.commit()
    _use_fake()

    ok = auth_client.post(PREP, json={"cv_id": cv_id, "job_description_id": job.id})
    assert ok.status_code == 200

    bad = auth_client.post(PREP, json={"cv_id": cv_id, "job_description_id": 99999})
    assert bad.status_code == 404


def test_interview_prep_scoped_to_owner(client: TestClient) -> None:
    a = client.post(
        "/api/auth/register", json={"email": "a@an.com", "password": "passw0rd1"}
    ).json()["access_token"]
    b = client.post(
        "/api/auth/register", json={"email": "b@an.com", "password": "passw0rd1"}
    ).json()["access_token"]
    cv_id = client.post(
        "/api/cv", json={"title": "A"}, headers={"Authorization": f"Bearer {a}"}
    ).json()["id"]
    ai_service.set_ai_client(FakeAIClient(structured={"InterviewPrepResult": RESULT}))

    r = client.post(PREP, json={"cv_id": cv_id}, headers={"Authorization": f"Bearer {b}"})
    assert r.status_code == 404
