# 🚀 AuraMind MVP Execution Plan

**Created:** August 5, 2026 at 3:13 AM  
**Goal:** Ship billable MVP in 3 weeks (by August 25, 2026)  
**Current Rating:** 8.7/10 code quality, 6.5/10 launch readiness

---

## ✅ COMPLETED (Just Now)

1. **Font Optimization** - Optimized AuraSans from 8 files → 2 files (saved ~190KB)
   - Kept: Regular + Bold WOFF2 only
   - Removed: TTF fallbacks, Italic variants
   - File: `src/index.css` updated ✅

---

## 🔥 CRITICAL TASKS (Do These in Order)

### **WEEK 1: SIMPLIFICATION (Aug 5-11)**

#### **Day 1 - TODAY (Aug 5)**

**Task #21: Define Your Positioning** ⏰ 4-8 hours
```
CRITICAL DECISION: Who is AuraMind for?

Pick ONE target audience:
[ ] Medical students (USMLE/boards prep)
[ ] Language learners (Duolingo alternative)
[ ] College students (exam prep)
[ ] Professional certifications (CPA, bar exam)
[ ] General knowledge enthusiasts

Then write your 5-word positioning:
"_______________ for _______________ who _______________"

Example: "FSRS-powered flashcards for medical students who hate Anki"

ACTION: Write this down and update landing page headline
```

---

#### **Day 2 (Aug 6)**

**Task #22: Cut 80% of Features** ⏰ 2-4 hours

Open: `src/pages/dashboard/NovaHub.tsx`

KEEP these 5 routes only:
```tsx
<Route path="/" element={<NovaOverview />} />
<Route path="/decks" element={<NovaLibrary />} />
<Route path="/study/:deckId" element={<StudyModeRoute />} />
<Route path="/generator" element={<GeneratorPage />} />
<Route path="/settings" element={<SettingsPage />} />
```

