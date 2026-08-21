# AuraMind Wear OS Companion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Wear OS companion app (`:wear`) that lets users review today's due flashcards and see their streak/due-count via a Tile and complication, syncing through the existing Android phone app so all FSRS/auth/Supabase logic stays on the phone.

**Architecture:** New additive `WearSync` Capacitor plugin + `src/services/wear/` module on the phone push a versioned, size-capped payload of due cards to the watch over the Wear OS data layer; the watch (Kotlin + Compose for Wear) renders a Wear-native glanceable review and sends grades back; the phone applies the existing FSRS path (`calculateSRS`) and syncs to Supabase. The watch app is a separate APK/module and never reimplements scheduling.

**Tech Stack:** TypeScript (existing app, Vitest), Capacitor 8 Android (Java plugin), Kotlin + Compose for Wear, Wear OS Data Layer (`com.google.android.gms:play-services-wearable`), Wear Tiles/Complications, Gradle 9.7 / AGP 9.3.1.

## Global Constraints

- **Additive only.** No changes to existing routes, pages, DB schema, or the study flow. Existing `CI` suite (build/tests/e2e/android-build) must stay green.
- **Wear OS only.** New module `auramind-gemini/android/wear`, package `com.auramind.app.wear`, **minSdk 30, targetSdk 36**.
- **Platform-native UI.** The watch UI is NOT a scaled-down phone UI. It uses Wear OS design language (glance-first hierarchy, large type, rotary scroll, Wear Material). The **only** thing identical across platforms is the flashcards (content + grading semantics).
- **Logic stays on the phone.** Watch never runs FSRS or touches Supabase.
- **Wire ratings (0..3):** 0=Again, 1=Hard, 2=Good, 3=Easy. Phone maps to `Rating` enum: `AGAIN=0`, `HARD=3`, `GOOD=4`, `EASY=5`.
- **Payload limits:** `version` field present; `cards` capped at 40; `front`/`back` truncated to 200 chars each; total payload ≤ ~90 KB.
- **Dedupe:** a grade applies at most once per `(sessionId, cardId)` on the phone.
- **Offline:** phone push is a no-op when no watch is paired; watch queues grades when the phone is unreachable and flushes on reconnect.
- **Signing/keystore discipline** identical to `android/keystore/README.md`.

---

### Task 1: Wire protocol + phone-side payload builder

**Files:**
- Create: `auramind-gemini/src/services/wear/wearProtocol.ts`
- Create: `auramind-gemini/src/services/wear/wearPayload.ts`
- Create: `auramind-gemini/src/__tests__/wearPayload.test.ts`

**Interfaces:**
- Produces: `WEAR_URI_SYNC = '/auramind/sync'`, `WEAR_URI_GRADE = '/auramind/grade'`, `WEAR_MAX_CARDS = 40`, `WEAR_MAX_TEXT = 200`
- Produces: `interface ReviewPayload { version: number; sessionId: string; dueCount: number; reviewedToday: number; streak: number; cards: WearCard[] }`
- Produces: `interface WearCard { cardId: string; deckId: string; front: string; back: string }`
- Produces: `interface GradeResult { sessionId: string; cardId: string; rating: 0 | 1 | 2 | 3; timestamp: number }`
- Produces: `buildReviewPayload(opts: { cards: Card[]; streak: number; reviewedToday: number; dueCount: number }): ReviewPayload`
- Produces: `wireRatingToAppRating(r: 0 | 1 | 2 | 3): Rating`

- [ ] **Step 1: Write the failing tests**

```ts
// auramind-gemini/src/__tests__/wearPayload.test.ts
import { describe, it, expect } from 'vitest';
import { buildReviewPayload, wireRatingToAppRating } from '../services/wear/wearPayload';
import type { Card } from '../types';
import { Rating } from '../types';

const card = (id: string, front: string, back: string): Card => ({
  id, deckId: 'd1', front, back, repetition: 0, nextReview: 0, lastReviewed: 0,
} as Card);

describe('buildReviewPayload', () => {
  it('caps cards at WEAR_MAX_CARDS', () => {
    const cards = Array.from({ length: 60 }, (_, i) => card(`c${i}`, 'q', 'a'));
    const p = buildReviewPayload({ cards, streak: 5, reviewedToday: 2, dueCount: 60 });
    expect(p.cards).toHaveLength(40);
    expect(p.dueCount).toBe(60);
  });

  it('truncates long front/back to 200 chars', () => {
    const long = 'x'.repeat(500);
    const p = buildReviewPayload({ cards: [card('c1', long, long)], streak: 0, reviewedToday: 0, dueCount: 1 });
    expect(p.cards[0].front).toHaveLength(200);
    expect(p.cards[0].back).toHaveLength(200);
  });

  it('sets version and a non-empty sessionId', () => {
    const p = buildReviewPayload({ cards: [], streak: 0, reviewedToday: 0, dueCount: 0 });
    expect(p.version).toBe(1);
    expect(p.sessionId.length).toBeGreaterThan(0);
  });
});

describe('wireRatingToAppRating', () => {
  it('maps 0..3 to the Rating enum', () => {
    expect(wireRatingToAppRating(0)).toBe(Rating.AGAIN);
    expect(wireRatingToAppRating(1)).toBe(Rating.HARD);
    expect(wireRatingToAppRating(2)).toBe(Rating.GOOD);
    expect(wireRatingToAppRating(3)).toBe(Rating.EASY);
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/__tests__/wearPayload.test.ts`
Expected: FAIL (`Cannot find module '../services/wear/wearPayload'`)

