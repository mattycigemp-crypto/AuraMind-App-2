---
name: AuraMind Design System
colors:
  surface: '#0d1515'
  surface-dim: '#0d1515'
  surface-bright: '#333b3b'
  surface-container-lowest: '#080f10'
  surface-container-low: '#151d1e'
  surface-container: '#192122'
  surface-container-high: '#232b2c'
  surface-container-highest: '#2e3637'
  on-surface: '#dce4e5'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#dce4e5'
  inverse-on-surface: '#2a3233'
  outline: '#849495'
  outline-variant: '#3b494b'
surface-tint: '#8B5CF6'
primary: '#F5F3FF'
on-primary: '#4B0082'
primary-container: '#EDE9FE'
on-primary-container: '#6D28D9'
inverse-primary: '#6D28D9'
secondary: '#d0bcff'
on-secondary: '#3c0091'
secondary-container: '#571bc1'
on-secondary-container: '#c4abff'
tertiary: '#fff3f2'
on-tertiary: '#67001b'
tertiary-container: '#ffcdcf'
on-tertiary-container: '#bc0b3b'
error: '#ffb4ab'
on-error: '#690005'
error-container: '#93000a'
on-error-container: '#ffdad6'
primary-fixed: '#C4B5FD'
primary-fixed-dim: '#8B5CF6'
on-primary-fixed: '#2E1A47'
on-primary-fixed-variant: '#5D3FD3'
secondary-fixed: '#e9ddff'
secondary-fixed-dim: '#d0bcff'
on-secondary-fixed: '#23005c'
on-secondary-fixed-variant: '#5516be'
tertiary-fixed: '#ffdadb'
tertiary-fixed-dim: '#ffb2b7'
on-tertiary-fixed: '#40000d'
on-tertiary-fixed-variant: '#92002a'
background: '#0d1515'
on-background: '#dce4e5'
surface-variant: '#2e3637'
bg-neural: '#050505'
surface-glass: rgba(15, 15, 20, 0.7)
border-brutal: '#262626'
accent-neural-grid: '#121212'
status-retention-high: '#8B5CF6'
status-retention-low: '#A78BFA'
typography:
  impact-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  eyebrow:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.2em
  body-main:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  mono-label:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  sidebar-width: 280px
  container-max: 1440px
  card-padding: 20px
---

# AuraMind Dashboard Development Prompt

## Project Overview
AuraMind is an AI-powered learning platform that transforms study materials into intelligent flashcard systems with spaced repetition. The platform focuses on source-anchored flashcards, weak-spot analysis, and adaptive review flows to help students, professionals, and lifelong learners retain dense material effectively.

## Tech Stack Requirements
- **Frontend**: React with TypeScript, Vite, TailwindCSS
- **UI Components**: Radix UI primitives with custom styling
- **Routing**: React Router DOM
- **State Management**: React hooks (useState, useEffect, useContext)
- **Styling**: TailwindCSS with custom design system matching the landing page
- **Icons**: Lucide React
- **Animations**: Framer Motion for smooth transitions
- **Theme**: Dark/light mode support using next-themes

## Design System Requirements
- **Color Scheme**: Match the existing landing page design with neural grid backgrounds, glass morphism effects, and brutalist design elements
- **Typography**: Use the same font hierarchy as landing page (impact-lg, eyebrow, tracking-widest styles)
- **Components**: Glass cards with borders, scan line effects, clip-reveal animations
- **Layout**: Responsive design with mobile-first approach

## Main Dashboard Requirements

### Sidebar Navigation (IN THIS EXACT ORDER)
1. **Main Dashboard** - Overview with stats, progress charts, upcoming reviews
2. **Cards & Decks** - Flashcard management, deck creation, import/export
3. **AI Chat** - AI assistant for study help and content generation
4. **Lessons** - Structured learning paths and progress tracking
5. **Settings** - User preferences, account settings, study modes

### Main Dashboard Features
- **Stats Overview**: Cards studied today, streak counter, retention rate
- **Progress Charts**: Visual representation of learning progress using recharts
- **Upcoming Reviews**: List of cards due for review with priority indicators
- **Weak Spot Analysis**: Show topics needing attention with risk percentages
- **Quick Actions**: Start review session, create new deck, import materials
- **Study Mode Selector**: Foundation, Exam, Deep Work modes with intensity settings

### Cards & Decks Section
- **Deck Management**: Create, edit, delete, organize decks
- **Flashcard Editor**: Rich card creation with source anchoring
- **Import Features**: PDF, lecture notes, APKG file support
- **Export Options**: Download decks in various formats
- **Search & Filter**: Find cards quickly by content, tags, or deck
- **Bulk Operations**: Mass edit, move cards between decks

