"""Database engine construction.

The engine is created lazily and cached so importing the app package does not
require a configured database (useful for tooling, tests, and CI).
"""

from __future__ import annotations

from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

from app.core.config import settings


def _make_engine(url: str) -> Engine:
    connect_args: dict = {}
    kwargs: dict = {
        "echo": settings.db_echo,
        "pool_pre_ping": settings.db_pool_pre_ping,
        "future": True,
    }

    if url.startswith("sqlite"):
        # Used by the test suite; allow use across threads for TestClient.
        connect_args["check_same_thread"] = False
    else:
        kwargs["pool_size"] = settings.db_pool_size
        kwargs["max_overflow"] = settings.db_max_overflow
        kwargs["pool_recycle"] = 1800  # avoid MySQL "server has gone away"

    return create_engine(url, connect_args=connect_args, **kwargs)


@lru_cache
def get_engine() -> Engine:
    """Return the process-wide SQLAlchemy engine, creating it on first use."""
    return _make_engine(settings.sqlalchemy_url)
