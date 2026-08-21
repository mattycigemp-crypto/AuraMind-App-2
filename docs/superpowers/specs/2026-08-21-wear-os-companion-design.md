# AuraMind Wear OS Companion — Design

**Date:** 2026-08-21
**Status:** Draft for review (no code written yet)
**Author:** opencode (design), owner = maintainer

---

## 1. Goal

Ship a **Wear OS companion app** for AuraMind v1 that gives learners a
glanceable, delightful way to knock out their daily reviews on their wrist,
without turning the watch into a miniature clone of the phone app.

**Design principle (from the brief):** "whatever looks the coolest but is
still easy to figure out." → A polished, animated, 3-screen review flow plus a
watch-face Tile/complication. Nothing more in v1.

## 2. Scope

### In v1
- **Glanceable review**: watch shows today's due cards; flip front → back;
  self-grade (Again / Hard / Good / Easy). Grades sync back to the phone,
  which applies the existing FSRS scheduler and syncs to Supabase.
- **Wear OS Tile** showing due-count + streak; tap opens the review.
- **Watch-face complication** showing due-count (numeric/ring).
- **Offline-safe**: works over Bluetooth to the paired phone; queued grades
  flush when reconnected.

### Out of v1 (explicit non-goals)
- Voice quick-study.
- Browsing decks / full study sessions / stats on the watch.
- Standalone (LTE/Wi-Fi-only) mode — watch always pairs through the phone.
- watchOS / Apple Watch (deferred until the iOS app ships).

## 3. Platform & packaging

- **Wear OS only.** Google's watch platform, pairs with the already-shipping
  Android phone app.
- **New Android module `:wear`** in `auramind-gemini/android/wear/`, package
  `com.auramind.app.wear`, **own APK** (watch apps are separate APKs installed
  on the watch).
- **minSdk 30 / targetSdk 36** (Wear OS 3+; Compose for Wear + interactive
  features require API 30+). The vast majority of active Wear OS devices are
  Wear OS 3+.
- **UI: Compose for Wear** (`androidx.wear.compose`) — this is what delivers
  the "cool" (smooth motion, large type, glanceable layout) with low effort.
- **Signing**: signed with the same release upload keystore family as the
  phone app (new key alias for the watch or reuse — decided at impl time;
  backup discipline identical to `android/keystore/README.md`).

## 4. Architecture

```
┌─────────────────────────┐        Wear OS Data Layer (Bluetooth)        ┌──────────────────────────┐
│  Phone app (existing)    │  ── payload (due cards, streak, dueCount)──▶ │  Watch app (:wear)        │
│  com.auramind.app        │                                              │  com.auramind.app.wear    │
│  React/Capacitor         │  ◀── grade result (cardId, rating, ts) ──── │  Compose for Wear         │
│  + NEW WearSync plugin   │                                              │  + Tile + complication    │
└─────────────────────────┘                                              └──────────────────────────┘
         │                                                                        
         ▼                                                                        
   Supabase (existing sync + auth)                                              
   FSRS (existing src/services/study/fsrs.ts)                                  
```

**Rule:** all business logic (FSRS, persistence, auth, Supabase sync) stays in
the **phone app**. The watch is a thin, beautiful client. Nothing on the watch
reimplements scheduling.

## 5. Components

### 5.1 Phone side — `WearSync` Capacitor plugin (NEW, isolated)
A small local Capacitor plugin inside the existing Android project so the
existing React app can talk to the Wear data layer without any change to
existing screens.

- JS API:
  - `WearSync.pushReviewPayload(payload)` → serializes `ReviewPayload` to a
    `DataMap` and pushes a `DataItem` at URI `/auramind/sync`.
  - `WearSync.onGradeResult(cb)` → event when the watch sends a grade.
- Kotlin internals:
  - `WearableListenerService` to receive grades from the watch.
  - `DataClient` (`Wearable.getDataClient(context)`) for sending.
  - Trivial, self-contained: a no-op with no side effects when no watch is
    paired (Wear data calls return empty; no crash, no network).
- **Additive only**: new plugin package + registration. Existing routes,
  pages, DB schema, and study flow are untouched.

### 5.2 Phone side — sync orchestration (small, additive)
A module (`src/services/wear/`) in the existing React app that:
- Builds the `ReviewPayload` from data the app already has: due cards
  (via existing DB/study services), streak, reviewed-today, due-count.
- Triggers a push on: app foreground, end of a study session, and when the
  due set changes materially.
- On `onGradeResult`: looks up the card, applies the **existing FSRS grade**
  path (the same function the in-app study mode calls), persists, and syncs
  to Supabase — reusing the existing update flow exactly.
- **Dedupe**: a grade is applied at most once per `(sessionId, cardId)` so a
  duplicate from the data layer can't double-apply FSRS.

