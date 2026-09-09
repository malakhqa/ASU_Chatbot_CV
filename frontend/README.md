# Frontend — AI Career Assistant

React 19 + TypeScript, built with Vite. React Router for routing, Axios for the
API client, Vitest + Testing Library for tests.

## Layout

```text
frontend/
├── src/
│   ├── main.tsx                 # entry — mounts <App/>
│   ├── App.tsx                  # BrowserRouter + AuthProvider + routes
│   ├── config.ts               # API_BASE_URL from VITE_API_BASE_URL
│   ├── components/
│   │   ├── common/             # Button, Input, TextArea, Select, Modal, Loading,
│   │   │                       #   ErrorMessage, TagsInput, RepeatableList
│   │   ├── layout/             # Navbar, Sidebar, DashboardLayout
│   │   ├── profile/            # Section + one *Form per profile section (reused by cv/)
│   │   ├── cv/                 # CVEditor, CVPreview, TemplateSelector, CVActions, VersionHistory
│   │   ├── analyzer/           # ScoreCard, AnalysisResult, Recommendations, AnalysisPanel
│   │   ├── ats/                # ATSResultPanel (ATS-readiness check)
│   │   ├── jobs/               # JobDescriptionForm, JobAnalysis, SkillGapPanel, CustomizedCV
│   │   ├── chatbot/            # Chatbot, ChatMessage, ChatInput, CVActionNotification
│   │   ├── dashboard/          # ProfileStatusCard, RecentCVsCard
│   │   └── routing/            # ProtectedRoute
│   ├── context/
│   │   ├── authContext.ts      # createContext + types
│   │   └── AuthProvider.tsx    # session state + login/register/logout
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProfile.ts       # load / reload the career profile
│   │   ├── useCVs.ts           # load / reload the CV list
│   │   ├── useCV.ts            # load / reload a single CV
│   │   └── useChat.ts          # one conversation: optimistic send + CV-action state
│   ├── lib/
│   │   ├── errors.ts           # toErrorMessage()
│   │   ├── validation.ts       # email / password / confirm validators
│   │   ├── profile.ts          # toFields / cleanProfilePayload / isDirty
│   │   ├── cv.ts               # CV_TEMPLATES, templateLabel, emptyCVContent
│   │   ├── job.ts              # JobDraft, jobChoiceFromDraft
│   │   ├── format.ts           # formatDate
│   │   └── download.ts         # saveBlob, filenameFromDisposition
│   ├── pages/                  # Login, Register, Dashboard, Profile, MyCVs, CreateCV,
│   │                           #   EditCV, AnalyzeCV, ATSCheck, CustomizeCV, Chat; NotFound
│   ├── services/
│   │   ├── api.ts              # axios instance + token attach + 401→refresh→retry
│   │   ├── authService.ts
│   │   ├── profileService.ts   # GET / PUT /api/profile
│   │   ├── cvService.ts        # list / get / create / generate / update / versions / pdf
│   │   ├── analysisService.ts  # analyze a CV, list past analyses
│   │   ├── atsService.ts       # POST /api/cv/ats-check (stateless)
│   │   ├── skillGapService.ts  # POST /api/cv/skill-gap (stateless)
│   │   ├── jobService.ts       # jobs CRUD + POST /api/jobs/customize
│   │   ├── chatService.ts      # send message + conversation CRUD
│   │   └── tokenStore.ts       # guarded localStorage for JWTs
│   ├── types/                  # API/data types mirroring backend schemas
│   └── test/setup.ts           # jest-dom matchers
├── eslint.config.js            # flat config (ESLint 9 + typescript-eslint)
├── .prettierrc.json
├── .prettierignore             # dist / coverage / tooling caches
├── vite.config.ts              # react plugin, `@` alias, /api dev proxy, vitest
├── nginx.conf                  # prod: serve SPA + reverse-proxy /api → backend
├── .dockerignore
├── Dockerfile                  # node build stage → nginx serve stage
└── .env.example
```

## Prerequisites

**Node.js 20+ and npm** — install from <https://nodejs.org/> or via nvm/fnm.
(Not needed if you only run the stack through Docker.)

## Setup & run

```bash
cd frontend
npm install
cp .env.example .env.local        # set VITE_API_BASE_URL if backend isn't on :8000
npm run dev                       # http://localhost:5173
```

Start the backend first (`cd ../backend && uvicorn app.main:app --reload`). In dev,
requests to `/api` are proxied to `VITE_API_BASE_URL` (default `http://localhost:8000`).

## Docker

Two-stage build: `node:20-alpine` runs `npm ci && npm run build`, then
`nginx:1.27-alpine` serves the static `dist/` and reverse-proxies `/api/` to the
`backend` service (see `nginx.conf`). Because the API is same-origin through
nginx, the bundle is built with an **empty** `VITE_API_BASE_URL` (build arg) so
the axios client calls `/api` — no CORS, and the backend port need not be
published. `nginx` also does SPA history fallback (`try_files … /index.html`) and
long-caches `/assets/`.

