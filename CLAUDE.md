# AuraMind — Agent Cheat Sheet

AuraMind is an adaptive AI learning system: turn anything (PDF, video, lecture,
topic) into a course of cards/lessons/quizzes, schedule review with FSRS v5, and
tutor with **Prof. Aura**, an AI that models the user's real weaknesses.

Canonical docs (read these first, not this file):

- `README.md` — what the product is, quick start, env vars, build/deploy.
- `ARCHITECTURE.md` — system structure, schema, RLS/permissions, AI chain, routes.
- `CONTRIBUTING.md` — local setup, Conventional Commits, migration rules, PR bar.
- `SECURITY.md` — private vulnerability reporting.
- `CHANGELOG.md` — release history.

## Surfaces

| Surface | Path | Notes |
|---|---|---|
| Web app | `auramind-gemini/` | React 19 + Vite 6 + Tailwind 4 + React Router 7, served by Vercel (PWA) |
| Android app | `auramind-gemini/android/` | Active Capacitor 8 build, generated from the same React source |
| Backend | `api/` | Vercel serverless (`index.ts` + `stripe-webhook.ts`) with an Express dev server (`server.js`, port 3001) |
| Database | `supabase/migrations/` | Append-only, idempotent SQL migrations (source of truth for schema) |
| Desktop | `auramind-gemini/archive/src-tauri/` | Archived Tauri 2 (not built) |

## Commands (run inside `auramind-gemini/` unless noted)

```bash
npm run dev            # Vite dev server (port 3000)
npm run type-check     # tsc --noEmit
npm run lint           # ESLint
npm test               # Vitest suite
npm run build          # production build
npm run build:apk:debug    # Capacitor sync + debug APK
npm run build:aab:release  # Capacitor sync + release AAB (needs signing env vars)
npm run migrate        # node ../run-migrations.js
npm run diagnostics    # migration drift + remote ledger checks
```

From the repo root, `npm run dev` starts web (3000) + API (3001) together.

## Key conventions

- **Migrations** — every `public`-schema change ships as a new
  `supabase/migrations/YYYYMMDD_snake_case.sql` file: append-only, idempotent,
  bookkept in `schema_migrations`. Never self-apply to production from a PR.
- **Commits** — Conventional Commits (`feat:`, `fix:`, `db:`, `chore:`, …);
  branch names mirror the prefix. No `Codebuff` attribution.
- **RLS** — every table is row-level secured via `auth.uid()`; admin gates use
  `is_admin(auth.uid())` / `current_user_is_admin()` (app metadata), never
  trust `user_metadata` for authorization.
- **Env** — `VITE_`-prefixed vars ship to the browser (public). Server-only
  keys (`RESEND_API_KEY`, `STRIPE_*`, `SUPABASE_SERVICE_ROLE_KEY`,
  `GOOGLE_SEARCH_API_KEY`) must never be `VITE_`-prefixed.

## Author

CogniVect, Inc. — proprietary, all rights reserved.
