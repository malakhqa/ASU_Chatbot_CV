"""ORM models package.

Every model module must be imported here so that ``Base.metadata`` is fully
populated for Alembic autogenerate and ``create_all``. Models are added in Task 4.
"""

from __future__ import annotations

from app.database.base import Base

# Model modules will be imported below as they are added, e.g.:
# from app.models.user import User  # noqa: F401

__all__ = ["Base"]
