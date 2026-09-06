"""Tests for the health and meta endpoints."""

from __future__ import annotations

from app import __version__
from fastapi.testclient import TestClient


def test_health_ok(client: TestClient) -> None:
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["version"] == __version__


def test_root_meta(client: TestClient) -> None:
    resp = client.get("/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["health"] == "/api/health"
    assert body["version"] == __version__


def test_openapi_available(client: TestClient) -> None:
    resp = client.get("/openapi.json")
    assert resp.status_code == 200
    assert resp.json()["info"]["title"]