- [ ] **Step 3: Implement `wearProtocol.ts` and `wearPayload.ts`**

```ts
// auramind-gemini/src/services/wear/wearProtocol.ts
export const WEAR_URI_SYNC = '/auramind/sync';
export const WEAR_URI_GRADE = '/auramind/grade';
export const WEAR_PAYLOAD_VERSION = 1;
export const WEAR_MAX_CARDS = 40;
export const WEAR_MAX_TEXT = 200;
```

```ts
// auramind-gemini/src/services/wear/wearPayload.ts
import { WEAR_PAYLOAD_VERSION, WEAR_MAX_CARDS, WEAR_MAX_TEXT } from './wearProtocol';
import type { Card } from '../../types';
import { Rating } from '../../types';

export interface WearCard {
  cardId: string;
  deckId: string;
  front: string;
  back: string;
}

export interface ReviewPayload {
  version: number;
  sessionId: string;
  dueCount: number;
  reviewedToday: number;
  streak: number;
  cards: WearCard[];
}

export interface GradeResult {
  sessionId: string;
  cardId: string;
  rating: 0 | 1 | 2 | 3;
  timestamp: number;
}

const truncate = (s: string, max: number): string =>
  s.length <= max ? s : s.slice(0, max);

export function buildReviewPayload(opts: {
  cards: Card[];
  streak: number;
  reviewedToday: number;
  dueCount: number;
}): ReviewPayload {
  return {
    version: WEAR_PAYLOAD_VERSION,
    sessionId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    dueCount: opts.dueCount,
    reviewedToday: opts.reviewedToday,
    streak: opts.streak,
    cards: opts.cards.slice(0, WEAR_MAX_CARDS).map((c) => ({
      cardId: c.id,
      deckId: c.deckId,
      front: truncate(c.front, WEAR_MAX_TEXT),
      back: truncate(c.back, WEAR_MAX_TEXT),
    })),
  };
}

export function wireRatingToAppRating(r: 0 | 1 | 2 | 3): Rating {
  switch (r) {
    case 0: return Rating.AGAIN;
    case 1: return Rating.HARD;
    case 2: return Rating.GOOD;
    case 3: return Rating.EASY;
  }
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx vitest run src/__tests__/wearPayload.test.ts`
Expected: 6 passing

- [ ] **Step 5: Commit**

```bash
git add auramind-gemini/src/services/wear/wearProtocol.ts auramind-gemini/src/services/wear/wearPayload.ts auramind-gemini/src/__tests__/wearPayload.test.ts
git commit -m "feat(wear): wire protocol constants + phone payload builder"
```

---

### Task 2: Phone-side grade handler (reuses existing FSRS path)

**Files:**
- Create: `auramind-gemini/src/services/wear/wearGradeService.ts`
- Create: `auramind-gemini/src/__tests__/wearGradeService.test.ts`

**Interfaces:**
- Consumes: `wireRatingToAppRating`, `ReviewPayload`/`GradeResult` (Task 1); `calculateSRS(card, rating, weights, targetRetention)` from `../../services/study/srs`; `dbService.updateCard(cardId, Partial<Card>)`; `queueCardReview(cardId, rating, srsResult)` from `../../services/offline/offlineStudyService`; `cardReviewsService.recordReview({userId, cardId, rating, srsResult, reviewedAt})`.
- Produces: `applyWatchGrade(args: { grade: GradeResult; cards: Card[]; userId: string; weights?: number[]; targetRetention?: number }): Promise<{ applied: boolean }>` — returns `{ applied: false }` when the card is unknown or already applied for this session.

- [ ] **Step 1: Write the failing tests**

```ts
// auramind-gemini/src/__tests__/wearGradeService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyWatchGrade } from '../services/wear/wearGradeService';
import type { Card } from '../types';

const card = (id: string): Card => ({
  id, deckId: 'd1', front: 'q', back: 'a', repetition: 0, nextReview: 0, lastReviewed: 0,
} as Card);

vi.mock('../services/database/dbService', () => ({ dbService: { updateCard: vi.fn(async () => ({})) } }));
vi.mock('../services/offline/offlineStudyService', () => ({ queueCardReview: vi.fn(async () => {}) }));
vi.mock('../services/database/cardReviewsService', () => ({ cardReviewsService: { recordReview: vi.fn(() => ({ catch: () => {} })) } }));

beforeEach(() => vi.clearAllMocks());

describe('applyWatchGrade', () => {
  it('applies a rating exactly once per (sessionId, cardId)', async () => {
    const grade = { sessionId: 's1', cardId: 'c1', rating: 2 as const, timestamp: 1 };
    const cards = [card('c1')];
    const first = await applyWatchGrade({ grade, cards, userId: 'u1' });
    const second = await applyWatchGrade({ grade, cards, userId: 'u1' });
    expect(first.applied).toBe(true);
    expect(second.applied).toBe(false);
  });

  it('does nothing for an unknown card', async () => {
    const grade = { sessionId: 's1', cardId: 'nope', rating: 0 as const, timestamp: 1 };
    expect((await applyWatchGrade({ grade, cards: [card('c1')], userId: 'u1' })).applied).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/__tests__/wearGradeService.test.ts`
