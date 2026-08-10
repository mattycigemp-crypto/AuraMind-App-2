# AuraMind — Complete Master Reference

> Auto-generated from the full codebase exploration on July 8, 2026. This document is the single source of truth for everything AuraMind. When you need to understand ANY aspect of this project, start here.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Name** | AuraMind |
| **Tagline** | AI-Powered Study Companion |
| **Version** | 2.0.0 |
| **Domain** | `auramind.app` (DNS at Namecheap → needs A record `76.76.21.21`) |
| **Vercel project** | `auramind-gemini` (org: `team_cuIB2UjO85PypaCiv6wiLYxO`, projectId: `prj_yhfSoOftNS3jaRNah2vn5x2SG1ow`) |
| **Vercel deployment** | `https://auramind-gemini-fl7arzx5m-matt-smiths-projects-4e410eda.vercel.app` (latest prod) |
| **Repository owner** | `mattycigemp-crypto` (owner email: `matty.cigemp@gmail.com`) |
| **License** | Proprietary — All rights reserved |

---

## 2. What AuraMind Does

AuraMind is an AI-powered flashcard and study platform. Users create decks of flashcards, study with spaced repetition, generate new cards with AI, take quizzes, and follow structured learning paths.

**Core workflow:**
1. Create a deck (manually, from AI generation, or import from PDF/Anki)
2. Study flashcards with spaced repetition (SM-2 / FSRS v5)
3. Track progress via dashboard analytics (streaks, retention, heatmaps)
4. Use AI chat for explanations, quiz generation, and research

**Target audience:** Students, professionals, language learners, educators, lifelong learners.

---

## 3. Project Structure

