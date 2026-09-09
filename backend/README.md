# Backend — AI Career Assistant

FastAPI application.

## Layout

```text
backend/
├── app/
│   ├── main.py          # app factory + entrypoint (app.main:app)
│   ├── api/             # routers: health, auth, profile, cv, jobs, chat
│   ├── core/            # config, security (hashing + JWT), dependencies (CurrentUser, AI)
│   ├── services/        # auth, profile, ai, prompt_builder, cv, analysis, job, chatbot, pdf
│   ├── models/          # SQLAlchemy models: user, profile, cv (CV+CVVersion),
│   │                    #   conversation (Conversation+ChatMessage), job, analysis, enums
│   ├── schemas/         # Pydantic request/response models per area + common
│   ├── database/        # base (declarative Base + mixins), connection (engine),
│   │                    #   session (SessionLocal + get_db dependency)
│   └── utils/           # validators, helpers
├── alembic/             # migration environment (env.py) + versions/
│                        #   0001: initial schema (all 8 tables)
├── alembic.ini          # URL comes from app settings, not this file
├── tests/
├── requirements.txt
├── requirements-dev.txt
├── pyproject.toml       # ruff + pytest config
├── .env                 # local secrets (gitignored) — copy from .env.example
├── .dockerignore
├── docker-entrypoint.sh # runs `alembic upgrade head`, then uvicorn
└── Dockerfile           # python:3.12-slim, non-root, stdlib healthcheck
```

## Setup

```bash
cd backend
python -m venv .venv
# Windows PowerShell:  .venv\Scripts\Activate.ps1
# Windows cmd:         .venv\Scripts\activate.bat
# bash/zsh:            source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env        # then edit values
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- API root:  http://localhost:8000/
- Health:    http://localhost:8000/api/health
- Docs:      http://localhost:8000/docs

## Docker

The image is `python:3.12-slim`, installs `requirements.txt`, copies the app, and
runs as a non-root user. `docker-entrypoint.sh` applies `alembic upgrade head`
(retrying while MySQL finishes starting) and then launches
`uvicorn app.main:app --host 0.0.0.0 --port 8000`. A stdlib `HEALTHCHECK` polls
`/api/health`.

Config comes entirely from environment variables — `.dockerignore` keeps `.env`,
`tests/`, and caches out of the image. Normally run via the root
`docker compose up --build`, which supplies `DATABASE_URL` (host `mysql`),
`JWT_SECRET_KEY`, `GEMINI_API_KEY`, etc. from the root `.env`. Standalone:

```bash
docker build -t aica-backend ./backend
docker run --rm -p 8000:8000 \
  -e DATABASE_URL='mysql+pymysql://career:change-me@host.docker.internal:3306/career_assistant' \
  -e JWT_SECRET_KEY='...' -e GEMINI_API_KEY='' \
  aica-backend
```

## Database & migrations

`DATABASE_URL` (in `backend/.env`) is the single source of truth — `alembic.ini`
does not contain a URL. Start MySQL via `docker compose up -d mysql` from the repo
root, then:

```bash
# create a new migration from model changes
alembic revision --autogenerate -m "describe change"

# apply migrations
alembic upgrade head