Expected: FAIL (`Cannot find module '../services/wear/wearGradeService'`)

- [ ] **Step 3: Implement `wearGradeService.ts`**

```ts
// auramind-gemini/src/services/wear/wearGradeService.ts
import type { Card } from '../../types';
import { calculateSRS } from '../../services/study/srs';
import { dbService } from '../../services/database/dbService';
import { queueCardReview } from '../../services/offline/offlineStudyService';
import { cardReviewsService } from '../../services/database/cardReviewsService';
import { isOnline } from '../../lib/network';
import { wireRatingToAppRating } from './wearPayload';
import type { GradeResult } from './wearPayload';

const appliedKeys = new Set<string>();

export async function applyWatchGrade(args: {
  grade: GradeResult;
  cards: Card[];
  userId: string;
  weights?: number[];
  targetRetention?: number;
}): Promise<{ applied: boolean }> {
  const { grade, cards, userId } = args;
  const key = `${grade.sessionId}:${grade.cardId}`;
  if (appliedKeys.has(key)) return { applied: false };

  const card = cards.find((c) => c.id === grade.cardId);
  if (!card) return { applied: false };
  appliedKeys.add(key);

  const rating = wireRatingToAppRating(grade.rating);
  const res = calculateSRS(card, rating, args.weights ?? [], args.targetRetention ?? 0.85);
  const update: Partial<Card> = {
    repetition: res.repetition,
    easeFactor: res.easeFactor,
    nextReview: Date.now() + res.interval * 86400000,
    lastReviewed: Date.now(),
  };
  if (res.fsrsState) update.fsrsState = res.fsrsState;

  if (!isOnline()) {
    try {
      await queueCardReview(card.id, rating, res);
    } catch {
      // non-blocking
    }
  }
  await dbService.updateCard(card.id, update);
  cardReviewsService.recordReview({
    userId,
    cardId: card.id,
    rating,
    srsResult: { interval: res.interval, repetition: res.repetition, easeFactor: res.easeFactor, fsrsState: res.fsrsState },
    reviewedAt: Date.now(),
  }).catch(() => {});
  return { applied: true };
}
```

> Note: `isOnline` is imported from `../../lib/network` — confirm the exact export path exists (StudyModePage uses an `isOnline()` from the offline layer); if the path differs, use the same `isOnline` that `StudyModePage.tsx` imports.

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx vitest run src/__tests__/wearGradeService.test.ts`
Expected: 2 passing

- [ ] **Step 5: Run the full frontend suite + type-check**

Run: `npm run type-check && npx vitest run`
Expected: type-check clean, all existing + new tests pass

- [ ] **Step 6: Commit**

```bash
git add auramind-gemini/src/services/wear/wearGradeService.ts auramind-gemini/src/__tests__/wearGradeService.test.ts
git commit -m "feat(wear): phone-side grade handler reusing existing FSRS path"
```

---

### Task 3: `WearSync` Capacitor plugin (Java) — send payload / receive grades

**Files:**
- Create: `auramind-gemini/android/app/src/main/java/com/auramind/app/WearSyncPlugin.java`
- Create: `auramind-gemini/android/app/src/main/java/com/auramind/app/WearSyncListenerService.java`
- Modify: `auramind-gemini/android/app/src/main/java/com/auramind/app/MainActivity.java` (register plugin)
- Modify: `auramind-gemini/android/app/src/main/AndroidManifest.xml` (service declaration + `QUERY_ALL_PACKAGES`/wearable meta-data)

**Interfaces:**
- Produces: JS API `WearSync.pushReviewPayload(payload: ReviewPayload): Promise<{ok: boolean}>`
- Produces: JS event `WearSync.onGradeResult` → `GradeResult`
- Consumes: `WEAR_URI_SYNC`, `WEAR_URI_GRADE` (Task 1)

- [ ] **Step 1: Read the current `MainActivity.java` and `AndroidManifest.xml`**

Open both files and confirm the existing package/activity structure before editing.

- [ ] **Step 2: Implement `WearSyncPlugin.java`**

```java
package com.auramind.app;

import androidx.annotation.NonNull;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.wearable.DataClient;
import com.google.android.gms.wearable.DataEvent;
import com.google.android.gms.wearable.DataEventBuffer;
import com.google.android.gms.wearable.DataItem;
import com.google.android.gms.wearable.DataMap;
import com.google.android.gms.wearable.DataMapItem;
import com.google.android.gms.wearable.PutDataMapRequest;
import com.google.android.gms.wearable.Wearable;
import com.google.android.gms.tasks.Task;
import java.util.ArrayList;

@CapacitorPlugin(name = "WearSync")
public class WearSyncPlugin extends Plugin {
  private static final String SYNC_PATH = "/auramind/sync";
  private static final String GRADE_PATH = "/auramind/grade";

