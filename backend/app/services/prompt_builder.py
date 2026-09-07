"""Prompt + context assembly for AI requests.

The backend is responsible for gathering the right context (profile, current CV,
job description, conversation history) and prepending the safety guardrails
before anything is sent to Gemini. Callers pass plain dicts (``model_dump()``)
so this module has no dependency on the ORM or schemas.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import Any

GUARDRAILS = (
    "You help university students and recent graduates with their CVs and careers.\n"
    "Follow these rules strictly and without exception:\n"
    "- NEVER invent skills, work experience, education, projects, certifications,\n"
    "  achievements, publications, or qualifications. Use only what the user provided.\n"
    "- If information is missing, ask for it or omit it. Do not fill gaps with guesses.\n"
    "- Do not exaggerate or inflate. Rewording the user's real content is fine;\n"
    "  adding new factual claims is not.\n"
    "- Keep language professional, concise, specific, and truthful.\n"
    "- Prefer active voice and concrete, measurable phrasing when the user's own\n"
    "  information supports it."
)


def _clean(value: Any) -> str:
    return str(value).strip()


def _kv_lines(data: Mapping[str, Any], keys: Iterable[str]) -> list[str]:
    lines: list[str] = []
    for key in keys:
        val = data.get(key)
        if val:
            lines.append(f"- {key.replace('_', ' ').title()}: {_clean(val)}")
    return lines


def _bullet_list(items: Iterable[Any]) -> list[str]:
    return [f"- {_clean(item)}" for item in items if _clean(item)]


def profile_to_text(profile: Mapping[str, Any]) -> str:
    parts: list[str] = []
    contact = _kv_lines(
        profile,
        ("full_name", "email", "phone", "location", "linkedin", "github", "website"),
    )
    if contact:
        parts.append("Contact:\n" + "\n".join(contact))
    if profile.get("summary"):
        parts.append("Summary:\n" + _clean(profile["summary"]))

    for section in ("education", "experience", "projects", "certifications", "languages", "awards"):
        entries = profile.get(section) or []
        if not entries:
            continue
        rendered = []
        for entry in entries:
            if isinstance(entry, Mapping):
                fields = [f"{k}: {_clean(v)}" for k, v in entry.items() if v not in (None, "", [])]
                rendered.append("  * " + "; ".join(fields))
            else:
                rendered.append(f"  * {_clean(entry)}")
        parts.append(f"{section.title()}:\n" + "\n".join(rendered))

    skills = profile.get("skills") or []
    if skills:
        parts.append("Skills: " + ", ".join(_clean(s) for s in skills))

    return "\n\n".join(parts) if parts else "(empty profile)"


def cv_to_text(content: Mapping[str, Any]) -> str:
    parts: list[str] = []
    personal = content.get("personal_info") or {}
    if isinstance(personal, Mapping):
        contact = _kv_lines(
            personal, ("full_name", "email", "phone", "location", "linkedin", "github", "website")
        )
        if contact:
            parts.append("Personal info:\n" + "\n".join(contact))
    if content.get("summary"):
        parts.append("Summary:\n" + _clean(content["summary"]))

    for section in ("education", "experience", "projects", "certifications", "languages"):
        entries = content.get(section) or []
        if not entries:
            continue
        rendered = []
        for entry in entries:
            if isinstance(entry, Mapping):
                fields = [f"{k}: {_clean(v)}" for k, v in entry.items() if v not in (None, "", [])]
                rendered.append("  * " + "; ".join(fields))
            else:
                rendered.append(f"  * {_clean(entry)}")
        parts.append(f"{section.title()}:\n" + "\n".join(rendered))

    skills = content.get("skills") or []
    if skills:
        parts.append("Skills: " + ", ".join(_clean(s) for s in skills))

    return "\n\n".join(parts) if parts else "(empty CV)"


def job_to_text(job: Mapping[str, Any]) -> str:
    header = _kv_lines(job, ("title", "company"))
    body = _clean(job.get("description", ""))
    out = "\n".join(header)
    if body:
        out = (out + "\n\n" if out else "") + f"Description:\n{body}"
    return out or "(no job description)"


def history_to_text(messages: Iterable[Mapping[str, Any]], *, max_messages: int = 20) -> str:
    items = list(messages)[-max_messages:]
    lines = [
        f"{_clean(m.get('role', 'user')).upper()}: {_clean(m.get('content', ''))}" for m in items
    ]
    return "\n".join(lines) if lines else "(no prior messages)"


def build_context(
    *,
    profile: Mapping[str, Any] | None = None,
    cv_content: Mapping[str, Any] | None = None,
    job: Mapping[str, Any] | None = None,
    history: Iterable[Mapping[str, Any]] | None = None,
    task: str | None = None,
) -> str:
    """Assemble a single context string from whichever pieces are provided."""
    blocks: list[str] = []
    if profile is not None:
        blocks.append("## Career Profile\n" + profile_to_text(profile))
    if cv_content is not None:
        blocks.append("## Current CV\n" + cv_to_text(cv_content))
    if job is not None:
        blocks.append("## Target Job\n" + job_to_text(job))
    if history is not None:
        blocks.append("## Conversation so far\n" + history_to_text(history))
    if task:
        blocks.append("## Task\n" + task.strip())
    return "\n\n".join(blocks)
