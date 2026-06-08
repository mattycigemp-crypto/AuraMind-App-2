# AuraMind Tutorial

## Part 1: User Tutorial (How to Use AuraMind)

### Getting Started

#### 1. Create an Account

- Go to the AuraMind app (your deployed URL or `http://localhost:3000`)
- Click **Get Started** or **Sign Up**
- Choose one of:
  - **Email & Password** — traditional signup
  - **Google** or **GitHub** — social login (via Supabase)
  - **Magic Link** — passwordless email login
- Verify your email if prompted

#### 2. First-Time Setup

After logging in, the onboarding flow helps you:

1. Set your display name and avatar
2. Select your learning goals and preferences
3. Choose whether to load sample content (pre-made demo decks)
4. Complete the interactive tutorial walkthrough

The dashboard then appears — your learning command center.

### Navigating the Dashboard

The dashboard uses a **bento grid layout** with these tiles:

| Tile | What it shows |
|---|---|
| Study Overview | Cards due today, streak count, next review |
| Quick Actions | Generate a deck, import content, start studying |
| Progress Metrics | Activity heatmap, retention rate, study time |
| Recent Activity | Recently studied decks and generated content |
| Learning Paths | Quick-access tile showing enrolled courses and next lesson |
| Recommendations | AI-suggested study topics and times |

The **cosmic sidebar** on the left provides navigation:

- **Dashboard** — main hub
- **Paths** — structured learning courses
- **Decks** — your flashcard collections
- **Study** — start a study session
- **Chat** — AI study buddy and content generation
- **Settings** — account and preferences

### Using Learning Paths (Structured Courses)

Learning Paths are structured curricula with 6 courses and 86 total lessons.

#### Browse and Enroll

1. Click **Paths** in the sidebar
2. Browse the six available courses:
   - JavaScript Mastery
   - React & Modern Frontend
   - Database & SQL
   - Machine Learning & AI
   - Data Structures & Algorithms
   - TypeScript Deep Dive
3. Click a course card to see its details (modules, lesson count, duration)
4. Click **Enroll** to start the course

#### Study a Lesson

1. Open an enrolled course
2. Click any lesson in the module tree
3. The lesson popup shows:
   - **Breadcrumb** — module title, duration, "Lesson X of Y"
   - **Description** — highlights what you'll learn
   - **Markdown content** — rich text with code blocks, tables, and examples
4. Use **Previous** / **Next** to progress through lessons
5. Dot indicators show your progress within the module

#### Enrollment

- Enrollments are saved instantly in `localStorage`
- Best-effort sync to Supabase ensures persistence across devices
- You can enroll in multiple courses simultaneously

### Working with Flashcards

#### Create a Deck

**From a topic:**
1. Click **Quick Generate** on the dashboard
2. Enter a topic (e.g., "Photosynthesis" or "React Hooks")
3. AI generates 20-50 flashcards automatically
4. Preview, edit, and save

**From a document:**
1. Click **Import** in the sidebar
2. Upload a PDF, PowerPoint, or text file
3. AI extracts key concepts and creates cards
4. Review and save the generated deck

**From chat:**
1. Go to **Chat**
2. Describe what you want to study ("Create a deck about machine learning algorithms")
3. Iterate with follow-up requests ("Make the questions harder", "Add more examples")
4. Save the final deck

#### Study Flashcards

1. Go to **Decks** and select a deck
2. Click **Study** to start a session
3. You'll see the **question** side — think of your answer
4. Click the card or press **Space** to flip it
5. Rate your recall with one of four options:

| Rating | Key | Meaning | Effect |
|---|---|---|---|
| Again | 0 | Forgot completely | Reset interval |
| Hard | 3 | Recalled with difficulty | Short interval |
| Good | 4 | Recalled with hesitation | Normal interval |
| Easy | 5 | Recalled immediately | Long interval |

6. The SRS algorithm schedules the next review based on your rating

#### Understanding Spaced Repetition

AuraMind uses the **SM-2 algorithm** (SuperMemo-2):

- Each card tracks: `interval`, `easeFactor`, `repetition count`, `next review date`
- Successful recalls increase the interval: 1 day → 6 days → `interval × easeFactor`
- Failed recalls reset to a 1-day interval
- The ease factor adjusts based on rating quality (minimum 1.3)
- This ensures you review cards at the optimal moment — just before you'd forget them

### Using Study Modes

