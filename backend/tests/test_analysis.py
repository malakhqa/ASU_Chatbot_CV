"""Integration tests for CV analysis."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Analysis, JobDescription, User
from app.services import ai_service
from tests._fakes import FakeAIClient

ANALYZE = "/api/cv/analyze"

RESULT = {
    "score": 68,
    "strengths": ["Clear structure", "Relevant skills listed"],
    "weaknesses": ["Summary is generic", "No measurable impact"],
    "missing": ["GitHub link", "Graduation date"],
    "recommendations": ["Quantify achievements", "Add a projects section"],
}


def _use_fake_result() -> None:
    ai_service.set_ai_client(FakeAIClient(structured={"AnalysisResult": RESULT}))


def _make_cv(auth_client: TestClient) -> int:
    return auth_client.post("/api/cv", json={"title": "CV"}).json()["id"]


def test_analyze_requires_auth(client: TestClient) -> None:
    assert client.post(ANALYZE, json={"cv_id": 1}).status_code == 401


def test_analyze_persists_and_returns_result(auth_client: TestClient, db_session: Session) -> None:
    cv_id = _make_cv(auth_client)
    _use_fake_result()

    resp = auth_client.post(ANALYZE, json={"cv_id": cv_id})
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["score"] == 68
    assert body["cv_id"] == cv_id
    assert body["cv_version_number"] == 1
    assert body["recommendations"] == RESULT["recommendations"]
    assert body["results"]["strengths"] == RESULT["strengths"]
    assert body["results"]["missing"] == RESULT["missing"]

    assert db_session.scalar(select(Analysis).where(Analysis.cv_id == cv_id)) is not None


def test_analyze_missing_cv_is_404(auth_client: TestClient) -> None:
    _use_fake_result()
    assert auth_client.post(ANALYZE, json={"cv_id": 4321}).status_code == 404


def test_analyze_returns_503_without_ai(auth_client: TestClient) -> None:
    cv_id = _make_cv(auth_client)
    assert auth_client.post(ANALYZE, json={"cv_id": cv_id}).status_code == 503


def test_analyze_against_job(auth_client: TestClient, db_session: Session) -> None:
    cv_id = _make_cv(auth_client)
    user = db_session.scalar(select(User).where(User.email == "student@example.com"))
    job = JobDescription(
        user_id=user.id, title="Backend Engineer", company="Acme", description="Python, APIs"
    )
    db_session.add(job)
    db_session.commit()

    _use_fake_result()
    ok = auth_client.post(ANALYZE, json={"cv_id": cv_id, "job_description_id": job.id})
    assert ok.status_code == 201

    bad = auth_client.post(ANALYZE, json={"cv_id": cv_id, "job_description_id": 99999})
    assert bad.status_code == 404


def test_list_cv_analyses_newest_first(auth_client: TestClient) -> None:
    cv_id = _make_cv(auth_client)
    _use_fake_result()
    auth_client.post(ANALYZE, json={"cv_id": cv_id})
    auth_client.post(ANALYZE, json={"cv_id": cv_id})

    listing = auth_client.get(f"/api/cv/{cv_id}/analyses").json()
    assert len(listing) == 2
    assert listing[0]["id"] > listing[1]["id"]


def test_analyses_scoped_to_owner(client: TestClient) -> None:
    a = client.post(
        "/api/auth/register", json={"email": "a@an.com", "password": "passw0rd1"}
    ).json()["access_token"]
    b = client.post(
        "/api/auth/register", json={"email": "b@an.com", "password": "passw0rd1"}
    ).json()["access_token"]
    cv_id = client.post(
        "/api/cv", json={"title": "A"}, headers={"Authorization": f"Bearer {a}"}
    ).json()["id"]

    r = client.get(f"/api/cv/{cv_id}/analyses", headers={"Authorization": f"Bearer {b}"})
    assert r.status_code == 404
