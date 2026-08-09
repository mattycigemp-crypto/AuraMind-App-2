# M6 Store Submission — operator playbook

This doc is the single-page checklist for everything you, the maintainer,
must provision *outside* the codebase before the first production cut of
AuraMind. Pair it with the M5 platform hardening + the brand surface
shipped in `lib/branding.ts`.

The release pipeline is fully wired and `npm run mobile:check-env
--with-play --with-asc --with-match` will tell you at a glance what
secret is missing. The pieces marked **🟠 MUST provision** will block
upload to the respective store. Items marked **🟡 optional** unlock
better UX but a non-signed/missing-config build still works.

---

## 1. GitHub repo secrets (Settings → Secrets and variables → Actions)

All secrets are encrypted at rest and only exposed to jobs that
declare `secrets:` access. None of these values should land in this
repo, in commit history, or in a notes tool.

| Secret                                       | Used by                                  | Required for             |
|----------------------------------------------|------------------------------------------|--------------------------|
| 🟠 `TAURI_PRIVATE_KEY`                       | release.yml, release-tauri.yml           | Tauri updater signing key (.key base64) |
| 🟠 `TAURI_KEY_PASSWORD`                      | release.yml, release-tauri.yml           | Tauri updater key password |
| 🟠 `ANDROID_KEYSTORE_B64`                    | mobile-android.yml                       | Android release keystore (base64) |
| 🟠 `ANDROID_KEYSTORE_PASSWORD`               | mobile-android.yml                       | Android keystore password |
| 🟠 `ANDROID_KEY_ALIAS`                       | mobile-android.yml                       | Android key alias (e.g. `auramind-release`) |
| 🟠 `ANDROID_KEY_PASSWORD`                    | mobile-android.yml                       | Android key password |
| 🟠 `PLAY_STORE_SERVICE_ACCOUNT_JSON`         | mobile-android.yml                       | Google Play API service-account JSON |
| 🟠 `APPLE_CERTIFICATE`                       | release.yml, release-tauri.yml           | Apple Developer ID .p12 (base64) |
| 🟠 `APPLE_CERTIFICATE_PASSWORD`              | release.yml, release-tauri.yml           | Apple .p12 export password |
| 🟠 `APPLE_SIGNING_IDENTITY`                  | release.yml, release-tauri.yml           | `Developer ID Application: CogniVect, Inc. (TEAMID)` |
| 🟠 `APPLE_ID`                                | mobile-ios.yml                           | Apple ID email owner of App Store Connect |
| 🟠 `APPLE_TEAM_ID`                           | mobile-ios.yml                           | Apple Developer 10-char team ID |
| 🟠 `APPLE_ITC_TEAM_ID`                       | mobile-ios.yml                           | Apple App Store Connect team ID |
| 🟠 `ASC_API_KEY_PATH`                        | mobile-ios.yml                           | Path to .p8 API key inside the macOS-14 runner (workspace-cached) |
| 🟠 `MATCH_GIT_URL`                           | mobile-ios.yml                           | git URL of your `match` cert repo (private) |
| 🟠 `MATCH_PASSWORD`                          | mobile-ios.yml                           | `match` repo encryption password |
| 🟠 `MATCH_GIT_BASIC_AUTHORIZATION`            | mobile-ios.yml                           | base64 "user:token" for HTTPS access to the match repo |
| 🟡 `WINDOWS_CERTIFICATE`                     | release.yml, release-tauri.yml           | Windows code-signing .pfx (base64) — required only for Windows |
| 🟡 `WINDOWS_CERTIFICATE_PASSWORD`            | release.yml, release-tauri.yml           | Windows .pfx password |

Provisioning order:
1. Generate the local Tauri keypair first (`npx @tauri-apps/cli signer
   generate --write`). Add the printed pubkey to `tauri.conf.json →
   plugins.updater.pubkey`. Base64-encode the .key file. Store both
   values in a password manager (1Password, Bitwarden) AND set the
   corresponding GitHub secrets.
2. Generate the Android release keystore. **Backup is irreplaceable**;
   losing the keystore means you cannot upload updates to the existing
   Play listing. Keep two offline copies.
3. Generate the Apple Developer ID Application .p12. Export from
   Keychain Access → Developer ID Application → Export. .p12 is
   password-protected; both are secrets.
4. Generate the Apple App Store Connect API key (.p8 + Key ID +
   Issuer ID). The API key file itself goes in a separate private
   storage; ASC_API_KEY_PATH points to its location on the CI runner.
5. Stand up the `match` repo: a separate *private* git repo named
   `auramind-ios-certs` (or similar). Push with a single commit so
   `match nuke match_appstore` can wipe + re-install cleanly.
6. Optional: stand up Azure Trusted Signing or purchase a Windows EV
   certificate. Without it, SmartScreen warns users on first launch
   but the binary still works.

---

## 2. Apple App Store Connect

### 2.1 Create the app record