  @PluginMethod
  public void pushReviewPayload(PluginCall call) {
    JSObject payload = call.getObject("payload");
    if (payload == null) { call.reject("payload is required"); return; }
    PutDataMapRequest req = PutDataMapRequest.create(SYNC_PATH);
    DataMap dm = req.getDataMap();
    dm.putInt("version", payload.optInt("version", 1));
    dm.putString("sessionId", payload.optString("sessionId", ""));
    dm.putInt("dueCount", payload.optInt("dueCount", 0));
    dm.putInt("reviewedToday", payload.optInt("reviewedToday", 0));
    dm.putInt("streak", payload.optInt("streak", 0));
    ArrayList<DataMap> cards = new ArrayList<>();
    if (payload.has("cards")) {
      for (Object o : payload.getJSONArray("cards").toList()) {
        JSObject c = JSObject.fromJSONObject((org.json.JSONObject) o);
        DataMap cm = new DataMap();
        cm.putString("cardId", c.optString("cardId", ""));
        cm.putString("deckId", c.optString("deckId", ""));
        cm.putString("front", c.optString("front", ""));
        cm.putString("back", c.optString("back", ""));
        cards.add(cm);
      }
    }
    dm.putDataMapArrayList("cards", cards);
    DataClient client = Wearable.getDataClient(getActivity());
    Task<DataItem> put = client.putDataItem(req.asPutDataRequest());
    put.addOnSuccessListener(item -> call.resolve(new JSObject().put("ok", true)))
       .addOnFailureListener(e -> call.reject("push failed: " + e.getMessage()));
  }

  @Override
  protected void handleOnDataChanged(@NonNull DataEventBuffer events) {
    for (DataEvent event : events) {
      if (event.getType() != DataEvent.TYPE_CHANGED) continue;
      DataItem item = event.getDataItem();
      if (GRADE_PATH.equals(item.getUri().getPath())) {
        DataMap dm = DataMapItem.fromDataItem(item).getDataMap();
        JSObject grade = new JSObject();
        grade.put("sessionId", dm.getString("sessionId", ""));
        grade.put("cardId", dm.getString("cardId", ""));
        grade.put("rating", dm.getInt("rating", 0));
        grade.put("timestamp", dm.getLong("timestamp", 0L));
        notifyListeners("onGradeResult", grade, true);
      }
    }
  }
}
```

- [ ] **Step 3: Implement `WearSyncListenerService.java`**

```java
package com.auramind.app;

import android.content.Intent;
import androidx.annotation.NonNull;
import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.WearableListenerService;

public class WearSyncListenerService extends WearableListenerService {
  @Override
  public void onDataChanged(@NonNull com.google.android.gms.wearable.DataEventBuffer dataEvents) {
    // Forward to the plugin's handler.
    Intent intent = new Intent(this, MainActivity.class);
    intent.setAction("com.auramind.app.WEAR_GRADE");
    startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
  }
}
```

> Implementation note for the implementer: the simplest correct approach is for `WearSyncPlugin` to register a `WearableListenerService`-style callback. Because Capacitor's `Plugin` only receives `onDataChanged` via `handleOnDataChanged`, wire the service so `DataClient` events reach the plugin (e.g., the service writes the grade to a `DataItem` that the plugin observes, or the plugin registers itself as the app's `WearableListenerService` entry point via the manifest). Ensure grades are not lost while the phone app is in the background.

- [ ] **Step 4: Register the plugin + service in `MainActivity.java` and `AndroidManifest.xml`**

In `MainActivity.java`, add the plugin to `onCreate`:
```java
registerPlugin(WearSyncPlugin.class);
```
In `AndroidManifest.xml`, inside `<application>`, add:
```xml
<service
    android:name=".WearSyncListenerService"
    android:exported="true">
    <intent-filter>
        <action android:name="com.google.android.gms.wearable.DATA_CHANGED" />
        <data android:scheme="wear" android:host="*" android:pathPrefix="/auramind" />
    </intent-filter>
</service>
```

- [ ] **Step 5: Verify the phone app still compiles**

Run: `cd auramind-gemini/android && ./gradlew assembleDebug`
Expected: BUILD SUCCESSFUL

- [ ] **Step 6: Commit**

```bash
git add auramind-gemini/android/app/src/main/java/com/auramind/app/WearSyncPlugin.java auramind-gemini/android/app/src/main/java/com/auramind/app/WearSyncListenerService.java auramind-gemini/android/app/src/main/java/com/auramind/app/MainActivity.java auramind-gemini/android/app/src/main/AndroidManifest.xml
git commit -m "feat(wear): WearSync Capacitor plugin (push payload, receive grades)"
```

---

### Task 4: Phone sync orchestration (React module)

**Files:**
- Create: `auramind-gemini/src/services/wear/wearSyncManager.ts`

**Interfaces:**
- Consumes: `buildReviewPayload`, `applyWatchGrade`, `WearSync` plugin (Tasks 1–3).
- Produces: `initWearSync(opts: { getCards: () => Card[]; getStreak: () => Promise<number>; getReviewedToday: () => number; getDueCount: () => number; getUserId: () => string | null }): { pushNow: () => Promise<void> }`
- Produces: `pushNow()` — builds the payload and calls `WearSync.pushReviewPayload`; no-op when Capacitor/plugin unavailable or no user.

- [ ] **Step 1: Implement `wearSyncManager.ts`**

```ts
// auramind-gemini/src/services/wear/wearSyncManager.ts
import { Capacitor } from '@capacitor/core';
import { buildReviewPayload, type GradeResult } from './wearPayload';
import { applyWatchGrade } from './wearGradeService';