```
AuraMind App 2/                          ← Project root
├── auramind-gemini/                     ← MAIN FRONTEND (React 19 + Vite)
│   ├── src/
│   │   ├── App.tsx                      ← Root component, routes, state management
│   │   ├── main.tsx                     ← Platform detection + React mount
│   │   ├── index.tsx                    ← Browser entry (PWA, SEO, error handler)
│   │   ├── index.css                    ← Global styles
│   │   ├── architectural.css            ← Design tokens
│   │   ├── components/
│   │   │   ├── achievements/            ← AchievementUnlock, CelebratoryFeedback
│   │   │   ├── auth/                    ← AuthPage, PaymentPage
│   │   │   ├── auramind/               ← CommandPalette, NeuralBg
│   │   │   ├── background/             ← Visual effects
│   │   │   ├── challenges/             ← DailyChallenges
│   │   │   ├── charts/                 ← Chart components
│   │   │   ├── chat/                   ← AuraChat, AIChatPage, NotebookLM*, SourceGroundedChat
│   │   │   ├── common/                 ← InteractiveOverlay
│   │   │   ├── dashboard/              ← MainDashboard, Sidebar, AIChat, CardsDecks, Settings, Analytics
│   │   │   ├── deck/                   ← FlashcardCreator
│   │   │   ├── gamification/           ← Leaderboard, AchievementsDashboard
│   │   │   ├── icons/                  ← CustomIcons
│   │   │   ├── landing/                ← ModernLandingPage (primary), ProfessionalNavbar, PricingSection, etc.
│   │   │   ├── layout/                 ← Layout components
│   │   │   ├── microlearning/          ← Micro-learning components
│   │   │   ├── mobile/                 ← MobileDashboard
│   │   │   ├── notifications/          ← QuizGenerationNotifier
│   │   │   ├── quiz/                   ← Quiz components
│   │   │   ├── settings/               ← Settings components
│   │   │   ├── shared/                 ← ErrorBoundary, KeyboardAware, AmbientPlayer, HmrRefreshNotice
│   │   │   ├── study/                  ← StudyCard, MindMapView, AudioOverview
│   │   │   ├── ui/                     ← CinematicLoader, CustomCursor, base UI
│   │   │   └── visualizations/         ← Data visualization components
│   │   ├── contexts/
│   │   │   ├── AuraContext.tsx
│   │   │   ├── DashboardWorkspaceContext.tsx
│   │   │   ├── LayoutContext.tsx
│   │   │   └── SourceDocumentsContext.tsx
│   │   ├── data/
│   │   │   └── learningPathsData.ts    ← 86 lessons across 6 courses
│   │   ├── hooks/
│   │   │   ├── useTheme.tsx            ← ThemeProvider + theme toggle
│   │   │   ├── useScrollAnimations.ts  ← Scroll-triggered animations
│   │   │   ├── useAIChat.ts            ← AI chat hook
│   │   │   ├── useSpeechRecognition.ts ← Web Speech API
│   │   │   ├── useNative.ts            ← Tauri/Capacitor detection
│   │   │   ├── usePlatform.ts          ← Platform detection
│   │   │   ├── useStudyStats.ts        ← Study statistics
│   │   │   ├── useTranslation.ts       ← i18n
│   │   │   └── useNotionIntegration.ts
│   │   ├── i18n/                       ← Internationalization (config + locales)
│   │   ├── lib/
│   │   │   ├── env.ts                  ← Environment validation
│   │   │   ├── seo.ts                  ← Meta tags + JSON-LD
│   │   │   ├── pwa.ts                  ← PWA config (Vite plugin)
│   │   │   ├── motion.ts               ← Page transition variants
│   │   │   ├── logger.ts               ← Structured logging
│   │   │   ├── analytics.ts            ← Analytics helpers
│   │   │   ├── rateLimiter.ts          ← Client-side rate limiting
│   │   │   ├── chat-prompts.ts         ← AI system prompts
│   │   │   └── utils.ts                ← General utilities
│   │   ├── pages/
│   │   │   ├── AuraMindComplete.tsx    ← Main dashboard host
│   │   │   ├── NotFoundPage.tsx
│   │   │   ├── DownloadPage.tsx
│   │   │   ├── admin/                  ← HealthCheckPage
│   │   │   ├── analytics/              ← AnalyticsPage
│   │   │   ├── auth/                   ← AdminConsolePage, CallbackPage, ResetPasswordPage, etc.
│   │   │   ├── chat/                   ← ChatPage
│   │   │   ├── dashboard/              ← Dashboard sub-pages
│   │   │   ├── deck/                   ← DeckDetailRoute
│   │   │   ├── legal/                  ← DocsPage, PrivacyPolicyPage, TermsOfServicePage
│   │   │   ├── settings/               ← SettingsPage
│   │   │   └── study/                  ← StudyModePage
│   │   ├── services/
│   │   │   ├── api.ts                  ← Generic API helpers
│   │   │   ├── api/
│   │   │   │   ├── groqService.ts      ← AI flashcard/quiz generation (Groq)
│   │   │   │   ├── auraAiService.ts    ← Multi-provider unified AI chat
│   │   │   │   ├── freeAiService.ts    ← Ollama-based chat
│   │   │   │   ├── localInferenceService.ts ← WebLLM in-browser AI
│   │   │   │   ├── factCheckService.ts ← AI content verification
│   │   │   │   ├── challengesService.ts
│   │   │   │   ├── audioOverviewService.ts
│   │   │   │   ├── mindMapService.ts
│   │   │   │   └── notificationsService.ts
│   │   │   ├── analytics/              ← analyticsService
│   │   │   ├── auth/                   ← Auth services
│   │   │   ├── database/
│   │   │   │   ├── supabase.ts         ← Supabase client init
│   │   │   │   ├── dbService.ts        ← Unified DB facade (decks, cards, sessions)
│   │   │   │   ├── syncUser.ts         ← User sync
│   │   │   │   └── modules/            ← deckService, cardService, sessionService, cache
│   │   │   ├── email/                  ← Email services (Resend)
│   │   │   ├── gamification/           ← Gamification logic
│   │   │   ├── generation/             ← Content generation
│   │   │   ├── homework/               ← Homework helper
│   │   │   ├── i18n/                   ← I18n services
│   │   │   ├── import/                 ← PDF/presentation import
│   │   │   ├── integrations/           ← Anki, Notion, Obsidian, Quizlet, Schoology
│   │   │   ├── learningPaths/          ← Learning path enrollment
│   │   │   ├── notifications/          ← Notification services
│   │   │   ├── offline/                ← offlineStudyService
│   │   │   ├── quiz/                   ← Quiz services
│   │   │   ├── quotes/                 ← quotesService
│   │   │   ├── search/                 ← Search services
│   │   │   ├── stripe/                 ← Stripe payment
│   │   │   ├── study/
│   │   │   │   ├── srs.ts              ← SM-2 spaced repetition
│   │   │   │   ├── fsrs.ts             ← FSRS v5 algorithm
│   │   │   │   ├── roadmapService.ts   ← Card metadata management
│   │   │   │   └── enhanced/           ← Enhanced study features
│   │   │   ├── supabase/               ← Supabase helpers
│   │   │   ├── trial/                  ← Trial management
│   │   │   ├── tutor/                  ← Tutor services
│   │   │   └── wordnik/                ← Wordnik dictionary
│   │   ├── styles/
│   │   │   ├── design-tokens.css
│   │   │   └── animations/             ← awe.ts (animation system)
│   │   ├── types/                      ← index.ts (all TypeScript types)
│   │   └── utils/                      ← permissions.ts, localeUtils.ts
│   ├── archive/android/                ← Capacitor Android (archived)
│   ├── archive/ios/                    ← Capacitor iOS (archived)
│   ├── archive/src-tauri/              ← Tauri v2 desktop (archived)
│   ├── public/
│   │   ├── manifest.json               ← PWA manifest
│   │   └── robots.txt
│   ├── archive/capacitor.config.ts     ← (archived)
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── package.json                    ← "auramind" v2.0.0
│   ├── .env.example
│   └── index.html
├── api/                                ← BACKEND (Vercel Serverless + Express dev server)
│   ├── index.ts                        ← Main API router (39KB — handles ALL endpoints)
│   ├── middleware.ts                   ← CORS, rate limiting, security headers
│   ├── server.js                       ← Express dev server (proxies to Vercel handler)
│   ├── chatHandler.ts                  ← SSE streaming chat
│   ├── stripe-webhook.ts               ← Stripe webhook handler
│   ├── routes/
│   │   └── chat.ts                     ← Express chat route
│   └── package.json                    ← "auramind-api" v1.0.0
├── auramind-lib/                       ← SHARED LIBRARY
│   ├── types.ts                        ← Shared types (ViewKey, AuthMode, Deck, FlashcardData, etc.)
│   └── store.ts                        ← Zustand store + SAMPLE_* data
├── supabase/
│   └── migrations/                     ← DB migrations (FSRS, learning_paths, audit_events)
├── model-service/                      ← Python model service (FastAPI)
│   ├── main.py
│   ├── mock_main.py
│   └── requirements.txt
├── content/
│   └── qwen_lora/                      ← Fine-tuned Qwen 2.5 LoRA (263 MB — excluded from Vercel)
├── .github/
│   └── workflows/                      ← CI, deploy, release-tauri
├── vercel.json                         ← Vercel deployment config (routes, headers)
├── .vercelignore                       ← Files excluded from Vercel deploy
├── .gitignore
├── ARCHITECTURE.md                     ← Architecture reference (this document supersedes it)
├── README.md                           ← Project README
├── CHANGELOG.md                        ← Version changelog
├── DEPLOYMENT.md                       ← Deployment guide
└── package.json                        ← Root scripts (npm run dev, watch, etc.)
```

