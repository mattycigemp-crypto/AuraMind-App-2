export interface TutorialSection {
  id: string;
  title: string;
  icon: string;
  subsections: TutorialSubsection[];
}

export interface TutorialSubsection {
  id: string;
  title: string;
  steps: TutorialStepData[];
}

export interface TutorialStepData {
  id: string;
  title: string;
  content: string;
  code?: string;
  tip?: string;
  warning?: string;
}

export const tutorialData: TutorialSection[] = [
  {
    id: 'user-guide',
    title: 'User Tutorial',
    icon: 'BookOpen',
    subsections: [
      {
        id: 'getting-started',
        title: 'Getting Started',
        steps: [
          {
            id: 'create-account',
            title: 'Create an Account',
            content: `Go to the AuraMind app and click **Get Started** or **Sign Up**.\n\nYou have three options:\n- **Email & Password** — traditional signup with email verification\n- **Google or GitHub** — one-click social login (via Supabase)\n- **Magic Link** — passwordless login, just check your inbox`,
            tip: 'Use Google/GitHub for the fastest onboarding — no email verification needed.',
          },
          {
            id: 'first-time-setup',
            title: 'First-Time Setup',
            content: `After logging in, the onboarding flow guides you through:\n\n1. Set your display name and avatar\n2. Select your learning goals and preferences\n3. Choose whether to load sample content (demo decks)\n4. Complete the interactive tutorial walkthrough\n\nAfter setup, you'll land on the **dashboard** — your learning command center.`,
          },
        ],
      },
      {
        id: 'navigating-dashboard',
        title: 'Navigating the Dashboard',
        steps: [
          {
            id: 'bento-grid',
            title: 'Bento Grid Layout',
            content: `The dashboard uses a **bento grid layout** with these tiles:\n\n- **Study Overview** — cards due today, streak count, next review\n- **Quick Actions** — generate a deck, import content, start studying\n- **Progress Metrics** — activity heatmap, retention rate, study time\n- **Recent Activity** — recently studied decks and generated content\n- **Learning Paths** — quick-access tile showing enrolled courses\n- **Recommendations** — AI-suggested study topics and times`,
            tip: 'The dashboard shows different tiles based on your activity. The more you study, the more insights appear.',
          },
          {
            id: 'sidebar-nav',
            title: 'Cosmic Sidebar Navigation',
            content: `The **cosmic sidebar** on the left provides main navigation:\n\n| Item | What it does |\n|---|---|\n| **Overview** | Main dashboard hub |\n| **Paths** | Structured learning courses |\n| **Decks & Cards** | Your flashcard collections |\n| **AI Study** | AI chat and study buddy |\n| **Analytics** | Learning statistics |\n| **Settings** | Account and preferences |\n\nThe sidebar also has a **Study Now** button and links to Documentation.`,
          },
        ],
      },
      {
        id: 'learning-paths',
        title: 'Using Learning Paths',
        steps: [
          {
            id: 'browse-enroll',
            title: 'Browse and Enroll',
            content: `Learning Paths are structured courses with **6 courses and 86 total lessons**:\n\n1. Click **Paths** in the sidebar\n2. Browse the six courses:\n   - JavaScript Mastery (18 lessons)\n   - React & Modern Frontend (14 lessons)\n   - Database & SQL (12 lessons)\n   - Machine Learning & AI (16 lessons)\n   - Data Structures & Algorithms (14 lessons)\n   - TypeScript Deep Dive (12 lessons)\n3. Click a course card to see modules and details\n4. Click **Enroll Now** to begin`,
          },
          {
            id: 'study-lesson',
            title: 'Study a Lesson',
            content: `1. Open an enrolled course\n2. Click any lesson in the module tree\n3. The lesson popup shows:\n   - **Breadcrumb** — module title, duration, "Lesson X of Y"\n   - **Description** — learning objectives summary\n   - **Rich markdown** — code blocks, tables, examples\n4. Use **Previous** / **Next** to progress through lessons\n5. Dot indicators show your progress within the module\n\nLessons contain real educational content with 2026-era examples (ES2025 features, React 19 hooks, PostgreSQL 18, Agentic AI, TypeScript 6.0).`,
            tip: 'Lessons are ordered from foundational to advanced. Follow the sequence for best results.',
          },
        ],
      },
      {
        id: 'flashcards',
        title: 'Working with Flashcards',
        steps: [
          {
            id: 'create-deck',
            title: 'Create a Deck',
            content: `**From a topic:**\n1. Click **Quick Generate** on the dashboard\n2. Enter a topic (e.g., "Photosynthesis" or "React Hooks")\n3. AI generates 20-50 flashcards automatically\n4. Preview, edit, and save\n\n**From a document:**\n1. Click **Import** in the sidebar\n2. Upload a PDF, PowerPoint, or text file\n3. AI extracts key concepts and creates cards\n4. Review and save the generated deck`,
            tip: 'For best results, use specific topics rather than broad ones. "React useState hook" works better than "React".',
          },
          {
            id: 'study-flashcards',
            title: 'Study with Spaced Repetition',
            content: `1. Go to **Decks** and select a deck\n2. Click **Study** to start a session\n3. See the **question** side — think of your answer\n4. Press **Space** or click to flip the card\n5. Rate your recall:\n\n| Rating | Key | Meaning |\n|---|---|---|\n| Again | 0 | Forgot completely |\n| Hard | 3 | Recalled with difficulty |\n| Good | 4 | Recalled with hesitation |\n| Easy | 5 | Recalled immediately |\n\nThe SM-2 algorithm schedules the next review based on your rating.\n\n- Successful recalls increase the interval: 1d → 6d → interval × easeFactor\n- Failed recalls reset to a 1-day interval`,
          },
          {
            id: 'srs-details',
            title: 'How Spaced Repetition Works',
            content: `AuraMind implements the **SuperMemo-2 (SM-2) algorithm**:\n\nEach card tracks:\n- **Interval** — days until next review\n- **Ease Factor** — how easily you recall (minimum 1.3)\n- **Repetition count** — number of successful reviews\n- **Next review date** — when this card is due\n\nEasy cards are seen less often. Hard cards appear more frequently.\nFailed cards reset to give you another chance soon.\nThe ease factor adjusts to your personal memory patterns over time.`,
            code: `function calculateSRS(card, quality) {
  if (quality >= 3) {
    // Success: grow the interval
    if (repetition === 0) interval = 1
    else if (repetition === 1) interval = 6
    else interval = Math.round(interval * easeFactor)
    repetition++
  } else {
    // Failure: full reset
    repetition = 0; interval = 1
  }
  // Adjust ease factor based on quality
  easeFactor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  easeFactor = Math.max(1.3, easeFactor)
}`,
          },
        ],
      },
      {
        id: 'study-modes',
        title: 'Study Modes',
        steps: [
          {
            id: 'flashcard-review',
            title: 'Flashcard Review',
            content: `The default study mode with:\n- Smooth 3D flip animation\n- Keyboard shortcuts (Space to flip, 0/3/4/5 to rate)\n- Touch gestures on mobile\n- Progress bar showing session completion\n- LaTeX rendering for math content`,
          },
          {
            id: 'quiz-mode',
            title: 'Quiz Mode',
            content: `1. Open **Chat**\n2. Say "Quiz me on [topic]" or "Create a quiz from my deck"\n3. AI generates multiple-choice questions\n4. Answer each question and get immediate feedback\n5. Track your score and review incorrect answers`,
          },
          {
            id: 'study-buddy',
            title: 'Study Buddy Chat',
            content: `1. Open **Chat**\n2. Ask questions naturally: "Explain closures in JavaScript"\n3. The AI uses the **Socratic method** — guides you to answers\n4. Request examples: "Give me a real-world example of a promise"\n5. Ask for different explanations if something isn't clear`,
          },
        ],
      },
      {
        id: 'ai-features',
        title: 'AI Features',
        steps: [
          {
            id: 'ai-providers',
            title: 'AI Provider System',
            content: `AuraMind uses an AI system with two options:\n\n1. **Local AI** (if configured) — in-browser WebLLM via WebGPU\n2. **Groq** — fastest cloud response, free tier available\n\nThe system tries Groq first and falls back to local inference on rate limits.\nThis means you only need a Groq API key to use all AI features.`,
            tip: 'Groq is recommended for the best balance of speed and cost. It has a generous free tier.',
          },
          {
            id: 'research-assistant',
            title: 'Research Assistant',
            content: `1. Open **Chat**\n2. Enter a research topic: "Summarize advances in transformer architectures"\n3. The AI returns:\n   - Key findings and summaries\n   - Important papers and sources\n   - Related concepts to explore\n4. Save relevant information as new flashcards`,
          },
        ],
      },
    ],
  },

  {
    id: 'feature-walkthroughs',
    title: 'Feature Walkthroughs',
    icon: 'Play',
    subsections: [
      {
        id: 'wt-learning-paths',
        title: 'Learn JavaScript via Paths',
        steps: [
          {
            id: 'wt-lp-1',
            title: 'Enroll in JavaScript Mastery',
            content: `**Goal:** Enroll in the JavaScript Mastery course and complete your first lesson.\n\n1. Open the app and log in\n2. Click **Paths** in the sidebar\n3. Find **JavaScript Mastery** and click it\n4. Review the course details (12 modules, 18 lessons, ~4 hours)\n5. Click **Enroll Now**\n6. The first module "JavaScript Fundamentals" opens automatically\n7. Click **"Introduction to JavaScript & ES5 Basics"** (Lesson 1)`,
          },
          {
            id: 'wt-lp-2',
            title: 'Navigate Through Lessons',
            content: `1. Read the **description** to understand the lesson goal\n2. Scroll through the **markdown content** — code blocks have syntax highlighting\n3. Try the code examples in your browser console\n4. Click **Next Lesson** at the bottom to continue to Lesson 2\n5. Watch the **progress dots** update as you advance\n6. Use the **breadcrumb** to see where you are in the course\n\n**What you learn:** Lessons are organized logically, progress is tracked, and content is interactive.`,
          },
        ],
      },
      {
        id: 'wt-flashcards',
        title: 'Generate & Study AI Flashcards',
        steps: [
          {
            id: 'wt-fc-1',
            title: 'Generate a Deck',
            content: `**Goal:** Create a deck using AI, then study it with spaced repetition.\n\n1. On the dashboard, click **Generate Deck**\n2. Enter topic: "JavaScript Array Methods"\n3. Click **Generate** — AI creates ~30 flashcards in seconds\n4. Preview the cards — each has a question, answer, difficulty rating, and citations\n5. Click **Save Deck**\n6. You're taken to the deck view`,
          },
          {
            id: 'wt-fc-2',
            title: 'Study with SRS',
            content: `1. Click **Study** to start a session\n2. The card shows the question — think of your answer\n3. Press **Space** or click to flip and reveal the answer\n4. Rate your recall:\n   - **Again (0)** — you didn't remember (reset interval)\n   - **Hard (3)** — you struggled (short interval)\n   - **Good (4)** — some thought needed (normal interval)\n   - **Easy (5)** — immediate recall (long interval)\n5. The next card appears based on the SRS algorithm\n6. Cards you rate well appear less frequently — optimizing your study time`,
          },
        ],
      },
      {
        id: 'wt-study-buddy',
        title: 'Use the AI Study Buddy',
        steps: [
          {
            id: 'wt-sb-1',
            title: 'Chat with the AI Tutor',
            content: `**Goal:** Get help understanding a concept through conversational AI.\n\n1. Click **Chat** in the sidebar\n2. Type: "I just studied closures in JavaScript. Can you explain them with examples?"\n3. The AI responds with a **Socratic-style** explanation\n4. Follow up: "Can you give me a real-world analogy?"\n5. The AI provides an analogy (e.g., comparing closures to backpacks)\n6. Ask: "Create 5 practice questions about closures"\n7. The AI generates questions — answer them right in the chat\n8. Say: "Save these as a flashcard deck called 'Closures Practice'"\n9. The cards appear in your Decks list for future review`,
            tip: 'The AI remembers the conversation context, so you can have long, flowing discussions.',
          },
        ],
      },
      {
        id: 'wt-import',
        title: 'Import Documents',
        steps: [
          {
            id: 'wt-imp-1',
            title: 'PDF to Flashcards',
            content: `**Goal:** Import a PDF and convert it to study materials.\n\n1. Click **Import** in the sidebar (or Quick Actions on dashboard)\n2. Select a PDF file (or drag and drop)\n3. The file uploads and AI processing begins\n4. Watch the progress indicator as the AI extracts key concepts\n5. Preview generated cards organized by section\n6. Edit any cards before saving — adjust questions or answers\n7. Click **Save** to create a new deck\n8. The deck appears in your collection with the document's title`,
            tip: 'Works great with textbooks, research papers, and lecture slides.',
          },
        ],
      },
      {
        id: 'wt-analytics',
        title: 'Monitor Your Analytics',
        steps: [
          {
            id: 'wt-analytics-1',
            title: 'Review Your Stats',
            content: `**Goal:** Review your study statistics and optimize your learning.\n\n1. Look at the dashboard **Study Overview** tile — cards due, streak, next review\n2. Check the **Activity Heatmap** — green squares show study days\n3. View the **Progress Metrics**: retention rate and study time\n4. Go to **Analytics** for deeper stats\n5. AI **Recommendations** suggest what to study next\n\n**What you discover:** The heatmap helps maintain consistency. The retention rate reveals if your study strategy is working.`,
          },
        ],
      },
      {
        id: 'wt-local-ai',
        title: 'Set Up Local AI',
        steps: [
          {
            id: 'wt-local-ai-1',
            title: 'Run AI for Free',
            content: `**Goal:** Run AuraMind with a local LLM for free.\n\n1. Download and install **LM Studio** or **Ollama**\n2. Download a model like \`llama-3.2-3b-instruct\`\n3. Start the local server (LM Studio: click "Start Server", default port 1234)\n4. Configure \`.env\`:\n\n\`\`\`env\nVITE_USE_LOCAL_AI=true\nVITE_AI_BASE_URL=http://localhost:1234\nVITE_AI_MODEL=llama-3.2-3b-instruct\n\`\`\`\n\n5. Start the dev server: \`npm run dev\`\n6. Try **Generate Deck** — requests route through Vite's proxy to your local AI`,
            tip: 'Local models are smaller but still effective for generating study materials. The system falls back gracefully if the local AI fails.',
          },
        ],
      },
    ],
  },
];

export const quickStartSteps = [
  {
    id: 'quick-1',
    title: 'Create your account',
    description: 'Sign up with email, Google, or GitHub',
  },
  {
    id: 'quick-2',
    title: 'Generate your first deck',
    description: 'Pick a topic and let AI create flashcards',
  },
  {
    id: 'quick-3',
    title: 'Study with spaced repetition',
    description: 'Review cards and rate your recall',
  },
  {
    id: 'quick-4',
    title: 'Take a learning path',
    description: 'Enroll in a structured course',
  },
  {
    id: 'quick-5',
    title: 'Explore AI features',
    description: 'Use study buddy, quizzes, and import',
  },
];



