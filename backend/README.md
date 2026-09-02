# Backend — AI Career Assistant

FastAPI application. Structure and run instructions are added in **Task 2**.

Planned layout (from the technical documentation):

```text
backend/
├── app/
│   ├── main.py
│   ├── api/          # routers: auth, profile, cv, chat, analysis, jobs, pdf
│   ├── services/     # business logic + ai_service
│   ├── models/       # SQLAlchemy models
│   ├── schemas/      # Pydantic request/response models
│   ├── database/     # engine, session, base
│   ├── core/         # config, security, dependencies
│   └── utils/        # validators, helpers
├── requirements.txt
├── .env              # local secrets (gitignored) — copy from .env.example
└── Dockerfile        # Task 23
```
