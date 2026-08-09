# AuraMind — Apple App Store Listing

> **v1 copy approved for upload directly into App Store Connect.** Brand:
> AuraMind (CogniVect, Inc). Privacy + App Privacy Details answers are designed
> to align with what `src/services/` actually does — never claim data use you
> don't actually perform.

---

## Name (≤ 30 chars)
**AuraMind**

## Subtitle (≤ 30 chars)
**AI flashcards & memory**

## Promotional text (≤ 170 chars)
**Smart flashcards with FSRS spaced repetition. Drop a PDF, get a deck in 60 seconds. Personalizes to your memory so you remember more, study less.**

## Description

```
Stop cramming. Start retaining.

AuraMind uses FSRS — the modern spaced-repetition algorithm proven to retain
30% more per session than legacy Anki schedulers — to schedule the right
card at the right moment, every time.

WHAT YOU GET

• AI-generated flashcards — drop a PDF, video link, or topic; get a deck
  in under a minute.
• Personalized spaced repetition — the schedule reshapes itself around
  how YOU remember. The longer you use it, the less studying you need.
• Active recall + retrieval practice — proven to beat re-reading 2-3x.
• Offline-first — your decks live on your device; sync when you're online.
• Streaks, leagues, and friends — gentle, never burn-out pressure.
• Memory Palace + Flow Mode — turn hard topics into vivid mental
  walkthroughs; or enter distraction-free deep-study.
• Concept Maps — see how ideas in a deck connect.

PRIVACY

Decks stay on your device unless you opt-in to cloud sync. We use Sentry for
crash reports only and PostHog for product analytics — never to sell your
study data. Full policy: https://auramind.app/privacy.

MADE FOR STUDENTS WHO ACTUALLY STUDY

Med school (USMLE), law school (BAR), grad cumulative exams, language
learners — if you're willing to put in the work, AuraMind makes sure the
work sticks.
```

## Keywords (≤ 100 chars, comma-separated)
**flashcards,spaced repetition,FSRS,studying,memory,med school,USMLE,BAR,law school,learning**

## Support URL
`https://auramind.app/support`

## Marketing URL (optional)
`https://auramind.app`

## Privacy Policy URL
`https://auramind.app/privacy`

## What's new (per release)

```
• Smarter scheduling — your deck now adapts around how YOU remember.
• Memory Palaces — turn hard topics into vivid mental walkthroughs.
• Friend streaks and gentle leagues — study with others without losing focus.
• Faster deck creation — drop a PDF, get a deck in 60 seconds.
```

## App Privacy Details (App Store Connect)

Apple now requires per-capability answers. Use exactly the values below so the
App Store review reads as honest.

| Data type | Collected? | Linked to user? | Used for tracking? |
|---|---|---|---|
| Contact info — email | Yes (account creation) | Yes | No |
| Contact info — name | Optional (profile field) | Yes | No |
| User content — photos | Yes (optional avatar upload) | Yes | No |
| User content — audio | Yes (voice-recognition study mode) | Yes | No |
| Identifiers — user ID | Yes (internal only) | Yes | No |
| Usage data — product interaction | Yes (PostHog analytics) | Yes | No |
| Diagnostics — crash logs | Yes (Sentry) | No | No |
| Purchases | Yes (Stripe / App Store IAP) | Yes | No |

We do NOT collect from kids, do NOT sell data, do NOT use data for advertising
tracking.

## Age rating questionnaire (App Store Connect)

- Unrestricted web access: NO (we make ONE webview call to Stripe Checkout in-app; the rest is closed-loop to our backend).
- User-generated content: NO (decks stay on-device until user opts into cloud sync; then stored encrypted at rest in Supabase).
- Gambling: NO.
- Violence / sexual / drugs / profanity: NONE.

Expected rating: **4+ (no objectionable content)**.

## Graphics inventory

| Asset | Dimensions | Required? | Storage path |
|---|---|---|---|
| App icon | 1024×1024, no transparency, no rounded corners | YES | `store/graphics/ios/icon-1024.png` |
| iPhone 6.7" screenshot (iPhone 15 Pro Max) | 1290×2796 | YES, 3–10 | `store/graphics/ios/screenshots/iPhone-6.7/01..N.png` |
| iPhone 6.5" screenshot (iPhone 11 Pro Max) | 1242×2688 | Optional | `store/graphics/ios/screenshots/iPhone-6.5/01..N.png` |
| iPhone 5.5" screenshot (iPhone 8 Plus) | 1242×2208 | Optional | `store/graphics/ios/screenshots/iPhone-5.5/01..N.png` |
| iPad 12.9" screenshot | 2048×2732 | YES if listed Universal | `store/graphics/ios/screenshots/iPad-12.9/01..N.png` |
| iPad 11" screenshot (current gen) | 1668×2388 | Optional | `store/graphics/ios/screenshots/iPad-11/01..N.png` |
| App preview video | 1920×1080 (iPhone), 30s max | Optional | `store/graphics/ios/preview-30s.mp4` |

## Pre-launch checklist (iOS-specific)

- [ ] Xcode 16 + App Store Connect access verified
- [ ] Bundle ID `com.auramind.app` registered with App Store Connect
- [ ] Apple Developer Team ID stored in repository secrets
- [ ] Provisioning profile (App Store distribution) created for `com.auramind.app`
- [ ] Push Notifications capability enabled (requires APNs auth key)
- [ ] Keychain Sharing capability enabled (group.com.auramind.app)
- [ ] Camera/Microphone permissions declared (only what we use)
- [ ] `ITSAppUsesNonExemptEncryption=false` set (HTTPS-only)
- [ ] TestFlight internal upload passes Apple's automatic validation
- [ ] Internal Beta App Review (≥ 14 days if external testing)
- [ ] App Privacy Details filled in App Store Connect
- [ ] Age rating questionnaire complete
- [ ] Privacy + Terms URLs return 200
- [ ] Export compliance: ITSAppUsesNonExemptEncryption=false ⇒ skip annual self-classification