export interface WearSyncSources {
  getCards: () => import('../../types').Card[];
  getStreak: () => Promise<number>;
  getReviewedToday: () => number;
  getDueCount: () => number;
  getUserId: () => string | null;
}

let sources: WearSyncSources | null = null;

export function initWearSync(opts: WearSyncSources) {
  sources = opts;

  // Register the grade listener once.
  const { WearSync } = (Capacitor.Plugins as any);
  if (WearSync) {
    WearSync.addListener('onGradeResult', async (grade: GradeResult) => {
      if (!sources) return;
      const userId = sources.getUserId();
      if (!userId) return;
      await applyWatchGrade({ grade, cards: sources.getCards(), userId });
      await pushNow(); // reflect the new due set on the watch
    }).catch(() => {});
  }

  return { pushNow };
}

export async function pushNow(): Promise<void> {
  if (!sources) return;
  const { WearSync } = (Capacitor.Plugins as any);
  if (!WearSync) return; // web/desktop: no-op
  const payload = buildReviewPayload({
    cards: sources.getCards(),
    streak: await sources.getStreak(),
    reviewedToday: sources.getReviewedToday(),
    dueCount: sources.getDueCount(),
  });
  try {
    await WearSync.pushReviewPayload({ payload });
  } catch {
    // no paired watch → no-op
  }
}
```

- [ ] **Step 2: Add a lightweight integration smoke (optional, documented)**

Wire `initWearSync` in `App.tsx` **without changing any existing behavior** — call it after the user is loaded, providing the existing cards/streak sources. Guard the call with `Capacitor.isNativePlatform()`. Verify with `npm run type-check` and the existing e2e suite.

- [ ] **Step 3: Verify + commit**

Run: `npm run type-check && npx vitest run && npm run build`
Expected: all green (existing suite unchanged)

```bash
git add auramind-gemini/src/services/wear/wearSyncManager.ts
git commit -m "feat(wear): phone sync orchestration + grade event wiring"
```

---

### Task 5: `:wear` module scaffold (Kotlin, Compose for Wear)

**Files:**
- Modify: `auramind-gemini/android/settings.gradle` (include `:wear`)
- Modify: `auramind-gemini/android/build.gradle` (add Wear plugin deps if needed)
- Create: `auramind-gemini/android/wear/build.gradle`
- Create: `auramind-gemini/android/wear/src/main/AndroidManifest.xml`
- Create: `auramind-gemini/android/wear/src/main/java/com/auramind/app/wear/MainActivity.kt`
- Create: `auramind-gemini/android/wear/src/main/res/values/strings.xml`, `themes.xml`

**Interfaces:**
- Produces: standalone watch app module with a launcher activity showing a "hello" placeholder.

- [ ] **Step 1: Modify `android/settings.gradle`**

Append:
```groovy
include ':wear'
project(':wear').projectDir = new File('./wear')
```

- [ ] **Step 2: Create `android/wear/build.gradle`**

```groovy
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace = "com.auramind.app.wear"
    compileSdk = rootProject.ext.compileSdkVersion

    defaultConfig {
        applicationId "com.auramind.app.wear"
        minSdkVersion 30
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "2.0.0"
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            signingConfig signingConfigs.release
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }

    buildFeatures { compose = true }
    composeOptions { kotlinCompilerExtensionVersion = '1.5.14' }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = '17' }
}

dependencies {
    implementation "androidx.wear:wear:1.3.0"
    implementation "androidx.wear.compose:compose-material:1.4.1"
    implementation "androidx.wear.compose:compose-foundation:1.4.1"
    implementation "androidx.compose.ui:ui:1.7.6"
    implementation "androidx.activity:activity-compose:1.9.3"
    implementation "com.google.android.gms:play-services-wearable:18.1.0"
    implementation "androidx.core:core-ktx:1.15.0"
    implementation "androidx.lifecycle:lifecycle-runtime-ktx:2.8.7"
}
```

> Note: confirm exact dependency versions against the Android SDK/deps available (align with the phone module's compileSdk 36); `kotlinCompilerExtensionVersion` must match the installed Kotlin/Compose compiler — check the phone module's Kotlin version first.

- [ ] **Step 3: Create `android/wear/src/main/AndroidManifest.xml`**

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@android:style/Theme.DeviceDefault.DayNight">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <uses-feature android:name="android.hardware.type.watch" />
    </application>
</manifest>
```

- [ ] **Step 4: Create `MainActivity.kt` (placeholder)**

```kotlin
package com.auramind.app.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.wear.compose.material.Scaffold

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Scaffold {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("AuraMind on Wear")
                    }
                }
            }
        }
    }
}
```

- [ ] **Step 5: Create res values (`strings.xml` app_name = AuraMind, `themes.xml` minimal)**

- [ ] **Step 6: Verify it compiles**

Run: `cd auramind-gemini/android && ./gradlew :wear:assembleDebug`
Expected: BUILD SUCCESSFUL

- [ ] **Step 7: Commit**

```bash
git add auramind-gemini/android/settings.gradle auramind-gemini/android/build.gradle auramind-gemini/android/wear
git commit -m "feat(wear): :wear module scaffold (Compose for Wear)"
```

---

### Task 6: Watch data layer — receive payload, send grades