Built and run by the root `docker compose up --build`. Standalone:

```bash
docker build -t aica-frontend ./frontend           # same-origin /api (needs the proxy target)
docker build -t aica-frontend --build-arg VITE_API_BASE_URL=http://localhost:8000 ./frontend
docker run --rm -p 5173:80 aica-frontend
```

## Scripts

| Command             | What it does                       |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Vite dev server                    |
| `npm run build`     | `tsc` typecheck + production build |
| `npm run typecheck` | `tsc --noEmit` only                |
| `npm run preview`   | Serve the built app                |
| `npm run lint`      | ESLint                             |
| `npm run format`    | Prettier write                     |
| `npm run test`      | Vitest (watch)                     |
| `npm run test:run`  | Vitest once                        |

## Auth flow

`tokenStore` keeps the access + refresh JWTs in `localStorage`. `api.ts` attaches
the access token to every request; on a `401` (non-auth endpoint) it runs **one**
refresh — de-duplicated across concurrent requests — replays the original request,
and on failure clears tokens and notifies `AuthProvider`, which flips to
`anonymous` so `ProtectedRoute` redirects to `/login`.

## Career profile page (`/profile`)

`useProfile` loads `GET /api/profile`; the page keeps a local editable copy of the
editable fields (`lib/profile.toFields`). **Save** is enabled only when the copy
differs from the loaded profile (`isDirty`) and the optional email is valid; it
sends `cleanProfilePayload(...)` to `PUT /api/profile` — blank scalars become
`null`, string lists are trimmed, and placeholder rows (empty, or missing a
required key like a language's `name`) are dropped so the backend's strict PUT
doesn't 422. Repeatable sections use `RepeatableList`; `skills` /
`technologies` / `highlights` use `TagsInput`.

## CVs (`/cvs`, `/cvs/new`, `/cvs/:id`)

- **`MyCVs`** lists CV cards (`GET /api/cv`) with an empty state; each card links
  to `/cvs/:id`.
- **`CreateCV`** takes a title + template and offers two paths: **Generate from my
  profile** (`POST /api/cv/generate` — AI draft; **503** shows "AI service is not
  configured", so the user can still start blank) or **Start blank**
  (`POST /api/cv`). On success it routes to `/cvs/:id`.
- **`EditCV`** (`/cvs/:id`) is the editor: a toolbar (title, `TemplateSelector`,
  an **Analyze** link, `CVActions`), a collapsible `VersionHistory` with restore,
  and a two-pane `CVEditor` + live `CVPreview`. The section forms are the same
  components as the profile editor. **Save** sends `{title, template}` in place and
  only adds `content` to the payload when the body actually changed (so a title
  tweak doesn't spawn a version). **Download PDF** (`GET /api/cv/:id/pdf`, blob) is
  disabled while there are unsaved edits. Loaded state lives in a single
  `draft | null` so the editor never flashes an empty frame.
- **`AnalyzeCV`** (`/cvs/:id/analyze`) runs `POST /api/cv/analyze` and renders the
  result: `ScoreCard` (0–100, banded), `AnalysisResult` (strengths / weaknesses /
  missing), `Recommendations`. Past analyses (`GET /api/cv/:id/analyses`) load on
  mount; the most recent shows first and older ones are switchable.
- **`ATSCheck`** (`/cvs/:id/ats`) runs `POST /api/cv/ats-check` (stateless) and
  renders `ATSResultPanel`: `ScoreCard`, passing checks, findings sorted by
  severity (each tagged with a category — keywords / sections / formatting /
  relevance / content), and `Recommendations`.
- **`CustomizeCV`** (`/cvs/:id/customize`) — pick a saved job or paste a new one
  (a new one is saved via `POST /api/jobs` before use, since analyze needs an id).
  Three actions share that job: **Analyze match** → `POST /api/cv/analyze` with the
  job id → reuses the analyzer panel scoped to the role; **Skill gap** →
  `POST /api/cv/skill-gap` → `SkillGapPanel` (match score + have / missing /
  worth-strengthening buckets); **Tailor CV for this job** → `POST /api/jobs/customize`
  → a new `job_customization` version; `CustomizedCV` previews it with "Open in
  editor" + "Download PDF".

## Chatbot

`useChat` drives one conversation: on send it appends an optimistic user bubble,
POSTs `/api/chat/message`, then appends the assistant reply (rolling the optimistic
message back on error). The reply may carry a `proposed_action` — a
`{section, action, content}` CV edit — surfaced by `CVActionNotification`. When the
`Chatbot` is given a `cvId`, the backend **auto-applies** valid actions as a new
`chat_edit` version (`applied: true`, `cv_version_number`), and `onCvUpdated` lets
the parent reload.

- **`Chat`** page (`/chat`) — conversation list sidebar (`GET/DELETE
/api/chat/conversations`) + the `Chatbot` for a career Q&A.
- **`EditCV`** embeds `<Chatbot cvId={…} onCvUpdated={reload}>` in a collapsible
  panel so requests like “add Python to my skills” edit the open CV directly.
