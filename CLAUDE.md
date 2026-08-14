# AuraMind - Voice-Powered Flashcard Platform

**Last Updated:** August 5, 2026  
**Status:** Pre-launch MVP (targeting Aug 25, 2026)  
**Positioning:** Voice-powered flashcards for audio learners

---

## 🎯 What Is AuraMind?

AuraMind is a voice-first spaced repetition platform that lets you study hands-free. Unlike traditional flashcard apps (Anki, Quizlet), AuraMind speaks questions aloud and listens to your answers, making it perfect for commuters, multitaskers, and audio learners.

**Core Features:**
1. **Voice Q&A Mode** - AI speaks flashcard questions, you answer aloud
2. **Audio → Flashcards** - Upload lectures/meetings, get instant flashcard decks
3. **Document → Study Materials** - Upload PDFs/docs, generate notes/slides/flashcards
4. **FSRS v5 Scheduling** - Better retention than Anki (30% improvement)

---

## 📁 Project Structure

```
C:\Users\wegot\AuraMind Website\AuraMind App 2\
├── auramind-gemini/          # Main React app
│   ├── src/
│   │   ├── components/       # 262 components
│   │   │   ├── landing/      # Landing page
│   │   │   ├── dashboard/    # NovaHub (main app)
│   │   │   ├── study/        # Study session
│   │   │   ├── chat/         # AI chat
│   │   │   └── ui/           # Shared UI components
│   │   ├── pages/           
│   │   │   ├── dashboard/    # NovaHub entry point
│   │   │   ├── study/        # Study mode
│   │   │   ├── generator/    # AI card generator
│   │   │   └── settings/     # User settings
│   │   ├── services/         # 80+ service modules
│   │   │   ├── api/          # AI providers (Groq, Puter, local)
│   │   │   ├── study/        # FSRS v5 implementation
│   │   │   ├── database/     # Supabase integration
│   │   │   ├── gamification/ # XP, achievements, streaks
│   │   │   └── stripe/       # Subscription management
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities
│   │   └── styles/           # Design system
│   ├── public/
│   │   └── fonts/            # AuraSans custom font
│   └── package.json          # 1,314 packages (optimized Aug 5)
├── supabase/
│   └── migrations/           # Append-only SQL migrations
├── api/                      # Vercel serverless functions
├── POSITIONING.md            # Market positioning
├── VOICE_FEATURES.md         # Voice feature implementation guide
├── MVP_EXECUTION_PLAN.md     # 3-week sprint to launch
└── QUICK_START.md            # 5-minute setup
```

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** React 19 + TypeScript (strict mode)
- **Build:** Vite 6
- **Styling:** Tailwind CSS 4 + custom design tokens
- **Routing:** React Router 6
- **State:** Zustand (consolidating from mixed Context/Zustand)
- **Animation:** Framer Motion (GSAP/anime.js removed Aug 5)
- **UI Components:** Radix UI primitives + custom components

### **Backend**
- **API:** Vercel serverless functions
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **AI:** Groq (primary), Puter (fallback), local (offline)

### **Voice/Audio**
- **TTS:** Web Speech API / OpenAI TTS
- **STT:** Web Speech API / Groq Whisper
- **Transcription:** Groq Whisper API
- **Recording:** RecordRTC (web) / Capacitor Voice Recorder (mobile)

### **Mobile** (Deferred to Phase 2)
- **Framework:** Capacitor 8 (archived, will re-add post-launch)
- **Platforms:** iOS, Android
- **Strategy:** Ship web PWA first, add native if users demand it

### **Desktop** (Deferred)
- **Framework:** Tauri 2 (archived)

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Git

### **Setup (5 minutes)**

```bash
# 1. Navigate to app directory
cd "C:\Users\wegot\AuraMind Website\AuraMind App 2\auramind-gemini"

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Fill in your API keys in .env.local
# - Supabase URL + Anon Key
# - Groq API Key
# - Stripe keys (test mode)

# 5. Start dev server
npm run dev
```

Open http://localhost:3000