---

## 4. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend framework** | React | 19.2.3 |
| **Build tool** | Vite | 5.4.11 |
| **Language** | TypeScript | 5.8.2 |
| **CSS framework** | Tailwind CSS | 4.2.1 |
| **UI primitives** | Radix UI | ~30 packages (accordion through tooltip) |
| **Animation** | Framer Motion, GSAP, Three.js/R3F | 12.27.1, 3.15.0, 0.184.0 |
| **Smooth scroll** | Lenis | 1.3.19 |
| **Routing** | React Router DOM | 6.27.0 |
| **Charts** | Recharts | 3.8.1 |
| **Forms** | React Hook Form | 7.73.1 |
| **Validation** | Zod | 4.3.6 |
| **State management** | Zustand | 5.0.14 |
| **Database / Auth** | Supabase | 2.97.0 |
| **Payments** | Stripe | 20.2.0 (API) |
| **Email** | Resend | 4.0.0 |
| **Analytics** | PostHog | 1.366.1 |
| **AI providers** | Groq, OpenRouter, Ollama/LM Studio, WebLLM | Multiple |
| **PDF parsing** | pdfjs-dist | 5.4.624 |
| **Math rendering** | KaTeX | 0.16.45 |
| **Markdown** | react-markdown + remark-gfm | 10.1.0 |
| **Icons** | Lucide React | 0.562.0 |
| **i18n** | i18next + react-i18next | 26.3.0 |
| **Testing** | Vitest + Testing Library | 4.0.17 |
| **Desktop** | Tauri v2 (archived) | 2.x — see `archive/src-tauri/` |
| **Mobile** | Capacitor (archived) | 8.x — see `archive/` |
| **PWA** | vite-plugin-pwa | 0.21.2 |
| **Backend runtime** | Node.js / Express / Vercel Serverless | — |
| **Python service** | FastAPI | (model-service/) |

---

## 5. Database Schema (Supabase PostgreSQL)

### Tables

**decks**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | gen_random_uuid() |
| user_id | UUID (FK → auth.users) | NOT NULL |
| title | TEXT | NOT NULL |
| description | TEXT | |
| card_count | INTEGER | DEFAULT 0 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| is_sample | BOOLEAN | |
| source_label | TEXT | |

