/**
 * Branding — single source of truth for the CogniVect (parent) and
 * AuraMind (first product) brand surface.
 *
 * Load-bearing contract (pinned by `__tests__/branding.test.ts` v3 + every
 * legal/footer page consumer). Any future rename touches exactly this
 * file; consumers reference `BRAND.*` or the named exports — never the
 * literal string "CogniVect" inline.
 *
 * Placement policy (M6.5.b round 14):
 *   - AuraMind is the PRIMARY mark everywhere it's seen.
 *   - CogniVect parent line appears BENEATH or BESIDE the AuraMind mark,
 *     never inside it, never replacing it. See `CogniWordmark.tsx`.
 *   - Store-listing metadata (capacitor.config appName, tauri.conf.json
 *     productName, Cargo.toml package.name, package.json metadata,
 *     index.html <title>) MUST stay "AuraMind" only — Apple/Google
 *     reject anything that looks like a tagline in the visual app name,
 *     and only the "Developer/Vendor Name" field accepts the parent
 *     brand. CogniVect leaves that field at the storefront console.
 *   - Mobile chrome (TopAppBar, MobileTabBar) is intentionally too
 *     cramped for the parent line.
 *
 * Per the test contract:
 *   - `PARENT_COMPANY_LEGAL` and `TRADEMARK_STATEMENT` carry NO trailing
 *     period because consumers re-attach their own punctuation, and a
 *     missing trailing dot at the source avoids "Inc.." double-period
 *     bugs at the site of use.
 *   - `LEGAL_YEAR` and `LEGAL_COPYRIGHT_LINE` share a stable year so the
 *     parity test can re-extract the year string from the copyright
 *     line and compare it byte-for-byte to `LEGAL_YEAR`.
 */

/* ── Named exports (canonical, pinned by branding.test.ts) ───────────── */

export const PARENT_COMPANY_NAME    = 'CogniVect';
export const PARENT_COMPANY_LEGAL   = 'CogniVect, Inc';          /* no trailing period */
export const PARENT_BRAND_SLUG     = 'covect';
export const PARENT_BRAND_TAGLINE  = 'cognitive · vector';     /* middle dot, not '+' */
export const PRODUCT_NAME          = 'AuraMind';
export const PRODUCT_BYLINE        = `${PRODUCT_NAME} — a ${PARENT_COMPANY_NAME} product`;
export const CONTACT_EMAIL         = 'hello@auramind.app';
/* Until CogniVect provisions its own mailbox, parent brand contact-mail
 * aliases to the deliverability-warmed production mailbox. */
export const PARENT_CONTACT_EMAIL  = CONTACT_EMAIL;
export const LEGAL_ADDRESS         = `${PARENT_COMPANY_LEGAL}, 548 Market St, San Francisco, CA 94104`;
export const TRADEMARK_STATEMENT   = `${PRODUCT_NAME} is a trademark of ${PARENT_COMPANY_LEGAL}`;

/* Year must be computed BEFORE the copyright line so the inlined value
 * inside LEGAL_COPYRIGHT_LINE matches LEGAL_YEAR byte-for-byte. */
export const LEGAL_YEAR: number                       = new Date().getFullYear();
export const LEGAL_COPYRIGHT_LINE: string             = `© ${LEGAL_YEAR} CogniVect, Inc. All rights reserved.`;

/* Issuer URL — used in store Developer/Vendor URL field. Forward-looking
 * for M6 store submission. Not on the LEGAL_YEAR axis; const for stable
 * deploys (DNS-stable, won't churn even when the year flips). */
export const VENDOR_URL                                = 'https://cogniavect.app';

/* Inline-text helper: "AuraMind by CogniVect" / "by CogniVect" wording
 * for compact UI surfaces (sidebar logo strip, splash bottom). Folded
 * into PRODUCT_BYLINE for marketing-style copy. */
export const PARENT_BYLINE_SHORT                       = `by ${PARENT_COMPANY_NAME}`;

/* ── BRAND aggregate — every key mirrors its named export ─────────────── */
/* The branding.test.ts parity test asserts Object.keys(BRAND).sort()
 * equals a fixed enumeration, so adding a constant requires updating
 * both surfaces. */
export const BRAND = {
  parentName:           PARENT_COMPANY_NAME,
  parentLegal:          PARENT_COMPANY_LEGAL,
  parentSlug:           PARENT_BRAND_SLUG,
  parentTagline:        PARENT_BRAND_TAGLINE,
  product:              PRODUCT_NAME,
  productByline:        PRODUCT_BYLINE,
  contactEmail:         CONTACT_EMAIL,
  parentContactEmail:   PARENT_CONTACT_EMAIL,
  legalAddress:         LEGAL_ADDRESS,
  trademarkStatement:   TRADEMARK_STATEMENT,
  copyrightLine:        LEGAL_COPYRIGHT_LINE,
} as const;

/* ── Type-safe helpers ────────────────────────────────────────────────── */

export type BrandParent = typeof PARENT_COMPANY_NAME; // 'CogniVect'
export type BrandAggregateKeys = keyof typeof BRAND;
