"""Render a :class:`CVContent` to a PDF.

Uses reportlab (pure Python, no system libraries) with the Bitstream Vera fonts
that ship with reportlab, so output is identical on Windows and in the Docker
image. One baseline "professional" template for now; unknown template names fall
back to it.

Note: Vera covers Latin, Latin Extended, Greek and Cyrillic. Complex-script
shaping (Arabic, CJK) is out of scope for the MVP.
"""

from __future__ import annotations

import os
from io import BytesIO
from typing import Any
from xml.sax.saxutils import escape

import reportlab
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)

from app.schemas.cv import CVContent

_FONT_DIR = os.path.join(os.path.dirname(reportlab.__file__), "fonts")
_BODY = "CVSans"
_BOLD = "CVSans-Bold"
_ITALIC = "CVSans-Italic"
_ACCENT = HexColor("#1a3c5e")
_MUTED = HexColor("#555555")
_RULE = HexColor("#b8c4d0")

_fonts_ready = False


def _ensure_fonts() -> None:
    global _fonts_ready
    if _fonts_ready:
        return
    pdfmetrics.registerFont(TTFont(_BODY, os.path.join(_FONT_DIR, "Vera.ttf")))
    pdfmetrics.registerFont(TTFont(_BOLD, os.path.join(_FONT_DIR, "VeraBd.ttf")))
    pdfmetrics.registerFont(TTFont(_ITALIC, os.path.join(_FONT_DIR, "VeraIt.ttf")))
    pdfmetrics.registerFontFamily(_BODY, normal=_BODY, bold=_BOLD, italic=_ITALIC, boldItalic=_BOLD)
    _fonts_ready = True


def _styles() -> dict[str, ParagraphStyle]:
    return {
        "name": ParagraphStyle(
            "name", fontName=_BOLD, fontSize=20, leading=24, textColor=_ACCENT, spaceAfter=2
        ),
        "contact": ParagraphStyle(
            "contact", fontName=_BODY, fontSize=9, leading=13, textColor=_MUTED, spaceAfter=6
        ),
        "section": ParagraphStyle(
            "section",
            fontName=_BOLD,
            fontSize=11.5,
            leading=14,
            textColor=_ACCENT,
            spaceBefore=10,
            spaceAfter=2,
        ),
        "entry_title": ParagraphStyle(
            "entry_title", fontName=_BOLD, fontSize=10, leading=13, spaceBefore=4
        ),
        "entry_meta": ParagraphStyle(
            "entry_meta", fontName=_ITALIC, fontSize=8.5, leading=11, textColor=_MUTED
        ),
        "body": ParagraphStyle(
            "body", fontName=_BODY, fontSize=9.5, leading=13, alignment=TA_LEFT, spaceAfter=1
        ),
        "bullet": ParagraphStyle("bullet", fontName=_BODY, fontSize=9.5, leading=13),
    }


def _t(value: Any) -> str:
    return escape(str(value)) if value is not None else ""


def _date_range(start: Any, end: Any, current: bool) -> str:
    start_s, end_s = (str(start).strip() if start else ""), (str(end).strip() if end else "")
    if current:
        return f"{start_s} – Present".strip(" –")
    if start_s and end_s:
        return f"{start_s} – {end_s}"
    return start_s or end_s


def _bullets(items: list[Any], style: ParagraphStyle) -> ListFlowable:
    return ListFlowable(
        [ListItem(Paragraph(_t(i), style), leftIndent=10) for i in items if str(i).strip()],
        bulletType="bullet",
        bulletFontName=_BODY,
        bulletFontSize=6,
        leftIndent=12,
        spaceBefore=1,
    )


def _section(title: str, styles: dict[str, ParagraphStyle]) -> list[Any]:
    return [
        Paragraph(title.upper(), styles["section"]),
        HRFlowable(width="100%", thickness=0.6, color=_RULE, spaceBefore=1, spaceAfter=3),
    ]


def _experience_block(content: CVContent, s: dict[str, ParagraphStyle]) -> list[Any]:
    out: list[Any] = _section("Experience", s)
    for e in content.experience:
        heading = " — ".join(p for p in (_t(e.title), _t(e.company)) if p)
        out.append(Paragraph(heading or "Experience", s["entry_title"]))
        meta = " · ".join(
            p for p in (_date_range(e.start_date, e.end_date, e.current), _t(e.location)) if p
        )
        if meta:
            out.append(Paragraph(meta, s["entry_meta"]))
        if e.description:
            out.append(Paragraph(_t(e.description), s["body"]))
        if e.highlights:
            out.append(_bullets(list(e.highlights), s["bullet"]))
    return out


