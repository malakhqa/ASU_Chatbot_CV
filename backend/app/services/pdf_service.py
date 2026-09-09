"""Render a :class:`CVContent` to a PDF.

Uses reportlab (pure Python, no system libraries) with the Bitstream Vera fonts
that ship with reportlab, so output is identical on Windows and in the Docker
image.

Five templates — ``professional`` (default), ``modern``, ``minimal``,
``academic`` and ``creative`` — differ in accent colour, header treatment,
section-rule style, heading case, spacing, alignment and (for ``academic``)
section order. Unknown template names fall back to ``professional``.

Note: Vera covers Latin, Latin Extended, Greek and Cyrillic. Complex-script
shaping (Arabic, CJK) is out of scope for the MVP.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from io import BytesIO
from typing import Any
from xml.sax.saxutils import escape

import reportlab
from reportlab.lib.colors import Color, HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT
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
_MUTED = HexColor("#555555")

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


# --- template specs -------------------------------------------------------------


@dataclass(frozen=True)
class _TemplateSpec:
    accent: Color
    rule: Color
    name_size: float
    heading_size: float
    align: int  # name + contact alignment
    section_rule_width: str  # "100%" / "60%" / "" (no rule)
    header_rule_thickness: float  # 0 = no rule under the header
    heading_upper: bool
    heading_letter_spacing: float
    section_space_before: float
    education_first: bool


_PROFESSIONAL = _TemplateSpec(
    accent=HexColor("#1a3c5e"),
    rule=HexColor("#b8c4d0"),
    name_size=20,
    heading_size=11.5,
    align=TA_LEFT,
    section_rule_width="100%",
    header_rule_thickness=1.0,
    heading_upper=True,
    heading_letter_spacing=0.0,
    section_space_before=10,
    education_first=False,
)

_TEMPLATES: dict[str, _TemplateSpec] = {
    "professional": _PROFESSIONAL,
    "modern": _TemplateSpec(
        accent=HexColor("#0f766e"),
        rule=HexColor("#99e2d8"),
        name_size=23,
        heading_size=11,
        align=TA_LEFT,
        section_rule_width="",  # colour carries the heading, no underline
        header_rule_thickness=2.6,
        heading_upper=True,
        heading_letter_spacing=0.6,
        section_space_before=14,
        education_first=False,
    ),
    "minimal": _TemplateSpec(
        accent=HexColor("#222222"),
        rule=HexColor("#dddddd"),
        name_size=16,
        heading_size=9.5,
        align=TA_LEFT,
        section_rule_width="",
        header_rule_thickness=0.0,
        heading_upper=True,
        heading_letter_spacing=1.4,
        section_space_before=9,
        education_first=False,
    ),
    "academic": _TemplateSpec(
        accent=HexColor("#243b53"),
        rule=HexColor("#c2cede"),
        name_size=18,
        heading_size=11,
        align=TA_CENTER,
        section_rule_width="100%",
        header_rule_thickness=0.8,
        heading_upper=False,  # Title Case
        heading_letter_spacing=0.0,
        section_space_before=12,
        education_first=True,
    ),
    "creative": _TemplateSpec(
        accent=HexColor("#7c3aed"),
        rule=HexColor("#d9c8f7"),
        name_size=25,
        heading_size=12,
        align=TA_LEFT,
        section_rule_width="60%",
        header_rule_thickness=3.4,
        heading_upper=True,
        heading_letter_spacing=0.8,
        section_space_before=14,
        education_first=False,
    ),
}


def _resolve(template: str) -> _TemplateSpec:
    return _TEMPLATES.get((template or "").strip().lower(), _PROFESSIONAL)


def _styles(spec: _TemplateSpec) -> dict[str, ParagraphStyle]:
    return {
        "name": ParagraphStyle(
            "name",
            fontName=_BOLD,
            fontSize=spec.name_size,
            leading=spec.name_size * 1.2,
            textColor=spec.accent,
            alignment=spec.align,
            spaceAfter=2,
        ),
        "contact": ParagraphStyle(
            "contact",
            fontName=_BODY,
            fontSize=9,
            leading=13,
            textColor=_MUTED,
            alignment=spec.align,
            spaceAfter=6,
        ),
        "section": ParagraphStyle(
            "section",
            fontName=_BOLD,
            fontSize=spec.heading_size,
            leading=spec.heading_size + 2.5,
            textColor=spec.accent,
            spaceBefore=spec.section_space_before,
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


def _heading_text(title: str, spec: _TemplateSpec) -> str:
    text = title.upper() if spec.heading_upper else title.title()
    if spec.heading_letter_spacing:
        # crude tracking: reportlab has no letter-spacing, so space the glyphs out
        gap = " " if spec.heading_letter_spacing < 1 else "  "
        text = gap.join(text)
    return text


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


def _section(title: str, s: dict[str, ParagraphStyle], spec: _TemplateSpec) -> list[Any]:
    out: list[Any] = [Paragraph(_heading_text(title, spec), s["section"])]
    if spec.section_rule_width:
        out.append(
            HRFlowable(
                width=spec.section_rule_width,
                thickness=0.6,
                color=spec.rule,
                spaceBefore=1,
                spaceAfter=3,
                hAlign="LEFT",
            )
        )
    else:
        out.append(Spacer(1, 2))
    return out


def _experience_block(
    content: CVContent, s: dict[str, ParagraphStyle], spec: _TemplateSpec
) -> list[Any]:
    out: list[Any] = _section("Experience", s, spec)
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


def _education_block(
    content: CVContent, s: dict[str, ParagraphStyle], spec: _TemplateSpec
) -> list[Any]:
    out: list[Any] = _section("Education", s, spec)
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


def _projects_block(
    content: CVContent, s: dict[str, ParagraphStyle], spec: _TemplateSpec
) -> list[Any]:
    out: list[Any] = _section("Projects", s, spec)
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


def _simple_list_block(
    title: str, lines: list[str], s: dict[str, ParagraphStyle], spec: _TemplateSpec
) -> list[Any]:
    out: list[Any] = _section(title, s, spec)
    out.append(Paragraph(" · ".join(lines), s["body"]))
    return out


def _build_story(cv_title: str, content: CVContent, spec: _TemplateSpec) -> list[Any]:
    s = _styles(spec)
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
    if spec.header_rule_thickness:
        story.append(
            HRFlowable(
                width="100%", thickness=spec.header_rule_thickness, color=spec.accent, spaceAfter=2
            )
        )
    else:
        story.append(Spacer(1, 4))

    if content.summary.strip():
        story += _section("Summary", s, spec)
        story.append(Paragraph(_t(content.summary), s["body"]))

    experience = _experience_block(content, s, spec) if content.experience else []
    education = _education_block(content, s, spec) if content.education else []
    if spec.education_first:
        story += education + experience
    else:
        story += experience + education

    if content.projects:
        story += _projects_block(content, s, spec)
    if content.skills:
        story += _simple_list_block("Skills", [_t(x) for x in content.skills], s, spec)
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
        story += _simple_list_block("Certifications", [x for x in lines if x], s, spec)
    if content.languages:
        lines = [
            " — ".join(p for p in (_t(lang.name), _t(lang.proficiency)) if p)
            for lang in content.languages
        ]
        story += _simple_list_block("Languages", [x for x in lines if x], s, spec)

    if len(story) <= 3:  # only the header rendered
        story.append(Spacer(1, 6 * mm))
        story.append(Paragraph("This CV has no content yet.", s["entry_meta"]))
    return story


def available_templates() -> list[str]:
    return list(_TEMPLATES)


def render_cv_pdf(*, cv_title: str, content: CVContent, template: str = "professional") -> bytes:
    """Render ``content`` to PDF bytes styled by ``template``."""
    _ensure_fonts()
    spec = _resolve(template)

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
    doc.build(_build_story(cv_title, content, spec))
    return buffer.getvalue()
