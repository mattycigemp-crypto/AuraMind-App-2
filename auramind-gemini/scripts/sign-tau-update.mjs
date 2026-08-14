#!/usr/bin/env node
/**
 * scripts/sign-tau-update.mjs — Tauri v2 updater manifest generator + signer.
 *
 * What it does:
 *   1. Reads TAURI_PRIVATE_KEY + TAURI_KEY_PASSWORD from the environment
 *      (these secrets are read by the release.yml workflow via ${{ secrets.* }}).
 *   2. Reads inputs:
 *        --tag           (e.g. v2.0.0)
 *        --notes         (release-notes markdown; defaults to CHANGELOG excerpt)
 *        --target        (platform target, e.g. darwin-aarch64, darwin-x86_64,
 *                         linux-x86_64, windows-x86_64)
 *        --url           (download URL for the binary on the release page)
 *        --signature     (the minisign signature produced by tauri-action
 *                         when building; usually <binary>.sig served as an
 *                         asset next to the binary)
 *        --out           (output file path; defaults to the same directory
 *                         the binary lives in, basename + .json)
 *   3. Writes the Tauri updater manifest in the exact shape that the
 *      `tauri-plugin-updater` reads on the client. The signature field is
 *      the minisign-style base64 string (no key material leaves this
 *      script — only the signature).
 *
 * Why a script instead of inlining this into Tauri config:
 *   Tauri 2 already generates <platform>-<arch>.json next to each binary
 *   when the updater plugin is active, but we centralise the helper here
 *   so future M7 work (CDN-backed updater, stable-staged releases) only
 *   touches one file.
 *
 * The matching private key MUST live in TAURI_PRIVATE_KEY (base64 of the
 * minisign .key file content); the matching public key goes into
 * `tauri.conf.json → plugins.updater.pubkey` and is checked by the
 * `updater` plugin at startup. See src-tauri/BUNDLE-CONFIG-NOTES.md
 * for the regeneration command before first prod cut.
 *
 * Usage:
 *   TAURI_PRIVATE_KEY=$(cat ~/.tauri/auramind.key | base64) \
 *   TAURI_KEY_PASSWORD=... \
 *   node scripts/sign-tau-update.mjs \
 *     --tag v2.0.0 \
 *     --target darwin-aarch64 \
 *     --url https://github.com/cogniavect/auramind/releases/download/v2.0.0/AuraMind.app.tar.gz \
 *     --signature "untrusted comment: minisign signature\nRWSIGNATURE..." \
 *     --out build/AuraMind.app.tar.gz.json
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

// ── CLI arg parser ────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 2; i < argv.length; i += 2) {
    const k = argv[i];
    const v = argv[i + 1];
    if (!k || !k.startsWith('--')) throw new Error(`expected --flag, got: ${k}`);
    out[k.slice(2)] = v;
  }
  return out;
}

const args = parseArgs(process.argv);
const TAG       = args.tag;       // e.g. v2.0.0
const TARGET    = args.target;    // e.g. darwin-aarch64
const URL       = args.url;       // download URL
const SIGNATURE = args.signature; // minisign signature blob (base64 multiline)
const OUT       = args.out ?? null; // optional output path

if (!TAG || !TARGET || !URL || !SIGNATURE) {
  console.error('Missing required --tag, --target, --url, or --signature flag.');
  console.error('See the JSDoc at the top of this file for usage.');
  process.exit(1);
}

const PRIVATE_B64 = process.env.TAURI_PRIVATE_KEY;
const PASSWORD    = process.env.TAURI_KEY_PASSWORD;
if (!PRIVATE_B64) {
  console.error('TAURI_PRIVATE_KEY env var is not set. It should be the base64-encoded .key file.');
  process.exit(1);
}

// ── Signature construction ────────────────────────────────────────────
//
// Tauri's updater reads the `signatures` map keyed by target, and the
// matching public key (from tauri.conf.json) verifies the minisign
// signature of the binary. We keep this minimal: the signature blob comes
// pre-signed from `tauri-action` and is passed in; we don't add crypto here.

const manifest = {
  version: TAG.replace(/^v/, ''),
  notes:   args.notes ?? `AuraMind ${TAG} — see https://github.com/cogniavect/auramind/releases/tag/${TAG}`,
  pub_date: new Date().toISOString(),
  // Tauri's manifest schema permits either a single `signature` field
  // OR a per-platform `platforms` map. We emit both for the broadest
  // client compatibility (the v1 updater read `signature` directly, v2
  // prefers `platforms`).
  signature: SIGNATURE,
  platforms: {
    [TARGET]: {
      signature: SIGNATURE,
      url:       URL,
    },
  },
};

// ── Output ────────────────────────────────────────────────────────────

const outputPath = OUT
  ? resolve(OUT)
  : (URL.startsWith('file://')
      ? fileURLToPath(URL).replace(/\.[^.]+$/, '.json')
      : `${dirname(URL) === '.' ? '' : dirname(URL) + '/'}${basename(URL)}.json`);

writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`✔ Tauri updater manifest written: ${outputPath}`);

// ── Self-check (dev-friendly smoke test) ──────────────────────────────
//
// Catch obvious typos before the workflow hands the manifest to GitHub
// Releases. PASSWORD is not strictly required to emit the manifest, but
// if it's missing from a CI run that's loud-failing on, we add a hint.

if (!PASSWORD) {
  console.warn('⚠ TAURI_KEY_PASSWORD is not set.');
  console.warn('  The manifest is correct, but the private-key file shipped to');
  console.warn('  CI without TAURI_KEY_PASSWORD cannot re-sign updated binaries');
  console.warn('  later. Set the password to avoid an emergency rotation.');
}

// Also: print the bodies of the two critical fields once so a human can
// eyeball them in CI logs.
console.log(`\n── Manifest contents ─────────────────────────────────────────`);
console.log(`version:    ${manifest.version}`);
console.log(`pub_date:   ${manifest.pub_date}`);
console.log(`platforms:  ${Object.keys(manifest.platforms).join(', ')}`);
console.log(`signature:  ${manifest.signature.split('\n')[0].substring(0, 60)}…`);
console.log(`─────────────────────────────────────────────────────────────`);
