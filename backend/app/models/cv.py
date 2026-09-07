"""CV and CV version models.

A ``CV`` is the durable record (title, template). Its content lives in
``CVVersion`` rows as structured JSON, so individual sections can be updated and
previous versions kept. ``CV.current_version_number`` points at the active
version; the CV service maintains it.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON as SA_JSON
from sqlalchemy import Enum as SA_Enum
from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, CreatedAtMixin, TimestampMixin
from app.models.enums import CVVersionSource, enum_values_callable

if TYPE_CHECKING:
    from app.models.analysis import Analysis
    from app.models.user import User


class CV(TimestampMixin, Base):
    __tablename__ = "cvs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    template: Mapped[str] = mapped_column(String(50), default="professional", nullable=False)
    current_version_number: Mapped[int | None] = mapped_column(Integer)

    user: Mapped[User] = relationship(back_populates="cvs")
    versions: Mapped[list[CVVersion]] = relationship(
        back_populates="cv",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="CVVersion.version_number",
    )
    # Analyses are kept when a CV is deleted (FK is ON DELETE SET NULL).
    analyses: Mapped[list[Analysis]] = relationship(
        back_populates="cv",
        passive_deletes=True,
    )

    def __repr__(self) -> str:  # pragma: no cover - debug aid
        return f"<CV id={self.id} title={self.title!r} v={self.current_version_number}>"


class CVVersion(CreatedAtMixin, Base):
    __tablename__ = "cv_versions"
    __table_args__ = (
        UniqueConstraint("cv_id", "version_number", name="uq_cv_versions_cv_version"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    cv_id: Mapped[int] = mapped_column(
        ForeignKey("cvs.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[dict[str, Any]] = mapped_column(SA_JSON, nullable=False)
    source: Mapped[CVVersionSource] = mapped_column(
        SA_Enum(CVVersionSource, values_callable=enum_values_callable()),
        default=CVVersionSource.GENERATED,
        nullable=False,
    )
    note: Mapped[str | None] = mapped_column(String(255))

    cv: Mapped[CV] = relationship(back_populates="versions")

    def __repr__(self) -> str:  # pragma: no cover - debug aid
        return f"<CVVersion cv_id={self.cv_id} v={self.version_number} src={self.source}>"
