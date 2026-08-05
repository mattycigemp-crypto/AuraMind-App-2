/**
 * types.ts — typed error subclasses for each Puter.js subsystem.
 *
 * Every Puter subsystem error extends the same base `PuterUnavailableError`
 * defined in `../puterProvider.ts`. This lets us write generic catch blocks
 * once (e.g. `if (e.isAuthRequired && e instanceof PuterUnavailableError)`)
 * while still distinguishing subsystem-specific failure modes inside the
 * consumer that knows about FS vs KV.
 *
 * Why not one big `PuterUnavailableError` with a `subsystem` field?
 *   - instanceof narrowing is faster for the UI to branch on.
 *   - The discriminated `isFsQuotaExceeded`, `isUvzRetry` etc. flags stay
 *     type-safe on each subclass (TS won't let a KV call accidentally
 *     read an FS-specific flag without casting).
 */

import {
  PuterUnavailableError,
} from '../puterProvider';

export class PuterAuthError extends PuterUnavailableError {
  readonly subsystem = 'auth' as const;
  constructor(message: string, opts: { isAuthRequired?: boolean } = {}) {
    super(message, {
      isAuthRequired: opts.isAuthRequired ?? true,
      puterMessage: 'auth error',
    });
    this.name = 'PuterAuthError';
  }
}

export class PuterKvError extends PuterUnavailableError {
  readonly subsystem = 'kv' as const;
  readonly isQuotaExceeded: boolean;
  constructor(message: string, opts: { isQuotaExceeded?: boolean; puterMessage?: string } = {}) {
    super(message, {
      isQuotaExhausted: !!opts.isQuotaExceeded,
      puterMessage: opts.puterMessage ?? '',
    });
    this.name = 'PuterKvError';
    this.isQuotaExceeded = !!opts.isQuotaExceeded;
  }
}

export class PuterFsError extends PuterUnavailableError {
  readonly subsystem = 'fs' as const;
  readonly isFsQuotaExceeded: boolean;
  readonly isPathNotFound: boolean;
  constructor(
    message: string,
    opts: { isFsQuotaExceeded?: boolean; isPathNotFound?: boolean; puterMessage?: string } = {},
  ) {
    super(message, {
      puterMessage: opts.puterMessage ?? '',
    });
    this.name = 'PuterFsError';
    this.isFsQuotaExceeded = !!opts.isFsQuotaExceeded;
    this.isPathNotFound = !!opts.isPathNotFound;
  }
}

export class PuterAiImageError extends PuterUnavailableError {
  readonly subsystem = 'ai-image' as const;
  /** true for `puter.ai.txt2img` safety-blocked content (CSAM detector, etc). */
  readonly isContentBlocked: boolean;
  constructor(
    message: string,
    opts: { isContentBlocked?: boolean; puterMessage?: string } = {},
  ) {
    super(message, {
      puterMessage: opts.puterMessage ?? '',
    });
    this.name = 'PuterAiImageError';
    this.isContentBlocked = !!opts.isContentBlocked;
  }
}
