# Tauri Bundle Config — operator notes

This file documents how `tauri.conf.json`, `Cargo.toml`, and the signing
infrastructure map to each other for AuraMind's M6 store submission.
The JSON/TOML files themselves cannot carry commentary (JSON forbids
comments; TOML is too dense) — so the operator-facing notes live here.

---

## 1. Updater public key (`plugins.updater.pubkey`)

The pubkey currently in `tauri.conf.json` is a placeholder. Before the
first production release, regenerate it from a **fresh** minisign key
pair so the updater plugin can verify Tauri-built binaries that the
release pipeline signs.

```bash
# 1. Generate a new key pair (only on a developer machine, never CI):
npx @tauri-apps/cli@^2 signer generate --write
# ^ saves /Users/<you>/.tauri/auramind.key and prints the pubkey.

# 2. Encode the .key file as base64 for the TAURI_PRIVATE_KEY secret:
base64 -i ~/.tauri/auramind.key | tr -d '\n' > auramind.key.b64

# 3. Update .github/workflows/<release.yml> secrets:
#    - TAURI_PRIVATE_KEY   = contents of auramind.key.b64
#    - TAURI_KEY_PASSWORD  = the password you set in step 1

# 4. Replace the `plugins.updater.pubkey` field in tauri.conf.json with
#    the printed pubkey string.

# 5. Re-run `sign-tau-update.mjs --signature ...` against a test asset
#    to confirm the round-trip verifies before shipping.
```

If the pubkey in `tauri.conf.json` doesn't match the private key in
GitHub Actions, every update prompt silently fails with a signature
mismatch. The `scripts/sign-tau-update.mjs` script is on the same
keypair as Tauri-action's auto-generated `.sig` files, so a mismatch
will surface immediately in the CI log.

---

## 2. macOS signing (`bundle.macOS.*`)

`signingIdentity`  — leave `null` when developing locally; set from
  the `APPLE_SIGNING_IDENTITY` env var via the tauri-action workflow.

`providerShortName` — set to `"CogniVect, Inc."` (matches your Apple
  Developer Team registered name). Update this string if CogniVect
  ever changes its legal name on the Apple developer account; the
  notarization upload will reject a mismatch.

`entitlements`  — leave `null` for v1 to use Apple's default sandbox-
  free notarization. Add an entitlements plist here only if the app
  needs Hardened-Runtime exceptions (e.g. JIT, microphone).

---

## 3. Windows signing (`bundle.windows.certificateThumbprint`)

For Azure Trusted Signing or signtool.exe with an EV cert, set this
field to the SHA-1 thumbprint of the code-signing certificate.

If left `null`, Tauri's MSI/EXE ships unsigned; Windows SmartScreen
will warn users on first launch. Set the thumbprint before the first
Windows binary upload to GitHub Releases.

---

## 4. Brand surface line

We separated `bundle.productName` ("AuraMind" — what users see) from
`bundle.publisher` ("CogniVect, Inc." — what Apple/Windows metadata
reads). Apple App Store Connect doesn't display the publisher string
on the consumer-facing listing, but Apple notarization and Windows
SmartScreen DO read it.

`bundle.category` = `"Education"` (Apple's LSApplicationCategoryType
enum spells this value `public.app-category.education`; Tauri normalises
to the friendly form in its Info.plist emit).
