# AuraMind Pre-Launch Checklist

> **Single source of truth for "are we ready to ship?"** Every box below must
> be ticked before either store submission. Items map directly to the boxes
> Apple + Google review teams check. Update this checklist with the date of
> each completion so we have an audit trail.

**Target first release date:** ___________

---

## 1. Branding & legal

- [ ] **Privacy policy URL returns 200** — `https://auramind.app/privacy`
- [ ] **Terms of service URL returns 200** — `https://auramind.app/terms`
- [ ] **Support URL returns 200** — `https://auramind.app/support` (or
      `mailto:hello@auramind.app` works)
- [ ] **Privacy policy lists**: CogniVect, Inc as operator; data collected
      (account email, optional profile photo, study progress, crash logs,
      Stripe-billing metadata); all third-party SDKs (Sentry, PostHog,
      Stripe); storage duration; user's rights under GDPR + CCPA; contact
      channel.
- [ ] **Terms of service lists**: subscription auto-renew, cancellation
      procedure, refund policy, prohibited content rules, limitation of
      liability (limited to CogniVect and its affiliates), jurisdiction.
- [ ] **Both pages render CogniVect footer** (the parent-company byline
      "AuraMind — a CogniVect product") at the bottom, with the year-frozen
      copyright line on the right.

## 2. Build artifacts

- [ ] Android AAB signed with the **production upload keystore**
      (`auramind-gemini/android/keystore/release.keystore`).
- [ ] Android `versionCode` increments by 1 every release.
- [ ] iOS IPA signed with **Apple Distribution** identity (not Ad Hoc,
      not Development).
- [ ] iOS `CFBundleShortVersionString` matches the marketing version
      (e.g., "1.0.0", "1.1.0").
- [ ] iOS `CFBundleVersion` is a positive integer ≥ previous build.
- [ ] Android target SDK ≥ 34 (we ship 36).
- [ ] iOS deployment target: 15.0+
- [ ] No leftover debug logs in release AAB (verify with `adb logcat`
      on a sideloaded release build — there should be no `console.log`.
      We use Sentry's `beforeSend` stripper to strip browser debug logs.)
- [ ] ProGuard / R8 mapping file uploaded to Crashlytics / Sentry for
      symbolicated crashes.

## 3. Capabilities & permissions

- [ ] Android: `INTERNET` permission declared
      (already in `AndroidManifest.xml`).
- [ ] Android: Push Notifications permission declared IF google-services.json
      is present; the build script auto-applies the plugin when present.
- [ ] iOS: `NSFaceIDUsageDescription` set (we set this in our updated
      Info.plist — for `NativeBiometric`).
- [ ] iOS: `NSMicrophoneUsageDescription` set
      (we set this — for `useSpeechRecognition`).
- [ ] iOS: `NSSpeechRecognitionUsageDescription` set
      (iOS 17+ requirement).
- [ ] iOS: `ITSAppUsesNonExemptEncryption=false`
      (HTTPS-only, no annual ERN filing required).
- [ ] iOS: `aps-environment` entitlement set (development for TestFlight,
      production for App Store upload).
- [ ] iOS: `keychain-access-groups` set to `group.com.auramind.app` for
      biometric credential persistence.

## 4. TestFlight / Internal Testing

- [ ] TestFlight internal testers added (Apple IDs from team members).
- [ ] TestFlight internal build smoke-tested ≥ 14 days.
- [ ] Google Play Internal Testing track has ≥ 5 internal testers.
- [ ] Internal Testing track has been running ≥ 14 days with no P0 bugs.
- [ ] At least 5 distinct real-device installs (mixed Pixel + Samsung + iPhone).

## 5. Store listings

### Apple App Store Connect

- [ ] App name "AuraMind" entered.
- [ ] Subtitle ≤ 30 chars (e.g., "AI flashcards & memory").
- [ ] Promotional text ≤ 170 chars.
- [ ] Description copy from `store/ios/listing.md` pasted.
- [ ] Keywords pasted (≤ 100 chars).
- [ ] Privacy + support + marketing URLs all set.
- [ ] App Privacy Details filled (see `store/ios/listing.md` table).
- [ ] Age rating questionnaire complete.
- [ ] iPhone 6.7" screenshots uploaded (3+).
- [ ] iPhone 6.5" screenshots uploaded (3+).
- [ ] iPad 12.9" screenshots if "Designed for iPad" published.
- [ ] App icon 1024×1024 uploaded (no transparency).
- [ ] Pricing set to Free.
- [ ] IAP products published (AuraMind Premium subscription).
- [ ] Build selected and submitted to App Review.

### Google Play Console

- [ ] App name "AuraMind" entered.
- [ ] Short + long description from `store/android/listing.md` pasted.
- [ ] Phone screenshots uploaded (4+).
- [ ] Tablet screenshots uploaded (2+).
- [ ] Feature graphic 1024×500 uploaded.
- [ ] App icon 512×512 uploaded (with adaptive icon foreground).
- [ ] Privacy policy URL set.
- [ ] Content rating (IARC) questionnaire complete.
- [ ] Data safety form accurate (we collect: account email, optional name,
      optional profile photo, study progress, crash logs, billing metadata).
- [ ] Target audience 13+ selected.
- [ ] Pricing Free, in-app products configured.
- [ ] Closed Testing → Production release submitted.

## 6. Operational readiness

- [ ] Stripe webhook endpoint live + verified.
- [ ] Sentry crash reporting live + verified (test crash on TestFlight).
- [ ] PostHog analytics live + verified (test event lands).
- [ ] Error budget alert wired (e.g., Sentry PagerDuty).
- [ ] On-call rotation documented (one human responsible for launches).
- [ ] Runbook (this file!) up to date with each launch.

## 7. Final go/no-go

- [ ] All "P0" bugs from Internal Testing closed.
- [ ] No crashlytics signal during last 7-day Internal Testing window.
- [ ] Marketing website updated with current screenshots.
- [ ] Email blast drafted (or skipped if silent launch).
- [ ] Twitter post drafted.
- [ ] App Store / Play Store links recorded for analytics attribution.
- [ ] Date of release: _____________

**Sign-off:**

- Engineering: ___________________________
- Product: ___________________________
- Design: ___________________________
