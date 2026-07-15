# AuraMind Mobile Publishing Guide

This guide covers everything needed to publish the AuraMind Capacitor app to the Apple App Store and Google Play Store.

---

## Prerequisites

### Accounts

| Store | Cost | Setup Time | Notes |
|-------|------|------------|-------|
| Apple Developer Program | $99 / year | 24–48 hrs (enrollment review) | Required for any iOS distribution |
| Google Play Console | $25 one-time | Instant | Requires Google account |

### Environment

- **Node.js** ≥ 18
- **Xcode** 16+ (macOS only — iOS builds)
- **Android Studio** (with SDK 34+)
- **JDK 17+** (for Android builds / keytool)

---

## 1. Android Publishing

### 1.1 Generate a Production Keystore

The debug keystore (used for development) is at `android/keystore/debug.keystore`.
For production, generate a **release keystore** — do NOT reuse the debug keystore.

```powershell
# From repo root
keytool -genkey -v -keystore android/keystore/release.keystore `
  -alias auramind-release `
  -keyalg RSA -keysize 2048 -validity 10000
```

**You will be prompted for:**
- Keystore password (store in a password manager!)
- Key password (can match keystore password)
- Distinguished name fields (CN, OU, O, L, ST, C)

**⚠️ BACK THIS UP.** Losing the release keystore means you cannot upload updates
to Google Play — you'd need to create a new app with a new package name.

### 1.2 Update Capacitor Config

After generating, update `capacitor.config.ts`:

```ts
android: {
  buildOptions: {
    keystorePath: 'android/keystore/release.keystore',
    keystoreAlias: 'auramind-release',
    keystorePassword: '<your-password>',
    keyPassword: '<your-password>',
  },
},
```

For CI/CD, inject these via environment variables instead of hardcoding.

### 1.3 Build Release AAB

```bash
npm run build:android
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

> Google Play requires the **Android App Bundle (AAB)** format since August 2021.
> APK is also accepted but AAB is strongly recommended.

### 1.4 Google Play Console Setup

1. Go to [Google Play Console](https://play.google.com/console/)
2. Create a new app (or use existing)
3. Fill in **Store listing**:
   - App name (≤ 30 chars): "AuraMind"
   - Short description (≤ 80 chars)
   - Full description (≤ 4000 chars)
   - Screenshots: 2–8 phone + 2–8 tablet (min 320px, max 3840px)
   - Feature graphic: 1024×500
   - App icon: 512×512 (with 1024×1024 adaptive icon)
   - Privacy policy URL: `https://auramind.app/privacy`
4. Complete **Content rating** questionnaire (IARC)
5. Set **Pricing & distribution** (free or paid)
6. Upload AAB under **Production → Release → Create new release**
7. Roll out: 10% → 50% → 100% staged rollout

### 1.5 Android-Specific Gotchas

- **Push Notifications**: Requires `google-services.json` from Firebase Console.
  Place it in `android/app/`. The build script auto-detects it.
- **ProGuard / R8**: Enable minification for production:
  ```gradle
  release {
    minifyEnabled true
    proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
  }
  ```
- **App Signing**: Google Play manages app signing key by default (Play App Signing).
  Upload the upload key (the keystore above). Google signs for distribution.

---

## 2. iOS Publishing

### 2.1 Prerequisites

- macOS (required for Xcode)
- Apple Developer account ($99/yr)
- Xcode 16+ installed from Mac App Store

### 2.2 Build for Archive

```bash
npm run build:ios
```

This:
1. Runs `npm run build` (Vite web build)
2. Syncs web assets to `ios/`
3. Opens `ios/App/App.xcworkspace` in Xcode
4. From Xcode: **Product → Archive**

Or manually:

```bash
npm run build:mobile
# Open ios/App/App.xcworkspace in Xcode
# Select Any iOS Device (or Generic iOS Device) as target
# Product → Archive
```

### 2.3 App Store Connect Setup

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Create a new app (Bundle ID: `com.auramind.app`)
3. Fill in app information:
   - Name, subtitle, privacy policy URL
   - App icon (1024×1024, no transparency)
   - Screenshots: 6.7″ iPhone 15 Pro Max + 12.9″ iPad Pro
   - App preview video (30s max — optional but recommended)
4. Set pricing and availability

### 2.4 Distribute via Xcode

1. After **Product → Archive**, the Organizer window opens
2. Click **Distribute App**
3. Choose **App Store Connect** → **Upload**
4. Select distribution options:
   - Include bitcode for iOS? (No — deprecated)
   - Strip Swift symbols (Yes)
   - Upload your app's symbols (Yes — for Crashlytics)
5. Click **Upload**

### 2.5 TestFlight

1. In App Store Connect, enable TestFlight
2. Add internal testers (Apple ID emails)
3. Add external testers (requires Beta App Review — 1–2 days)
4. Distribute build to testers
5. Run through the full flow before final submission

### 2.6 Submit for Review

1. In App Store Connect, go to the build
2. Add review notes (test accounts, special instructions)
3. Submit for review (24–48 hours typical)
4. Monitor status in App Store Connect

### 2.7 iOS-Specific Gotchas

- **Export Compliance**: AuraMind uses encryption (HTTPS). You'll need to submit
  an ERN (Exemptions Registration Number) or complete the annual self-classification.
- **Push Notifications**: Requires APNs certificate or key in Apple Developer portal.
  Enable "Push Notifications" capability in Xcode.
