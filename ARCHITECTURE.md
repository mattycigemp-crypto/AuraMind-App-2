# AuraMind Architecture & Reference

> Consolidated from all planning documents on 2026-07-08. Refer to `README.md` for setup, `CHANGELOG.md` for version history, `DEPLOYMENT.md` for deployment.

---

## System Overview

AuraMind is a full-stack AI-powered study companion with three deployable units:

| Unit | Path | Tech | Purpose |
|---|---|---|---|
| Frontend SPA | `auramind-gemini/` | React 19 + Vite + Tailwind 4 | Main application |
| Backend API | `api/` | Express + Vercel Serverless | Auth, Stripe, admin, chat |
| Desktop/Mobile | `archive/src-tauri/`, `archive/android/`, `archive/ios/` | Tauri v2 + Capacitor | Archived — web-only |

**Key dependencies:** Supabase (auth + DB), Stripe (payments), Resend (email), PostHog (analytics). AI providers: Groq, OpenRouter, local (Ollama/LM Studio).

---

## Database Schema (Supabase PostgreSQL)

### Core tables
- **decks** — id, user_id, title, description, created_at, source_label, is_sample
- **cards** — id, user_id, deck_id, front/back, next_review, interval, ease_factor, repetition, last_reviewed, source_type, citations (JSONB), trust_score, fsrs_state (JSONB), verified (BOOL)
- **learning_paths** — id, title, description, icon, level, duration, modules, enrolled_count, rating, color
- **learning_path_enrollments** — id, user_id, learning_path_id, progress
- **fact_check_history** — id, user_id, card_id, verified, confidence, checked_at
- **audit_events** — id, actor_id, actor_email, action, category, target_id, target_email, details, severity, created_at
- **chat_logs** — id, user_id, messages, response_preview, tokens_generated, model, duration_ms
- **schema_migrations** — version tracking

All tables have Row Level Security (RLS) policies: users can only access their own data.

---

## Role-Based Permission System

| Permission | Owner | CEO | Admin | Employee | User |
|---|---|---|---|---|---|
| Access Admin Panel | ✓ | ✓ | ✓ | ✓ | ✗ |
| Manage Users | ✓ | ✓ | ✓ | ✗ | ✗ |
| Manage Roles | ✓ | ✓ | ✗ | ✗ | ✗ |
| View Analytics | ✓ | ✓ | ✓ | ✓ | ✗ |
| Manage Coupons | ✓ | ✓ | ✓ | ✗ | ✗ |
| Manage Settings | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete Users | ✓ | ✗ | ✗ | ✗ | ✗ |
| Free Access | ✓ | ✓ | ✓ | ✗ | ✗ |

Role is determined by `user.user_metadata.role`. The owner email (`matty.cigemp@gmail.com`) is hardcoded. Admins skip subscription checks automatically.

---

## AI Integration

### Provider priority: Local AI → Groq → OpenRouter → DeepSeek
- **Local**: LM Studio / Ollama on port 1234, proxied via Vite (`/local-ai`)
- **Groq**: Fastest free tier, model `llama-3.3-70b-versatile`
- **OpenRouter**: Multiple models, model `deepseek/deepseek-r1-0528:free`
- **Model service**: Python FastAPI at `MODEL_SERVICE_URL` (default `http://127.0.0.1:8000`)

### Key AI services
- `groqService.ts` — Flashcard/quiz generation from topics
- `auraAiService.ts` — Multi-provider unified chat
- `freeAiService.ts` — Ollama-based chat
- `factCheckService.ts` — AI content verification
- `chatHandler.ts` (API) — SSE streaming chat via model-service
- `deepseekService.ts` — Socratic tutor with enhanced prompts

### Chat streaming flow
Client → `/api/chat/stream?message=...&token=...` → Express router → `chatHandler.ts` → SSE stream from model-service → token-by-token to client. Rate limited: 30 req/min per IP. Responses logged to `chat_logs`.

---

## Spaced Repetition

### SM-2 Algorithm (`src/services/study/srs.ts`)
- Ratings: Again(0), Hard(3), Good(4), Easy(5)
- Successful recall: interval grows geometrically (1d → 6d → interval × easeFactor)
- Failed recall: full reset to 1 day
- Ease factor adjusted by quality (min 1.3)

### FSRS v5 (`src/services/study/fsrs.ts`)
- Replaced SM-2 as primary engine (v2.0.0)
- Stores state as JSONB in `cards.fsrs_state`
- Up to 30% better retention efficiency

---

## API Endpoints

All under `/api` — routed from `api/index.ts`:

| Endpoint | Actions | Auth |
|---|---|---|
| `/api/admin` | list, toggle, utility, test, query, revenue, bulk, audit | Admin JWT |
| `/api/coupons` | list, create, delete | Admin JWT |
| `/api/subscription` | verify | None |
| `/api/chat` | stream (SSE) | Optional |
| `/api/stripe` | checkout, portal | Varies |
| `/api/account` | delete | User JWT |
| `/api/audit` | list, create | Admin JWT |
| `/api/integrations` | notion, anki, obsidian, schoology connect/disconnect | User JWT |

