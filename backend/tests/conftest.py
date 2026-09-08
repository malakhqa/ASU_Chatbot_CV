"""Shared pytest fixtures.

Tests run against an isolated in-memory SQLite database. The ``get_db``
dependency is overridden so requests made through ``client`` and direct queries
made through ``db_session`` share the same connection.
"""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  -- populate Base.metadata
from app.core.config import settings
from app.database import get_db
from app.database.base import Base
from app.main import create_app
from app.services import ai_service
from tests._fakes import FakeAIClient


@pytest.fixture(autouse=True)
def _reset_ai_client(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Isolate every test from any real Gemini config in ``backend/.env``.

    AI starts "unconfigured" (so the 503 contract holds); tests that need a
    working model install a ``FakeAIClient`` via the ``fake_ai`` fixture, which
    ``get_ai_client()`` returns before the key check.
    """
    monkeypatch.setattr(settings, "gemini_api_key", "")
    ai_service._real_client.cache_clear()
    yield
    ai_service.set_ai_client(None)
    ai_service._real_client.cache_clear()


@pytest.fixture
def fake_ai() -> FakeAIClient:
    """Install a FakeAIClient as the active AI client for the test."""
    client = FakeAIClient()
    ai_service.set_ai_client(client)
    return client


@pytest.fixture
def db_engine() -> Iterator[Engine]:
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _fk_pragma(dbapi_conn, _record) -> None:
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

    Base.metadata.create_all(engine)
    try:
        yield engine
    finally:
        Base.metadata.drop_all(engine)
        engine.dispose()


@pytest.fixture
def db_session(db_engine: Engine) -> Iterator[Session]:
    factory = sessionmaker(bind=db_engine, autoflush=False, expire_on_commit=False, future=True)
    session = factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_engine: Engine, db_session: Session) -> Iterator[TestClient]:
    application = create_app()

    def _override_get_db() -> Iterator[Session]:
        yield db_session

    application.dependency_overrides[get_db] = _override_get_db
    with TestClient(application) as test_client:
        yield test_client
    application.dependency_overrides.clear()


@pytest.fixture
def auth_client(client: TestClient) -> TestClient:
    """A ``client`` with a registered user's access token pre-attached."""
    resp = client.post(
        "/api/auth/register",
        json={"email": "student@example.com", "password": "hunter2pw"},
    )
    assert resp.status_code == 201, resp.text
    token = resp.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client