- **Info.plist keys**: Camera, microphone, FaceID usage descriptions must be set.

---

## 3. Screenshot Requirements

### iOS

| Device | Screen Size | Orientation | Requirements |
|--------|-------------|-------------|--------------|
| iPhone 15 Pro Max | 6.7″ (1290×2796) | Portrait | 1–10 screenshots |
| iPad Pro 12.9″ | 12.9″ (2048×2732) | Portrait/Landscape | 1–10 screenshots |

Use [AppScreens](https://appscreens.com) or [Fastlane screenshot](https://docs.fastlane.tools/getting-started/ios/screenshots/) for automation.

### Android

| Format | Size | Notes |
|--------|------|-------|
| Phone screenshots | Min 320px, max 3840px | 2–8 required |
| Tablet screenshots | Same constraints | 2–8 (for 7″+ and 10″+ tablets) |
| Feature graphic | 1024×500 | Used in search results |
| App icon (round) | 512×512 | Adaptive: 108×108 dp foreground |
| Promo video | 1920×1080 | Optional, ≤ 30s |

---

## 4. Build Automation with Fastlane

Fastlane automates screenshot capture, code signing, beta deployment, and release.

### Setup

```bash
gem install fastlane
cd ios && fastlane init
cd ../android && fastlane init
```

### Example Fastfile (`ios/fastlane/Fastfile`)

```ruby
default_platform(:ios)

platform :ios do
  desc "Build and upload to TestFlight"
  lane :beta do
    sync_code_signing
    build_app(scheme: "App")
    upload_to_testflight
  end

  desc "Build and upload to App Store"
  lane :release do
    sync_code_signing
    build_app(scheme: "App", configuration: "Release")
    upload_to_app_store
  end
end
```

### Example Fastfile (`android/fastlane/Fastfile`)

```ruby
default_platform(:android)

platform :android do
  desc "Build and upload to Google Play Internal Testing"
  lane :beta do
    gradle(task: "bundleRelease")
    upload_to_play_store(track: "internal")
  end

  desc "Build and upload to Google Play Production"
  lane :release do
    gradle(task: "bundleRelease")
    upload_to_play_store(track: "production")
  end
end
```

---

## 5. CI/CD with GitHub Actions

Create `.github/workflows/mobile-release.yml`:

```yaml
name: Mobile Release

on:
  release:
    types: [published]

jobs:
  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: 17
      - run: npm ci
      - run: npm run build
      - run: npx cap sync android
      - name: Build Android AAB
        env:
          ANDROID_KEYSTORE: ${{ secrets.ANDROID_KEYSTORE }}
          ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
        run: cd android && ./gradlew bundleRelease
      - uses: actions/upload-artifact@v4
        with:
          name: android-release
          path: android/app/build/outputs/bundle/release/app-release.aab

  ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - run: npx cap sync ios
      - name: Build & upload iOS
        env:
          APP_STORE_CONNECT_USERNAME: ${{ secrets.ASC_USERNAME }}
          APP_STORE_CONNECT_PASSWORD: ${{ secrets.ASC_APP_SPECIFIC_PASSWORD }}
        run: |
          cd ios
          xcodebuild -workspace App/App.xcworkspace \
            -scheme App \
            -configuration Release \
            -archivePath App.xcarchive \
            archive
          xcodebuild -exportArchive \
            -archivePath App.xcarchive \
            -exportPath ./build \
            -exportOptionsPlist ExportOptions.plist
```

Store secrets in GitHub repo **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `ANDROID_KEYSTORE` | Base64-encoded release keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias |
| `ANDROID_KEY_PASSWORD` | Key password |
| `ASC_USERNAME` | Apple ID email |
| `ASC_APP_SPECIFIC_PASSWORD` | App-specific password |
| `MATCH_PASSWORD` | (if using fastlane match) |

---

## 6. Pre-Launch Checklist

- [ ] App icons generated for all required sizes
- [ ] Screenshots captured for all device form factors
- [ ] Privacy policy page live and linked
- [ ] Terms of service page live and linked
- [ ] Support URL (email or website) configured
- [ ] TestFlight internal testing completed
- [ ] Google Play internal testing completed
- [ ] Crash reporting (Firebase/Sentry) integrated
- [ ] Analytics (PostHog/Mixpanel) verified working
- [ ] Deep links / universal links configured
- [ ] CI/CD pipeline tested end-to-end
- [ ] App metadata translated (if multi-language)
- [ ] Rating & review prompt deferred (≥ 3 sessions)
- [ ] Subscription / IAP products configured (if applicable)

---

## 7. Post-Launch

- Monitor crash reports in Firebase Crashlytics / Sentry
- Watch App Store Reviews & Google Play Ratings (reply within 1–2 days)
- Plan regular update cadence (every 2–4 weeks)
- Update screenshots when UI changes significantly
- Renew Apple Developer membership annually ($99)

---

## Reference

| Item | Link |
|------|------|
| Capacitor Docs | https://capacitorjs.com/docs |
| Fastlane Docs | https://docs.fastlane.tools |
| Apple Developer | https://developer.apple.com |
| App Store Connect | https://appstoreconnect.apple.com |
| Google Play Console | https://play.google.com/console |
| Firebase Console | https://console.firebase.google.com |
| AuraMind Web App | https://auramind.app |