#### Flashcard Review

The default study experience with:
- Smooth 3D flip animation
- Keyboard shortcuts (Space to flip, 0/3/4/5 to rate)
- Touch gestures on mobile
- Progress bar showing session completion
- LaTeX rendering for math content

#### Quiz Mode (via Chat)

1. Open **Chat**
2. Say "Quiz me on [topic]" or "Create a quiz from my deck"
3. AI generates multiple-choice questions
4. Answer each question and get immediate feedback with explanations
5. Track your score and review incorrect answers

#### Study Buddy Chat

1. Open **Chat**
2. Ask questions in natural language: "Explain closures in JavaScript"
3. The AI uses the **Socratic method** — guides you to answers rather than giving them directly
4. Request examples: "Give me a real-world example of a promise"
5. Ask for different explanations if you don't understand the first one

#### Focus Mode

During any study session:
- Toggle **full screen** for an immersive environment
- Enable **ambient sounds** for concentration
- Notifications are suppressed automatically

### Using AI Features

#### Content Generation

AuraMind uses a **multi-provider AI system** with automatic fallback:
1. **Local AI** (if configured) — LM Studio or Ollama
2. **Groq** — fastest response, free tier available
3. **OpenRouter** — access to many models
4. **DeepSeek** — cost-effective fallback

The system tries providers in priority order and falls back if one fails.

#### Research Assistant

1. Open **Chat**
2. Enter a research topic: "Summarize recent advances in transformer architectures"
3. The AI aggregates information from its knowledge and returns:
   - Key findings and summaries
   - Important papers and sources
   - Related concepts to explore
4. Save relevant information as new flashcards

#### Fact Verification

Ask the AI to verify claims:
- "Is it true that memory retention drops 80% in 24 hours?"
- The AI responds with verification, confidence level, and related context

### Advanced Features

#### Import from Anki

1. Go to **Import** → **Anki**
2. Upload a `.apkg` file
3. Cards are imported with media (images, audio) preserved
4. Tags and categorization are maintained

#### Track Your Analytics

The dashboard shows:
- **Activity heatmap** — calendar view of your study patterns
- **Streak count** — consecutive study days
- **Retention rate** — how well you're retaining information
- **Cards due today** — what needs review

#### Subscription

| Plan | Price | Features |
|---|---|---|
| Free | $0 | Limited decks and generations |
| Monthly | $9.99/mo | Unlimited decks, AI generation, all study modes |
| Annual | $3.99/mo ($47.88/yr) | Same as Monthly at 60% off |

---

## Part 2: Developer Setup Tutorial

### Prerequisites

- **Node.js** (v18+)
- **npm** (comes with Node.js)
- **Git**
- A **Supabase** account (free tier works) — for auth and database
- At least one **AI provider API key** — for content generation

### Step 1: Clone and Install

```bash
# Navigate to the project
cd "AuraMind App 2/auramind-gemini"

# Install dependencies
npm install
```

### Step 2: Configure Environment Variables

Copy the example env file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# === REQUIRED: Supabase ===
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === REQUIRED: At least one AI provider ===
# Option A: Groq (fastest, free tier)
VITE_GROQ_API_KEY=gsk_your_key_here
# Option B: OpenRouter
VITE_OPENROUTER_API_KEY=sk-or-your_key_here
# Option C: Local AI (LM Studio / Ollama)
VITE_USE_LOCAL_AI=true
VITE_AI_BASE_URL=http://localhost:1234
VITE_AI_MODEL=llama-3.3-70b-versatile

# === OPTIONAL: Stripe ===
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_STRIPE_PRICE_ID_MONTHLY=price_monthly
VITE_STRIPE_PRICE_ID_ANNUAL=price_annual

# === OPTIONAL: Email (Resend) ===
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=noreply@mail.yourdomain.com

# === OPTIONAL: Analytics ===
VITE_POSTHOG_KEY=phc_your_key_here
```

#### Where to get API keys:

| Service | Where |
|---|---|
| Supabase | Dashboard → Project Settings → API |
| Groq | https://console.groq.com/keys |
| OpenRouter | https://openrouter.ai/keys |
| Stripe | https://dashboard.stripe.com/apikeys |
| Resend | https://resend.com/api-keys |
| PostHog | https://app.posthog.com/project/settings |

### Step 3: Database Setup

Set up Supabase tables:

```bash
node run-migration.js
```

Or run SQL from `fix-database-schema.sql` manually in the Supabase SQL Editor.

### Step 4: Start the Dev Server

```bash
npm run dev
```

The app runs at **`http://localhost:3000`** with:
- **Hot Module Replacement** — changes reflect instantly
- **API Proxy** — `/local-ai` routes to your local AI server
- **Vite Dev Tools** — fast builds and debugging