def _education_block(content: CVContent, s: dict[str, ParagraphStyle]) -> list[Any]:
    out: list[Any] = _section("Education", s)
    for ed in content.education:
        degree = ", ".join(p for p in (_t(ed.degree), _t(ed.field_of_study)) if p)
        heading = " — ".join(p for p in (degree, _t(ed.institution)) if p)
        out.append(Paragraph(heading or "Education", s["entry_title"]))
        meta = " · ".join(
            p
            for p in (
                _date_range(ed.start_date, ed.end_date, False),
                f"GPA: {_t(ed.gpa)}" if ed.gpa else "",
            )
            if p
        )
        if meta:
            out.append(Paragraph(meta, s["entry_meta"]))
        if ed.description:
            out.append(Paragraph(_t(ed.description), s["body"]))
    return out


def _projects_block(content: CVContent, s: dict[str, ParagraphStyle]) -> list[Any]:
    out: list[Any] = _section("Projects", s)
    for pr in content.projects:
        out.append(Paragraph(_t(pr.name) or "Project", s["entry_title"]))
        meta = " · ".join(p for p in (", ".join(map(_t, pr.technologies)), _t(pr.link)) if p)
        if meta:
            out.append(Paragraph(meta, s["entry_meta"]))
        if pr.description:
            out.append(Paragraph(_t(pr.description), s["body"]))
        if pr.highlights:
            out.append(_bullets(list(pr.highlights), s["bullet"]))
    return out


def _simple_list_block(title: str, lines: list[str], s: dict[str, ParagraphStyle]) -> list[Any]:
    out: list[Any] = _section(title, s)
    out.append(Paragraph(" · ".join(lines), s["body"]))
    return out


def _build_story(cv_title: str, content: CVContent) -> list[Any]:
    s = _styles()
    story: list[Any] = []

    pi = content.personal_info
    name = _t(pi.full_name) or _t(cv_title) or "Curriculum Vitae"
    story.append(Paragraph(name, s["name"]))
    contact = " · ".join(
        p
        for p in (
            _t(pi.email),
            _t(pi.phone),
            _t(pi.location),
            _t(pi.linkedin),
            _t(pi.github),
            _t(pi.website),
        )
        if p
    )
    if contact:
        story.append(Paragraph(contact, s["contact"]))
    story.append(HRFlowable(width="100%", thickness=1, color=_ACCENT, spaceAfter=2))

    if content.summary.strip():
        story += _section("Summary", s)
        story.append(Paragraph(_t(content.summary), s["body"]))

    if content.experience:
        story += _experience_block(content, s)
    if content.education:
        story += _education_block(content, s)
    if content.projects:
        story += _projects_block(content, s)
    if content.skills:
        story += _simple_list_block("Skills", [_t(x) for x in content.skills], s)
    if content.certifications:
        lines = [
            " — ".join(
                p
                for p in (
                    _t(c.name),
                    _t(c.issuer),
                    f"({_t(c.issue_date)})" if c.issue_date else "",
                )
                if p
            )
            for c in content.certifications
        ]
        story += _simple_list_block("Certifications", [x for x in lines if x], s)
    if content.languages:
        lines = [
            " — ".join(p for p in (_t(lang.name), _t(lang.proficiency)) if p)
            for lang in content.languages
        ]
        story += _simple_list_block("Languages", [x for x in lines if x], s)

    if len(story) <= 3:  # only the header rendered
        story.append(Spacer(1, 6 * mm))
        story.append(Paragraph("This CV has no content yet.", s["entry_meta"]))
    return story


def render_cv_pdf(*, cv_title: str, content: CVContent, template: str = "professional") -> bytes:
    """Render ``content`` to PDF bytes. ``template`` is currently informational."""
    _ = template  # single template for now; unknown names fall back here
    _ensure_fonts()

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title=cv_title or "CV",
    )
    doc.build(_build_story(cv_title, content))
    return buffer.getvalue()
