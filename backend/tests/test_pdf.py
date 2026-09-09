"""Tests for CV PDF export."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.schemas.cv import CVContent
from app.services import pdf_service

RICH_CONTENT = {
    "personal_info": {
        "full_name": "Jäne Дое",  # accented + Cyrillic -> Vera covers these
        "email": "jane@example.com",
        "location": "Amman",
    },
    "summary": "Backend engineer with a focus on APIs & data.",
    "experience": [
        {
            "title": "Backend Intern",
            "company": "Acme",
            "start_date": "2024-06",
            "end_date": "2024-09",
            "current": False,
            "description": "Built and shipped internal services.",
            "highlights": ["Cut p95 latency 40%", "Added CI"],
        }
    ],
    "education": [{"institution": "ASU", "degree": "BSc", "field_of_study": "CS", "gpa": "3.8"}],
    "projects": [{"name": "CV Bot", "technologies": ["Python", "Gemini"]}],
    "skills": ["Python", "FastAPI", "SQL"],
    "certifications": [{"name": "AWS CCP", "issuer": "Amazon", "issue_date": "2024"}],
    "languages": [{"name": "English", "proficiency": "Fluent"}],
}


def test_render_cv_pdf_returns_pdf_bytes() -> None:
    empty = pdf_service.render_cv_pdf(cv_title="Empty", content=CVContent())
    assert empty[:5] == b"%PDF-"
    assert b"%%EOF" in empty

    full = pdf_service.render_cv_pdf(
        cv_title="Full", content=CVContent.model_validate(RICH_CONTENT)
    )
    assert full[:5] == b"%PDF-"
    assert len(full) > len(empty)


def test_every_template_renders_and_is_distinct() -> None:
    content = CVContent.model_validate(RICH_CONTENT)
    names = pdf_service.available_templates()
    assert set(names) == {"professional", "modern", "minimal", "academic", "creative"}

    rendered = {
        n: pdf_service.render_cv_pdf(cv_title="X", content=content, template=n) for n in names
    }
    for name, pdf in rendered.items():
        assert pdf[:5] == b"%PDF-" and b"%%EOF" in pdf, name

    # each non-default template differs from the professional baseline
    baseline = rendered["professional"]
    for name in ("modern", "minimal", "academic", "creative"):
        assert rendered[name] != baseline, name


def test_unknown_template_falls_back_to_professional() -> None:
    content = CVContent.model_validate(RICH_CONTENT)
    fallback = pdf_service.render_cv_pdf(cv_title="X", content=content, template="nope")
    professional = pdf_service.render_cv_pdf(cv_title="X", content=content, template="professional")
    # same layout spec -> same output size (bytes can differ by an embedded timestamp)
    assert fallback[:5] == b"%PDF-"
    assert len(fallback) == len(professional)


def test_pdf_endpoint_requires_auth(client: TestClient) -> None:
    assert client.get("/api/cv/1/pdf").status_code == 401


def test_pdf_endpoint_blank_cv(auth_client: TestClient) -> None:
    cv_id = auth_client.post("/api/cv", json={"title": "My CV"}).json()["id"]
    resp = auth_client.get(f"/api/cv/{cv_id}/pdf")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.headers["content-disposition"] == 'attachment; filename="My-CV.pdf"'
    assert resp.content[:5] == b"%PDF-"


def test_pdf_endpoint_rich_cv_is_larger(auth_client: TestClient) -> None:
    blank_id = auth_client.post("/api/cv", json={"title": "Blank"}).json()["id"]
    rich_id = auth_client.post("/api/cv", json={"title": "Rich"}).json()["id"]
    auth_client.put(f"/api/cv/{rich_id}", json={"content": RICH_CONTENT})

    blank = auth_client.get(f"/api/cv/{blank_id}/pdf").content
    rich = auth_client.get(f"/api/cv/{rich_id}/pdf").content
    assert rich[:5] == b"%PDF-" and blank[:5] == b"%PDF-"
    assert len(rich) > len(blank)


def test_pdf_endpoint_404s(auth_client: TestClient, client: TestClient) -> None:
    assert auth_client.get("/api/cv/9999/pdf").status_code == 404

    other = client.post(
        "/api/auth/register", json={"email": "o@p.com", "password": "passw0rd1"}
    ).json()["access_token"]
    cv_id = client.post(
        "/api/cv", json={"title": "Theirs"}, headers={"Authorization": f"Bearer {other}"}
    ).json()["id"]
    assert auth_client.get(f"/api/cv/{cv_id}/pdf").status_code == 404