### 5.3 Watch side — Compose for Wear UI (NEW)
- **Home screen**: due-count + streak hero, "Start review" button. Reuses the
  AuraMind dark/violet brand (radial violet aura motif, large type).
- **Review screen**: card front (large, scrollable for long text) → tap →
  back → grade buttons (Again/Hard/Good/Easy) → next card. Completion state
  ("All caught up ✨").
- **Tile**: due-count + streak glance; tap deep-links into the review.
- **Complication**: due-count numeric/ring on supported watch faces.
- **Sync status**: small indicator (sent / queued offline).

### 5.4 Sync protocol (Wear Data Layer `DataMap`)
- `DataItem` URI `/auramind/sync`, key `payload`.
- `ReviewPayload`:
  - `version: Int` — payload format version; watch ignores unknown versions.
  - `sessionId: String` — one per pushed batch.
  - `dueCount: Int`, `reviewedToday: Int`, `streak: Int`.
  - `cards: [{ cardId, deckId, front, back }]` — **capped** (first ~40 due,
    each text field truncated to a watch-friendly length; total ≤ ~90 KB to
    stay under the Wear data-layer size limit).
- `GradeResult`: `{ sessionId, cardId, rating: 0..3, timestamp }`, URI
  `/auramind/grade`.
- Ratings map to the app's existing FSRS answers (0=Again,1=Hard,2=Good,
  3=Easy) — identical to the in-app grading.

## 6. Data flow (happy path)

1. Phone builds `ReviewPayload` from existing due data → pushes via `WearSync`.
2. Watch receives, shows home (due-count + streak) → user taps Start.
3. Watch shows card front → tap to reveal back → user grades.
4. Watch sends `GradeResult` per card; stores locally if phone unreachable.
5. Phone receives grade → applies **existing FSRS** update → persists →
   Supabase sync (existing path).
6. On disconnect/reconnect, queued `GradeResult`s flush in order.

## 7. Error handling & safety

- **No paired watch / data layer unavailable**: phone push is a no-op; app
  behaviour unchanged. Watch with no payload shows an empty/offline state.
- **Stale payload**: version mismatch → watch discards and stays idle.
- **Duplicate grades**: dedupe by `(sessionId, cardId)` on the phone.
- **Truncation/caps**: enforced by the payload builder; long cards are
  truncated on the phone before sending (watch screens are small anyway).
- **Watch offline grading**: grades queue on the watch; flush on reconnect;
  queue size bounded; oldest dropped with a note if it overflows (rare).
- **No changes to existing behaviour**: every new piece is additive and
  isolated. Existing unit/e2e suite must stay green.

## 8. Testing

- **Phone plugin**: unit tests for payload serialization, cap/truncation,
  grade dedupe; integration smoke on the Wear OS emulator pairing with a
  phone emulator.
- **Watch**: instrumented UI tests (Compose) for home/review/grade/completion;
  manual pass on a Wear OS emulator and (later) a real watch.
- **CI**: new job builds `:wear` (assembleDebug + assembleRelease), plus the
  existing suite stays required. Watch app signed in the same pipeline as the
  phone AAB.
- **Regression guard**: the existing `CI` workflow (web build, tests, e2e,
  android-build) must remain green — this feature adds files, never rewrites.

## 9. Milestones (implementation order)

1. Design sign-off (this doc).
2. `:wear` module skeleton + watch app shell + home/review screens (Compose).
3. Phone `WearSync` plugin + payload builder + grade handling.
4. Data-layer round trip on Wear OS emulators (phone ↔ watch).
5. Tile + complication.
6. Offline queue + dedupe hardening.
7. CI for `:wear` + signing + docs update (store listing note).
8. Play Internal Testing of both APKs together.

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Touching the existing app | All new code isolated in new module/plugin/services; no edits to existing routes/pages/schema; existing tests must pass |
| Wear data-layer quirks | Versioned payload; no-op when unavailable; dedupe; bounded queue |
| Scope creep ("make it cooler") | v1 is fixed: review + Tile + complication; everything else is a listed non-goal |
| Signing/keystore | Same keystore backup discipline as phone (`android/keystore/README.md`) |
| Play review of a companion watch app | Watch app declares a companion dependency on the phone app (standard, accepted pattern) |

## 11. Decisions made (in lieu of asking again)

- **Platform:** Wear OS first; watchOS deferred until iOS ships.
- **Experience:** glanceable review + Tile + complication (matches "cool but
  easy to figure out").
- **Architecture:** companion-through-phone (Approach A); standalone
  (Approach C) and WebView reuse (Approach B) ruled out for v1.
- **Reuse:** FSRS/Supabase/auth stay on the phone; nothing duplicated.
