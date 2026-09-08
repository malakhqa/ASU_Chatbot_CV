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
│   │   ├── common/             # Button, Input, TextArea, Modal, Loading,
│   │   │                       #   ErrorMessage, TagsInput, RepeatableList
│   │   ├── layout/             # Navbar, Sidebar, DashboardLayout
│   │   ├── profile/            # Section + one *Form per profile section
│   │   └── routing/            # ProtectedRoute
│   ├── context/
│   │   ├── authContext.ts      # createContext + types
│   │   └── AuthProvider.tsx    # session state + login/register/logout
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useProfile.ts       # load / reload the career profile
│   ├── lib/
│   │   ├── errors.ts           # toErrorMessage()
│   │   ├── validation.ts       # email / password / confirm validators
│   │   └── profile.ts          # toFields / cleanProfilePayload / isDirty
│   ├── pages/                  # Login, Register, Profile (validated forms); Dashboard, NotFound (stubs)
│   ├── services/
│   │   ├── api.ts              # axios instance + token attach + 401→refresh→retry
│   │   ├── authService.ts
│   │   ├── profileService.ts   # GET / PUT /api/profile
│   │   └── tokenStore.ts       # guarded localStorage for JWTs
│   ├── types/                  # API/data types mirroring backend schemas
│   └── test/setup.ts           # jest-dom matchers
├── eslint.config.js            # flat config (ESLint 9 + typescript-eslint)
├── .prettierrc.json
├── vite.config.ts              # react plugin, `@` alias, /api dev proxy, vitest
└── .env.example
```

## Prerequisites

**Node.js 20+ and npm** (not currently installed on this machine — install from
<https://nodejs.org/> or via nvm/fnm).

## Setup & run

```bash
cd frontend
npm install
cp .env.example .env.local        # set VITE_API_BASE_URL if backend isn't on :8000
npm run dev                       # http://localhost:5173
```

Start the backend first (`cd ../backend && uvicorn app.main:app --reload`). In dev,
requests to `/api` are proxied to `VITE_API_BASE_URL` (default `http://localhost:8000`).

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