**cards**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | gen_random_uuid() |
| user_id | UUID (FK → auth.users) | NOT NULL |
| deck_id | UUID (FK → decks) | ON DELETE CASCADE |
| front (question) | TEXT | NOT NULL |
| back (answer) | TEXT | NOT NULL |
| next_review | TIMESTAMPTZ | SRS scheduling |
| interval | INTEGER | Days, DEFAULT 0 |
| ease_factor | NUMERIC | DEFAULT 2.5 |
| repetition | INTEGER | DEFAULT 0 |
| last_reviewed | TIMESTAMPTZ | |
| source_type | TEXT | manual, ai, import, research, etc. |
| source_label | TEXT | |
| citations | JSONB | Array of {id, label, excerpt, locator, sourceType} |
| trust_score | NUMERIC | DEFAULT 0 |
| verified | BOOLEAN | DEFAULT FALSE (AI fact-check) |
| fsrs_state | JSONB | {stability, difficulty, elapsedDays, scheduledDays, repetitions, lapses, lastReview} |
| updated_at | TIMESTAMPTZ | Auto-updated via trigger |

**learning_paths**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| title | TEXT | |
| description | TEXT | |
| icon | TEXT | DEFAULT 'book' |
| level | TEXT | CHECK (beginner, intermediate, advanced) |
| duration | TEXT | |
| modules | INTEGER | DEFAULT 0 |
| enrolled_count | INTEGER | DEFAULT 0 |
| rating | DECIMAL(3,2) | 0-5 |
| color | TEXT | Tailwind gradient classes |
| created_at / updated_at | TIMESTAMPTZ | |

**learning_path_enrollments**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → auth.users) | ON DELETE CASCADE |
| learning_path_id | UUID (FK → learning_paths) | ON DELETE CASCADE |
| progress | INTEGER | 0-100 |
| enrolled_at / updated_at | TIMESTAMPTZ | |
| UNIQUE(user_id, learning_path_id) | | |

**fact_check_history**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → auth.users) | |
| card_id | UUID (FK → cards) | ON DELETE CASCADE |
| verified | BOOLEAN | |
| confidence | NUMERIC | DEFAULT 0 |
| issues / suggestions / sources | JSONB | |
| checked_at | TIMESTAMPTZ | |

**audit_events**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| actor_id | UUID (FK → auth.users) | ON DELETE SET NULL |
| actor_email | TEXT | NOT NULL |
| action | TEXT | NOT NULL |
| category | TEXT | CHECK (user, subscription, admin, database, system, security) |
| target_id | TEXT | |
| target_email | TEXT | |
| details | TEXT | |
| severity | TEXT | CHECK (info, warning, critical) |
| metadata | JSONB | DEFAULT '{}' |
| created_at | TIMESTAMPTZ | |

**chat_logs**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → auth.users) | |
| messages | JSONB | Array of {role, content} |
| response_preview | TEXT | |
| tokens_generated | INTEGER | |
| model | TEXT | |
| duration_ms | INTEGER | |
| success | BOOLEAN | |
| error_message | TEXT | |
| created_at | TIMESTAMPTZ | |

**schema_migrations** — version tracking

### RLS Policies
All tables have Row Level Security enabled. Users can only access their own rows (via `auth.uid() = user_id`). Admins have elevated read access. Service role can insert audit events.

### Views
- **card_analytics** — Computed view: srs_algorithm (fsrs/sm2), card_stage (new/learning/mature), review_status (due/due_soon/not_due)

---

## 6. Routes (React Router in App.tsx)

### Public Routes (no auth required)
| Path | Component | Notes |
|---|---|---|
| `/` | ModernLandingPage | Landing page with hero, features, pricing, CTA |
| `/auth` | AuthPage | Login/signup (email, Google, GitHub, magic link) |
| `/subscribe` | PaymentPage | Stripe checkout (redirected if already subscribed) |
| `/docs` | DocsPage | Documentation |
| `/privacy` | PrivacyPolicyPage | |
| `/terms` | TermsOfServicePage | |
| `/download` | DownloadPage | Desktop/mobile app downloads |
| `/reset-password` | ResetPasswordPage | |
| `/restore-account` | RestoreAccountPage | |
| `/auth/callback` | CallbackPage | OAuth callback |
| `/auth/schoology/callback` | SchoologyCallbackPage | LMS OAuth |
| `*` | NotFoundPage | 404 |