1. https://appstoreconnect.apple.com → My Apps → "+ New App".
2. Bundle ID: select `com.auramind.app` (created at the Developer Portal
   with the "Push Notifications" + "App Groups" capabilities if you
   intend to add either).
3. Primary Language: English (U.S.).
4. SKU: `AuraMind-2-0-0`. Tracked in Appfile.
5. User Access: owner = `APPLE_ID`.

### 2.2 Submit metadata once (or run `bundle exec fastlane ios metadata_only`)

`fastlane/metadata/en-US/*.txt` is the source of truth — `fastlane deliver`
syncs it into ASC on the next `release` lane.

- **Name**: AuraMind (30 char cap, exact)
- **Subtitle**: Study smarter, not longer
- **Privacy URL**: https://auramind.app/privacy
- **Marketing URL**: https://auramind.app
- **Support URL**: https://auramind.app/docs
- **Copyright**: © CogniVect, Inc.
- **Developer Name**: CogniVect, Inc. — set at ASC account level
- **App Review Notes**: see `fastlane/metadata/review_information/notes.txt`
- **Demo Account**: see `fastlane/metadata/review_information/demo_user.txt`

### 2.3 Submit the first build

```
bundle exec fastlane ios release
```

`deliver` reads the metadata, `gym` builds a production-quality binary,
`pilot` uploads to TestFlight (internal + external). Once it's
processed (typically 5–15 minutes), the build appears in ASC. Click
the build → "Submit for Review" → wait for Apple.

### 2.4 Expected review timeline

- Initial App Review submission: 24–48 hours typical.
- Subsequent updates: 12–24 hours typical.

---

## 3. Google Play Console

### 3.1 Create the app record

1. https://play.google.com/console → All apps → Create app.
2. App name: AuraMind
3. Default language: English (United States)
4. App or game → App
5. Free or paid: Free

### 3.2 Service-account JSON for API uploads

1. Google Cloud Console → IAM & Admin → Service Accounts → Create.
2. Grant the "Service Account User" role on the **Play Internal Apps
   Admin** (or the new release-management role once migrated).
3. Create a JSON key. Download + store in a password manager.
4. In Play Console → Setup → API access → Link the service account.

### 3.3 First track upload (internal testing → production)

`store/android/changelogs/en-US.txt` is the changelog fed to
`fastlane supply` on every `r0adkll/upload-google-play` invocation.
The circle of trust:

1. Build → push to **internal testing** track.
2. Roll out to internal testers. Verify end-to-end against the Maven
   crash + the AI deck flow.
3. Promote internal → closed beta → production with 10% → 50% → 100%
   staged rollout.

### 3.4 Play Store listing fields

`store/android/listings/en-US/full_description.txt` syncs on every CI
build. The values map (Play → mint → asciidoc):

- **App name**: 30 char cap, exact "AuraMind"
- **Short description**: 80 char cap
- **Full description**: 4000 char cap
- **App icon**: 512×512 PNG (also auto-generates adaptive from supplied
  foreground/background)
- **Feature graphic**: 1024×500 PNG
- **Screenshots**: 2–8 phone (320–3840px), 2–8 tablet (7"+ and 10"+)

---

## 4. Tauri Updater service (releases.cogniavect.app)

The Cloudflare Worker at `cloudflare-worker/update.js` proxies GitHub
Releases into the Tauri updater protocol.

### 4.1 DNS

Point `releases.cogniavect.app` CNAME to the Worker's default
`*.workers.dev` subdomain (Cloudflare auto-creates this).

### 4.2 Worker secrets

None required for public GitHub releases. If you later bump past the
60 req/hr/IP public-API rate, add:

```bash
cd cloudflare-worker
wrangler secret put GITHUB_TOKEN
# paste a GitHub PAT with `public_repo` scope
```

### 4.3 Regenerating the Tauri updater keypair

See `src-tauri/BUNDLE-CONFIG-NOTES.md` §1. The maintenance burden is
lowest if the keypair is regenerated in a single, documented event and
stored in the password manager. The corresponding pubkey in
`tauri.conf.json → plugins.updater.pubkey` MUST match.

---

## 5. Pre-flight check (everything in one place)

From `auramind-gemini/scripts/check-mobile-env.js`:

```bash
# Android only (cheapest minimal check):
node scripts/check-mobile-env.js

# Android + Play Store upload:
node scripts/check-mobile-env.js --with-play

# iOS / App Store Connect:
node scripts/check-mobile-env.js --with-fastlane --with-asc --with-match
```

The script never prints secret values. It verifies file-existence and
plausible shape (length, prefix, JSON marker) and exits 0 when all
required items are present.

---

## 6. Routine cadence after launch

| Action                                           | Cadence      |
|--------------------------------------------------|--------------|
| Upload a maintenance AAB to Play Internal         | Every release |
| Run `fastlane ios metadata_only` after copy edits | Whenever      |
| Audit the match repo for cert expiry             | Quarterly     |
| Check reviewer response time on App Store        | Per release  |
| Renew Apple Developer Program membership          | Annually ($99) |
| Regenerate supabase JWT signing keys              | Quarterly    |
