# Backend — AI Career Assistant

FastAPI application.

## Layout

```text
backend/
├── app/
│   ├── main.py          # app factory + entrypoint (app.main:app)
│   ├── api/             # routers: health, auth, profile (cv, chat, ... added later)
│   ├── core/            # config, security (hashing + JWT), dependencies (CurrentUser, AI)
│   ├── services/        # auth_service, profile_service, ai_service, prompt_builder
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
└── Dockerfile           # Task 23
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
(`google-genai`, model `gemini-2.0-flash`). Everything else calls
`ai_service.generate_text(...)` / `generate_structured(prompt, PydanticSchema, ...)`
or takes the `AI` FastAPI dependency (`app.core.dependencies`), which returns
**503** when `GEMINI_API_KEY` is unset.

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

## Quality gates

```bash
ruff check .
ruff format --check .
pytest
```
