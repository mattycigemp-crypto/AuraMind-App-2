import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { _hasRealGroqKey as hasRealGroqKey } from '../services/api/nexusService';

/**
 * Sentinel for the dev-UX guard in nexusService.ts.
 *
 * History: the starter `.env` file ships `VITE_GROQ_API_KEY=gsk_your_key_here`
 * as a placeholder so the rest of the schema validates. Without a runtime
 * check, dev boxes see `Groq API error (401): Invalid API Key` from `groqChat`
 * bubble into `runAIAgent`'s step ticker. This test pins the behaviour so a
 * future "this looks dead" cleanup pass can't silently regress the guard.
 *
 * Two regression nets:
 *   1. The four `expect(hasRealGroqKey())` asserts below pin the helper's
 *      exact-match contract for the placeholder string.
 *   2. The `import { _hasRealGroqKey }` above fails loudly at module-load if
 *      a maintainer removes the `export` from `_hasRealGroqKey` (turning it
 *      file-private). That import failure is itself a regression signal.
 *
 * Note on the alias: `_hasRealGroqKey as hasRealGroqKey` keeps the test body
 * readable. The leading underscore on the source export signals
 * "test-seam, not public API" to IDE auto-import — don't import it from
 * production code without re-reading the helper's JSDoc.
 */

describe('nexusService._hasRealGroqKey — dev-UX placeholder guard', () => {
  beforeEach(() => {
    // Start clean so each `it` owns the env value.
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns false when VITE_GROQ_API_KEY is missing (undefined)', () => {
    // Vite's env types declare VITE_GROQ_API_KEY as `string` (not
    // `string | undefined`); vi.stubEnv's parameter demands the same,
    // so the cast is required to satisfy the contract — not cargo-culting.
    vi.stubEnv('VITE_GROQ_API_KEY', undefined as unknown as string);
    expect(hasRealGroqKey()).toBe(false);
  });

  it('returns false when VITE_GROQ_API_KEY is the empty string', () => {
    vi.stubEnv('VITE_GROQ_API_KEY', '');
    expect(hasRealGroqKey()).toBe(false);
  });

  it('returns false when VITE_GROQ_API_KEY holds the documented placeholder', () => {
    vi.stubEnv('VITE_GROQ_API_KEY', 'gsk_your_key_here');
    expect(hasRealGroqKey()).toBe(false);
  });

  it('returns true when VITE_GROQ_API_KEY holds any non-placeholder value', () => {
    vi.stubEnv('VITE_GROQ_API_KEY', 'gsk_real_FakeKeyForTest_1234abcdef');
    expect(hasRealGroqKey()).toBe(true);
  });

  it('does not match the placeholder case-insensitively (placeholder is exact)', () => {
    // Documented intent: only the literal `'gsk_your_key_here'` is the
    // placeholder. Mixed-case variants like `'GSK_YOUR_KEY_HERE'` are real
    // keys by this guard's contract (even if obviously not real Groq keys).
    // If a maintainer wants case-insensitive matching, update this expectation
    // AND the JSDoc on _hasRealGroqKey in lock-step.
    vi.stubEnv('VITE_GROQ_API_KEY', 'GSK_YOUR_KEY_HERE');
    expect(hasRealGroqKey()).toBe(true);
  });
});