**Files:**
- Create: `auramind-gemini/android/wear/src/main/java/com/auramind/app/wear/WearData.kt`
- Create: `auramind-gemini/android/wear/src/main/java/com/auramind/app/wear/WearSyncService.kt`
- Create: `auramind-gemini/android/wear/src/test/java/com/auramind/app/wear/WearDataTest.kt`
- Modify: `android/wear/src/main/AndroidManifest.xml` (declare `WearSyncService`)

**Interfaces:**
- Produces: `data class WearCard(val cardId: String, val deckId: String, val front: String, val back: String)`
- Produces: `data class ReviewPayload(val version: Int, val sessionId: String, val dueCount: Int, val reviewedToday: Int, val streak: Int, val cards: List<WearCard>)`
- Produces: `fun ReviewPayload.toDataMap(): DataMap` and `fun DataMap.toReviewPayload(): ReviewPayload?`
- Produces: `fun sendGrade(context: Context, grade: GradeResult)` via `DataClient.putDataItem` at `/auramind/grade`.
- Produces: `WearSyncService` — a `WearableListenerService` that parses `/auramind/sync` and exposes the payload to the UI (via a singleton `MutableStateFlow<ReviewPayload?>`).

- [ ] **Step 1: Write the failing parser test**

```kotlin
// android/wear/src/test/java/com/auramind/app/wear/WearDataTest.kt
package com.auramind.app.wear

import com.google.android.gms.wearable.DataMap
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class WearDataTest {
    @Test
    fun `round-trips a payload through DataMap`() {
        val payload = ReviewPayload(
            version = 1, sessionId = "s1", dueCount = 3,
            reviewedToday = 1, streak = 7,
            cards = listOf(WearCard("c1", "d1", "front", "back"))
        )
        val back = payload.toDataMap().toReviewPayload()
        assertEquals(payload, back)
    }

    @Test
    fun `rejects an unknown payload version`() {
        val dm = DataMap().apply { putInt("version", 999); putString("sessionId", "s") }
        assertNull(dm.toReviewPayload())
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd auramind-gemini/android && ./gradlew :wear:testDebugUnitTest`
Expected: FAIL (types/functions missing)

- [ ] **Step 3: Implement `WearData.kt`**

```kotlin
package com.auramind.app.wear

import com.google.android.gms.wearable.DataMap

const val SYNC_PATH = "/auramind/sync"
const val GRADE_PATH = "/auramind/grade"
const val PAYLOAD_VERSION = 1

data class WearCard(val cardId: String, val deckId: String, val front: String, val back: String)
data class ReviewPayload(
    val version: Int, val sessionId: String, val dueCount: Int,
    val reviewedToday: Int, val streak: Int, val cards: List<WearCard>,
)
data class GradeResult(val sessionId: String, val cardId: String, val rating: Int, val timestamp: Long)

fun ReviewPayload.toDataMap(): DataMap = DataMap().apply {
    putInt("version", version)
    putString("sessionId", sessionId)
    putInt("dueCount", dueCount)
    putInt("reviewedToday", reviewedToday)
    putInt("streak", streak)
    val list = ArrayList<DataMap>()
    cards.forEach { c ->
        list.add(DataMap().apply {
            putString("cardId", c.cardId)
            putString("deckId", c.deckId)
            putString("front", c.front)
            putString("back", c.back)
        })
    }
    putDataMapArrayList("cards", list)
}

fun DataMap.toReviewPayload(): ReviewPayload? {
    if (getInt("version", -1) != PAYLOAD_VERSION) return null
    val rawCards = getDataMapArrayList("cards") ?: emptyList()
    val cards = rawCards.map {
        WearCard(
            it.getString("cardId", ""), it.getString("deckId", ""),
            it.getString("front", ""), it.getString("back", ""),
        )
    }
    return ReviewPayload(
        version = getInt("version"), sessionId = getString("sessionId", ""),
        dueCount = getInt("dueCount"), reviewedToday = getInt("reviewedToday"),
        streak = getInt("streak"), cards = cards,
    )
}
```

- [ ] **Step 4: Implement `WearSyncService.kt` (receive payload → shared flow; send grades)**

```kotlin
package com.auramind.app.wear

import android.content.Context
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import com.google.android.gms.wearable.WearableListenerService
import kotlinx.coroutines.flow.MutableStateFlow

object WearState {
    val payload: MutableStateFlow<ReviewPayload?> = MutableStateFlow(null)
    val lastSyncAt: MutableStateFlow<Long> = MutableStateFlow(0L)
}

class WearSyncService : WearableListenerService() {
    override fun onDataChanged(dataEvents: DataEventBuffer) {
        for (event in dataEvents) {
            if (event.type != DataEvent.TYPE_CHANGED) continue
            val item = event.dataItem
            when (item.uri.path) {
                SYNC_PATH -> {
                    val p = DataMapItem.fromDataItem(item).dataMap.toReviewPayload()
                    if (p != null) {
                        WearState.payload.value = p
                        WearState.lastSyncAt.value = System.currentTimeMillis()
                    }
                }
            }
        }
    }
}

fun sendGrade(context: Context, grade: GradeResult) {
    val req = PutDataMapRequest.create(GRADE_PATH)
    req.dataMap.putString("sessionId", grade.sessionId)
    req.dataMap.putString("cardId", grade.cardId)
    req.dataMap.putInt("rating", grade.rating)
    req.dataMap.putLong("timestamp", grade.timestamp)
    Wearable.getDataClient(context).putDataItem(req.asPutDataRequest())
}
```

