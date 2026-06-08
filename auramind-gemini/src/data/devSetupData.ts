export interface DevSetupSubsection {
  id: string;
  title: string;
  steps: DevSetupStep[];
}

export interface DevSetupStep {
  id: string;
  title: string;
  content: string;
  code?: string;
  tip?: string;
  warning?: string;
}

export const devSetupSubsections: DevSetupSubsection[] = [
  {
    id: 'prerequisites',
    title: 'Prerequisites',
    steps: [
      {
        id: 'requirements',
        title: 'What You Need',
        content: `Before setting up AuraMind locally, ensure you have:\n\n- **Node.js** v18+\n- **npm** (comes with Node.js)\n- **Git**\n- A **Supabase** account (free tier works)\n- At least one **AI provider API key**`,
      },
    ],
  },
  {
    id: 'installation',
    title: 'Installation',
    steps: [
      {
        id: 'clone-install',
        title: 'Clone and Install',
        content: `Navigate to the project and install dependencies:`,
        code: `cd "AuraMind App 2/auramind-gemini"
npm install`,
      },
      {
        id: 'configure-env',
        title: 'Configure Environment',
        content: `Copy the example env file and edit it with your credentials:`,
        code: `cp .env.example .env`,
        tip: 'You only need Supabase + at least one AI provider to get started. Stripe and Resend are optional.',
      },
      {
        id: 'api-keys',
        title: 'Where to Get API Keys',
        content: `| Service | Where to get it |\n|---|---|\n| **Supabase** | Dashboard → Project Settings → API |\n| **Groq** | https://console.groq.com/keys |\n| **Stripe** | https://dashboard.stripe.com/apikeys |\n| **Resend** | https://resend.com/api-keys |\n| **PostHog** | https://app.posthog.com/project/settings |`,
      },
      {
        id: 'database-setup',
        title: 'Database Setup',
        content: `Set up the Supabase tables:`,
        code: `node run-migration.js`,
        tip: 'You can also run the SQL from fix-database-schema.sql manually in the Supabase SQL Editor.',
      },
      {
        id: 'start-dev',
        title: 'Start the Dev Server',
        content: `Run the development server with hot module replacement:`,
        code: `npm run dev`,
        tip: 'The app runs at http://localhost:3000. The Vite dev server proxies /local-ai to your local AI if configured.',
      },
    ],
  },
  {
    id: 'testing',
    title: 'Testing',
    steps: [
      {
        id: 'run-tests',
        title: 'Run Tests',
        content: `AuraMind uses Vitest for unit testing:`,
        code: `# Run all tests
npm test

# Run with UI
npm run test:ui`,
        tip: 'Tests cover the SRS algorithm, database service, and AI service integration.',
      },
    ],
  },
  {
    id: 'building',
    title: 'Building & Deploying',
    steps: [
      {
        id: 'build',
        title: 'Production Build',
        content: `Build and deploy to Vercel:`,
        code: `# TypeScript check
npm run type-check

# Production build
npm run build

# Preview the build
npm run preview

# Deploy to Vercel
npm run deploy`,
      },
    ],
  },
  {
    id: 'project-structure',
    title: 'Project Structure',
    steps: [
      {
        id: 'structure',
        title: 'Key Directories',
        content: `\`\`\`
auramind-gemini/
├── src/
│   ├── components/     # React components by domain
│   │   ├── dashboard/  # Dashboard, LearningPaths, TutorialPage
│   │   ├── deck/       # Flashcard deck management
│   │   ├── study/      # Study mode components
│   │   ├── chat/       # AI chat interfaces
│   │   └── ui/         # Radix UI base components
│   ├── pages/          # Route-level components
│   ├── services/       # Business logic & API calls
│   │   ├── api/        # AI provider integration
│   │   ├── learningPaths/ # Course data & enrollment
│   │   └── study/      # SRS algorithm
│   ├── data/           # Static course & tutorial content
│   ├── hooks/          # Custom React hooks
│   └── types/          # TypeScript definitions
├── api/                # Vercel serverless functions
└── public/             # Static assets
\`\`\``,
      },
    ],
  },
];



