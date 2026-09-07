"""Integration tests for CV endpoints."""

from __future__ import annotations

from fastapi.testclient import TestClient

from tests._fakes import FakeAIClient

CV = "/api/cv"
GENERATE = "/api/cv/generate"

PROFILE_PAYLOAD = {
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1 555 0100",
    "location": "Amman, Jordan",
    "skills": ["Python", "FastAPI"],
    "education": [{"institution": "ASU", "degree": "BSc"}],
}

FAKE_CV_CONTENT = {
    "personal_info": {"full_name": "HALLUCINATED NAME", "email": "evil@bad.com"},
    "summary": "Backend-focused CS student.",
    "education": [{"institution": "ASU", "degree": "BSc", "field_of_study": "CS"}],
    "experience": [],
    "skills": ["Python", "FastAPI"],
    "projects": [],
    "certifications": [],
    "languages": [],
}


def test_cv_endpoints_require_auth(client: TestClient) -> None:
    assert client.get(CV).status_code == 401
    assert client.post(CV, json={"title": "x"}).status_code == 401
    assert client.post(GENERATE, json={"title": "x"}).status_code == 401


def test_create_blank_cv(auth_client: TestClient) -> None:
    resp = auth_client.post(CV, json={"title": "My First CV"})
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["title"] == "My First CV"
    assert body["template"] == "professional"
    assert body["current_version_number"] == 1
    assert body["current_version"]["source"] == "manual_edit"
    assert body["current_version"]["content"]["summary"] == ""


def test_generate_cv_uses_ai_but_keeps_real_contact(auth_client: TestClient) -> None:
    auth_client.put("/api/profile", json=PROFILE_PAYLOAD)

    from app.services import ai_service

    ai_service.set_ai_client(FakeAIClient(structured={"CVContent": FAKE_CV_CONTENT}))

    resp = auth_client.post(GENERATE, json={"title": "Backend CV", "template": "modern"})
    assert resp.status_code == 201, resp.text
    body = resp.json()
    version = body["current_version"]
    assert version["source"] == "generated"
    assert version["version_number"] == 1
    assert version["content"]["summary"] == "Backend-focused CS student."
    # contact block comes from the profile, NOT the model's hallucination
    assert version["content"]["personal_info"]["full_name"] == "Jane Doe"
    assert version["content"]["personal_info"]["email"] == "jane@example.com"


def test_generate_cv_returns_503_when_ai_unconfigured(auth_client: TestClient) -> None:
    resp = auth_client.post(GENERATE, json={"title": "No AI"})
    assert resp.status_code == 503


def test_list_and_get_cv(auth_client: TestClient) -> None:
    a = auth_client.post(CV, json={"title": "CV A"}).json()
    auth_client.post(CV, json={"title": "CV B"})

    listing = auth_client.get(CV).json()
    assert {c["title"] for c in listing} == {"CV A", "CV B"}
    assert "current_version" not in listing[0]  # summaries only

    detail = auth_client.get(f"{CV}/{a['id']}").json()
    assert detail["id"] == a["id"]
    assert detail["current_version"]["content"]["summary"] == ""


def test_get_missing_cv_is_404(auth_client: TestClient) -> None:
    assert auth_client.get(f"{CV}/9999").status_code == 404


def test_cv_is_scoped_to_owner(client: TestClient) -> None:
    a = client.post(
        "/api/auth/register", json={"email": "a@x.com", "password": "passw0rd1"}
    ).json()["access_token"]
    b = client.post(
        "/api/auth/register", json={"email": "b@x.com", "password": "passw0rd1"}
    ).json()["access_token"]

    cv_id = client.post(
        CV, json={"title": "A's CV"}, headers={"Authorization": f"Bearer {a}"}
    ).json()["id"]

    r = client.get(f"{CV}/{cv_id}", headers={"Authorization": f"Bearer {b}"})
    assert r.status_code == 404
    r = client.put(
        f"{CV}/{cv_id}", json={"title": "hacked"}, headers={"Authorization": f"Bearer {b}"}
    )
    assert r.status_code == 404


def test_update_title_only_keeps_version(auth_client: TestClient) -> None:
    cv_id = auth_client.post(CV, json={"title": "Old"}).json()["id"]
    resp = auth_client.put(f"{CV}/{cv_id}", json={"title": "New Title"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "New Title"
    assert body["current_version_number"] == 1


def test_update_content_creates_new_version(auth_client: TestClient) -> None:
    cv_id = auth_client.post(CV, json={"title": "Editable"}).json()["id"]
    new_content = {"summary": "Now with a real summary.", "skills": ["Go", "Rust"]}
    resp = auth_client.put(f"{CV}/{cv_id}", json={"content": new_content, "note": "edited summary"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["current_version_number"] == 2
    v = body["current_version"]
    assert v["source"] == "manual_edit"
    assert v["note"] == "edited summary"
    assert v["content"]["summary"] == "Now with a real summary."
    assert v["content"]["skills"] == ["Go", "Rust"]
