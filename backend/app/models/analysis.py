"""CV analysis result model."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON as SA_JSON
from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, CreatedAtMixin

if TYPE_CHECKING:
    from app.models.cv import CV
    from app.models.user import User


class Analysis(CreatedAtMixin, Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    # Keep the analysis if the CV is later deleted.
    cv_id: Mapped[int | None] = mapped_column(
        ForeignKey("cvs.id", ondelete="SET NULL"),
        index=True,
    )
    cv_version_number: Mapped[int | None] = mapped_column(Integer)

    score: Mapped[int | None] = mapped_column(Integer)  # 0-100
    results: Mapped[dict[str, Any]] = mapped_column(SA_JSON, default=dict, nullable=False)
    recommendations: Mapped[list[Any]] = mapped_column(SA_JSON, default=list, nullable=False)

    user: Mapped[User] = relationship(back_populates="analyses")
    cv: Mapped[CV | None] = relationship(back_populates="analyses")

    def __repr__(self) -> str:  # pragma: no cover - debug aid
        return f"<Analysis id={self.id} cv_id={self.cv_id} score={self.score}>"