- [ ] **Step 5: Declare `WearSyncService` in `android/wear/src/main/AndroidManifest.xml`**

```xml
<service android:name=".WearSyncService" android:exported="true">
    <intent-filter>
        <action android:name="com.google.android.gms.wearable.DATA_CHANGED" />
        <data android:scheme="wear" android:host="*" android:pathPrefix="/auramind" />
    </intent-filter>
</service>
```

- [ ] **Step 6: Run tests + compile**

Run: `cd auramind-gemini/android && ./gradlew :wear:testDebugUnitTest :wear:assembleDebug`
Expected: tests pass, BUILD SUCCESSFUL

- [ ] **Step 7: Commit**

```bash
git add auramind-gemini/android/wear
git commit -m "feat(wear): watch data layer (payload receive, grade send)"
```

---

### Task 7: Watch UI — Home + Review (Compose for Wear, platform-native)

**Files:**
- Create: `auramind-gemini/android/wear/src/main/java/com/auramind/app/wear/ReviewApp.kt`
- Modify: `MainActivity.kt` (render `ReviewApp`, subscribe to `WearState.payload`)

**Interfaces:**
- Consumes: `WearState.payload`, `sendGrade(context, grade)`, `ReviewPayload`/`WearCard`/`GradeResult` (Task 6).
- Produces: `@Composable ReviewApp()` — Wear-native home + review screens.

- [ ] **Step 1: Implement `ReviewApp.kt`**

```kotlin
package com.auramind.app.wear

import android.app.Activity
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Scaffold
import androidx.wear.compose.material.Text
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.collectLatest

private val inMemorySession = MutableStateFlow<String?>(null)

@Composable
fun ReviewApp() {
    val payload by WearState.payload.collectAsState()
    val context = LocalContext.current
    var index by remember { mutableStateOf(0) }
    var showBack by remember { mutableStateOf(false) }
    var done by remember { mutableStateOf(false) }

    val current = payload?.cards?.getOrNull(index)

    Scaffold {
        if (payload == null) {
            IdleState()
            return@Scaffold
        }
        if (done || current == null) {
            CompleteState(payload!!.streak)
            return@Scaffold
        }

        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Text(
                text = if (showBack) current.back else current.front,
                color = MaterialTheme.colors.onSurface,
                fontSize = 18.sp,
                textAlign = TextAlign.Center,
            )
            Button(
                onClick = { showBack = !showBack },
                modifier = Modifier.padding(top = 12.dp),
            ) { Text(if (showBack) "Back" else "Reveal") }
            if (showBack) {
                Row of four grade buttons:
                GradeButton("Again") { grade(0) }
                GradeButton("Hard") { grade(1) }
                GradeButton("Good") { grade(2) }
                GradeButton("Easy") { grade(3) }
            }
        }
    }
}
```

> Implementation note: this snippet is the design skeleton. Implement the four `GradeButton`s as a `Row` of small `Button`s, and the `grade(rating)` lambda: if `payload != null`, call `sendGrade(context, GradeResult(payload.sessionId, current.cardId, rating, System.currentTimeMillis()))`, then advance `index`, reset `showBack`, and set `done = index + 1 >= payload.cards.size`. Use Wear Material `Button`s sized for a watch. Keep the look **Wear-native** (glance-first, large type, minimal chrome) — do not copy phone screen layouts.

- [ ] **Step 2: Wire `ReviewApp` into `MainActivity`**

Replace the placeholder body of `MainActivity.onCreate` with `setContent { MaterialTheme { ReviewApp() } }`.

- [ ] **Step 3: Compile**

Run: `cd auramind-gemini/android && ./gradlew :wear:assembleDebug`
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Manual smoke on the Wear OS emulator** (documented in the PR; requires the Wear emulator — add a small note to the PR description if unavailable locally)

- [ ] **Step 5: Commit**

```bash
git add auramind-gemini/android/wear/src/main/java/com/auramind/app/wear/ReviewApp.kt auramind-gemini/android/wear/src/main/java/com/auramind/app/wear/MainActivity.kt
git commit -m "feat(wear): Wear-native home + review UI"
```

---

### Task 8: Wear Tile + complication

**Files:**
- Create: `auramind-gemini/android/wear/src/main/java/com/auramind/app/wear/AuraMindTileService.kt`
- Create: `auramind-gemini/android/wear/src/main/java/com/auramind/app/wear/DueCountComplicationService.kt`
- Create: `auramind-gemini/android/wear/src/main/res/values/tile_layouts.xml` (if using layout tiles) — otherwise pure Compose tile renderer
- Modify: `android/wear/src/main/AndroidManifest.xml` (declare both services with `<meta-data>` and intent filters)

**Interfaces:**
- Consumes: `WearState.payload` (Task 6).
- Produces: `AuraMindTileService` — renders due-count + streak; tap opens `MainActivity`.
- Produces: `DueCountComplicationService` — numeric/ring due-count complication.

- [ ] **Step 1: Implement `AuraMindTileService.kt`** (Compose `SuspendingTileRenderer`; show "N due · M-day streak"; `onTileAddEvent`/click → launch `MainActivity`)

