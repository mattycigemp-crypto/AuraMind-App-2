# AuraMind Android Keystore

> **This directory is gitignored.** The keystore, password, alias, and key password
> must NEVER be committed. They are sourced from environment variables at build
> time — see `auramind-gemini/android/app/build.gradle → signingConfigs.release`.

## 1. Generate the production upload keystore

Run from repo root (PowerShell or bash):

```bash
keytool -genkeypair \
  -keystore auramind-gemini/android/keystore/release.keystore \
  -alias auramind-upload \
  -keyalg RSA \
  -keysize 4096 \
  -validity 9125 \
  -dname "CN=CogniVect, OU=AuraMind, O=CogniVect Inc, L=San Francisco, ST=California, C=US" \
  -storepass "<your-store-password>" \
  -keypass "<your-key-password>"
```

- **Validity 9125 days = 25 years.** Google Play requires ≥ 25 years to cover
  the full lifespan of the uploaded APK/AAB.
- **RSA 4096.** Google recommends 4096 for new upload keys as of 2023.
- **Alias `auramind-upload`.** Matches the default name in `build.gradle`.
- **Distinguished name.** `O=CogniVect Inc` is the legal entity that owns the
  brand. Update if the company is later renamed or restructured.

You will be prompted for both passwords (or pass them via `-storepass` / `-keypass`
which is fine for CI).

## 2. Back the keystore up. Twice.

| Backup location | Why | Format |
|---|---|---|
| 1Password (shared vault, "Engineering — Android Signing") | Quick daily access; tied to team | Binary keystore file + alias + both passwords |
| Encrypted USB drive in a fireproof safe | Off-site, air-gapped, recoverable if 1Password is lost | Binary keystore file + alias + both passwords |
| Age-encrypted backup in private git repo (`auramind-internal/keys.git`) | Versioned history, audit trail | `age`-encrypted blob of keystore + plaintext alias + a hint for the password |

You **must** back up:
1. The keystore file itself (`release.keystore`).
2. The keystore password (store password).
3. The key alias (`auramind-upload`).
4. The key password (key password).
5. The full keytool command + arguments (so it can be recreated identically if
   needed).

Losing the keystore means you cannot upload updates to Google Play under
`com.auramind.app` — you'd need a new package name and start over.

## 3. Wire to CI/CD (GitHub Actions)

In the GitHub repo, go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_B64` | `base64 -w0 release.keystore` (single-line, no wrapping) |
| `ANDROID_KEYSTORE_PASSWORD` | The keystore password used in step 1 |
| `ANDROID_KEY_ALIAS` | `auramind-upload` |
| `ANDROID_KEY_PASSWORD` | The key password used in step 1 |

The `.github/workflows/mobile-android.yml` workflow reads all four and injects
them into the Gradle build at tag-push time.

## 4. Wire to a developer machine

Add to `~/.gradle/gradle.properties` (NOT the project — keep secrets out of git):

```properties
AURAMIND_KEYSTORE_PATH=/Users/you/keys/auramind/release.keystore
ANDROID_KEYSTORE_PATH=/Users/you/keys/auramind/release.keystore
ANDROID_KEYSTORE_PASSWORD=...
ANDROID_KEY_ALIAS=auramind-upload
ANDROID_KEY_PASSWORD=...
```

Or pass inline per-build:

```bash
ANDROID_KEYSTORE_PATH=/Users/you/keys/auramind/release.keystore \
ANDROID_KEYSTORE_PASSWORD=... \
ANDROID_KEY_ALIAS=auramind-upload \
ANDROID_KEY_PASSWORD=... \
npm run mobile:sign:android
```

## 5. Rotate vs. recover

**Rotation = bad.** Rotation means enrolling a new upload key with Google — possible
via the Play Console ("App signing → Upload key reset") but invasive: Google
reviews the request, and if approved, Google re-signs all existing installs. Only
do this if you're confident the existing key is compromised.

**Recovery = good.** Recovery means making a backup of the existing key. We back
the key up in three places (1Password, USB, encrypted git) precisely so you never
have to rotate.
