"""Job description lookups.

Minimal for now (analysis needs to load a job by id); Task 11 extends this with
create/list and the customization flow.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import JobDescription, User


class JobNotFoundError(Exception):
    """Raised when a job description does not exist or is not owned by the caller."""


def get_job(db: Session, user: User, job_id: int) -> JobDescription:
    job = db.scalar(
        select(JobDescription).where(
            JobDescription.id == job_id,
            JobDescription.user_id == user.id,
        )
    )
    if job is None:
        raise JobNotFoundError(job_id)
    return job
