# Frontend — AI Career Assistant

React + TypeScript (Vite). Scaffolding and run instructions are added in **Task 14**.

Planned layout (from the technical documentation):

```text
frontend/
├── src/
│   ├── components/   # common, layout, profile, cv, chatbot, analyzer, jobs
│   ├── pages/        # Login, Register, Dashboard, Profile, MyCVs, ...
│   ├── services/     # api.ts + one module per backend area
│   ├── hooks/        # useAuth, useProfile, useCV, useChat
│   ├── context/      # AuthContext, CVContext
│   ├── types/        # shared API/data types
│   ├── utils/        # validation, formatting
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
└── Dockerfile        # Task 23
```
