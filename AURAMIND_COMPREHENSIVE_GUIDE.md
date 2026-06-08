# AuraMind: AI-Powered Learning Platform - Comprehensive Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Core Philosophy](#core-philosophy)
3. [Platform Overview](#platform-overview)
4. [Key Features](#key-features)
5. [Technical Architecture](#technical-architecture)
6. [User Experience](#user-experience)
7. [AI Integration](#ai-integration)
8. [Spaced Repetition System](#spaced-repetition-system)
9. [Study Modes](#study-modes)
10. [Content Management](#content-management)
11. [Import & Export Capabilities](#import--export-capabilities)
12. [Analytics & Progress Tracking](#analytics--progress-tracking)
13. [User Roles & Permissions](#user-roles--permissions)
14. [Subscription & Payments](#subscription--payments)
15. [Security & Privacy](#security--privacy)
16. [Development & Deployment](#development--deployment)
17. [Future Roadmap](#future-roadmap)
18. [Conclusion](#conclusion)

---

## Introduction

AuraMind is a revolutionary AI-powered learning platform designed to transform how students, professionals, and lifelong learners acquire and retain knowledge. By combining cutting-edge artificial intelligence with proven cognitive science principles, AuraMind creates a personalized learning experience that adapts to individual learning styles, schedules, and goals.

The platform represents a paradigm shift from traditional flashcard applications to an intelligent study companion that actively participates in the learning process. Unlike passive study tools that simply present information, AuraMind engages users through dynamic content generation, adaptive scheduling, and interactive study modes that make learning more effective and enjoyable.

### The Problem AuraMind Solves

Traditional learning methods suffer from several critical limitations:

1. **Inefficient Content Creation**: Creating high-quality study materials is time-consuming and requires significant expertise in both the subject matter and effective study techniques.

2. **One-Size-Fits-All Approaches**: Most learning platforms treat all learners identically, ignoring individual differences in learning speed, retention patterns, and knowledge gaps.

3. **Passive Learning Experiences**: Conventional study tools are static and unresponsive, failing to adapt to user performance or provide meaningful feedback.

4. **Poor Retention Rates**: Without systematic review scheduling, learners forget up to 80% of newly acquired information within 24 hours.

5. **Fragmented Learning Ecosystems**: Students must switch between multiple tools for content creation, study sessions, progress tracking, and collaboration.

AuraMind addresses these challenges through an integrated, intelligent platform that automates content creation, personalizes learning experiences, and optimizes retention through scientifically-backed algorithms.

### Target Audience

AuraMind serves a diverse range of learners:

- **Students**: From high school to postgraduate level, needing to master complex subjects across disciplines
- **Professionals**: Seeking to acquire new skills, maintain professional credentials, or stay current in rapidly evolving fields
- **Language Learners**: Requiring systematic vocabulary building and grammar practice
- **Researchers**: Managing large volumes of information and maintaining knowledge across multiple domains
- **Educators**: Creating and distributing study materials to students with personalized learning paths
- **Lifelong Learners**: Pursuing self-directed education across various interests and hobbies

---

## Core Philosophy

AuraMind is built upon three fundamental principles that guide every aspect of its design and functionality:

### 1. Cognitive Science First

The platform's foundation rests on decades of research into how human memory and learning actually work. Rather than implementing features based on intuition or market trends, AuraMind incorporates evidence-based learning techniques:

- **Spaced Repetition**: Leveraging the forgetting curve to optimize review timing
- **Active Recall**: Prioritizing retrieval practice over passive review
- **Interleaving**: Mixing different topics and question types to improve discrimination
- **Elaborative Encoding**: Encouraging deeper processing through explanations and connections
- **Metacognition**: Helping learners understand their own learning processes

### 2. AI as a Learning Partner

Rather than replacing human intelligence, AuraMind's AI capabilities augment and enhance natural learning processes. The AI serves as:

- **Content Generator**: Creating high-quality study materials from any source
- **Personal Tutor**: Providing explanations, examples, and adaptive feedback
- **Study Coach**: Optimizing schedules and identifying knowledge gaps
- **Research Assistant**: Gathering and synthesizing information from multiple sources
- **Motivation Engine**: Providing encouragement and maintaining engagement

### 3. Seamless Integration

Learning shouldn't require managing multiple disconnected tools. AuraMind integrates every aspect of the learning lifecycle:

- **Content Ingestion**: Import from documents, websites, videos, and existing study materials
- **Knowledge Organization**: Automatic categorization and relationship mapping
- **Study Execution**: Multiple modes optimized for different learning objectives
- **Progress Tracking**: Comprehensive analytics and performance metrics
- **Social Learning**: Collaboration features and community resources

---

## Platform Overview

AuraMind is a full-stack web application built with modern web technologies and deployed on serverless infrastructure. The platform consists of several interconnected components:

### Frontend Application

The user interface is built as a React 19 application using TypeScript for type safety and developer experience. Key frontend technologies include:

- **React 19**: Latest version of React with improved performance and developer experience
- **TypeScript**: Static typing for robust code and better IDE support
- **Vite**: Fast build tool and development server with proxy for local AI
- **Tailwind CSS**: Utility-first CSS framework with architectural design system
- **Framer Motion**: Advanced animation system with "The Engineering of Awe" framework
- **Radix UI**: Unstyled, accessible component library for building custom UI components
- **React Router DOM**: Client-side routing for single-page application navigation
- **Lucide React**: Beautiful, consistent icon library
- **Supabase**: Authentication and real-time database integration
- **Recharts**: Data visualization for analytics
- **PostHog**: User analytics and product insights
- **Zod**: Runtime type validation and schema definitions

### Backend Infrastructure

The backend uses Vercel serverless functions with a consolidated API structure:

#### API Structure

``` 
api/
├── index.ts                   # Main API router with consolidated endpoints
├── stripe-webhook.ts          # Handle Stripe webhook events
```

The main API router (`index.ts`) handles multiple endpoint categories:
- **admin**: User management, role assignment, admin utilities
- **coupons**: Stripe coupon management
- **users**: User operations (redirected to admin)
- **subscription**: Subscription status verification
- **stripe**: Stripe checkout and portal sessions
- **email**: Email operations (placeholder)
- **account**: Account operations (delete account)

#### Server Configuration

- **Vercel Functions**: Serverless deployment with automatic scaling
- **Node.js Runtime**: Latest Node.js version with ES modules
- **Environment Variables**: Secure configuration management
- **CORS Handling**: Proper cross-origin resource sharing
- **Error Handling**: Comprehensive error logging and user feedback

### Database & Storage

AuraMind uses Supabase as its primary database and authentication provider:

- **PostgreSQL**: Robust relational database with advanced features
- **Row Level Security**: Fine-grained access control at the database level
- **Real-time Subscriptions**: Live data synchronization across clients
- **Authentication**: Built-in user authentication with multiple providers
- **Storage**: File storage for user uploads and generated content

### Third-Party Integrations

The platform integrates with several external services:

- **AI Providers**: Groq, OpenRouter, and local AI models for content generation
- **Payment Processing**: Stripe for subscription management and payments
- **Email Service**: Resend for transactional emails and notifications
- **Analytics**: PostHog for user behavior tracking and product analytics
- **File Processing**: PDF.js for document parsing, JSZip for archive handling

---

## Key Features

### AI-Powered Content Generation

AuraMind's most distinctive feature is its ability to generate high-quality study materials from any input. Users can:

- **Generate from Topics**: Simply enter a topic, and AuraMind creates comprehensive flashcard decks
- **Import Documents**: Upload PDFs, PowerPoint presentations, or text files for automatic card generation
- **Chat to Create**: Have a conversation with the AI to iteratively build study materials
- **Web Scraping**: Extract content from URLs and convert to study cards
- **Existing Material Enhancement**: Improve and expand on existing flashcard collections

The AI understands context, generates appropriate difficulty levels, and creates meaningful connections between concepts. Each generated card includes:

- **Clear Questions**: Formulated to test understanding rather than rote memorization
- **Comprehensive Answers**: Detailed explanations with examples and context
- **Citations**: Source references for verification and deeper study
- **Difficulty Ratings**: Automatic assessment of question complexity
- **Metadata**: Tags, categories, and relationship information

### Intelligent Spaced Repetition

AuraMind implements the SuperMemo-2 (SM-2) algorithm, one of the most effective spaced repetition systems:

- **Adaptive Scheduling**: Review intervals adjust based on user performance
- **Quality Ratings**: Users rate their recall (Again, Hard, Good, Easy) to inform scheduling
- **Optimal Timing**: Cards appear at the exact moment when review is most effective
- **Forgetting Curve Optimization**: Accounts for natural memory decay patterns
- **Personalized Parameters**: Algorithm parameters adapt to individual learning patterns

The system tracks:

- **Next Review Date**: When each card should next be studied
- **Interval**: Current spacing between reviews (in days)
- **Ease Factor**: Measure of how easily the user recalls the card
- **Repetition Count**: Number of successful reviews
- **Last Reviewed**: Timestamp of the most recent study session

### Multiple Study Modes

Different learning objectives require different approaches. AuraMind provides several study modes:

#### Flashcard Review

The classic flashcard experience enhanced with modern features:

- **Flip Animation**: Smooth card reveal with motion design
- **Keyboard Shortcuts**: Efficient navigation for power users
- **Voice Input**: Speak answers for hands-free studying
- **Progress Indicators**: Visual feedback on session completion
- **Citation Display**: Source references for deeper understanding
- **Math Rendering**: LaTeX support for mathematical content

#### Quiz Mode

Test knowledge with multiple-choice questions (available within chat interface):

- **AI-Generated Questions**: Automatically created from deck content
- **Immediate Feedback**: Instant right/wrong indication with explanations
- **Difficulty Levels**: Questions calibrated to user ability
- **Score Tracking**: Performance metrics and improvement tracking
- **Integration**: Available as part of the AI chat experience

#### Study Buddy Chat

Interactive conversational learning:

- **Natural Language Interface**: Chat with an AI tutor about your study material
- **Contextual Responses**: AI understands your specific deck and progress
- **Socratic Method**: Guided learning through questions rather than direct answers
- **Concept Explanation**: Deep dives into difficult topics
- **Personalized Examples**: Examples tailored to your interests and background

#### Presentation Mode

Learn through structured presentations (component available, AI generation in development):

- **Slide-Based Learning**: Content organized into logical sequences
- **Speech Synthesis**: Text-to-speech for audio learning
- **Navigation Controls**: Easy navigation between slides
- **Full Screen Mode**: Immersive presentation experience
- **Auto-Play**: Automatic slide progression with speech

### Advanced Import Capabilities

AuraMind supports importing from virtually any source:

#### Document Import

- **PDF Parsing**: Extract text from PDF files with layout preservation
- **PowerPoint Processing**: Convert slide presentations into study materials
- **Text Files**: Import plain text, Markdown, and rich text formats
- **Batch Processing**: Handle multiple files simultaneously

#### Anki Integration

- **APKG Import**: Import existing Anki decks with full compatibility
- **Media Handling**: Preserve images, audio, and other media assets
- **Tag Preservation**: Maintain existing categorization systems
- **Review History**: Import previous study progress when possible

#### Web Content

- **URL Import**: Extract content from web pages and articles (planned feature)
- **Text Paste**: Paste web content directly into the chat interface for card generation
- **Notion Import**: Convert Notion pages to study materials (planned feature)

#### Academic Sources

- **Citation Management**: Support for BibTeX and other citation formats
- **Reference Linking**: Connect cards to original sources
- **Academic Paper Processing**: Extract key points from research papers
- **Bibliography Generation**: Create reference lists from study materials

### Comprehensive Analytics

AuraMind provides detailed insights into learning progress:

#### Performance Metrics

- **Retention Rates**: Track how well information is being retained over time
- **Study Frequency**: Monitor consistency and identify optimal study times
- **Difficulty Distribution**: Understand which topics require more attention
- **Speed Metrics**: Track how quickly cards are being reviewed
- **Accuracy Rates**: Measure correctness across different subjects

#### Progress Visualization

- **Activity Heatmaps**: Calendar view showing study activity patterns (available in dashboard)
- **Learning Curves**: Visual representation of progress over time (planned)
- **Knowledge Maps**: Network diagrams showing concept relationships (planned)
- **Streak Tracking**: Gamification elements to maintain motivation (available)
- **Goal Progress**: Track progress toward learning objectives (planned)

#### Predictive Analytics (Planned)

- **Optimal Study Times**: AI-recommended study schedules
- **Knowledge Gap Analysis**: Identify weak areas requiring attention
- **Retention Predictions**: Forecast long-term retention based on current performance
- **Workload Optimization**: Balance study load across different subjects

### Collaboration Features (Planned)

Learning is often a social activity. AuraMind plans to include:

#### Deck Sharing (Planned)

- **Public Decks**: Browse and use community-created study materials
- **Private Sharing**: Share decks with specific users or groups
- **Collaborative Editing**: Work together on deck creation and refinement
- **Version Control**: Track changes and maintain history

#### Study Groups (Planned)

- **Group Challenges**: Compete with friends on study metrics
- **Leaderboards**: Compare progress with peers
- **Shared Progress**: Track group learning objectives
- **Discussion Forums**: Discuss topics and share insights

### Learning Paths

AuraMind now includes structured, course-based learning paths that guide users through comprehensive curricula:

#### Course Catalog (6 Courses, 86 Lessons)

- **JavaScript Mastery**: From ES5 basics through ES2025/2026 features (Temporal API, Iterator Helpers, Set Methods, Decorators)
- **React & Modern Frontend**: Component patterns through React 19 hooks (`use()`, `useActionState`, `useOptimistic`, React Compiler)
- **Database & SQL**: Fundamentals through PostgreSQL 18 (UUID v7, B-Tree Skip Scan, pgvector, io_uring)
- **Machine Learning & AI**: Foundations through Agentic AI, LLMOps, RAG architectures, and MCP
- **Data Structures & Algorithms**: Pattern-based interview preparation with complexity analysis
- **TypeScript Deep Dive**: Types through TypeScript 6.0 (strict mode, Go-based compiler, erasableSyntaxOnly)

#### Lesson Experience

Each lesson includes a structured popup with:
- **Breadcrumb Navigation**: Module title, estimated duration, lesson position indicator
- **Description Box**: Highlighted summary of the lesson's learning objectives
- **Full Markdown Content**: Rich educational content rendered with syntax-highlighted code blocks, tables, and interactive elements via `react-markdown` and `remark-gfm`
- **Progress Navigation**: Previous/Next lesson buttons with dot-based progress indicator
- **Module Organization**: Lessons grouped into modules within each course

#### Enrollment System

- **Local-First**: Enrollments stored in `localStorage` for instant access
- **Supabase Sync**: Best-effort background persistence to Supabase with deterministic UUID generation
- **Progress Tracking**: Track enrolled courses and completed lessons per user

#### Data Architecture

- **Static Content**: All 86 lessons stored in `learningPathsData.ts` with educational markdown content
- **Local Rendering**: Course structure and content served entirely from local data — no database dependency for core content
- **Enrollment Persistence**: Hybrid model — localStorage as primary store, Supabase as secondary sync target

---

## Technical Architecture

### Frontend Architecture

The React application follows a component-based architecture with clear separation of concerns:

#### Component Structure

``` 
src/
├── components/
│   ├── achievements/      # Achievement system and unlock animations
│   ├── auth/              # Authentication-related components
│   ├── background/        # Visual effects and neural grid animations
│   ├── challenges/        # Gamification challenges system
│   ├── chat/             # AI chat interfaces and study buddy
│   ├── dashboard/        # Main dashboard components (Dashboard2026, LearningPaths)
│   ├── deck/             # Flashcard deck management
│   ├── landing/          # Marketing and onboarding pages
│   ├── layout/           # Layout components and providers
│   ├── shared/           # Reusable UI components
│   ├── study/            # Study mode components and SRS
│   └── ui/               # Base UI components (Radix UI)
├── pages/                # Route-level components
│   ├── analytics/        # Analytics and insights pages
│   ├── auth/            # Authentication and admin console
│   ├── challenges/      # Challenge management
│   ├── chat/            # Chat interface pages
│   ├── dashboard/       # Dashboard variants
│   ├── deck/            # Deck management pages
│   ├── decks/           # Deck collection pages
│   ├── insights/        # Learning insights
│   ├── legal/           # Legal pages (terms, privacy)
│   ├── planner/         # Study planner
│   ├── professor/       # Professor mode
│   ├── schedule/        # Study schedule
│   ├── study/           # Study mode pages
│   └── leaderboards/    # Gamification leaderboards
├── services/            # Business logic and API calls
│   ├── analytics/       # Analytics and tracking service
│   ├── api/             # External API integrations (AI, Stripe)
│   ├── auth/            # Authentication services
│   ├── database/        # Database operations (Supabase)
│   ├── email/           # Email services
│   ├── import/          # File import processing
│   ├── integrations/    # Third-party integrations (Anki, Notion)
│   ├── stripe/          # Payment processing
│   ├── learningPaths/   # Learning path data and enrollment services
│   ├── study/            # Study algorithms (SRS, roadmap)
│   ├── supabase/        # Supabase client
│   └── trial/           # Trial management
├── contexts/            # React contexts
│   └── LayoutContext.tsx # Layout management context
├── hooks/              # Custom React hooks
│   ├── useTheme.tsx     # Theme management
│   ├── useScrollAnimations.ts # Scroll animations
│   ├── useMagneticButton.ts # Magnetic button effects
│   ├── useToast.ts      # Toast notifications
│   └── use-mobile.tsx   # Mobile detection
├── styles/             # Styling and animations
│   ├── animations/      # Animation system (awe)
│   ├── design/          # Design system (bento-2-0)
│   └── architectural.css # Base architectural styles
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   ├── permissions.ts   # Role-based permissions
│   └── localeUtils.ts   # Localization utilities
├── data/               # Static data and constants
│   ├── premadeContent.ts # Sample content
│   └── learningPathsData.ts # 86 lessons across 6 courses
└── i18n/               # Internationalization
    ├── config.ts        # i18n configuration
    └── locales/         # Translation files
```

#### Custom Hooks

- **useState**: Local component state
- **useEffect**: Side effects and data fetching
- **useContext**: Global state (theme, authentication)
- **useReducer**: Complex state logic
- **Custom Hooks**: Reusable stateful logic (useMouseTracking, useTheme, etc.)

#### Routing

React Router DOM handles client-side routing with protected routes:

- **Public Routes**: Landing page, authentication
- **Protected Routes**: Dashboard, Learning Paths, study modes, settings
- **Role-Based Routes**: Admin console with permission checks
- **Route Guards**: Subscription status verification

### Backend Architecture

The backend uses Vercel serverless functions with a consolidated API structure:

#### API Structure

```
api/
├── index.ts                   # Main API router with consolidated endpoints
├── stripe-webhook.ts          # Handle Stripe webhook events
```

The main API router (`index.ts`) handles multiple endpoint categories:
- **admin**: User management, role assignment, admin utilities
- **coupons**: Stripe coupon management
- **users**: User operations (redirected to admin)
- **subscription**: Subscription status verification
- **stripe**: Stripe checkout and portal sessions
- **email**: Email operations (placeholder)
- **account**: Account operations (delete account)

#### Database Schema

 

Supabase PostgreSQL database with the following main tables:

 

**decks**

 

- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- title (Text)
- description (Text)
- created_at (Timestamp)
- source_label (Text)
- is_sample (Boolean)

 

**cards**

 

- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- deck_id (UUID, Foreign Key to decks)
- question (Text)
- answer (Text)
- next_review (Timestamp)
- interval (Integer)
- ease_factor (Numeric)
- repetition (Integer)
- last_reviewed (Timestamp)
- source_type (Enum: 'manual', 'ai', 'import', 'research')
- source_label (Text)
- citations (JSONB)
- trust_score (Numeric)

 

**user_profiles** (Extended auth.users metadata)

 

- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- role (Enum: USER, EMPLOYEE, ADMIN, CEO, OWNER)
- plan (Text)
- streak (Integer)
- joined_date (Timestamp)
- last_study_date (Timestamp)

**Row Level Security (RLS)** policies ensure data isolation:
- Users can only access their own data
- Admins have elevated access based on role permissions
- Public decks have appropriate read permissions
- Role-based access to admin functions

### AI Integration Architecture

The AI service layer supports multiple providers with intelligent fallback:

#### Provider Selection

```typescript
// Priority order: Local AI > Groq > OpenRouter > DeepSeek
1. Local AI (if VITE_USE_LOCAL_AI=true)
   - Base URL: /local-ai/v1 (proxied via Vite)
   - Model: Configurable via VITE_AI_MODEL
   
2. Groq (if VITE_GROQ_API_KEY available)
   - Base URL: https://api.groq.com/openai/v1
   - Model: llama-3.3-70b-versatile (default)
   - Advantage: Fast response times, free tier
   
3. OpenRouter (if VITE_OPENROUTER_API_KEY available)
   - Base URL: https://openrouter.ai/api/v1
   - Model: deepseek/deepseek-r1-0528:free (default)
   - Advantage: Multiple model options
   
4. DeepSeek (fallback)
   - Base URL: Configurable via environment
   - Model: deepseek-chat (default)
   - Advantage: Cost-effective alternative
```

#### Response Caching

To improve performance and reduce API costs:

- **In-Memory Cache**: 5-minute cache for identical requests
- **Cache Key Generation**: Based on request parameters
- **Automatic Eviction**: LRU (Least Recently Used) eviction when cache exceeds 100 entries
- **Cache Invalidation**: Manual invalidation for critical updates

#### AI Services

**Flashcard Generation**
- Input: Topic, document, or conversation
- Output: Array of flashcards with metadata
- Features: Difficulty assessment, citation generation, relationship mapping

**Quiz Generation**
- Input: Deck content or topic
- Output: Multiple-choice questions with explanations
- Features: Difficulty calibration, distractor generation, immediate feedback

**Study Buddy**
- Input: User question, context (deck, progress)
- Output: Conversational response with learning guidance
- Features: Socratic method, personalized examples, concept explanation

**Research Assistant**
- Input: Research topic or question
- Output: Comprehensive research summary with sources
- Features: Source aggregation, fact verification, citation generation

### Performance Optimization

#### Frontend Optimization

- **Code Splitting**: Dynamic imports for route-based code splitting
- **Lazy Loading**: Components loaded on-demand
- **Image Optimization**: WebP format with responsive images
- **Bundle Analysis**: Regular monitoring of bundle size
- **Memoization**: React.memo and useMemo for expensive computations
- **Virtual Scrolling**: For long lists (decks, cards)

#### Backend Optimization

- **Database Indexing**: Strategic indexes on frequently queried columns
- **Query Optimization**: Efficient SQL queries with proper joins
- **Connection Pooling**: Supabase connection management
- **Edge Caching**: Vercel edge functions for static content
- **CDN Delivery**: Static assets delivered via CDN

#### AI Optimization

- **Request Batching**: Combine multiple AI requests when possible
- **Streaming Responses**: Progressive response rendering
- **Model Selection**: Choose appropriate model for task complexity
- **Prompt Engineering**: Optimized prompts for efficiency and accuracy

---

## User Experience

### Onboarding Journey

New users experience a carefully designed onboarding process:

#### 1. Landing Page

The landing page introduces AuraMind's value proposition:

- **Hero Section**: Compelling headline and call-to-action
- **Feature Showcase**: Interactive demonstrations of key features
- **Social Proof**: Testimonials and user statistics
- **Visual Design**: Modern, architectural aesthetic with smooth animations

#### 2. Authentication

Flexible authentication options:

- **Email/Password**: Traditional authentication with Supabase
- **Social Login**: Google, GitHub (via Supabase)
- **Magic Link**: Passwordless authentication
- **Email Verification**: Required for security

#### 3. Initial Setup

First-time configuration:

- **Profile Creation**: Name, avatar, learning goals
- **Preference Selection**: Study times, notification preferences
- **Tutorial**: Interactive walkthrough of core features
- **Sample Content**: Option to load demo decks for exploration

### Dashboard Experience

The main dashboard serves as the learning command center:

#### Bento Grid Layout

Inspired by bento box design, the dashboard uses a modular grid:

- **Study Overview**: Cards due today, streak count, next review
- **Quick Actions**: Generate deck, import content, start study session
- **Progress Metrics**: Activity heatmap, retention rate, study time
- **Recent Activity**: Recently studied decks, generated content
- **Recommendations**: AI-suggested study topics and times
- **Learning Paths Card**: Quick-access tile showing enrolled courses and next lesson

#### Cosmic Sidebar

Navigation sidebar with visual flair:

- **Section Navigation**: Dashboard, Paths, Decks, Study, Chat, Settings
- **Quick Access**: Frequently used decks and features
- **Visual Indicators**: Unread notifications, due cards
- **Collapsible**: Expandable for more screen real estate

#### Responsive Design

Adapts seamlessly to different screen sizes:

- **Desktop**: Full-featured experience with all panels visible
- **Tablet**: Optimized layout with collapsible sections
- **Mobile**: Bottom navigation, simplified interface, touch-optimized

### Learning Paths Experience

Structured curricula designed for systematic learning from beginner to advanced:

#### Course Selection

- **Browse Courses**: Six curated courses displayed as interactive cards with progress indicators
- **Course Details**: Each card shows lesson count, estimated duration, difficulty level, and module breakdown
- **Enrollment**: One-click enrollment stored locally with background Supabase sync
- **Progress Tracking**: Visual progress ring per course and per-user enrollment status

#### Lesson Navigation

- **Module Structure**: Courses organized into logical modules (e.g., "JavaScript Fundamentals", "Asynchronous JavaScript")
- **Sequential Flow**: Lessons ordered from foundational to advanced within each module
- **Popup Interface**: Lesson content opens as an overlaid popup with smooth animations
- **Breadcrumb**: Module title, duration estimate, and "Lesson X of Y" for spatial awareness

#### Lesson Content

- **Rich Markdown Rendering**: Full GFM support including tables, code blocks with syntax highlighting, task lists, and strikethrough via `react-markdown` + `remark-gfm`
- **Tailwind Typography**: `prose` class styling ensures readable, well-spaced educational content
- **Description Highlight**: Each lesson opens with an introductory description box summarizing learning objectives
- **Navigation Controls**: Previous/Next buttons with dot-based progress indicator for linear progression

### Study Session Experience

The core learning experience is designed for focus and effectiveness:

#### Card Presentation

- **Clean Interface**: Minimal distractions, focus on content
- **Smooth Animations**: Pleasant transitions between cards
- **Keyboard Navigation**: Efficient for power users
- **Touch Gestures**: Swipe gestures for mobile users
- **Progress Indicators**: Visual feedback on session progress

#### Rating Interface

After revealing the answer, users rate their recall:

- **Again (0)**: Complete forget - card will appear again soon
- **Hard (3)**: Remembered with difficulty - shorter interval
- **Good (4)**: Remembered with hesitation - normal interval
- **Easy (5)**: Remembered easily - longer interval

The rating interface uses large, touch-friendly buttons with keyboard shortcuts (0, 3, 4, 5).

#### Voice Study Mode

For hands-free studying:

- **Voice Recognition**: Speak answers using Web Speech API
- **Voice Feedback**: AI evaluates spoken responses
- **Voice Reminders**: Optional periodic reminders to study
- **Accessibility**: Improves accessibility for users with motor impairments

#### Focus Mode

Minimize distractions during study:

- **Full Screen**: Immersive study environment
- **Ambient Sounds**: Optional background audio for focus
- **Notification Blocking**: Suppress non-essential notifications
- **Time Boxing**: Pomodoro-style timer integration

### Content Creation Experience

Creating study materials is streamlined and intelligent:

#### Quick Generation

Fast deck creation from topics:

- **Simple Input**: Enter topic and optional parameters
- **AI Processing**: Automatic content generation
- **Preview**: Review generated cards before saving
- **Customization**: Edit, add, or remove cards as needed

#### Document Import

Rich document processing:

- **Drag & Drop**: Intuitive file upload interface
- **Progress Tracking**: Real-time processing status
- **Quality Assessment**: AI evaluation of generated content
- **Batch Operations**: Process multiple files simultaneously

#### Chat Interface

Conversational content creation:

- **Natural Dialogue**: Chat with AI to refine content
- **Iterative Refinement**: Ask for changes and improvements
- **Context Awareness**: AI remembers conversation context
- **Multi-Modal**: Text, voice, and image inputs

---

## AI Integration

### AI Service Architecture

AuraMind's AI capabilities are built on a flexible, multi-provider architecture:

#### Provider Abstraction

The AI service layer abstracts provider-specific details:

```typescript
interface AIProvider {
  chat(messages: Message[], model?: string): Promise<ChatResponse>;
  generateFlashcards(topic: string, options?: GenerationOptions): Promise<Flashcard[]>;
  generateQuiz(content: string, options?: QuizOptions): Promise<Quiz>;
  studyBuddy(question: string, context: StudyContext): Promise<StudyResponse>;
}
```

This abstraction allows easy addition of new AI providers and switching between them based on availability, cost, or performance.

#### Prompt Engineering

Carefully crafted prompts ensure high-quality outputs:

**Flashcard Generation Prompt**
```
You are an expert educator creating flashcards for effective learning.
Generate flashcards that test understanding, not just memorization.
Include clear questions, comprehensive answers, and difficulty ratings.
Structure your response as valid JSON with the following format:
{
  "cards": [
    {
      "question": "Clear, specific question",
      "answer": "Detailed answer with examples",
      "difficulty": "easy|medium|hard",
      "citations": ["Source references"]
    }
  ]
}
```

**Study Buddy Prompt**
```
You are a patient, encouraging tutor helping a student learn.
Use the Socratic method - guide the student to answers rather than giving them directly.
Adapt your explanations to the student's level of understanding.
Provide examples relevant to the student's interests when possible.
Focus on building intuition and deep understanding.
```

#### Response Processing

AI responses undergo post-processing:

- **Validation**: Ensure response matches expected format
- **Sanitization**: Remove potentially harmful content
- **Quality Assessment**: Evaluate response quality and relevance
- **Metadata Extraction**: Extract tags, categories, and relationships
- **Citation Verification**: Validate source references when provided

### AI Capabilities

#### Content Generation

**Topic-Based Generation**
- Input: "Machine Learning Fundamentals"
- Output: 20-50 flashcards covering key concepts
- Features: Automatic difficulty progression, concept relationships

**Document-Based Generation**
- Input: PDF, PowerPoint, or text file
- Output: Flashcards extracted from document content
- Features: Section-based organization, key point extraction

**Conversation-Based Generation**
- Input: Chat dialogue about a topic
- Output: Flashcards based on discussed concepts
- Features: Context-aware generation, follow-up suggestions

#### Learning Assistance

**Concept Explanation**
- Input: "Explain backpropagation in simple terms"
- Output: Accessible explanation with analogies and examples
- Features: Adaptive complexity, multiple explanation styles

**Example Generation**
- Input: "Give me examples of design patterns"
- Output: Real-world examples with code snippets
- Features: Domain-specific examples, difficulty matching

**Practice Problems**
- Input: "Create practice problems for calculus"
- Output: Problems with solutions and difficulty ratings
- Features: Step-by-step solutions, common mistakes

#### Research Assistance

**Information Synthesis**
- Input: Research question or topic
- Output: Comprehensive summary with multiple perspectives
- Features: Source aggregation, fact verification, citation generation

**Literature Review**
- Input: Academic field or research question
- Output: Overview of key papers and findings
- Features: Chronological organization, methodology comparison

**Fact Verification**
- Input: Statement or claim
- Output: Verification with sources and confidence level
- Features: Source reliability assessment, context provision

### AI Ethics and Safety

#### Content Moderation

- **Harmful Content Filtering**: Prevent generation of harmful, illegal, or unethical content
- **Bias Mitigation**: Reduce bias in generated content
- **Accuracy Verification**: Cross-check facts when possible
- **Source Attribution**: Always cite sources when using external information

#### Privacy Protection

- **Data Minimization**: Only send necessary data to AI providers
- **Anonymization**: Remove personally identifiable information before API calls
- **Secure Transmission**: Use HTTPS for all AI API communications
- **Data Retention**: Minimize storage of AI-generated content

#### Transparency

- **AI Labeling**: Clearly indicate AI-generated content
- **Confidence Scores**: Provide confidence levels for AI responses
- **Source Disclosure**: Show sources when AI uses external information
- **Limitation Communication**: Be transparent about AI limitations

---

## Spaced Repetition System

### Algorithm Implementation

AuraMind implements the SuperMemo-2 (SM-2) algorithm, a well-established spaced repetition system:

#### SM-2 Algorithm

```typescript
function calculateSRS(card: Card, quality: Rating): SRSResult {
  let { interval, repetition, easeFactor } = card;

  if (quality >= 3) {
    // Successful recall
    if (repetition === 0) {
      interval = 1; // First review: 1 day
    } else if (repetition === 1) {
      interval = 6; // Second review: 6 days
    } else {
      interval = Math.round(interval * easeFactor); // Subsequent reviews
    }
    repetition += 1;
  } else {
    // Failed recall - reset
    repetition = 0;
    interval = 1;
  }

  // Adjust ease factor based on quality
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3; // Minimum ease factor

  return { interval, repetition, easeFactor };
}
```

#### Quality Ratings

Users rate their recall on a 0-5 scale:

- **Again (0)**: Complete failure - forgot completely
- **Hard (3)**: Difficult recall - remembered with significant effort
- **Good (4)**: Good recall - remembered with some hesitation
- **Easy (5)**: Easy recall - remembered immediately

The rating system is designed to be intuitive while providing sufficient granularity for the algorithm.

#### Scheduling Logic

The algorithm calculates the next review date:

```typescript
nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000); // Convert days to milliseconds
```

Cards are sorted by next review date, and users study cards that are due (nextReview <= current time).

### Algorithm Enhancements

AuraMind includes several enhancements to the base SM-2 algorithm:

#### Fuzzy Scheduling

Instead of strict scheduling, use fuzzy intervals:

- **Hard Reviews**: Slightly shorter intervals for difficult cards
- **Easy Reviews**: Slightly longer intervals for easy cards
- **Randomization**: Small random variation to prevent pattern recognition

#### Context-Aware Scheduling

Adjust scheduling based on context:

- **Time of Day**: Optimal review times based on performance patterns
- **Study Session Length**: Adjust card count based on available time
- **Related Cards**: Schedule related cards together for reinforcement
- **Difficulty Clustering**: Group similar difficulty cards

#### Adaptive Parameters

Personalize algorithm parameters based on individual performance:

- **Initial Ease Factor**: Adjust based on overall performance
- **Quality Thresholds**: Customize rating interpretations
- **Interval Multipliers**: Scale intervals based on retention rates

### Learning Analytics

#### Retention Tracking

Track how well information is retained over time:

- **Short-term Retention**: Retention after 1 day, 3 days, 1 week
- **Long-term Retention**: Retention after 1 month, 3 months, 6 months
- **Decay Curves**: Individual forgetting curves for each user
- **Optimal Review Timing**: Identify when reviews are most effective

#### Performance Analysis

- **Accuracy Rates**: Measure of correct answers across different topics
- **Response Times**: Analysis of how quickly users respond to cards
- **Difficulty Progression**: Track how user performance changes with difficulty
- **Learning Velocity**: Speed of acquiring new knowledge
- **Mastery Levels**: Progress toward full mastery of content

#### Predictive Analytics

Predict future performance:

- **Retention Prediction**: Forecast long-term retention based on current performance
- **Workload Prediction**: Estimate future study workload
- **Optimal Schedule**: Recommend optimal study schedules
- **Knowledge Decay**: Predict when knowledge will need refreshing

---

## Study Modes

### Flashcard Review Mode

The classic flashcard experience, enhanced with modern features:

#### Card Display

- **Question Side**: Clear, readable question with optional context
- **Answer Side**: Comprehensive answer with explanations and examples
- **Citations**: Source references for verification
- **Media Support**: Images, audio, and video when applicable
- **Math Rendering**: LaTeX support for mathematical content

#### Interaction Design

- **Flip Animation**: Smooth 3D flip animation to reveal answer
- **Keyboard Shortcuts**: Space to flip, 0/3/4/5 to rate
- **Touch Gestures**: Tap to flip, swipe to navigate
- **Progress Bar**: Visual indicator of session progress
- **Time Tracking**: Track time spent per card

#### Review Strategies

- **Due Cards First**: Prioritize cards that are due for review
- **New Cards**: Introduce new cards gradually
- **Random Order**: Prevent order-dependent learning
- **Focused Review**: Review specific decks or tags

### Quiz Mode

Test knowledge with multiple-choice questions:

#### Question Generation

AI generates multiple-choice questions from deck content:

- **Question Types**: Various question formats (definition, application, analysis)
- **Distractor Generation**: Plausible incorrect answers
- **Difficulty Calibration**: Questions matched to user ability
- **Explanation Generation**: Detailed explanations for each answer

#### Quiz Interface

- **Question Display**: Clear question with all options
- **Selection Interface**: Easy option selection with visual feedback
- **Immediate Feedback**: Instant right/wrong indication
- **Explanation Display**: Detailed explanation after answering
- **Score Tracking**: Running score and performance metrics

#### Quiz Features

- **Timed Mode**: Optional time limit per question
- **Adaptive Difficulty**: Questions adjust based on performance
- **Review Mode**: Review incorrect answers after quiz
- **Progress Tracking**: Track improvement over time

### Study Buddy Chat

Interactive conversational learning:

#### Chat Interface

- **Natural Conversation**: Chat with AI tutor about study material
- **Context Awareness**: AI understands your deck and progress
- **Message History**: Full conversation history for reference
- **Rich Media**: Support for images, code, and formatted text

#### Learning Approaches

- **Socratic Method**: Guide learning through questions
- **Direct Explanation**: Clear explanations when needed
- **Example Generation**: Relevant examples for clarification
- **Analogy Creation**: Analogies to aid understanding

#### Personalization

- **Adaptive Complexity**: Adjust explanation complexity based on responses
- **Interest-Based Examples**: Examples tailored to user interests
- **Learning Style Adaptation**: Match explanation style to learning preferences
- **Progress Tracking**: Track understanding through conversation

### Presentation Mode

Learn through structured presentations:

#### Slide Generation

AI creates presentations from deck content:

- **Logical Organization**: Content organized into coherent slides
- **Visual Aids**: Automatic generation of diagrams and visualizations
- **Progressive Disclosure**: Information revealed in optimal sequence
- **Summary Slides**: Key points recap at section ends

#### Presentation Features

- **Navigation Controls**: Easy navigation between slides
- **Full Screen Mode**: Immersive presentation experience
- **Speaker Notes**: Additional context for each slide
- **Export Options**: Export to various formats (PDF, PowerPoint)

#### Learning Integration

- **Quiz Integration**: Embedded quizzes within presentations
- **Note Taking**: Take notes while viewing presentations
- **Review Mode**: Quick recap of key points
- **Progress Tracking**: Track presentation completion

---

## Content Management

### Deck Organization

AuraMind provides flexible deck organization:

#### Deck Structure

- **Hierarchical Organization**: Decks can contain sub-decks
- **Tagging System**: Multiple tags per deck for flexible categorization
- **Smart Collections**: Automatic collections based on criteria
- **Search & Filter**: Powerful search and filtering capabilities

#### Deck Metadata

Each deck includes rich metadata:

- **Title & Description**: Clear identification and purpose
- **Creation Date**: Track when deck was created
- **Last Modified**: Track recent changes
- **Card Count**: Number of cards in deck
- **Source Label**: Origin of deck content
- **Study Statistics**: Performance metrics for the deck

#### Deck Operations

- **Create**: New decks from scratch or AI generation
- **Edit**: Modify deck properties and content
- **Delete**: Remove decks with confirmation
- **Duplicate**: Copy decks for modification
- **Merge**: Combine multiple decks
- **Split**: Divide large decks into smaller ones

### Card Management

Fine-grained control over individual cards:

#### Card Properties

Each card includes:

- **Question & Answer**: Core content
- **Citations**: Source references
- **Difficulty Rating**: Automatic or manual difficulty assessment
- **Tags**: Categorization tags
- **Notes**: Personal notes and annotations
- **Media**: Associated images, audio, or video
- **SRS Data**: Spaced repetition parameters

#### Card Operations

- **Create**: Add new cards manually or via AI
- **Edit**: Modify card content and properties
- **Delete**: Remove cards with undo option
- **Duplicate**: Copy cards for modification
- **Move**: Move cards between decks
- **Batch Operations**: Perform operations on multiple cards

#### Card Quality

Tools to maintain card quality:

- **Quality Assessment**: AI evaluation of card quality
- **Duplicate Detection**: Identify and merge duplicate cards
- **Outdated Detection**: Flag potentially outdated information
- **Difficulty Calibration**: Ensure appropriate difficulty levels
- **Citation Verification**: Validate source references

### Content Lifecycle

Manage content throughout its lifecycle:

#### Creation

- **AI Generation**: Automated content creation
- **Manual Creation**: Manual card creation
- **Import**: Import from various sources
- **Templates**: Use templates for consistent formatting

#### Maintenance

- **Regular Review**: Scheduled review of content accuracy
- **Updates**: Update content as information changes
- **Retirement**: Archive or delete outdated content
- **Optimization**: Improve content based on performance data

#### Analytics

- **Usage Tracking**: Track how often content is used
- **Performance Analysis**: Analyze content effectiveness
- **Improvement Suggestions**: AI suggestions for improvement
- **A/B Testing**: Test different content versions

---

## Import & Export Capabilities

### Document Import

Import study materials from various document formats:

#### PDF Import

- **Text Extraction**: Extract text from PDF files
- **Layout Preservation**: Maintain document structure
- **Image Extraction**: Extract images when relevant
- **Metadata Extraction**: Extract document metadata
- **Batch Processing**: Process multiple PDFs simultaneously

#### PowerPoint Import

- **Slide Text Extraction**: Extract text from slides
- **Structure Preservation**: Maintain slide organization
- **Media Extraction**: Extract images and media
- **Speaker Notes**: Extract speaker notes when available
- **Template Recognition**: Identify slide templates for better organization

#### Text File Import

- **Plain Text**: Import plain text files
- **Markdown**: Import Markdown with formatting
- **Rich Text**: Import RTF and other rich text formats
- **Code Files**: Import code files with syntax highlighting
- **Structured Text**: Import CSV, JSON, and other structured formats

### Anki Integration

Seamless integration with existing Anki collections:

#### APKG Import

- **Deck Import**: Import Anki decks (.apkg files)
- **Media Handling**: Preserve images, audio, and media
- **Tag Preservation**: Maintain existing tags
- **Model Compatibility**: Handle various Anki card models
- **Review History**: Import review history when possible

#### Anki Compatibility

- **Note Types**: Support various Anki note types
- **Card Templates**: Preserve card templates
- **Cloze Deletion**: Support cloze deletion cards
- **Image Occlusion**: Support image occlusion cards
- **Field Mapping**: Map Anki fields to AuraMind fields

### Web Content Import

Import content from the web:

#### URL Import

- **Article Extraction**: Extract main content from articles
- **Text Cleaning**: Remove ads, navigation, and clutter
- **Metadata Extraction**: Extract title, author, date
- **Image Handling**: Extract and process images
- **Link Preservation**: Preserve important links

#### YouTube Integration

- **Transcript Extraction**: Extract video transcripts
- **Timestamp Handling**: Preserve timestamps for reference
- **Chapter Detection**: Detect video chapters for organization
- **Thumbnail Extraction**: Extract video thumbnails
- **Metadata Extraction**: Extract video metadata

#### Wikipedia Import

- **Article Extraction**: Extract Wikipedia articles
- **Link Following**: Follow internal links for related content
- **Reference Extraction**: Extract references and citations
- **Image Handling**: Extract article images
- **Category Handling**: Preserve Wikipedia categories

### Export Capabilities

Export content for use outside AuraMind:

#### Standard Formats

- **CSV Export**: Export to CSV for spreadsheet use
- **JSON Export**: Export to JSON for programmatic use
- **PDF Export**: Export to PDF for printing
- **Markdown Export**: Export to Markdown for documentation

#### Anki Export

- **APKG Export**: Export to Anki format
- **Media Packaging**: Package media files
- **Template Generation**: Generate appropriate card templates
- **Compatibility**: Ensure Anki compatibility

#### Study Guide Export

- **Summary Generation**: Generate study summaries
- **Outline Export**: Export content outlines
- **Flashcard Sheets**: Export printable flashcard sheets
- **Presentation Export**: Export as presentation slides

---

## Analytics & Progress Tracking

### Performance Metrics

Comprehensive tracking of learning performance:

#### Retention Metrics

- **Short-term Retention**: Retention after 1, 3, 7 days
- **Long-term Retention**: Retention after 1, 3, 6 months
- **Decay Rate**: Rate at which information is forgotten
- **Optimal Review Interval**: Ideal time between reviews
- **Retention Curves**: Visual representation of retention over time

#### Study Metrics

- **Study Frequency**: How often study sessions occur
- **Session Duration**: Average length of study sessions
- **Cards per Session**: Average cards reviewed per session
- **Accuracy Rate**: Percentage of correct answers
- **Review Speed**: Average time per card

#### Progress Metrics

- **Decks Completed**: Number of decks completed
- **Cards Mastered**: Number of cards with high retention
- **Streak Length**: Consecutive days of study
- **Total Study Time**: Cumulative time spent studying
- **Improvement Rate**: Rate of performance improvement

### Visualization

Rich visualizations of learning data:

#### Activity Heatmap

- **Calendar View**: Daily study activity over time
- **Intensity Indication**: Color-coded activity levels
- **Streak Visualization**: Visual representation of study streaks
- **Pattern Recognition**: Identify study patterns
- **Goal Tracking**: Track progress toward study goals

#### Learning Curves

- **Performance Over Time**: Performance trends over time
- **Retention Curves**: Retention rates over time
- **Difficulty Progression**: How difficulty changes over time
- **Subject Breakdown**: Performance by subject or deck
- **Comparative Analysis**: Compare performance across periods

#### Knowledge Maps

- **Concept Relationships**: Visual map of concept connections
- **Knowledge Gaps**: Identify areas needing attention
- **Learning Path**: Suggested learning sequence
- **Mastery Levels**: Visual representation of mastery
- **Cross-References**: Show relationships between topics

### Predictive Analytics

AI-powered predictions and recommendations:

#### Performance Prediction

- **Future Retention**: Predict long-term retention
- **Workload Forecast**: Estimate future study workload
- **Optimal Schedule**: Recommend optimal study times
- **Difficulty Prediction**: Predict future difficulty levels
- **Completion Estimates**: Estimate time to complete goals

#### Personalized Recommendations

- **Study Topics**: Recommend topics to study next
- **Review Schedule**: Suggest optimal review schedule
- **Content Suggestions**: Suggest new content to add
- **Learning Strategies**: Recommend effective learning strategies
- **Time Allocation**: Suggest time allocation across subjects

#### Adaptive Learning

- **Difficulty Adjustment**: Adjust content difficulty based on performance
- **Pacing Optimization**: Optimize learning pace
- **Content Selection**: Select most effective content
- **Review Strategy**: Optimize review strategy
- **Personalization**: Personalize learning experience

---

## User Roles & Permissions

### Role Hierarchy

AuraMind implements a hierarchical role system:

#### Role Levels

1. **Owner (Level 100)**
   - Full system access
   - Can manage all roles and settings
   - Can delete any user
   - Has free access to all features

2. **CEO (Level 90)**
   - Executive access
   - Can manage admins and view all data
   - Can manage settings
   - Has free access to all features

3. **Admin (Level 80)**
   - Administrative access
   - Can manage users and content
   - Can view analytics
   - Can manage coupons
   - Has free access to all features

4. **Employee (Level 50)**
   - Staff access
   - Can view analytics
   - Can manage basic operations
   - Limited content management

5. **User (Level 10)**
   - Standard user access
   - Can manage own content
   - Can view own analytics
   - Subscription-based access

#### Permission Matrix

| Permission | Owner | CEO | Admin | Employee | User |
|------------|-------|-----|-------|----------|------|
| Manage Users | ✓ | ✗ | ✓ | ✗ | ✗ |
| Manage Roles | ✓ | ✗ | ✗ | ✗ | ✗ |
| View Analytics | ✓ | ✓ | ✓ | ✓ | Own |
| Manage Coupons | ✓ | ✗ | ✓ | ✗ | ✗ |
| Manage Settings | ✓ | ✓ | ✗ | ✗ | ✗ |
| View All Data | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete Users | ✓ | ✗ | ✗ | ✗ | ✗ |
| Access Admin Panel | ✓ | ✓ | ✓ | ✗ | ✗ |
| Free Access | ✓ | ✓ | ✓ | ✗ | ✗ |

### Role Management

#### Role Assignment

- **Default Role**: New users assigned User role by default
- **Email-Based Assignment**: Specific emails automatically assigned roles
- **Manual Assignment**: Admins can manually assign roles
- **Role Promotion**: Users can be promoted based on criteria
- **Role Demotion**: Users can be demoted for policy violations

#### Role Verification

- **Authentication**: Verify user identity before role changes
- **Audit Trail**: Log all role changes
- **Approval Process**: Require approval for role changes
- **Notification**: Notify users of role changes
- **Review Period**: Regular review of role assignments

### Access Control

#### Route Protection

Protected routes require appropriate permissions:

```typescript
// Example: Admin-only route
<Route path="/admin/vault" element={
  permissions.canAccessAdminPanel ? (
    <AdminConsolePage />
  ) : (
    <Navigate to="/dashboard" replace />
  )
} />
```

#### Data Access

Row Level Security (RLS) in Supabase ensures data isolation:

- **User Data**: Users can only access their own data
- **Admin Data**: Admins can access all user data
- **Public Data**: Public decks accessible to all users
- **Sensitive Data**: Extra protection for sensitive information

#### Feature Access

Features are gated based on role and subscription:

- **Free Features**: Available to all users
- **Premium Features**: Require subscription
- **Admin Features**: Require admin role
- **Beta Features**: Available to select users

---

## Subscription & Payments

### Subscription Tiers

AuraMind offers two subscription tiers:

#### Monthly Protocol

- **Price**: $9.99/month
- **Features**: 
- **AI-powered flashcard generation**: Generate flashcards from notes, outlines, and study materials
- **Aura Operator**: 4 study agent modes (Study From Anything, Study Buddy, Content Pipeline, Research Assistant)
- **Deck creation & study sessions**: Create unlimited decks and study with spaced repetition
- **Research assistant & content pipeline**: Convert PDFs, PowerPoint files, and text into study materials
- **Full access**: Complete access to all platform features

#### Annual System

- **Price**: $3.99/month (billed annually at $47.88)
- **Savings**: 60% discount compared to monthly
- **Features**: All Monthly Protocol features
- **Value**: Best value for committed learners

#### Free Tier

- **Features**: Basic access with limited functionality
- **Storage**: Limited card storage
- **AI Generation**: Limited AI generations
- **Study Modes**: Basic flashcard review
- **Support**: Community support

### Payment Processing

Stripe integration for secure payment processing:

#### Checkout Flow

1. **Initiation**: User clicks "Subscribe" button
2. **Session Creation**: Server creates Stripe checkout session
3. **Redirection**: User redirected to Stripe checkout
4. **Payment**: User completes payment on Stripe
5. **Confirmation**: Stripe sends webhook confirmation
6. **Provisioning**: User account provisioned with premium features

#### Webhook Handling

Stripe webhooks handle payment events:

- **checkout.session.completed**: Successful payment
- **customer.subscription.created**: New subscription created
- **customer.subscription.updated**: Subscription updated
- **customer.subscription.deleted**: Subscription cancelled
- **invoice.payment_succeeded**: Recurring payment successful
- **invoice.payment_failed**: Recurring payment failed

#### Subscription Management

Users can manage subscriptions:

- **Upgrade**: Upgrade to higher tier
- **Downgrade**: Downgrade to lower tier
- **Cancel**: Cancel subscription
- **Reactivate**: Reactivate cancelled subscription
- **Payment Method**: Update payment method
- **Invoice History**: View payment history

### Free Access

Certain roles have free access to premium features:

- **Owner**: Full free access
- **CEO**: Full free access
- **Admin**: Full free access
- **Employee**: No free access
- **User**: No free access

Free access is granted through:

- **Role Assignment**: Automatic based on role
- **Coupon Codes**: Promotional codes for free access
- **Beta Programs**: Free access during beta testing
- **Educational Discounts**: Discounts for educational institutions

---

## Security & Privacy

### Data Security

#### Encryption

- **Data in Transit**: All data encrypted using TLS 1.3
- **Data at Rest**: Database encryption at rest
- **API Keys**: Encrypted storage of API keys
- **Sensitive Data**: Additional encryption for sensitive information

#### Authentication

- **Secure Authentication**: Supabase authentication with best practices
- **Multi-Factor Authentication**: Optional 2FA for enhanced security
- **Session Management**: Secure session management
- **Password Security**: Strong password requirements
- **Social Login**: Secure OAuth integration

#### Authorization

- **Role-Based Access Control**: Granular permissions based on roles
- **Row Level Security**: Database-level access control
- **API Security**: Secure API endpoints with proper authentication
- **Resource Access**: Proper authorization for all resources

### Privacy Protection

#### Data Collection

- **Minimal Collection**: Only collect necessary data
- **Purpose Limitation**: Use data only for stated purposes
- **Data Minimization**: Collect minimum necessary data
- **Consent**: Explicit consent for data collection
- **Transparency**: Clear disclosure of data practices

#### Data Usage

- **Limited Use**: Use data only for intended purposes
- **No Selling**: Never sell user data
- **No Profiling**: No invasive profiling for advertising
- **AI Processing**: Anonymize data before AI processing
- **Third-Party Sharing**: Limited sharing with trusted partners

#### Data Retention

- **Retention Policies**: Clear data retention policies
- **User Control**: Users can delete their data
- **Automatic Deletion**: Automatic deletion of old data
- **Export Options**: Users can export their data
- **Right to be Forgotten**: Complete data deletion on request

### Compliance

#### GDPR Compliance

- **Legal Basis**: Clear legal basis for data processing
- **User Rights**: Respect user rights under GDPR
- **Data Portability**: Provide data export capabilities
- **Data Protection Officer**: Designated data protection officer
- **Breach Notification**: Prompt notification of data breaches

#### CCPA Compliance

- **Disclosure**: Clear disclosure of data practices
- **Opt-Out**: Opt-out options for data selling
- **Access**: User access to collected data
- **Deletion**: Right to delete data
- **Non-Discrimination**: No discrimination for exercising rights

---

## Development & Deployment

### Development Environment

#### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Latest version
- **Git**: For version control
- **Code Editor**: VS Code or similar

#### Setup Process

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd "AuraMind Website/AuraMind App 2"
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd auramind-gemini
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp auramind-gemini/.env.example auramind-gemini/.env
   # Edit .env with your credentials
   ```

4. **Database Setup** (if needed)
   ```bash
   cd auramind-gemini
   node run-migration.js
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

#### Development Tools

- **Vite**: Fast development server with HMR and proxy support
- **TypeScript**: Type checking and IDE support
- **Vitest**: Unit testing framework with jsdom environment
- **Git**: Version control
- **ESLint**: Code linting (configured)
- **PostCSS**: CSS processing with Tailwind

### Testing

#### Unit Tests

Vitest for unit testing:

```bash
cd auramind-gemini
npm test
```

Test coverage includes:

- **SRS Algorithm**: Spaced repetition logic
- **Database Service**: Database operations
- **AI Service**: AI integration
- **Utilities**: Helper functions

Current test files:
- `auraAiService.test.ts`: AI service integration tests
- `dbService.test.ts`: Database service tests
- `srs.test.ts`: Spaced repetition algorithm tests

#### Integration Tests (Planned)

Integration tests for component interactions:

- **User Flows**: Complete user journeys
- **API Integration**: API endpoint testing
- **Database Integration**: Database operation testing
- **AI Integration**: AI service testing

#### End-to-End Tests (Planned)

E2E testing framework to be implemented:

- **Critical Paths**: Critical user journeys
- **Cross-Browser**: Testing across browsers
- **Mobile Testing**: Mobile device testing
- **Performance Testing**: Performance regression testing

### Build Process

#### Production Build

```bash
cd auramind-gemini
npm run build
```

Build optimizations:

- **Code Splitting**: Route-based code splitting
- **Tree Shaking**: Remove unused code
- **Minification**: Minify JavaScript and CSS
- **Asset Optimization**: Optimize images and assets
- **Bundle Analysis**: Analyze bundle size

#### Type Checking

```bash
npm run type-check
```

TypeScript compilation ensures type safety:

- **Type Errors**: Catch type errors at build time
- **Interface Compliance**: Ensure interface compliance
- **Import Validation**: Validate imports
- **Generic Types**: Proper generic type usage

### Deployment

#### Vercel Deployment

Automated deployment via Vercel:

1. **Connect Repository**: Connect GitHub repository to Vercel
2. **Configure Settings**: Set build settings and environment variables
3. **Deploy**: Automatic deployment on push to main branch
4. **Preview Deployments**: Preview deployments for pull requests
5. **Production Deployment**: Manual promotion to production

#### Environment Variables

Production environment variables:

- **VITE_SUPABASE_URL**: Supabase project URL
- **VITE_SUPABASE_ANON_KEY**: Supabase anonymous key
- **VITE_GROQ_API_KEY**: Groq API key
- **VITE_OPENROUTER_API_KEY**: OpenRouter API key
- **STRIPE_SECRET_KEY**: Stripe secret key (server-side)
- **STRIPE_WEBHOOK_SECRET**: Stripe webhook secret
- **RESEND_API_KEY**: Resend API key
- **VITE_POSTHOG_KEY**: PostHog analytics key

#### Monitoring

Production monitoring:

- **Performance Monitoring**: Vercel Analytics
- **User Analytics**: PostHog for user analytics (when configured)
- **Uptime Monitoring**: Vercel built-in monitoring
- **Log Aggregation**: Vercel logs

---

## Future Roadmap

### ✅ Recently Completed

- **Learning Paths**: Shipped 6 structured courses with 86 lessons covering JavaScript, React, Databases, Machine Learning, DSA, and TypeScript — with markdown rendering, lesson navigation, and local-first enrollment
- **Dashboard Redesign**: Updated dashboard layout with bento grid, learning paths card, and improved sidebar navigation
- **Quiz Lab**: Standalone quiz page (`/quiz`) with deck selection, AI-generated multiple-choice quizzes, score tracking, and sidebar navigation — accessible from dashboard sidebar
- **Chat Presentations**: AI-generated presentations render inline in AuraChat via new `ChatPresentation` component; shared `Slide`/`Presentation` types extracted to `types/index.ts`
- **Advanced Analytics**: Card Maturity Timeline (stacked area chart) and Rating Distribution (donut chart) wired into AnalyticsPage with real card data — no more mock data
- **Voice Hook**: `useSpeechRecognition()` custom hook for Web Speech API speech-to-text with start/stop/reset and transcript/interim support
- **Character Avatar in TopBar**: Mii/DiceBear character or uploaded image replaces user initials in TopAppBar

### Short-Term Goals (Next 3 Months)

#### Feature Enhancements

- **Enhanced Quiz Mode**: ✅ Completed — dedicated Quiz Lab page with AI-generated quizzes from any deck, session history, sidebar access
- **Presentation AI Generation**: ✅ Completed — ChatPresentation component renders presentations from AI tool actions in chat
- **Advanced Analytics**: ✅ Completed — Maturity Timeline and Button Distribution charts added with live data
- **Improved AI**: Enhanced AI capabilities and accuracy — service consolidation planned
- **Voice Features**: Enhanced voice interaction features — `useSpeechRecognition` hook ready for integration

#### Platform Improvements

- **Performance**: Optimize application performance
- **Accessibility**: Improve accessibility features
- **Internationalization**: Complete i18n implementation
- **Dark Mode**: Enhanced dark mode experience
- **Keyboard Shortcuts**: More keyboard shortcuts for power users

### Medium-Term Goals (Next 6 Months)

#### New Features

- **Collaboration Features**: Real-time collaboration on decks
- **Study Groups**: Enhanced group study features
- **Gamification**: More gamification elements
- **Integration Hub**: Integrations with more learning platforms
- **Advanced Import**: Support for more file formats

#### Platform Expansion

- **Mobile Apps**: Native iOS and Android applications
- **Offline Mode**: Offline functionality for studying without internet
- **API**: Public API for third-party integrations
- **Webhooks**: Webhooks for automation
- **Plugins**: Plugin system for extensions

### Long-Term Goals (Next 12 Months)

#### Vision Features

- **Adaptive Learning**: Fully adaptive learning system
- **Personal AI**: Personalized AI tutor for each user
- **Knowledge Graph**: Comprehensive knowledge graph
- **Predictive Learning**: Predictive learning recommendations
- **Cross-Platform Learning**: Seamless learning across devices

#### Platform Evolution

- **White Label**: White label options for organizations
- **Enterprise Features**: Enterprise-grade features
- **Global Expansion**: Expand to global markets
- **AI Research**: Conduct AI research for learning

---

## Conclusion

AuraMind represents a significant advancement in learning technology, combining artificial intelligence with cognitive science to create a truly personalized learning experience. The platform addresses the fundamental limitations of traditional learning methods through intelligent automation, adaptive algorithms, and seamless integration.

### Key Strengths

1. **AI-Powered**: Leverages cutting-edge AI for content generation and learning assistance
2. **Scientifically Grounded**: Based on proven cognitive science principles
3. **User-Centric**: Designed with user experience as a primary focus
4. **Flexible**: Adaptable to various learning styles and objectives
5. **Comprehensive**: All-in-one platform for the entire learning lifecycle

### Impact

AuraMind has the potential to:

- **Improve Learning Outcomes**: Better retention and understanding
- **Save Time**: Automated content creation and optimized scheduling
- **Increase Engagement**: Gamification and personalization increase motivation
- **Democratize Education**: Make quality learning tools accessible to all
- **Advance Learning Science**: Contribute to the field of learning science

### Vision

The ultimate vision for AuraMind is to become the definitive AI-powered learning platform that transforms how people learn and retain information. By continuously improving AI capabilities, expanding feature sets, and refining the user experience, AuraMind aims to make effective learning accessible, enjoyable, and efficient for everyone.

### Call to Action

Whether you're a student looking to ace your exams, a professional seeking to stay current in your field, or a lifelong learner pursuing new interests, AuraMind provides the tools and intelligence you need to achieve your learning goals. Join the growing community of AuraMind users and experience the future of learning today.

---

*This comprehensive guide provides an in-depth look at AuraMind's features, architecture, and vision. For specific implementation details, API documentation, or technical support, please refer to the project's technical documentation or contact the development team.*