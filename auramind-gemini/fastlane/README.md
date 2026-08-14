# AuraMind — Fastlane

This directory contains the Fastlane config used by the `mobile-android` /
`mobile-ios` GitHub Actions workflows.

## Install

```bash
cd auramind-gemini
bundle install
```

(requires Ruby 3.2+ — the macOS GitHub Actions runner ships it.)

## Lanes

| Platform | Lane | What it does |
|---|---|---|
| Android | `internal` | Builds a signed AAB → uploads to Google Play Internal Testing track |
| Android | `beta` | Same → uploads to Closed Beta track |
| Android | `production` | Same → uploads to Production (staged rollout 10%) |
| iOS | `beta` | Builds a signed IPA → uploads to TestFlight |
| iOS | `release` | Same → uploads to App Store + submits for review |

## Environment variables

### Android
- `ANDROID_KEYSTORE_PATH` — absolute path to `release.keystore`
- `ANDROID_KEYSTORE_PASSWORD` — keystore password
- `ANDROID_KEY_ALIAS` — usually `auramind-upload`
- `ANDROID_KEY_PASSWORD` — usually same as `ANDROID_KEYSTORE_PASSWORD`
- `PLAY_STORE_SERVICE_ACCOUNT_JSON_PATH` — path to the Google Play service
  account JSON (downloaded from Play Console → Setup → API access)

### iOS
- `APPLE_ID` — Apple ID email used to own App Store Connect
- `APPLE_TEAM_ID` — 10-character Apple Developer Team ID
- `APPLE_ITC_TEAM_ID` — App Store Connect team ID (often same as
  `APPLE_TEAM_ID`)
- `MATCH_GIT_URL` — git URL hosting the team's match cert repo
- `MATCH_PASSWORD` — match repo encryption password

## Run locally (dev machine)

```bash
# Android internal
cd auramind-gemini
ANDROID_KEYSTORE_PATH=$HOME/keys/auramind/release.keystore \
ANDROID_KEYSTORE_PASSWORD=... \
ANDROID_KEY_ALIAS=auramind-upload \
ANDROID_KEY_PASSWORD=... \
PLAY_STORE_SERVICE_ACCOUNT_JSON_PATH=$HOME/keys/play-account.json \
bundle exec fastlane android internal

# iOS beta (must run on macOS)
cd auramind-gemini
APPLE_ID=you@yourcompany.com \
APPLE_TEAM_ID=ABCD123456 \
APPLE_ITC_TEAM_ID=ABCD123456 \
MATCH_GIT_URL=https://github.com/yourorg/certificates \
MATCH_PASSWORD=... \
bundle exec fastlane ios beta
```

## Skip during CI

The GitHub Actions workflows already encode these steps — when running
locally you only invoke fastlane for verification; production builds go
through the CI pipeline.