COMMENT OUT (don't delete):
```tsx
{/* MVP: Deferred post-launch
<Route path="/analytics" element={<NovaAnalytics />} />
<Route path="/achievements" element={<NovaAchievements />} />
<Route path="/leaderboard" element={<NovaLeaderboard />} />
<Route path="/leagues" element={<LeaguesPage />} />
<Route path="/challenges" element={<NovaChallenges />} />
<Route path="/streak" element={<NovaStreak />} />
<Route path="/schedule" element={<NovaSchedule />} />
<Route path="/personalization" element={<NovaPersonalization />} />
<Route path="/marketplace" element={<MarketplacePage />} />
<Route path="/quiz" element={<QuizPage />} />
<Route path="/chat" element={<AIChatPage />} />
*/}
```

Test: Visit `http://localhost:3000/dashboard` and verify 5 pages work

---

#### **Day 3 (Aug 7)**

**Task #26: Consolidate Animation Libraries** ⏰ 3-5 hours

**Step 1: Remove GSAP + anime.js**
```bash
npm uninstall gsap @gsap/react animejs
```

**Step 2: Find and replace GSAP usage**
```bash
# Find all GSAP usage:
grep -r "gsap\|@gsap" src/

# Find all anime.js usage:
grep -r "anime" src/ --include="*.tsx" --include="*.ts"
```

**Step 3: Replace with Framer Motion**

For each file found, replace GSAP/anime animations with Framer Motion equivalents.

Common patterns:
```tsx
// BEFORE (GSAP):
gsap.to('.element', { opacity: 1, duration: 0.5 })

// AFTER (Framer Motion):
<motion.div animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
```

**Files likely affected:**
- `src/components/landing/ModernLandingPage.tsx`
- `src/lib/effects/` (custom effects)

Test after each file change.

---

**Task #24: Simplify State Management** ⏰ 4-6 hours

**Step 1: Create Zustand store**

Create `src/store/appStore.ts`:
```tsx
import { create } from 'zustand';
import { UserProfile, Deck, Card } from '../types';

interface AppStore {
  // User state
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  
  // Content state
  decks: Deck[];
  cards: Card[];
  setDecks: (decks: Deck[]) => void;
  setCards: (cards: Card[]) => void;
  
  // UI state
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  decks: [],
  cards: [],
  theme: 'dark',
  setUser: (user) => set({ user }),
  setDecks: (decks) => set({ decks }),
  setCards: (cards) => set({ cards }),
  setTheme: (theme) => set({ theme }),
}));
```

**Step 2: Replace Context providers**

In `App.tsx`:
- Remove `<DashboardWorkspaceProvider>`
- Replace with `useAppStore()` calls in components

**Step 3: Update components**
```tsx
// BEFORE:
const { user, decks } = useDashboardWorkspace();

// AFTER:
const user = useAppStore(state => state.user);
const decks = useAppStore(state => state.decks);
```

Test: Verify dashboard still loads correctly

---

#### **Day 4-5 (Aug 8-9)**

**Task #27: Simplify Landing Page** ⏰ 2-3 hours

Open: `src/components/landing/ModernLandingPage.tsx`

**Remove:**
- Scroll-synced SVG drawing (lines 204-219)
- Particle fields (line 223)
- Aurora drift animations (lines 226-239)
- Complex animation timelines

**Keep:**
- Hero section with one clear CTA
- 3 key benefits (FSRS, AI, UX)
- Simple pricing table
- Footer

**Make CTA obvious:**
```tsx
<button 
  onClick={() => navigate("/auth")}
  className="px-8 py-4 bg-[#7C3AED] text-white text-lg font-semibold rounded-xl"
>
  Start Studying Free →
</button>
```

Goal: Load in <1s, CTA visible immediately

---

### **WEEK 2: POLISH & VERIFY (Aug 12-18)**

#### **Day 6-7 (Aug 12-13)**

**Task #29: Verify Stripe Billing** ⏰ 4-6 hours

Test these flows:
1. Free signup → upgrade to Pro
2. Stripe checkout → success redirect
3. Webhook receives `checkout.session.completed`
4. User sees "Pro" status in dashboard
5. Subscription cancellation works

Files to check:
- `/api/stripe-webhook.ts` (already exists)
- `src/services/stripe/stripeWebhookService.ts`
- Settings page subscription UI

Test with Stripe test mode credit card: `4242 4242 4242 4242`

---

**Task #6: Bundle Optimization** ⏰ 3-4 hours

```bash
# Analyze current bundle
npm run analyze

# Check what's using space
npx vite-bundle-visualizer
```

Remove unused dependencies:
```bash
# Check if these are actually imported:
npm uninstall @mlc-ai/web-llm  # 84KB if not used
npm uninstall @react-three/fiber @react-three/drei  # if no 3D features active
npm uninstall three  # if removed above
npm uninstall lottie-react  # if no Lottie animations
```

Target: Reduce bundle from ~2.5MB → ~1.8MB

---

#### **Day 8-9 (Aug 15-16)**

**Task #30: Test User Journey** ⏰ 4-8 hours

Full end-to-end test:

1. **Landing page** → Click "Start Free"
2. **Signup** → Email verification
3. **Dashboard** → See welcome / sample deck
4. **Create deck** → Add 5 cards manually OR use AI generator
5. **Study session** → 
   - Flip card (Spacebar)
   - Rate (1-4 keys)
   - See next review date
   - Verify FSRS scheduling works
6. **Return next day** → See due cards
7. **Upgrade** → Stripe Pro checkout
8. **Verify Pro features** → Unlimited AI generation

**Fix any blockers immediately**

Mobile test:
- Open on iPhone/Android browser
- Test add to home screen (PWA)
- Verify touch gestures work

---

#### **Day 10 (Aug 17)**

**Task #31: Deploy to Production** ⏰ 2-4 hours

```bash
cd auramind-gemini
npm run build
vercel --prod
```

**Set environment variables in Vercel:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GROQ_API_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_PRICE_ID_MONTHLY`
- `VITE_STRIPE_PRICE_ID_ANNUAL`
- `STRIPE_SECRET_KEY` (backend)
- `STRIPE_WEBHOOK_SECRET` (backend)

**Post-deploy checklist:**
- [ ] Homepage loads
- [ ] Signup works
- [ ] Study session works
- [ ] Stripe checkout works
- [ ] Emails send (password reset)

---

### **WEEK 3: LAUNCH (Aug 19-25)**

#### **Day 11-12 (Aug 19-20)**

**Task #32: Find First 10 Customers** ⏰ Ongoing

**Reddit Launch:**
- r/Anki: "I built an Anki alternative with FSRS v5 (30% better retention)"
- r/GetStudying: "FSRS-powered flashcards that actually work"
- r/medicalschool (if targeting med students)
- r/languagelearning (if targeting language learners)

**Post template:**
```
Title: I built an Anki alternative with FSRS v5 for better retention

Hey r/Anki,

I'm a solo dev who spent [X] months building AuraMind because I was frustrated with [pain point].

What makes it different:
- FSRS v5 algorithm (30% better retention than Anki's SM-2)
- AI card generation (10x faster than manual)
- Modern UI that doesn't look like it's from 2006

It's free to try. Would love feedback from the community that taught me everything about SRS.

[Link]
```

---

#### **Day 13 (Aug 21)**

**Product Hunt Launch**

- Launch on Tuesday or Wednesday (best days)
- Prepare tagline: Your positioning from Task #21
- Upload 5-7 screenshots
- Gallery: Landing, Dashboard, Study Mode, AI Generator, Results
- First comment: Explain your story + ask for feedback

---

#### **Day 14-15 (Aug 22-23)**

**Direct Outreach**

Find 50 people in your target audience:
- Search Twitter for "Anki frustration" / "Quizlet doesn't work"
- Find study Discord servers
- Email med school study groups
- Language learning communities

**Cold email template:**
```
Subject: Tried Anki but [pain]? Built something different

Hi [Name],

Saw you're [studying for X]. Built a tool that might help.

It's like Anki but [key differentiator from your positioning].

Free to try: [link]

Would love 10 min of your time for feedback if you try it.

[Your name]
```

---

#### **Day 16-17 (Aug 24-25)**

**Follow-ups**
- Reply to Reddit comments
- Answer Product Hunt questions
- Follow up with email responses
- Track signups

**Goal:** 50-500 signups, 10 people willing to pay

---

### **WEEK 4+: ITERATE (Aug 26+)**

**Task #33: Interview Users Weekly** ⏰ 5-10 hours/week

Interview framework:
1. What problem were you trying to solve?
2. What did you try before AuraMind? (Anki? Quizlet?)
3. Why didn't that work?
4. What made you sign up?
5. What's missing?
6. Would you pay $8/month? Why/why not?

**Build what they ask for, not your roadmap.**

---

## 📊 SUCCESS METRICS

Track weekly:

| Metric | Week 1 | Week 2 | Week 3 | Week 4 |
|--------|--------|--------|--------|--------|
| Signups | 0 | 0 | 50-500 | +100 |
| Paying users | 0 | 0 | 10 | 20 |
| MRR | $0 | $0 | $80 | $160 |
| Day 2 retention | - | - | 50% | 60% |
| Day 7 retention | - | - | 30% | 40% |

---

## ❌ DEFERRED (Post-Revenue)

Don't work on these until you have 50+ paying customers:

- Task #9: Marketplace features
- Task #10: Accessibility audit
- Task #13: Performance monitoring
- Task #16: Additional state refactoring
- Admin panels (use Supabase dashboard)
- Mobile native apps (web PWA is enough)
- A/B testing framework
- Advanced analytics
- Revenue dashboards

---

## 🎯 YOUR DAILY WORKFLOW

Every day:
1. Pick ONE task from this plan
2. Set a timer (use the time estimate)
3. Work focused until done
4. Test what you built
5. Commit changes
6. Move to next task

Every week:
- Ship something users can see/use
- Interview 3-5 users
- Fix top pain point
- Ignore everything else

---

## 🏆 THE FINISH LINE

**By August 25, you will have:**
- ✅ 5 core pages that work
- ✅ Stripe billing that works
- ✅ Web PWA that works on mobile
- ✅ 50-500 signups
- ✅ 10 people willing to pay $8/month
- ✅ Validation that FSRS actually helps

**Then you build what paying customers ask for.**

Not your roadmap. Not your vision. What they'll pay for.

That's how Plausible got to $1M. That's how you'll get there too.

---

## 📞 NEED HELP?

If you get stuck on any task:
1. Check if the task is actually critical (probably isn't)
2. Search for examples in successful indie SaaS codebases
3. Ask specific technical questions (not "how do I build X")
4. Remember: shipped beats perfect

---

**START WITH TASK #21 TODAY (Aug 5)**

Open this file tomorrow morning. Execute one task at a time.

You've got 20 days to launch.

The clock is ticking. 🎯
