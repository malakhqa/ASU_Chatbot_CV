# Backend — AI Career Assistant

FastAPI application.

## Layout

```text
backend/
├── app/
│   ├── main.py          # app factory + entrypoint (app.main:app)
│   ├── api/             # routers: health (auth, profile, cv, ... added later)
│   ├── core/            # config (security, dependencies added later)
│   ├── services/        # business logic + ai_service (Task 6+)
│   ├── models/          # SQLAlchemy models (Task 4)
│   ├── schemas/         # Pydantic request/response models (Task 4)
│   ├── database/        # engine, session, base (Task 3)
│   └── utils/           # validators, helpers
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

## Quality gates

```bash
ruff check .
ruff format --check .
pytest
```
