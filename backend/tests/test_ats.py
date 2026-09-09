"""Integration tests for the ATS optimization check."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import JobDescription, User
from app.services import ai_service
from tests._fakes import FakeAIClient

ATS = "/api/cv/ats-check"

RESULT = {
    "score": 74,
    "passed": ["Standard section headings", "Plain-text dates"],
    "findings": [
        {"category": "keywords", "severity": "high", "message": "No cloud keywords present."},
        {"category": "content", "severity": "low", "message": "Objective line adds little."},
    ],
    "recommendations": ["Mirror the job's exact skill terms", "Drop the objective line"],
}


def _use_fake() -> None:
    ai_service.set_ai_client(FakeAIClient(structured={"ATSResult": RESULT}))


def _make_cv(auth_client: TestClient) -> int:
    return auth_client.post("/api/cv", json={"title": "CV"}).json()["id"]


def test_ats_check_requires_auth(client: TestClient) -> None:
    assert client.post(ATS, json={"cv_id": 1}).status_code == 401


def test_ats_check_returns_503_without_ai(auth_client: TestClient) -> None:
    cv_id = _make_cv(auth_client)
    assert auth_client.post(ATS, json={"cv_id": cv_id}).status_code == 503


def test_ats_check_returns_structured_result(auth_client: TestClient) -> None:
    cv_id = _make_cv(auth_client)
    _use_fake()

    resp = auth_client.post(ATS, json={"cv_id": cv_id})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["score"] == 74
    assert body["passed"] == RESULT["passed"]
    assert {f["category"] for f in body["findings"]} == {"keywords", "content"}
    assert body["findings"][0]["severity"] == "high"
    assert body["recommendations"] == RESULT["recommendations"]


def test_ats_check_missing_cv_is_404(auth_client: TestClient) -> None:
    _use_fake()
    assert auth_client.post(ATS, json={"cv_id": 9876}).status_code == 404


def test_ats_check_against_job(auth_client: TestClient, db_session: Session) -> None:
    cv_id = _make_cv(auth_client)
    user = db_session.scalar(select(User).where(User.email == "student@example.com"))
    job = JobDescription(
        user_id=user.id, title="Cloud Engineer", company="Acme", description="AWS, Terraform"
    )
    db_session.add(job)
    db_session.commit()
    _use_fake()

    ok = auth_client.post(ATS, json={"cv_id": cv_id, "job_description_id": job.id})
    assert ok.status_code == 200

    bad = auth_client.post(ATS, json={"cv_id": cv_id, "job_description_id": 99999})
    assert bad.status_code == 404


def test_ats_check_scoped_to_owner(client: TestClient) -> None:
    a = client.post(
        "/api/auth/register", json={"email": "a@an.com", "password": "passw0rd1"}
    ).json()["access_token"]
    b = client.post(
        "/api/auth/register", json={"email": "b@an.com", "password": "passw0rd1"}
    ).json()["access_token"]
    cv_id = client.post(
        "/api/cv", json={"title": "A"}, headers={"Authorization": f"Bearer {a}"}
    ).json()["id"]
    ai_service.set_ai_client(FakeAIClient(structured={"ATSResult": RESULT}))

    r = client.post(ATS, json={"cv_id": cv_id}, headers={"Authorization": f"Bearer {b}"})
    assert r.status_code == 404
