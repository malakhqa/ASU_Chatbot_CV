# AI Career Assistant

An AI-powered platform that helps university students and recent graduates create,
improve, analyze, and job-tailor their CVs from a single career profile.

- **Frontend:** React + TypeScript (Vite)
- **Backend:** Python + FastAPI
- **Database:** MySQL
- **AI:** Google Gemini (`gemini-2.0-flash`)
- **Deployment:** Docker / docker-compose
- **PDF:** WeasyPrint (HTML/CSS templates)

See [`Documentation/`](Documentation/) for the full business and technical specs.

---

## Repository layout

```text
ai-career-assistant/
├── backend/            # FastAPI application (Python)
├── frontend/           # React + TypeScript application (Vite)
├── Documentation/      # Business & technical documentation
├── docker-compose.yml  # mysql (usable now) + backend/frontend (Task 23)
├── .env.example        # Root env template for docker-compose
└── README.md
```

## Prerequisites

- Python 3.11+
- Node.js 20+ and npm
- Docker Desktop (for MySQL and full-stack runs)
- A Google Gemini API key

## Getting started (local development)

> The stack is being built task by task. Steps below grow as tasks land.

1. **Clone & configure**

   ```bash
   cp .env.example .env
   # edit .env — set MySQL passwords and the Gemini key
   ```

2. **Start the database**

   ```bash
   docker compose up -d mysql
   ```

3. **Backend** — _added in Task 2._
4. **Frontend** — _added in Task 14._

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
- [ ] Task 9 — CV versioning
- [ ] Task 10 — CV analysis
- [ ] Task 11 — Job-specific customization
- [ ] Task 12 — Chatbot + conversational CV editing
- [ ] Task 13 — PDF export
- [ ] Task 14 — Frontend scaffold
- [ ] Task 15 — Auth pages
- [ ] Task 16 — Career Profile UI
- [ ] Task 17 — CV list & creation
- [ ] Task 18 — CV Editor & Preview
- [ ] Task 19 — CV Analyzer UI
- [ ] Task 20 — Job customization UI
- [ ] Task 21 — Chatbot UI
- [ ] Task 22 — Dashboard
- [ ] Task 23 — Dockerization
- [ ] Task 24 — End-to-end pass