### AI Chat Interface
- **Study Assistant**: Help with understanding concepts
- **Content Generation**: Create flashcards from input material
- **Q&A Mode**: Answer questions about study materials
- **Voice Input**: Microphone integration for hands-free interaction
- **Chat History**: Persistent conversation history
- **Context Awareness**: Access to user's decks and study progress

### Lessons Section
- **Learning Paths**: Structured curriculum with milestones
- **Progress Tracking**: Visual progress bars and completion metrics
- **Lesson Content**: Interactive lessons with embedded flashcards
- **Quizzes & Tests**: Assessment tools with immediate feedback
- **Study Schedule**: Calendar integration for lesson planning
- **Performance Analytics**: Detailed reports on lesson completion

### Settings Page
- **Profile Settings**: User information, avatar, preferences
- **Study Preferences**: Default study mode, notifications, reminders
- **Privacy Settings**: Data export, account deletion, privacy controls
- **Appearance**: Theme selection, font sizes, accessibility options
- **Subscription**: Plan management, billing information
- **Advanced Settings**: API keys, integrations, experimental features

## Admin Dashboard Requirements

### Role-Based Access Control
- **Owner**: Full system access, user management, billing
- **CEO**: Strategic oversight, analytics, business metrics
- **Admin**: User management, content moderation, support
- **Moderator**: Content review, community management
- **Support**: Customer service, ticket management

### User Management Features
- **User Directory**: Search, filter, and view all users
- **Role Assignment**: Grant/revoke permissions and roles
- **User Analytics**: Usage patterns, engagement metrics
- **Account Actions**: Suspend, ban, reset passwords, delete accounts
- **Bulk Operations**: Mass email, role changes, data exports

### Admin Analytics
- **Platform Metrics**: Active users, new signups, retention rates
- **Content Statistics**: Deck creation, card generation, AI usage
- **Financial Dashboard**: Revenue, subscriptions, churn analysis
- **Performance Monitoring**: System health, API usage, error rates
- **User Behavior**: Feature usage, study patterns, drop-off points

### Content Moderation
- **Deck Review**: Review user-generated content for quality
- **AI Usage Monitoring**: Track AI API usage and costs
- **Report Management**: Handle user reports and appeals
- **Quality Control**: Automated and manual content quality checks

## Technical Implementation Details

### File Structure
```
src/
├── components/
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MainDashboard.tsx
│   │   ├── CardsDecks.tsx
│   │   ├── AIChat.tsx
│   │   ├── Lessons.tsx
│   │   └── Settings.tsx
│   ├── admin/
│   │   ├── AdminDashboard.tsx
│   │   ├── UserManagement.tsx
│   │   ├── RoleManager.tsx
│   │   ├── Analytics.tsx
│   │   └── ContentModeration.tsx
│   └── shared/
│       ├── GlassCard.tsx
│       ├── StatCard.tsx
│       └── ProgressBar.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useTheme.ts
│   └── useDashboard.ts
├── pages/
│   ├── Dashboard.tsx
│   └── Admin.tsx
└── styles/
    └── dashboard.css
```

### Key Components to Create
1. **DashboardLayout**: Main layout with sidebar and content area
2. **Sidebar**: Navigation component with exact order specified
3. **StatCard**: Reusable card for displaying metrics
4. **ProgressChart**: Chart component for learning analytics
5. **DeckCard**: Card component for deck management
6. **FlashcardEditor**: Rich editor for creating cards
7. **ChatInterface**: AI chat component with message history
8. **UserTable**: Admin table for user management

### State Management
- Use React Context for authentication and user data
- Local state for UI interactions and form data
- Consider React Query for server state management

### API Integration
- Design RESTful API endpoints for all dashboard features
- Implement proper error handling and loading states
- Use optimistic updates for better UX

### Responsive Design
- Mobile-first approach with collapsible sidebar
- Touch-friendly interactions for mobile devices
- Adaptive layouts for tablets and desktops

### Performance Considerations
- Implement lazy loading for heavy components
- Use React.memo for expensive components
- Optimize bundle size with code splitting
- Implement virtual scrolling for large lists

## Security & Privacy
- Implement proper authentication and authorization
- Secure API endpoints with proper validation
- Protect user data with encryption
- Implement audit logs for admin actions
- Follow GDPR and privacy regulations

## Testing Requirements
- Unit tests for all components
- Integration tests for user flows
- E2E tests for critical paths
- Accessibility testing

## Deployment Considerations
- Environment-specific configurations
- Proper CI/CD pipeline
- Monitoring and logging setup
- Backup and disaster recovery

## Success Metrics
- User engagement with dashboard features
- Reduced time to start studying
- Improved retention rates
- Admin efficiency in user management
- System performance and uptime

Create a masterpiece dashboard that combines beautiful design with powerful functionality, making AuraMind the premier learning platform for serious students and professionals.
