"""Tests for the database layer (engine, session, base)."""

from __future__ import annotations

import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import Base, SessionLocal, get_db
from app.database.connection import get_engine


def test_sqlalchemy_url_raises_when_unset(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "database_url", "")
    with pytest.raises(RuntimeError, match="DATABASE_URL is not set"):
        _ = settings.sqlalchemy_url


def test_get_engine_and_session_roundtrip(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "database_url", "sqlite+pysqlite:///:memory:")
    get_engine.cache_clear()
    try:
        engine = get_engine()
        assert engine.url.get_backend_name() == "sqlite"

        session = SessionLocal(bind=engine)
        try:
            assert session.execute(text("SELECT 1")).scalar_one() == 1
        finally:
            session.close()
    finally:
        get_engine.cache_clear()


def test_get_db_dependency_yields_session(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "database_url", "sqlite+pysqlite:///:memory:")
    get_engine.cache_clear()
    try:
        gen = get_db()
        session = next(gen)
        assert isinstance(session, Session)
        assert session.execute(text("SELECT 1")).scalar_one() == 1
        gen.close()  # triggers the finally: session.close()
    finally:
        get_engine.cache_clear()


def test_base_uses_naming_convention() -> None:
    assert "ix" in Base.metadata.naming_convention
    assert Base.metadata.naming_convention["fk"].startswith("fk_")
