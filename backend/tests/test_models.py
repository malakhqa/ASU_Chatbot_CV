"""ORM model tests: relationships, cascades, constraints, JSON round-trips.

Runs against an isolated in-memory SQLite database built from ``Base.metadata``.
"""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from app.models import (
    CV,
    Analysis,
    ChatMessage,
    Conversation,
    CVVersion,
    JobDescription,
    Profile,
    User,
)
from app.models.enums import CVVersionSource, MessageRole


@pytest.fixture
def db() -> Iterator[Session]:
    engine: Engine = create_engine("sqlite+pysqlite:///:memory:")

    @event.listens_for(engine, "connect")
    def _fk_pragma(dbapi_conn, _rec) -> None:  # enforce FK constraints on SQLite
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

    User.metadata.create_all(engine)
    session = sessionmaker(bind=engine, expire_on_commit=False)()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def _make_user(db: Session, email: str = "student@example.com") -> User:
    user = User(email=email, password_hash="x")
    db.add(user)
    db.commit()
    return user


def test_user_profile_one_to_one(db: Session) -> None:
    user = _make_user(db)
    user.profile = Profile(full_name="Jane Doe", skills=["Python", "SQL"])
    db.commit()

    fetched = db.get(User, user.id)
    assert fetched.profile is not None
    assert fetched.profile.skills == ["Python", "SQL"]
    assert fetched.profile.education == []  # JSON default


def test_cv_versions_and_unique_constraint(db: Session) -> None:
    user = _make_user(db)
    cv = CV(user_id=user.id, title="Backend CV")
    cv.versions.append(CVVersion(version_number=1, content={"summary": "hi"}))
    db.add(cv)
    db.commit()

    cv.versions.append(
        CVVersion(version_number=1, content={"summary": "dup"}, source=CVVersionSource.MANUAL_EDIT)
    )
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_enum_persisted_as_value(db: Session) -> None:
    user = _make_user(db)
    conv = Conversation(user_id=user.id)
    conv.messages.append(ChatMessage(role=MessageRole.USER, content="Add Python to my skills"))
    db.add(conv)
    db.commit()

    row = db.execute(
        ChatMessage.__table__.select().where(ChatMessage.conversation_id == conv.id)
    ).first()
    assert row.role == "user"


def test_cascade_delete_user_removes_children(db: Session) -> None:
    user = _make_user(db)
    user.profile = Profile(full_name="Jane")
    cv = CV(user_id=user.id, title="CV")
    cv.versions.append(CVVersion(version_number=1, content={}))
    db.add(cv)
    conv = Conversation(user_id=user.id)
    conv.messages.append(ChatMessage(role=MessageRole.SYSTEM, content="x"))
    db.add(conv)
    db.add(JobDescription(user_id=user.id, title="Dev", description="..."))
    db.commit()

    db.delete(user)
    db.commit()

    assert db.query(Profile).count() == 0
    assert db.query(CV).count() == 0
    assert db.query(CVVersion).count() == 0
    assert db.query(Conversation).count() == 0
    assert db.query(ChatMessage).count() == 0
    assert db.query(JobDescription).count() == 0


def test_analysis_survives_cv_delete(db: Session) -> None:
    user = _make_user(db)
    cv = CV(user_id=user.id, title="CV")
    db.add(cv)
    db.commit()
    db.add(
        Analysis(
            user_id=user.id,
            cv_id=cv.id,
            score=72,
            results={"strengths": ["clear"]},
            recommendations=["add metrics"],
        )
    )
    db.commit()

    db.delete(cv)
    db.commit()

    analysis = db.query(Analysis).one()
    assert analysis.cv_id is None
    assert analysis.score == 72
    assert analysis.results["strengths"] == ["clear"]