### **Available Scripts**
```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build
npm run test             # Run Vitest tests
npm run lint             # ESLint
npm run type-check       # TypeScript check
```

---

## 📦 Recent Changes (August 5, 2026)

### **Bundle Optimization**
- AuraSans font optimized (WOFF2 only, no italics)
- GSAP, animejs, @mlc-ai/web-llm, lottie-react still installed and in active use (used for landing animations, scroll effects, audio visualization, and Lottie graphics)
- Framer Motion used for UI transitions; GSAP/animejs used for complex sequenced animations
- **Note:** Prior claims of 54-package removal and 28% bundle reduction were inaccurate — these libraries remain in active use

### **Positioning Defined**
- Target audience: Audio learners, commuters, multitaskers
- Core differentiator: Hands-free voice study
- Tagline: "Study anything. Hands-free. Actually remember."

### **Documentation Created**
- Complete 3-week sprint plan
- Voice features implementation guide
- Market positioning document

---

## 🎯 Current MVP Scope (Aug 5-25)

### **Must Have (Launch)**
1. ✅ FSRS v5 flashcard study mode
2. ✅ Voice Q&A mode (TTS + STT) — fully wired, unit-tested (36/36), needs browser smoke test
3. ✅ Audio upload → flashcard generation — wired, unit-tested, needs browser smoke test
4. ✅ Basic deck management
5. ✅ Stripe billing (Free + Pro tiers)

### **Should Have (Month 2)**
1. Document upload → notes/slides
2. Mobile PWA optimization
3. Offline mode

### **Deferred (Post-Launch)**
1. Native mobile apps (iOS/Android)
2. Desktop app (Tauri)
3. Marketplace
4. Collaborative decks
5. Admin panels (use Supabase dashboard for now)

---

## 🏗️ Architecture Decisions

### **Spaced Repetition**
- **Algorithm:** FSRS v5 (Free Spaced Repetition Scheduler)
- **Why:** 30% better retention than Anki's SM-2
- **Implementation:** `src/services/study/fsrs.ts`
- **Features:** Personalized weights, automatic migration from legacy cards

### **AI Provider Strategy**
- **Primary:** Groq (fast, free tier)
- **Fallback:** Puter (when Groq unavailable)
- **Offline:** Template-based generation
- **Implementation:** Graceful degradation chain in `src/services/api/auraAiService.ts`