# roll back one step
alembic downgrade -1
```

The engine is created lazily (`app.database.connection.get_engine`), so importing
the app without a database configured is fine for tooling and tests. The test
suite points `DATABASE_URL` at in-memory SQLite.

## Authentication

JWT bearer auth with separate **access** (short-lived) and **refresh** tokens,
both signed HS256 with `JWT_SECRET_KEY`. Passwords are hashed with Argon2
(`pwdlib`). Protected routes depend on `CurrentUser` from
`app.core.dependencies`; `verify_ownership(owner_id, user)` enforces per-user
resource access.

| Method | Path                 | Body                          | Returns            |
| ------ | -------------------- | ----------------------------- | ------------------ |
| POST   | `/api/auth/register` | `{email, password}`           | `TokenResponse` (201) |
| POST   | `/api/auth/login`    | `{email, password}`           | `TokenResponse`    |
| POST   | `/api/auth/refresh`  | `{refresh_token}`             | `TokenResponse` (rotated) |
| GET    | `/api/auth/me`       | — (Bearer access token)       | `UserResponse`     |

Registration creates an empty `Profile` row so `GET /api/profile` always works.
`ENVIRONMENT=production` refuses to start with a default/empty `JWT_SECRET_KEY`
or an unset `DATABASE_URL`.

## Career profile

| Method | Path           | Body            | Notes                                   |
| ------ | -------------- | --------------- | --------------------------------------- |
| GET    | `/api/profile` | —               | Returns the caller's profile (auto-creates if missing) |
| PUT    | `/api/profile` | `ProfileUpdate` | **Full replace** — omitted lists become `[]`, omitted scalars become `null` |

Scalar contact fields plus JSON sections: `education`, `experience`, `skills`
(strings), `projects`, `certifications`, `languages`, `awards`. Section item
shapes live in `app/schemas/profile.py` and are reused by the CV content schema.

## AI service (Gemini)

`app/services/ai_service.py` is the **only** place that talks to Gemini
(`google-genai`; model from `GEMINI_MODEL`, default `gemini-3.6-flash`). Everything else calls
`ai_service.generate_text(...)` / `generate_structured(prompt, PydanticSchema, ...)`
or takes the `AI` FastAPI dependency (`app.core.dependencies`), which returns
**503** when `GEMINI_API_KEY` is **empty**.

> Keep `GEMINI_API_KEY=` empty in `.env` until you have a real key. A non-empty
> placeholder makes the app think AI is configured, so generate / analyze / chat
> return a confusing **502** (bad key) instead of a clean **503**. The test suite
> forces it empty regardless of `.env` (autouse fixture in `tests/conftest.py`).

- **Structured output**: pass a Pydantic model as `schema`; the wrapper sets
  `response_mime_type=application/json` + `response_schema` and validates the
  result, raising `AIResponseError` on bad/mismatched JSON.
- **Retries**: transient failures (429/5xx) retry with exponential backoff up to
  `GEMINI_MAX_RETRIES`; auth failures (401/403) raise `AIConfigError`; the rest
  raise `AIError`.
- **Context**: `app/services/prompt_builder.py` assembles the profile / CV / job /
  history context and owns `GUARDRAILS` — the "never invent qualifications" rules
  prepended as the system instruction.
- **Tests**: `ai_service.set_ai_client(FakeAIClient(...))` swaps in a deterministic
  stand-in (`tests/_fakes.py`); the `fake_ai` fixture does this and an autouse
  fixture resets it.

## CVs

Content is versioned: each CV has `CVVersion` rows, `current_version_number`
points at the active one, and every content change appends a new version.

| Method | Path                | Body              | Notes |
| ------ | ------------------- | ----------------- | ----- |
| GET    | `/api/cv`           | —                 | `CVSummary[]` (no bodies) |
| POST   | `/api/cv`           | `CVCreateRequest` | Blank CV, v1 empty content (`manual_edit`) |
| POST   | `/api/cv/generate`  | `CVCreateRequest` | Profile → Gemini → structured `CVContent`, v1 (`generated`); **503** if AI unconfigured, **502** on model failure |
| GET    | `/api/cv/{id}`      | —                 | `CVResponse` with `current_version` |
| PUT    | `/api/cv/{id}`      | `CVUpdateRequest` | `title`/`template` in place; `content` appends a new version (`manual_edit`) |
| GET    | `/api/cv/{id}/versions` | —             | `CVVersionResponse[]`, newest first |
| GET    | `/api/cv/{id}/versions/{n}` | —         | One version |
| POST   | `/api/cv/{id}/versions/{n}/restore` | —  | Appends a copy of version `n` (`restore`) and points `current` at it |
| GET    | `/api/cv/{id}/pdf`  | —                 | Renders the current version → `application/pdf` attachment (filename from the CV title) |

Not-found and not-owned both return **404** (existence isn't leaked). On generate,
the CV's `personal_info` (contact block) is filled from the **profile**, never from
the model's output — a guard against hallucinated contact details.

### Analysis

| Method | Path                    | Body            | Notes |
| ------ | ----------------------- | --------------- | ----- |
| POST   | `/api/cv/analyze`       | `AnalyzeRequest` (`cv_id`, optional `job_description_id`) | Evaluates the CV's current version (optionally vs a job) → `AnalysisResponse` (201, persisted); 404 unknown CV/job, 502 model failure, 503 AI unconfigured |
| GET    | `/api/cv/{id}/analyses` | —               | Past analyses for that CV, newest first |

`AnalysisResult` shape (what the model returns and what's stored in `results`):
`score` (0–100), `strengths[]`, `weaknesses[]`, `missing[]`, `recommendations[]`.

## Jobs & customization

| Method | Path                  | Body               | Notes |
| ------ | --------------------- | ------------------ | ----- |
| GET    | `/api/jobs`           | —                  | Saved job descriptions, newest first |
| POST   | `/api/jobs`           | `JobDescriptionCreate` | 201 |
| GET    | `/api/jobs/{id}`      | —                  | 404 if unknown/not owned |
| DELETE | `/api/jobs/{id}`      | —                  | 204 |
| POST   | `/api/jobs/customize` | `CustomizeRequest` (`cv_id` + `job_description_id` **or** inline `job_description`) | Tailors the CV's current version to the job → new `job_customization` version; returns `CVResponse`. 422 if no job given, 404 unknown CV/job, 502 model failure, 503 AI unconfigured |

Customization keeps the CV's existing `personal_info` (contact block is not a
tailoring target). An inline `job_description` is also persisted as a `JobDescription`.

## Chatbot

| Method | Path                              | Body            | Notes |
| ------ | --------------------------------- | --------------- | ----- |
| POST   | `/api/chat/message`              | `ChatSendRequest` (`message`, optional `conversation_id` / `cv_id` / `job_description_id`) | `ChatSendResponse`; 404 unknown ref, 502 model failure, 503 AI unconfigured |
| GET    | `/api/chat/conversations`        | —               | Summaries, most-recently-active first |
| GET    | `/api/chat/conversations/{id}`   | —               | Full thread with messages |
| DELETE | `/api/chat/conversations/{id}`   | —               | 204 |

## PDF export

`GET /api/cv/{id}/pdf` renders the CV's current version via `pdf_service`
(reportlab, pure Python — no GTK/Cairo, identical on Windows and in Docker). One
`professional` template; unknown `template` names fall back to it. Fonts are the
Bitstream Vera family bundled with reportlab (Latin/Latin-Extended/Greek/Cyrillic).
Complex-script shaping (Arabic, CJK) is a known MVP limitation — no pure-Python
engine does it well; revisit with WeasyPrint in the Docker image if needed.

## Chatbot

The model returns a `ChatTurn` = `{reply, cv_action?}`. `cv_action` is a
`{type:"cv_update", section, action, content}` where `section` ∈ {summary, skills,
education, experience, projects, certifications, languages} and `action` ∈ {add,
remove, replace, update} — both enforced by the schema. When a `cv_id` is supplied
and the action validates, it is applied via `cv_service.append_version` as a new
`chat_edit` version (`applied: true`, `cv_version_number` returned) — never a direct
DB write. An action the CV service rejects is **not** applied; the reply notes it.
Without a `cv_id`, the action is returned as `proposed_action` only.

## Quality gates

```bash
ruff check .
ruff format --check .
pytest
```
