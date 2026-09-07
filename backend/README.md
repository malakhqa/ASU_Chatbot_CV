# Backend — AI Career Assistant

FastAPI application.

## Layout

```text
backend/
├── app/
│   ├── main.py          # app factory + entrypoint (app.main:app)
│   ├── api/             # routers: health, auth (profile, cv, ... added later)
│   ├── core/            # config, security (hashing + JWT), dependencies (CurrentUser)
│   ├── services/        # business logic: auth_service (ai_service etc. added later)
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

## Quality gates

```bash
ruff check .
ruff format --check .
pytest
```