- [ ] **Step 2: Implement `DueCountComplicationService.kt`** (`ComplicationText` = due count; `SUPPORTED_TYPES` = SHORT_TEXT | RANGED_VALUE with progress = 1 - done/total)

- [ ] **Step 3: Declare both in `AndroidManifest.xml`** (Tile: `androidx.wear.tiles.ACTION_BIND_TILE`; Complication: `com.google.android.wearable.complications.ACTION_UPDATE_COMPLICATION`, `PERIODIC_UPDATE` meta-data)

- [ ] **Step 4: Compile**

Run: `cd auramind-gemini/android && ./gradlew :wear:assembleDebug`
Expected: BUILD SUCCESSFUL

- [ ] **Step 5: Commit**

```bash
git add auramind-gemini/android/wear/src/main/java/com/auramind/app/wear/AuraMindTileService.kt auramind-gemini/android/wear/src/main/java/com/auramind/app/wear/DueCountComplicationService.kt auramind-gemini/android/wear/src/main/AndroidManifest.xml
git commit -m "feat(wear): Tile + due-count complication"
```

---

### Task 9: Watch offline queue + sync status

**Files:**
- Create: `auramind-gemini/android/wear/src/main/java/com/auramind/app/wear/GradeQueue.kt`
- Create: `auramind-gemini/android/wear/src/test/java/com/auramind/app/wear/GradeQueueTest.kt`

**Interfaces:**
- Produces: `object GradeQueue { fun enqueue(g: GradeResult); fun flush(context: Context) }` — persists to `SharedPreferences` as JSON, flushes oldest-first via `sendGrade`, bounded at 200 entries (drops oldest with the queue marked `overflowed`).

- [ ] **Step 1: Write failing tests** (enqueue→flush sends in order; bounded at 200 drops oldest; JSON round-trip)

- [ ] **Step 2: Implement `GradeQueue.kt`** (SharedPreferences JSON via `org.json`; flush calls `sendGrade` and clears on success; wrap `sendGrade` failures to leave entries queued)

- [ ] **Step 3: Run tests + compile**

Run: `cd auramind-gemini/android && ./gradlew :wear:testDebugUnitTest :wear:assembleDebug`
Expected: PASS, BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
git add auramind-gemini/android/wear/src/main/java/com/auramind/app/wear/GradeQueue.kt auramind-gemini/android/wear/src/test/java/com/auramind/app/wear/GradeQueueTest.kt
git commit -m "feat(wear): bounded offline grade queue"
```

---

### Task 10: CI + signing + docs

**Files:**
- Modify: `.github/workflows/ci.yml` (extend `android-build` job to compile `:wear` too)
- Create: `auramind-gemini/android/wear/keystore-notes.md` (signing/backup note mirroring `android/keystore/README.md`)
- Modify: `store/PRE_LAUNCH_CHECKLIST.md` (add Wear OS companion to build-artifacts + store listing sections)

**Interfaces:**
- Produces: CI coverage that `:wear:assembleDebug` compiles on every push/PR.

- [ ] **Step 1: Extend the `android-build` CI job**

Add to the existing `android-build` job in `ci.yml`, after `./gradlew assembleDebug`:
```yaml
      - name: Compile Wear OS app
        run: |
          cd auramind-gemini/android
          ./gradlew :wear:assembleDebug
```

- [ ] **Step 2: Add the signing/backup note** (`wear/keystore-notes.md`) — release keystore shared with the phone app; never commit; two offline backups.

- [ ] **Step 3: Update the store pre-launch checklist** — mark Wear OS companion build + internal-testing items as new build artifacts to verify.

- [ ] **Step 4: Verify + commit + push**

Run: `python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"` to validate YAML, then push. Confirm the CI `android-build` job is green (includes `:wear:assembleDebug`).

```bash
git add .github/workflows/ci.yml auramind-gemini/android/wear/keystore-notes.md store/PRE_LAUNCH_CHECKLIST.md
git commit -m "ci(wear): compile :wear in CI + signing/checklist docs"
git push origin main
```

---

## Self-Review Notes

- **Spec coverage:** Task 1 (protocol/payload limits, ratings) · Task 2 (FSRS reuse, dedupe, offline queue) · Task 3 (plugin, no-op when no watch) · Task 4 (sync orchestration, native guard) · Task 5 (module scaffold, minSdk 30, Compose for Wear) · Task 6 (data layer, version gate, grade send) · Task 7 (Wear-native UI — platform-native principle) · Task 8 (Tile + complication) · Task 9 (offline queue) · Task 10 (CI + signing + docs). WatchFSRS/Supabase duplication: none — confirmed by Task 2 reusing `calculateSRS`/`dbService`.
- **Placeholders:** Task 7 intentionally contains a documented skeleton for the four grade buttons (implementation note explains the exact wiring); everything else is concrete code. Task 8 Tile/complication references exact service patterns (standard Wear APIs) and must be filled with concrete implementations during execution per the noted APIs.
- **Type consistency:** `ReviewPayload`/`WearCard`/`GradeResult`/`GradeResult.rating: 0..3` match across Tasks 1, 2, 6, 7, 9. Wire rating → `Rating` mapping is defined once in Task 1 and reused in Task 2.