### Step 5: Run Tests

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui
```

Test files:
- `src/services/__tests__/srs.test.ts` — spaced repetition algorithm
- `src/services/__tests__/dbService.test.ts` — database operations
- `src/services/__tests__/auraAiService.test.ts` — AI integration

### Production Build

```bash
# TypeScript check
npm run type-check

# Production build
npm run build

# Preview the build
npm run preview

# Deploy to Vercel
npm run deploy
```

### Project Structure

```
auramind-gemini/
├── src/
│   ├── components/        # React components by domain
│   │   ├── dashboard/     # Dashboard2026, LearningPaths
│   │   ├── deck/          # Flashcard deck management
│   │   ├── study/         # Study mode components
│   │   ├── chat/          # AI chat interfaces
│   │   └── ui/            # Radix UI base components
│   ├── pages/             # Route-level components
│   ├── services/          # Business logic & API calls
│   │   ├── api/           # AI provider integration
│   │   ├── learningPaths/ # Course data & enrollment
│   │   └── study/         # SRS algorithm
│   ├── data/              # Static course content
│   ├── hooks/             # Custom React hooks
│   └── types/             # TypeScript definitions
├── api/                   # Vercel serverless functions
├── public/                # Static assets
└── supabase/              # Database migrations
```

### Key Commands Reference

```bash
npm run dev         # Start dev server (localhost:3000)
npm run build       # Production build
npm test            # Run unit tests
npm run type-check  # TypeScript type checking
npm run deploy      # Build + deploy to Vercel
node run-migration.js  # Set up Supabase tables
```

---

## Part 3: Feature Walkthrough

### Walkthrough 1: Learn JavaScript via Learning Paths

**Goal:** Enroll in the JavaScript Mastery course and complete your first lesson.

1. Open the app and log in
2. Click **Paths** in the sidebar
3. Find **JavaScript Mastery** and click it
4. Review the course details (12 modules, 18 lessons, ~4 hours)
5. Click **Enroll Now**
6. The first module "JavaScript Fundamentals" is open by default
7. Click **"Introduction to JavaScript & ES5 Basics"** (Lesson 1)
8. Read the description, then scroll through the markdown content
9. Notice code blocks with syntax highlighting — try the examples in your browser console
10. Click **Next Lesson** at the bottom to continue
11. The progress dots update as you advance through the module

**What you discovered:**
- Lessons are organized in logical modules
- Each lesson has breadcrumb navigation for context
- Content includes runnable code snippets
- Progress is tracked automatically

### Walkthrough 2: Generate and Study AI Flashcards

**Goal:** Create a deck using AI, then study it with spaced repetition.

1. On the dashboard, click **Generate Deck**
2. Enter topic: "JavaScript Array Methods"
3. Click **Generate** — AI creates ~30 flashcards
4. Preview the cards — each has a question, answer, difficulty rating, and citations
5. Click **Save Deck**
6. You're taken to the deck view
7. Click **Study**
8. A card appears with the question side facing you
9. Think of your answer, then press **Space** to flip
10. Rate your recall:
    - **Again (0)** — you didn't remember
    - **Hard (3)** — you struggled
    - **Good (4)** — you got it with some thought
    - **Easy (5)** — immediate recall
11. The next card appears based on the SRS algorithm
12. Continue through all due cards — cards you rate well will appear less frequently

**What you discovered:**
- AI generates complete decks from a single topic prompt
- Each card includes citations and difficulty metadata
- The SRS algorithm personalizes review intervals
- Your ratings directly influence the spacing algorithm

### Walkthrough 3: Use AI Study Buddy

**Goal:** Get help understanding a concept through conversational AI.

1. Click **Chat** in the sidebar
2. Type: "I just studied closures in JavaScript. Can you explain them with examples?"
3. The AI responds with a Socratic-style explanation
4. Follow up: "Can you give me a real-world analogy?"
5. The AI provides an analogy comparing closures to backpacks
6. Ask: "Create 5 practice questions about closures"
7. The AI generates questions to test your understanding
8. Answer each one right in the chat
9. Ask: "Save these as a flashcard deck called 'Closures Practice'"
10. The cards appear in your Decks list for future review

**What you discovered:**
- The AI adapts to your current knowledge level
- It uses Socratic questioning to deepen understanding
- You can generate practice materials conversationally
- Chat output can be saved as permanent flashcard decks

### Walkthrough 4: Import Documents

**Goal:** Import a PDF and convert it to study materials.

1. Click **Import** in the sidebar (or from Quick Actions on dashboard)
2. Select a PDF file (or drag and drop)
3. The file is uploaded and AI processing begins
4. Watch the progress indicator as the AI extracts key concepts
5. A preview shows the generated cards organized by section
6. Edit any cards before saving — adjust questions or answers
7. Click **Save** to create a new deck
8. The deck appears in your collection with the document's title

**What you discovered:**
- AuraMind extracts structured knowledge from unstructured documents
- Cards are organized by source document sections
- You can edit AI output before saving
- Batch processing handles multiple files

### Walkthrough 5: Monitor Your Learning Analytics

**Goal:** Review your study statistics and optimize your learning.

1. Look at the dashboard **Study Overview** tile
   - Cards due today: count of pending reviews
   - Streak: consecutive study days
   - Next review: what's coming up
2. Check the **Activity Heatmap** — green squares show study days
3. View the **Progress Metrics** tile:
   - Retention rate: percentage of cards you're retaining
   - Study time: total time spent learning
4. Go to **Insights** in the sidebar (if available) for deeper metrics
5. The AI **Recommendations** tile suggests what to study next

**What you discovered:**
- Analytics are visible directly on the dashboard
- The heatmap helps maintain study consistency
- Retention rate shows if your study strategy is working
- AI recommendations help prioritize what needs attention

### Walkthrough 6: Set Up Local AI

**Goal:** Run AuraMind with a local LLM for free.

1. Download and install [LM Studio](https://lmstudio.ai/) or [Ollama](https://ollama.com/)
2. In LM Studio, download a model like `llama-3.2-3b-instruct`
3. Start the local server (LM Studio: click "Start Server", default port 1234)
4. Configure `.env`:
   ```env
   VITE_USE_LOCAL_AI=true
   VITE_AI_BASE_URL=http://localhost:1234
   VITE_AI_MODEL=llama-3.2-3b-instruct
   ```
5. Start the dev server: `npm run dev`
6. Open the app and try **Generate Deck** — requests route through Vite's proxy to your local AI
7. The proxy configuration in `vite.config.ts` rewrites `/local-ai` to your local server:
   ```ts
   proxy: {
     '/local-ai': {
       target: env.VITE_AI_BASE_URL || 'http://localhost:1234',
       changeOrigin: true,
       rewrite: (path) => path.replace(/^\/local-ai/, ''),
     }
   }
   ```

**What you discovered:**
- Local AI eliminates API costs
- The Vite proxy handles routing transparently
- Local models are smaller but still effective for study material generation
- The system falls back gracefully to cloud providers if local AI fails

### Walkthrough 7: The SRS Algorithm in Detail

**Goal:** Understand how spaced repetition schedules your reviews.

The core algorithm in `src/services/study/srs.ts`:

```typescript
function calculateSRS(card, quality) {
  let { interval, repetition, easeFactor } = card;

  if (quality >= 3) {
    // Successful recall
    if (repetition === 0) interval = 1;       // 1st review: next day
    else if (repetition === 1) interval = 6;  // 2nd review: 6 days
    else interval = Math.round(interval * easeFactor); // geometric growth
    repetition += 1;
  } else {
    // Failed recall — full reset
    repetition = 0;
    interval = 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(1.3, easeFactor); // never below 1.3

  return { interval, repetition, easeFactor };
}
```

**What happens when you rate:**

| Scenario | Rating | Interval | Ease Factor |
|---|---|---|---|
| First review, easy | Easy (5) | 1 day | 2.6 (increased) |
| Second review, good | Good (4) | 6 days | 2.5 (slight decrease) |
| Third review, good | Good (4) | ~15 days | 2.5 (stable) |
| Fourth review, forgot | Again (0) | 1 day (reset) | 2.3 (decreased) |

The algorithm ensures:
- Easy cards are seen less often
- Hard cards appear more frequently
- Failed cards reset to give you another chance soon
- The ease factor adjusts to your personal memory patterns