### Protected Routes (require auth + subscription)
| Path | Component | Notes |
|---|---|---|
| `/dashboard/*` | DashboardShell → AuraMindComplete | Main dashboard with sidebar |
| `/dashboard/chat` | AIChatPage | AI chat interface |
| `/dashboard/settings` | SettingsPage | User settings |
| `/deck/:id` | DeckDetailRoute | Deck detail view |
| `/study/:deckId` | StudyModePage | Active study session |
| `/admin/vault` | AdminConsolePage | Admin panel (role-gated) |
| `/admin/health` | HealthCheckPage | System health (role-gated) |

### Redirects (old → new)
`/dashboard/quiz` → `/dashboard/decks`, `/dashboard/planner` → `/dashboard`, `/dashboard/insights` → `/dashboard`, `/dashboard/professor` → `/dashboard`, `/generate` → `/dashboard/generator`, `/chat` → `/dashboard/chat`, `/settings` → `/dashboard/settings`, `/analytics` → `/dashboard/analytics`, `/schedule` → `/dashboard`, `/decks` → `/dashboard/decks`, `/leaderboards` → `/dashboard`, `/challenges` → `/dashboard`

---

## 7. API Endpoints

All under `/api` — routed from `api/index.ts`. The Express dev server (`api/server.js`) mounts chat routes first, then proxies everything else to the Vercel handler.

### Admin (`/api/admin/*`)
| Action | Method | Auth | Purpose |
|---|---|---|---|
| `list` | GET | Admin JWT | List all users with metadata |
| `toggle` | POST | Admin JWT | Toggle admin status (deprecated) |
| `utility/set_role` | POST | Admin JWT | Change user role (owner/ceo/admin/employee/user) |
| `utility/set_subscription` | POST | Admin JWT | Manually set subscription status |
| `utility/create_test_user` | POST | Admin JWT | Create test account |
| `utility/get_user_details` | POST | Admin JWT | Get user details |
| `test` | GET | Admin JWT | Run system diagnostics (Supabase + Stripe) |
| `query` | POST | Admin JWT | Read-only SQL query explorer |
| `revenue` | GET | Admin JWT | Stripe MRR/ARR metrics |
| `bulk/role` | POST | Admin JWT | Bulk role change |
| `bulk/email` | POST | Admin JWT | Bulk email (logs only) |
| `bulk/export` | POST | Admin JWT | CSV/JSON user export |
| `audit/list` | POST | Admin JWT | List audit events with filters |

### Other Endpoints
| Endpoint | Action | Auth | Purpose |
|---|---|---|---|
| `/api/coupons` | list/create/delete | Admin JWT | Stripe coupon management |
| `/api/subscription` | POST | None | Verify subscription status |
| `/api/chat/stream` | GET | Optional | SSE streaming AI chat |
| `/api/stripe/checkout` | POST | User context | Create Stripe checkout session (7-day trial) |
| `/api/stripe/portal` | POST | User context | Stripe billing portal |
| `/api/account/delete` | POST | User JWT | Delete account |
| `/api/audit/list` | POST | Admin JWT | List audit events |
| `/api/audit/create` | POST | Admin JWT | Create audit event |
| `/api/integrations/notion/*` | POST | User JWT | Notion connect/disconnect |
| `/api/integrations/anki/update` | POST | User JWT | Anki import tracking |
| `/api/integrations/obsidian/*` | POST | User JWT | Obsidian connect/disconnect |
| `/api/integrations/schoology/*` | POST | User JWT | Schoology connect/disconnect |
| `/api/fetch-url` | POST | Rate-limited | Fetch URL server-side, extract readable text (GeneratorPage) |
| `/api/fetch-youtube-transcript` | POST | Rate-limited | Fetch YouTube transcript server-side (GeneratorPage) |

### Chat Streaming Flow
1. Client → `GET /api/chat/stream?message=...&token=...`
2. Express router (`api/routes/chat.ts`) → `chatHandler.ts`
3. Rate limit check (30 req/min per IP)
4. Authenticate user via token (best-effort)
5. Forward to Python model service at `MODEL_SERVICE_URL/stream-chat` (default `http://127.0.0.1:8000`)
6. Stream tokens back via SSE (`text/event-stream`)
7. Log to `chat_logs` table

---

## 8. AI Integration

### Provider Priority
1. **Local AI** (if `VITE_USE_LOCAL_AI=true`) — Ollama/LM Studio on `VITE_AI_BASE_URL` (default `http://localhost:1234`)
2. **Groq** (if `VITE_GROQ_API_KEY` set) — Fastest free tier, model `llama-3.3-70b-versatile`
3. **OpenRouter** (if `VITE_OPENROUTER_API_KEY` set) — model `deepseek/deepseek-r1-0528:free`
4. **DeepSeek** — Fallback (via configurable URL)
5. **WebLLM** (`localInferenceService.ts`) — In-browser AI via WebGPU