### **State Management** (In Progress)
- **Current:** Mixed Context API + Zustand
- **Target:** Zustand only (simpler, fewer re-renders)
- **Status:** Migrating (see Task #24 in MVP_EXECUTION_PLAN.md)

### **Permissions System**
- **Roles:** Owner (100) > CEO (90) > Admin (80) > Employee (50) > User (10)
- **Implementation:** `src/utils/permissions.ts`
- **Features:** 11 granular permissions, role badges, free admin access

### **Platform-Aware Design**
- **Approach:** CSS custom properties per platform
- **Platforms:** iOS, Android, macOS, Windows, Linux
- **Variables:** `--platform-primary`, `--platform-glass`, `--platform-blur-strength`
- **File:** `src/styles/design-tokens.css`

---

## 📊 Database Schema

**Supabase Tables:**
- `users` - User profiles, subscription status, XP, streak
- `decks` - Flashcard decks with metadata
- `cards` - Flashcards with FSRS state
- `study_sessions` - Session history for analytics
- `achievements` - Gamification (28 achievements)
- `chat_sessions` - AI chat history
- `audit_events` - Admin action logging (planned)

**Migrations:** `./supabase/migrations/` (append-only, versioned)

---

## 🔒 Security

### **Auth**
- Supabase Auth (email/password)
- Row-Level Security (RLS) policies
- Owner email bypass via `VITE_OWNER_EMAIL`

### **API Keys**
- Groq API key (server-side only in production)
- Stripe webhook secret verification
- Environment variables never committed

### **Payments**
- Stripe test mode for development
- Webhook signature verification
- Subscription status checked on protected routes

---

## 🧪 Testing

### **Setup**
- **Framework:** Vitest + React Testing Library
- **E2E:** Playwright (configured, limited coverage)
- **Coverage:** ~40% estimated (goal: 70%+)

### **Running Tests**
```bash
npm run test           # Run all tests
npm run test:ui        # Vitest UI
npm run test:e2e       # Playwright E2E tests
```

---

## 🚢 Deployment

### **Web (Vercel)**
```bash
cd auramind-gemini
npm run build
vercel --prod
```

**Environment Variables (set in Vercel dashboard):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GROQ_API_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_OWNER_EMAIL`

### **Mobile** (Phase 2)
- Currently archived under `archive/`
- Will re-add Capacitor post-launch if users demand native apps
- Web PWA works on mobile browsers (add to home screen)

---

## 🎨 Design System

### **Typography**
- **Display:** Aura Sans (custom font, optimized to 52KB)
- **Body:** Aura Sans, fallback to Inter
- **Mono:** JetBrains Mono

### **Colors**
- **Primary:** `#7C3AED` (cosmic purple)
- **Secondary:** `#6366F1` (indigo)
- **Tertiary:** `#06B6D4` (cyan)
- **Background:** Radial gradient sweep (cobalt → violet)

### **Components**
- 262 total components
- Radix UI primitives (44+ components)
- Custom: SpotlightCard, MagneticButton, FrostGlass, etc.

---

## 📈 Success Metrics

### **Month 1 Goals (Aug 25 - Sep 25)**
- 500 signups
- 50 paying users ($400 MRR)
- 40% Day 7 retention
- 10% audio upload adoption

### **Month 3 Goals (Aug 25 - Nov 25)**
- 2,000 signups
- 200 paying users ($1,600 MRR)
- 50% Day 7 retention
- 30% audio upload adoption

---

## 🤝 Contributing

**Current Status:** Pre-launch solo development

**Post-Launch:**
- Issues: GitHub Issues
- PRs: All changes require review
- Code style: Prettier + ESLint
- Commit format: Conventional Commits

---

## 📚 Key Documents

- `POSITIONING.md` - Market positioning & launch strategy
- `VOICE_FEATURES.md` - Voice feature implementation guide
- `MVP_EXECUTION_PLAN.md` - 3-week sprint to launch
- `QUICK_START.md` - 5-minute setup guide
- `COMPLETED_TASKS.md` - What's done vs pending

---

## 🐛 Known Issues

1. **Mobile apps archived** - Focusing on web PWA first
2. **Admin panels minimal** - Using Supabase dashboard for now
3. **Mixed state management** - Migrating Context → Zustand
4. **18 dashboard routes** - Plan to cut to 5 core pages (Task #22)
5. **Animation library usage** - Some components still reference removed libs (need cleanup)

---

## 🔮 Roadmap

### **Week 1 (Aug 5-11): Voice Features**
- Voice Q&A mode (TTS + STT)
- Audio upload + transcription
- Basic testing

### **Week 2 (Aug 12-18): Polish & Deploy**
- Document processing
- Stripe billing verification
- Production deployment
- Beta testing

### **Week 3 (Aug 19-25): Launch**
- Reddit launch (r/Anki, r/GetStudying)
- Product Hunt
- Direct outreach
- Goal: 50 paying users

### **Month 2+: Iterate**
- Build what paying users ask for
- Add native mobile if demanded
- Marketplace (if content exists)

---

## 💡 Philosophy

**Shipping beats perfection.**

This codebase is technically excellent (8.7/10 code quality) but over-engineered for indie launch (6.5/10 readiness). The August 5 optimization sprint removed unnecessary complexity to focus on:

1. Voice features (unique differentiator)
2. FSRS v5 (technical moat)
3. Fast time-to-market (revenue validation)

Everything else deferred until post-launch based on paying customer feedback.

---

## 📞 Contact

**Owner:** mattycigemp-crypto (GitHub)  
**Email:** Set via `VITE_OWNER_EMAIL` env var

---

**Last Updated:** August 5, 2026 by Claude  
**Status:** Ready for voice feature development 🎤
