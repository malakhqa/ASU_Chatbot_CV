"""Integration tests for skill gap analysis."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import JobDescription, User
from app.services import ai_service
from tests._fakes import FakeAIClient

SKILL_GAP = "/api/cv/skill-gap"

RESULT = {
    "match_score": 55,
    "required": ["Python", "AWS", "Terraform", "CI/CD"],
    "have": ["Python"],
    "missing": ["AWS", "Terraform"],
    "improve": ["CI/CD"],
    "summary": "Solid Python base; cloud and IaC skills are the main gap.",
}


def _use_fake() -> None:
    ai_service.set_ai_client(FakeAIClient(structured={"SkillGapResult": RESULT}))


def _make_cv(auth_client: TestClient) -> int:
    return auth_client.post("/api/cv", json={"title": "CV"}).json()["id"]


def _make_job(auth_client: TestClient, db_session: Session) -> int:
    user = db_session.scalar(select(User).where(User.email == "student@example.com"))
    job = JobDescription(
        user_id=user.id,
        title="Cloud Engineer",
        company="Acme",
        description="Python, AWS, Terraform",
    )
    db_session.add(job)
    db_session.commit()
    return job.id


def test_skill_gap_requires_auth(client: TestClient) -> None:
    assert client.post(SKILL_GAP, json={"cv_id": 1, "job_description_id": 1}).status_code == 401


def test_skill_gap_job_is_required(auth_client: TestClient) -> None:
    cv_id = _make_cv(auth_client)
    _use_fake()  # so the request isn't short-circuited by the AI 503
    assert auth_client.post(SKILL_GAP, json={"cv_id": cv_id}).status_code == 422


def test_skill_gap_returns_503_without_ai(auth_client: TestClient, db_session: Session) -> None:
    cv_id = _make_cv(auth_client)
    job_id = _make_job(auth_client, db_session)
    assert (
        auth_client.post(SKILL_GAP, json={"cv_id": cv_id, "job_description_id": job_id}).status_code
        == 503
    )


def test_skill_gap_returns_structured_result(auth_client: TestClient, db_session: Session) -> None:
    cv_id = _make_cv(auth_client)
    job_id = _make_job(auth_client, db_session)
    _use_fake()

    resp = auth_client.post(SKILL_GAP, json={"cv_id": cv_id, "job_description_id": job_id})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["match_score"] == 55
    assert body["have"] == ["Python"]
    assert body["missing"] == ["AWS", "Terraform"]
    assert body["improve"] == ["CI/CD"]
    assert "gap" in body["summary"]


def test_skill_gap_missing_cv_or_job_is_404(auth_client: TestClient, db_session: Session) -> None:
    cv_id = _make_cv(auth_client)
    job_id = _make_job(auth_client, db_session)
    _use_fake()

    assert (
        auth_client.post(SKILL_GAP, json={"cv_id": 9876, "job_description_id": job_id}).status_code
        == 404
    )
    assert (
        auth_client.post(SKILL_GAP, json={"cv_id": cv_id, "job_description_id": 9876}).status_code
        == 404
    )


def test_skill_gap_scoped_to_owner(client: TestClient) -> None:
    a = client.post(
        "/api/auth/register", json={"email": "a@an.com", "password": "passw0rd1"}
    ).json()["access_token"]
    b = client.post(
        "/api/auth/register", json={"email": "b@an.com", "password": "passw0rd1"}
    ).json()["access_token"]
    ah = {"Authorization": f"Bearer {a}"}
    cv_id = client.post("/api/cv", json={"title": "A"}, headers=ah).json()["id"]
    job_id = client.post(
        "/api/jobs", json={"title": "Role", "description": "x"}, headers=ah
    ).json()["id"]
    ai_service.set_ai_client(FakeAIClient(structured={"SkillGapResult": RESULT}))

    r = client.post(
        SKILL_GAP,
        json={"cv_id": cv_id, "job_description_id": job_id},
        headers={"Authorization": f"Bearer {b}"},
    )
    assert r.status_code == 404