### Service Files
| File | Purpose |
|---|---|
| `groqService.ts` | Flashcard/quiz generation from topics |
| `auraAiService.ts` | Multi-provider unified chat with fallback |
| `freeAiService.ts` | Ollama-based chat (`VITE_OLLAMA_URL`) |
| `localInferenceService.ts` | WebLLM in-browser GPU inference |
| `factCheckService.ts` | AI content verification + trust scoring |
| `chatHandler.ts` (API) | SSE streaming chat via Python model-service |
| `deepseekService.ts` | Socratic tutor prompts (enhanced for v2) |
| `chat-prompts.ts` | AI system prompt templates |

### Python Model Service (`model-service/`)
- `main.py` — FastAPI server with `/stream-chat` endpoint
- `mock_main.py` — Mock version for testing
- Expects JSON with `messages`, `temperature`, `max_tokens`, `top_p`, `repetition_penalty`

### Qwen LoRA (`content/qwen_lora/`)
- Fine-tuned Qwen 2.5 Coder 14B adapter (263 MB)
- Used by `chatHandler.ts` for chat responses (model: `qwen2.5-coder-14b`)
- **Excluded from Vercel deployment** (`.vercelignore`)

---

## 9. Spaced Repetition

### SM-2 Algorithm (`srs.ts`)
```
calculateSRS(card, quality) → {interval, repetition, easeFactor, fsrsState?}

Quality ratings: Again(0), Hard(3), Good(4), Easy(5)

- Successful recall (quality ≥ 3):
  - 1st review: interval = 1 day
  - 2nd review: interval = 6 days
  - Subsequent: interval = interval × easeFactor
- Failed recall: reset to 1 day

Ease factor: EF' = EF + (0.1 - (5-q) × (0.08 + (5-q) × 0.02))
Minimum EF: 1.3
```

### FSRS v5 (`fsrs.ts`)
- Replaced SM-2 as primary engine in v2.0.0
- State stored as JSONB in `cards.fsrs_state`
- Parameters: stability, difficulty, elapsedDays, scheduledDays, repetitions, lapses, lastReview
- Up to 30% better retention vs SM-2

---

## 10. Role-Based Permissions

| Role | Level | Admin Panel | Manage Users | Manage Roles | View Analytics | Manage Coupons | Free Access |
|---|---|---|---|---|---|---|---|
| **Owner** | 100 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **CEO** | 90 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Admin** | 80 | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |
| **Employee** | 50 | ✓ (limited) | ✗ | ✗ | ✓ | ✗ | ✗ |
| **User** | 10 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

- Role from `user.user_metadata.role` (defaults to `user`)
- Owner email `matty.cigemp@gmail.com` is hardcoded
- Admins skip subscription check → `subscriptionStatus = 'active'`
- Role colors: Owner=Purple, CEO=Blue, Admin=Green, Employee=Yellow, User=Gray

---

## 11. Subscription & Payments

### Tiers
| Plan | Price | Features |
|---|---|---|
| **Monthly Protocol** | $7.99/mo | Unlimited decks, AI generation, all study modes |
| **Annual System** | $3.99/mo ($47.88/yr) | Same as monthly, 50% off |
| **Free / Starter** | $0 | Limited decks and AI generations |

### Stripe Flow
1. User clicks Subscribe → `POST /api/stripe/checkout` → Stripe Checkout (7-day trial)
2. Webhook: `api/stripe-webhook.ts` handles events
3. Events: checkout.session.completed, customer.subscription.*, invoice.*
4. Billing portal via `/api/stripe/portal`

### Subscription Status
- `active`: Paid and current
- `trialing`: In 7-day trial
- `canceled`: Cancelled
- `past_due`: Payment failed
- `none`: No subscription
- Admin roles (Owner, CEO, Admin) get `active` automatically via `hasFreeAccess`

---

## 12. Learning Paths

Six courses, 86 lessons in `src/data/learningPathsData.ts`:

| Course | Level | Duration | Modules | Lessons |
|---|---|---|---|---|
| JavaScript Mastery | Beginner | 4 weeks | 12 | ~18 |
| React & Modern Frontend | Intermediate | 6 weeks | 8 | ~18 |
| Database & SQL | Intermediate | 5 weeks | 10 | ~15 |
| Machine Learning & AI | Advanced | 8 weeks | 12 | ~24 |
| Data Structures & Algorithms | Intermediate | 7 weeks | 10 | ~20 |
| TypeScript Deep Dive | Advanced | 6 weeks | 8 | ~16 |

