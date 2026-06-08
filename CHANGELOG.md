# Changelog

All notable changes to AuraMind will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **FSRS Algorithm** - Replaced SM-2 with Free Spaced Repetition Scheduler v5 for up to 30% better retention efficiency
- **AI Fact-Checking** - Verify flashcard accuracy with automated fact-checking and trust scores
- **Anki Export** - Export decks to .apkg format for use in Anki desktop/mobile
- **Offline Support** - Study flashcards without internet connection via IndexedDB caching
- **PWA Support** - Install as native app on mobile/desktop with offline capabilities
- **Cookie Consent** - GDPR-compliant cookie consent banner with granular preferences
- **Data Export** - Export all personal data in JSON/CSV format (GDPR Article 20)
- **Error Boundaries** - Graceful error handling with recovery options
- **Rate Limiting** - Client-side API rate limiting to prevent abuse
- **Security Headers** - CSP, HSTS, X-Frame-Options, and other security headers
- **SEO Optimization** - Open Graph, Twitter Cards, JSON-LD structured data
- **Loading Skeletons** - Better UX with skeleton screens instead of spinners
- **404 Page** - Custom not-found page with helpful navigation
- **Environment Validation** - Fail-fast validation of required environment variables
- **Database Migration** - SQL migration for FSRS state, verified cards, and analytics

### Changed
- Enhanced Socratic method in AI tutor - guides students to answers instead of giving them directly
- Improved study buddy prompts for better learning outcomes
- Updated Vite config with PWA plugin and production optimizations
- Updated Vercel config with security headers and caching rules

### Fixed
- TypeScript type definitions for Card interface with FSRS state
- Database service handling of JSONB columns (fsrs_state)
- Analytics service integration with FSRS analytics

## [1.0.0] - 2026-01-15

### Added
- Initial release of AuraMind
- AI-powered flashcard generation (Groq, OpenRouter, Local AI)
- Spaced repetition with SM-2 algorithm
- Study modes: Flashcard review, Quiz, Study Buddy chat
- Supabase authentication and database
- Stripe subscription management
- Dashboard with analytics and progress tracking
- Import from Anki, Notion, Obsidian, PDF, PPTX
- Responsive design for desktop and mobile
- Dark/light theme support
- Gamification with streaks and achievements
- PostHog analytics integration
