# AI Career Assistant

An AI-powered platform that helps university students and recent graduates create,
improve, analyze, and job-tailor their CVs from a single career profile.

- **Frontend:** React + TypeScript (Vite)
- **Backend:** Python + FastAPI
- **Database:** MySQL
- **AI:** Google Gemini (`gemini-3.6-flash`)
- **Deployment:** Docker / docker-compose
- **PDF:** reportlab (pure-Python; Windows + Docker parity)

See [`Documentation/`](Documentation/) for the full business and technical specs.

---

## Repository layout

```text
ai-career-assistant/
├── backend/                    # FastAPI application (Python) + Dockerfile
├── frontend/                   # React + TypeScript (Vite) + Dockerfile + nginx.conf
├── Documentation/              # Business & technical documentation
├── docker-compose.yml          # mysql + backend + frontend (full stack)
├── docker-compose.override.yml # dev-only: publishes MySQL on 127.0.0.1
├── .env.example                # Root env template for docker-compose
└── README.md
```

## Prerequisites

- Python 3.11+
- Node.js 20+ and npm
- Docker Desktop (for MySQL and full-stack runs)
- A Google Gemini API key

## Run the whole stack with Docker

The fastest way to run everything — MySQL, the API, and the web app:

```bash
cp .env.example .env          # then edit: set a real GEMINI_API_KEY, strong passwords
docker compose up --build
```

Then open <http://localhost:5173>. The backend applies its database migrations
automatically on start, so the first boot is ready to use once the containers
report healthy.

| URL                            | What                                            |
| ------------------------------ | ----------------------------------------------- |
| <http://localhost:5173>        | Web app (nginx serves the SPA, proxies `/api`)  |
| <http://localhost:8000/docs>   | API docs (published for convenience/debugging)  |
| MySQL                          | **not** published by the base compose file      |

- `docker compose up --build` also merges `docker-compose.override.yml`, which
  publishes MySQL on `127.0.0.1:3306` for local tools like MySQL Workbench.
- For a production-style run with the database fully internal:
  `docker compose -f docker-compose.yml up --build`.
- `ENVIRONMENT=production` in `.env` makes the API refuse to start unless
  `JWT_SECRET_KEY` and `DATABASE_URL` are real values.

## Getting started (local development without Docker for the app)

1. **Clone & configure**

   ```bash
   cp .env.example .env
   # edit .env — set MySQL passwords and the Gemini key
   ```

2. **Start the database**

   ```bash
   docker compose up -d mysql
   ```

3. **Backend**

   ```bash
   cd backend && python -m venv .venv && .venv/Scripts/activate  # or source .venv/bin/activate
   pip install -r requirements-dev.txt
   cp .env.example .env   # set DATABASE_URL + GEMINI_API_KEY
   alembic upgrade head
   uvicorn app.main:app --reload --port 8000
   ```

4. **Frontend** (needs Node.js 20+)

   ```bash
   cd frontend && npm install
   cp .env.example .env.local
   npm run dev   # http://localhost:5173
   ```

## Using the app (end-to-end)

1. **Register** at `/register` — an empty career profile is created for you.
2. **Fill your career profile** (`/profile`): summary, skills, experience,
   education, projects. The dashboard shows how complete it is.
3. **Create a CV** (`/cvs/new`): **Generate from my profile** (AI drafts one) or
   **Start blank**. Every content change is saved as a new version — nothing is
   overwritten, and you can restore any earlier version.
4. **Analyse** a CV (`/cvs/:id/analyze`) for a 0–100 score with strengths,
   weaknesses, and concrete fixes.
5. **ATS check** (`/cvs/:id/ats`) — see how cleanly an Applicant Tracking System
   can parse the CV: section headings, keywords, formatting, and filler content.
6. **Interview prep** (`/cvs/:id/interview`) — generate likely interview
   questions from the CV, grouped by type, each with a note on what a strong
   answer covers.
7. **Tailor** a CV to a job (`/cvs/:id/customize`): paste a posting, then
   **Analyze match**, **Skill gap** (which of the role's skills you have, are
   missing, or should strengthen), or **Tailor CV for this job** (rewrites and
   reorders your existing content — it never invents experience).
8. **Chat** (`/chat`, or the panel inside the CV editor): ask career questions,
   or say “add Docker to my skills” to apply an edit as a new version.
9. **Download PDF** from the CV editor at any time.

If `GEMINI_API_KEY` is empty, the AI steps return a clear “AI service is not
configured” message and you can still build CVs by hand. If the key is rate-
limited or the model is busy, the app says so and no partial data is saved.

## Development conventions

| Area              | Tool                                             |
| ----------------- | ----------------------------------------------- |
| Python lint/format | `ruff` (lint + format)                          |
| Python tests       | `pytest`                                        |
| Python types       | type hints throughout; `mypy` optional          |
| DB migrations      | `alembic`                                       |
| TS lint/format     | `eslint` + `prettier` (configured in Task 14)   |
| TS tests           | `vitest`                                        |
| Commits            | Conventional Commits style (`feat:`, `fix:`, …) |

## Architecture principle

> React handles what the user sees, FastAPI handles what the application does,
> MySQL stores persistent data, Gemini provides AI capabilities, and Docker
> provides the deployment environment. The frontend never calls Gemini directly;
> the chatbot never writes to the database directly — CV changes always go
> through the CV service with validation.

## Build progress

- [x] Task 1 — Monorepo scaffold & meta files
- [x] Task 2 — FastAPI app skeleton
- [x] Task 3 — Database layer
- [x] Task 4 — Data models & schemas
- [x] Task 5 — Authentication
- [x] Task 6 — Career Profile API
- [x] Task 7 — AI service (Gemini)
- [x] Task 8 — CV generation
- [x] Task 9 — CV versioning
- [x] Task 10 — CV analysis
- [x] Task 11 — Job-specific customization
- [x] Task 12 — Chatbot + conversational CV editing
- [x] Task 13 — PDF export
- [x] Task 14 — Frontend scaffold
- [x] Task 15 — Auth pages
- [x] Task 16 — Career Profile UI
- [x] Task 17 — CV list & creation
- [x] Task 18 — CV Editor & Preview
- [x] Task 19 — CV Analyzer UI
- [x] Task 20 — Job customization UI
- [x] Task 21 — Chatbot UI
- [x] Task 22 — Dashboard
- [x] Task 23 — Dockerization
- [x] Task 24 — End-to-end pass
- Task 25 — Extended features
  - [x] 25a — ATS optimization check
  - [x] 25b — Skill gap analysis
  - [x] 25c — Interview preparation
  - [ ] 25d — Additional CV templates