### Enrollment System
- **Primary store**: localStorage (instant access)
- **Secondary sync**: Supabase (best-effort, deterministic UUIDs)
- Lessons open as popup overlays with breadcrumbs, markdown, Previous/Next

---

## 13. Native Apps

> **Archived (web-only for now).** The Tauri 2 desktop and Capacitor 8
> mobile stacks were moved under `archive/` in Aug 2026 and are not part
> of the current build/release pipeline. Restore from `archive/` to
> re-enable; the PWA remains the primary installable surface.

### PWA
- Service worker via `vite-plugin-pwa`
- Offline study support via `offlineStudyService.ts`
- Manifest: `public/manifest.json`
- Theme color: `#6366f1`

---

## 14. Integrations

| Service | Purpose | Auth Method | File |
|---|---|---|---|
| Notion | Import notes → flashcards | OAuth (access token) | `notionIntegration.ts` |
| Anki | Import/export .apkg decks | File-based | `ankiService.ts`, `ankiExportService.ts` |
| Obsidian | Import vault notes | File paths | `obsidianService.ts` |
| Quizlet | Import sets | Username | `quizletService.ts` |
| Schoology | LMS integration | OAuth (consumer key/secret) | `schoologyService.ts` |
| Wordnik | Dictionary definitions | API key | `wordnikService.ts` |
| Google Search | Research assistant | API key + engine ID | Search service |
| Slack | Admin notifications | Webhook URL | Admin settings |

---

## 15. Design System

### Colors
- **Primary gradient**: `#a855f7` (purple-500) → `#6366f1` (indigo-500) → `#06b6d4` (cyan-500)
- **Background**: `#0f0f23` / `#09090b` (dark)
- **Glass cards**: `rgba(15, 15, 35, 0.6)` + `backdrop-filter: blur(20px) saturate(180%)`
- **Borders**: `rgba(255, 255, 255, 0.06)`

### Typography
- **Headings**: Space Grotesk (Black for impact, Medium for labels)
- **Body**: Inter Regular 16px
- **Code/Mono**: Space Grotesk Medium 14px

### Motion
- **Standard easing**: `cubic-bezier(0.16, 1, 0.3, 1)`
- **Spring**: `stiffness: 300, damping: 30`
- **Stagger**: 50-80ms between children
- **Duration scale**: Fast(80ms), Normal(150ms), Slow(250ms), Modal(400ms), Hero(600ms+)

### Components
- **GlassCard**: Backdrop blur + border + inner shadow
- **NeuralBg**: Animated neural grid background
- **CustomCursor**: Magnetic follower cursor
- **CinematicLoader**: Full-screen loading animation
- **KeyboardAware**: Keyboard shortcut handler

### Accessibility
- Respects `prefers-reduced-motion`
- ARIA labels on interactive elements
- Focus-visible styling
- Skip-to-content link
- Keyboard navigation (Tab, Enter, Escape, shortcuts)

---

## 16. Environment Variables

### Required
| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