Admin API includes: user role management, test user creation, SQL query explorer (read-only), bulk operations, CSV export, Stripe revenue metrics.

---

## Frontend Architecture

### Route structure (`App.tsx`)
- **Public**: `/` (landing), `/auth`, `/subscribe`, `/docs`, `/privacy`, `/terms`, `/download`, `/reset-password`, `/restore-account`, `/auth/callback`, `/auth/schoology/callback`
- **Protected**: `/dashboard/*`, `/study/:deckId`, `/deck/:id`, `/admin/vault`, `/admin/health`
- Redirects: old routes → new dashboard routes

### Component tree
```
src/components/
├── achievements/    — Achievement unlock, celebratory feedback
├── auth/            — AuthPage, PaymentPage
├── background/      — Visual effects, neural grid
├── challenges/      — DailyChallenges (dev-mode gated)
├── chat/            — AuraChat, AIChatPage, NotebookLM components
├── dashboard/       — DashboardLayout, Sidebar, MainDashboard, CardsDecks, AIChat, Settings, Analytics
├── deck/            — FlashcardCreator, deck management
├── landing/         — ModernLandingPage (with ProfessionalNavbar, PricingSection, etc.)
├── study/           — Study mode, SRS components
├── quiz/            — Quiz generation and display
├── ui/              — CinematicLoader, CustomCursor, base UI components
├── shared/          — ErrorBoundary, KeyboardAware, HmrRefreshNotice
└── icons/           — CustomIcons
```

### State management
- React Contexts: `LayoutContext`, `DashboardWorkspaceContext`, `SourceDocumentsContext`, `AuraContext`
- Zustand store in `auramind-lib/store.ts` (workspace app)
- Main app state in `App.tsx` via `useState` + Supabase auth listener

---

## Learning Paths

Six courses, 86 lessons in `src/data/learningPathsData.ts`:
- JavaScript Mastery (ES5 → ES2026)
- React & Modern Frontend (through React 19 hooks)
- Database & SQL (through PostgreSQL 18)
- Machine Learning & AI (RAG, MCP, agentic AI)
- Data Structures & Algorithms
- TypeScript Deep Dive (through TS 6.0)

Enrollment: localStorage-first with best-effort Supabase sync. Lessons open as popups with markdown, breadcrumbs, Previous/Next navigation.

---

## Integrations

- **Notion** — OAuth connect/disconnect
- **Anki** — .apkg import/export
- **Obsidian** — vault path import
- **Quizlet** — username-based connection
- **Schoology** — LMS OAuth (consumer key + access token)
- **Wordnik** — Dictionary definitions
- **Google Search** — Custom search API for research

---

## Native Apps

> **Archived (web-only for now).** The Tauri 2 desktop and Capacitor 8
> mobile stacks were moved under `archive/` in Aug 2026 and are not part
> of the current build/release pipeline. Re-enable by restoring the
> directories from `archive/` and the workflows from `archive/.github/`.

---

## Design System

- **Colors**: Primary purple (#a855f7) → indigo (#6366f1) → cyan (#06b6d4)
- **Background**: Dark (#0f0f23 / #09090b)
- **Motion**: cubic-bezier(0.16, 1, 0.3, 1) for most entrances
- **Components**: Glass morphism cards, neural grid backgrounds, scan line effects
- **Animation**: Framer Motion + GSAP (ScrollTrigger) + Three.js/R3F + Lenis smooth scroll
- **Typography**: Space Grotesk for headings, Inter for body
- **Component library**: Radix UI primitives with custom Tailwind styling

---

## Competitive Position (as of mid-2026)

Key differentiators vs competitors (Quizlet, Anki, Knowt, RemNote, StudyFetch, Brainscape):
- AI-powered content generation from multiple input formats
- FSRS v5 algorithm (matching Anki's latest)
- Multi-platform: web-first (native desktop/mobile stacks archived)
- Source-grounded flashcards with citations
- Multi-provider AI with local fallback (no API costs)
- Integrated learning paths with structured curricula

---

## Animation Reference

AuraMind uses Framer Motion + GSAP + Three.js. Key patterns:
- Staggered containers with `staggerChildren: 0.06`
- `whileInView` with `viewport: { once: true }` for scroll reveals
- Spring physics for natural motion: `stiffness: 300, damping: 30`
- Glass cards with `backdrop-filter: blur(20px) saturate(180%)`
- Animated gradients with CSS `@property --angle`
- Respects `prefers-reduced-motion` throughout
- Refer to `ANIMATION_GUIDE.md` (now deleted) for detailed code examples

---

*Last updated: 2026-07-08*
