"""Integration tests for job descriptions and CV customization."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.services import ai_service
from tests._fakes import FakeAIClient

JOBS = "/api/jobs"
CUSTOMIZE = "/api/jobs/customize"

JOB = {"title": "Backend Engineer", "company": "Acme", "description": "Python, FastAPI, SQL"}

TAILORED_CONTENT = {
    "personal_info": {"full_name": "SHOULD BE IGNORED"},
    "summary": "Backend engineer tailored for Acme.",
    "skills": ["Python", "FastAPI", "SQL"],
    "experience": [],
    "education": [],
    "projects": [],
    "certifications": [],
    "languages": [],
}

ORIGINAL_CONTENT = {
    "personal_info": {"full_name": "Jane Doe", "email": "jane@example.com"},
    "summary": "Original summary.",
    "skills": ["Python"],
}


def _fake_tailor() -> None:
    ai_service.set_ai_client(FakeAIClient(structured={"CVContent": TAILORED_CONTENT}))


def _cv_with_content(auth_client: TestClient) -> int:
    cv_id = auth_client.post("/api/cv", json={"title": "CV"}).json()["id"]
    auth_client.put(f"/api/cv/{cv_id}", json={"content": ORIGINAL_CONTENT})
    return cv_id


# --- job CRUD ----------------------------------------------------------------


def test_jobs_require_auth(client: TestClient) -> None:
    assert client.get(JOBS).status_code == 401
    assert client.post(JOBS, json=JOB).status_code == 401
    assert client.post(CUSTOMIZE, json={"cv_id": 1, "job_description_id": 1}).status_code == 401


def test_job_crud_flow(auth_client: TestClient) -> None:
    created = auth_client.post(JOBS, json=JOB)
    assert created.status_code == 201, created.text
    job_id = created.json()["id"]
    assert created.json()["company"] == "Acme"

    auth_client.post(JOBS, json={"title": "Data Analyst", "description": "SQL, dashboards"})
    listing = auth_client.get(JOBS).json()
    assert [j["title"] for j in listing] == ["Data Analyst", "Backend Engineer"]  # newest first

    assert auth_client.get(f"{JOBS}/{job_id}").json()["title"] == "Backend Engineer"
    assert auth_client.delete(f"{JOBS}/{job_id}").status_code == 204
    assert auth_client.get(f"{JOBS}/{job_id}").status_code == 404


def test_create_job_validation(auth_client: TestClient) -> None:
    assert auth_client.post(JOBS, json={"title": "x"}).status_code == 422  # no description
    assert auth_client.post(JOBS, json={"description": "y"}).status_code == 422  # no title


# --- customization ----------------------------------------------------------


def test_customize_with_existing_job(auth_client: TestClient) -> None:
    cv_id = _cv_with_content(auth_client)  # v2
    job_id = auth_client.post(JOBS, json=JOB).json()["id"]
    _fake_tailor()

    resp = auth_client.post(CUSTOMIZE, json={"cv_id": cv_id, "job_description_id": job_id})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["current_version_number"] == 3
    v = body["current_version"]
    assert v["source"] == "job_customization"
    assert v["note"] == "Tailored for Backend Engineer"
    assert v["content"]["summary"] == "Backend engineer tailored for Acme."
    # contact block preserved from the original CV, not the model output
    assert v["content"]["personal_info"]["full_name"] == "Jane Doe"
    assert v["content"]["personal_info"]["email"] == "jane@example.com"


def test_customize_with_inline_job_creates_it(auth_client: TestClient) -> None:
    cv_id = _cv_with_content(auth_client)
    _fake_tailor()
    resp = auth_client.post(CUSTOMIZE, json={"cv_id": cv_id, "job_description": JOB})
    assert resp.status_code == 200, resp.text
    assert auth_client.get(JOBS).json()[0]["title"] == "Backend Engineer"


def test_customize_requires_a_job(auth_client: TestClient) -> None:
    cv_id = _cv_with_content(auth_client)
    _fake_tailor()
    assert auth_client.post(CUSTOMIZE, json={"cv_id": cv_id}).status_code == 422


def test_customize_unknown_cv_or_job(auth_client: TestClient) -> None:
    _fake_tailor()
    assert (
        auth_client.post(CUSTOMIZE, json={"cv_id": 9999, "job_description": JOB}).status_code == 404
    )
    cv_id = _cv_with_content(auth_client)
    assert (
        auth_client.post(CUSTOMIZE, json={"cv_id": cv_id, "job_description_id": 8888}).status_code
        == 404
    )


def test_customize_without_ai_is_503(auth_client: TestClient) -> None:
    cv_id = _cv_with_content(auth_client)
    resp = auth_client.post(CUSTOMIZE, json={"cv_id": cv_id, "job_description": JOB})
    assert resp.status_code == 503


def test_jobs_scoped_to_owner(client: TestClient) -> None:
    a = client.post(
        "/api/auth/register", json={"email": "a@j.com", "password": "passw0rd1"}
    ).json()["access_token"]
    b = client.post(
        "/api/auth/register", json={"email": "b@j.com", "password": "passw0rd1"}
    ).json()["access_token"]

    job_id = client.post(JOBS, json=JOB, headers={"Authorization": f"Bearer {a}"}).json()["id"]
    cv_id = client.post(
        "/api/cv", json={"title": "A"}, headers={"Authorization": f"Bearer {a}"}
    ).json()["id"]

    b_headers = {"Authorization": f"Bearer {b}"}
    assert client.get(f"{JOBS}/{job_id}", headers=b_headers).status_code == 404

    ai_service.set_ai_client(FakeAIClient(structured={"CVContent": TAILORED_CONTENT}))
    r = client.post(
        CUSTOMIZE,
        json={"cv_id": cv_id, "job_description_id": job_id},
        headers=b_headers,
    )
    assert r.status_code == 404  # B doesn't own the CV
