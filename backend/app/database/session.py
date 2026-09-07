"""Session factory and the FastAPI request-scoped DB dependency."""

from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy.orm import Session, sessionmaker

from app.database.connection import get_engine

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    future=True,
)


def get_db() -> Iterator[Session]:
    """Yield a database session bound to the engine, closing it afterwards.

    Usage in routes:  ``db: Session = Depends(get_db)``
    """
    session = SessionLocal(bind=get_engine())
    try:
        yield session
    finally:
        session.close()
