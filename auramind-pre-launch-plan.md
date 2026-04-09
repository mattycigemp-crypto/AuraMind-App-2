# AuraMind Pre-Launch & Scaling Technical Plan

We've categorized the massive strategic checklist into an actionable, phased technical roadmap. We will execute this using our 4-Phase methodology. Here is the breakdown of what we actually need to *build*:

## Phase 1: Core Product & UX Polish (The Foundation)
**Goal:** Ensure the app loads instantly, onboarding is seamless, and the core experience is frictionless.
1. **Performance Audit:** 
   - Optimize bundle size (Vite build optimization).
   - Implement dynamic imports / React.lazy for heavy routes (e.g., Auth, Dashboard vs. Admin).
   - Target `< 2 seconds` load time.
2. **Onboarding UX:** 
   - Streamline the first-time user experience to `< 3 steps`.
   - Ensure the "Core Action" (e.g., generating a deck or taking a study session) is exactly 1-tap away from the dashboard.
3. **Analytics Integration:**
   - Integrate Mixpanel or PostHog to track Day 1/Day 7 retention, Drop-off moments, and Core Action conversion rates.

## Phase 2: Retention Mechanics (The Habit Builder)
**Goal:** Give users a reason to return daily.
1. **Streaks & Insights:**
   - Extend the existing `streak` counter logic in Supabase `profiles`.
   - Build a visual "Daily Insights" or "Activity Heatmap" on the Dashboard.
2. **Push/Web Notifications:**
   - Implement web notifications (Service Workers or OneSignal) for study reminders ("Your AI noticed you forgot something...").
3. **Personalization Engine:**
   - Give the AI context on the user's past performance (leveraging their SRS scores) to make recommendations "smarter" and not just static generations.

## Phase 3: Monetization & Growth (The Paywall & Loops)
**Goal:** Ensure the paywall is perfectly timed and build viral mechanics.
1. **Strategic Paywall:**
   - Ensure the Stripe checkout validates free-tier usage before aggressively locking users out (maybe allow 1 free AI deck generation before paywall).
2. **Viral Loop (Referrals):**
   - Implement a "Share this Deck" feature allowing users to generate a public link to their deck.
   - Implement an "Invite Friends for Premium" referral program using Supabase tracking.

## Phase 4: Localization & Optimization (Scaling)
**Goal:** App Store Optimization and Internationalization.
1. **i18n Implementation:**
   - Integrate `react-i18next` for rapid localization (starting with Spanish, Portuguese, etc.).
   - Dynamically load language packs based on user browser locale.
2. **SEO & App Store Prep:**
   - Ensure landing page has perfect SEO tags (Meta, OpenGraph).
   - Prepare dynamic routes for SEO indexing on public "Shared Decks".
