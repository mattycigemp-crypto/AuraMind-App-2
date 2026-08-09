# AuraMind Screenshot Manifest

> **Master list of screenshots required for App Store + Play Store submission.**
> Generate from a working app build (TestFlight build for iOS, Internal Testing
> APK for Android), not from staging. Apple reviewers reject screenshots that
> say "Demo", "Lorem Ipsum", or show beta features not in the binary.

## Auto-capture (recommended)

Use **Fastlane Snapshot** so screenshots stay consistent across releases:

```bash
# Once, on a machine with iOS Simulator + Android Emulator installed
cd auramind-gemini
bundle exec fastlane snapshot

# Or per-device (iOS only)
xcrun simctl create "iPhone 15 Pro Max" "iPhone 15 Pro Max"
bundle exec fastlane ios screenshots
```

The script walks the four canonical screens, takes one screenshot per device,
and dumps them into `store/graphics/{platform}/screenshots/`.

## Manual capture (single device, single feature)

1. Build the app for the right platform (`npm run build:android` /
   `npm run build:ios`).
2. Pick **4 canonical screens** + **2 "wow" moments**:

   | # | Screen | Why |
   |---|---|---|
   | 1 | Home dashboard | First impression — shows recent decks, streak, AFK timers |
   | 2 | Active study session | Shows that cards actually move (FSRS scheduler) |
   | 3 | AI deck creation | Wedge feature — shows "drop a PDF, get a deck in 60 seconds" |
   | 4 | Profile / personalization | Forerunner differentiator — shows the personalized FSRS weights |
   | 5 | Memory Palace (mobile) | Headline win — visual that you can't get from Anki |
   | 6 | Flow Mode (mobile) | Headline win — distraction-free deep-study |

3. Press **Shift+Cmd+5** (Mac) or `adb exec-out screencap -p` (Android) at each.
4. Drop into the right `store/graphics/{platform}/screenshots/...` folder.

## Required sizes

### iOS (Apple App Store Connect)

| Device | Required? | Pixel size | Orientation |
|---|---|---|---|
| iPhone 6.7" (iPhone 15 Pro Max, current flagship) | YES — 3–10 PNG, no transparency | 1290×2796 | Portrait |
| iPhone 6.5" (iPhone 11 Pro Max, last-gen flagship) | Recommended — 3–10 | 1242×2688 | Portrait |
| iPhone 5.5" (iPhone 8 Plus, fallback for older devices) | Recommended — 3–10 | 1242×2208 | Portrait |
| iPad 12.9" (current iPad Pro) | YES if "Designed for iPad" is YES | 2048×2732 | Portrait or landscape |
| iPad 11" (current iPad Air) | Recommended — 3–10 | 1668×2388 | Portrait or landscape |

### Android (Google Play Console)

| Format | Required? | Pixel size | Notes |
|---|---|---|---|
| Phone screenshots | YES — 2–8 PNG/JPG | min 320, max 3840 | All modern sizes snap-fit |
| 7" tablet screenshots | Recommended — 2–8 | min 320, max 3840 | Helps with tablet search ranking |
| 10" tablet screenshots | Recommended — 2–8 | min 320, max 3840 | Helps with tablet search ranking |
| Feature graphic | YES — 1 | 1024×500 | Top banner on Play Store listing |
| App icon (round) | YES — 1 | 512×512 | Adaptive icon: 108×108 dp foreground |
| Promo video | Optional — 1 | 1920×1080, ≤ 30s | MP4, plays in Play Store and standalone |

## Localization

For v1 we ship English-only on the stores. Localizing screenshots is a v1.1
follow-up (ROADMAP.md task). Re-shoot the screenshots per locale once
`@capacitor/local-notifications` + `i18next` round-trip is fully wired.

## Don't include these in screenshots

- Real user data (avatars that look real, names, etc.). Use placeholder
  DiceBear avatars.
- Trial banners ("Free for 30 days") — Apple rejects anything that implies
  promotion beyond the binary's actual IAP.
- Beta / dev flags in the URL bar, dev server port numbers, etc.
- "Lorem ipsum" text. Looks unprofessional and the reviewer will bounce.
- Screens that say "Coming soon" — either ship the feature or remove the
  screenshot.

## Checklist (paste into your release PR)

- [ ] All iPhone 6.7" screenshots captured (3+)
- [ ] All iPhone 6.5" screenshots captured (3+) — if budget allows
- [ ] iPad 12.9" screenshots captured (3+) — if "Designed for iPad" marketed
- [ ] All Android phone screenshots captured (4+)
- [ ] Feature graphic 1024×500 PNG ≤ 1 MB
- [ ] App icon 1024×1024 PNG (iOS, no transparency, no rounded corners)
- [ ] App icon 512×512 PNG + adaptive icon foreground 108×108 dp (Android)
- [ ] Promo video optional — 30s, 1920×1080
- [ ] Screenshots reviewed against "Don't include" list above
- [ ] Drop all finalized assets into `store/graphics/{platform}/screenshots/...`