### AI (at least one)
| Variable | Purpose |
|---|---|
| `VITE_GROQ_API_KEY` | Groq AI (fastest free tier) |
| `VITE_OPENROUTER_API_KEY` | OpenRouter AI |
| `VITE_USE_LOCAL_AI` | Enable local AI (true/false) |
| `VITE_AI_BASE_URL` | Local AI URL (default: http://localhost:1234) |
| `VITE_OLLAMA_URL` | Ollama URL (default: http://localhost:11434) |
| `VITE_AI_MODEL` | Custom model (default: llama-3.2-3b-instruct) |
| `VITE_GEMINI_API_KEY` | Gemini (declared, not actively used) |

### Payments
| Variable | Purpose |
|---|---|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key |
| `VITE_STRIPE_PRICE_ID_MONTHLY` | Monthly price ID |
| `VITE_STRIPE_PRICE_ID_ANNUAL` | Annual price ID |
| `STRIPE_SECRET_KEY` | Stripe secret (server-side) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |

### Email
| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender (e.g. noreply@mail.auramind.app) |

### Other
| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_SSE_BASE` | SSE streaming base URL |
| `VITE_POSTHOG_KEY` | PostHog analytics |
| `VITE_GOOGLE_SEARCH_API_KEY` | Google Custom Search |
| `VITE_GOOGLE_SEARCH_ENGINE_ID` | Search engine ID |
| `VITE_WORDNIK_API_KEY` | Wordnik dictionary |
| `VITE_SCHOOLOGY_CONSUMER_KEY` | Schoology OAuth |
| `VITE_SCHOOLOGY_CONSUMER_SECRET` | Schoology secret |
| `VITE_SLACK_WEBHOOK_URL` | Admin notifications |
| `VITE_APP_URL` | Production URL |
| `VITE_DEMO_VIDEO_URL` | Landing page demo video |
| `VITE_DEBUG` | Debug logging |
| `VITE_MAX_DECKS_FREE` | Free tier deck limit |
| `VITE_MAX_DECKS_PRO` | Pro tier deck limit |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server-side) |
| `MODEL_SERVICE_URL` | Python model service URL |
| `ADMIN_EMAIL` | Hardcoded admin email |

---

## 17. NPM Scripts

### Root (`package.json`)
| Script | Purpose |
|---|---|
| `npm run dev` | Start dev server (auramind-gemini on port 3000) |
| `npm run dev:network` | Dev server on port 3001 with network access |
| `npm run build` | Production build |
| `npm run deploy` | Build + deploy to Vercel |
| `npm test` | Run tests |
| `npm run type-check` | TypeScript type checking |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run tauri:dev` | Tauri desktop dev |
| `npm run tauri:build` | Tauri desktop build |
| `npm run build:android` | Capacitor Android build |
| `npm run build:ios` | Capacitor iOS build |

### API (`api/package.json`)
| Script | Purpose |
|---|---|
| `node server.js` | Start Express dev server on port 3001 |

---

## 18. Deployment

### Vercel
- **Config**: `vercel.json` (build command, output directory, rewrites, headers)
- **Build**: `cd auramind-gemini && npm install && npm run build`
- **Output**: `auramind-gemini/dist`
- **SSR/API**: `api/` directory → serverless functions
- **Domain**: `auramind.app` (needs DNS: A record `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com`)
- **Excluded from deploy** (`.vercelignore`): content/, model-service/, src-tauri/, android/, ios/, supabase/, auramind-lib/

### Production URL
`https://auramind-gemini-fl7arzx5m-matt-smiths-projects-4e410eda.vercel.app` (latest)

### Security Headers (from `vercel.json`)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- Asset caching: 1 year for `/assets/*`, 1 hour for `/manifest.json`, no-cache for `/sw.js`

---

## 19. CI/CD

### GitHub Actions (`.github/workflows/`)
- **ci.yml** — Lint + type-check + test on push/PR
- **deploy.yml** — Deploy to Vercel on main branch push
- **release-tauri.yml** — Build Tauri desktop app for release

---

## 20. Key Files Reference

| File | Lines | Purpose |
|---|---|---|
| `App.tsx` | ~800 | Routes, auth state, deck/card CRUD, subscription check |
| `api/index.ts` | ~650 | All API endpoint routing + admin utilities |
| `chatHandler.ts` | ~220 | SSE streaming chat with rate limiting + logging |
| `groqService.ts` | — | AI flashcard/quiz generation |
| `srs.ts` | — | SM-2 spaced repetition algorithm |
| `fsrs.ts` | — | FSRS v5 algorithm |
| `dbService.ts` | — | Unified database facade |
| `learningPathsData.ts` | — | 86 lessons across 6 courses |
| `vite.config.ts` | ~50 | Build config, proxies, code splitting |
| `vercel.json` | ~40 | Deployment routes, headers, caching |
| `capacitor.config.ts` | ~80 | Mobile app configuration |

---

## 21. Common Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| `auramind.app` not resolving | DNS not configured | Add A record `76.76.21.21` at Namecheap |
| `www.auramind.app` not resolving | Missing CNAME | Add CNAME `www` → `cname.vercel-dns.com` |
| "File size limit exceeded (100 MB)" | `content/qwen_lora/` included | Already excluded in `.vercelignore` |
| Build fails after cleanup | Deleted file still imported | Run `npx tsc --noEmit` to find broken imports |
| Supabase connection error | Missing env vars | Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| AI generation fails | No AI provider configured | Set at least one of: `VITE_GROQ_API_KEY`, `VITE_OPENROUTER_API_KEY`, or `VITE_USE_LOCAL_AI=true` |
| Subscription check fails | No backend URL | Set `VITE_API_BASE_URL` |

---

## 22. Git

- **Branch**: `main`
- **Ahead of origin**: 2 commits
- **Remote**: origin
- **Key recent commits**: Tauri v2 plugin configs, localStorage crash fix, fetch API URL fix, native app additions, `.env` untracking

---

*Generated: July 8, 2026*
