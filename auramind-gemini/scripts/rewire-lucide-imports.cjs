#!/usr/bin/env node
/**
 * rewire-lucide-imports.cjs
 *
 * Rewires every `from 'lucide-react'` / `from "lucide-react"` module specifier
 * to AuraMind's own icon barrel `@/components/icons`. Named imports and aliases
 * (e.g. `Upload as UploadIcon`) are untouched — only the specifier changes, and
 * the barrel exports the same names. Run after vendor-lucide-icons.cjs.
 *
 * Usage:  node scripts/rewire-lucide-imports.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(entry.name)) yield p;
  }
}

let files = 0;
let replacements = 0;
for (const file of walk(SRC)) {
  const before = fs.readFileSync(file, 'utf8');
  const after = before
    .replace(/from\s+'lucide-react'/g, "from '@/components/icons'")
    .replace(/from\s+"lucide-react"/g, 'from "@/components/icons"');
  if (after !== before) {
    const count = (before.match(/from\s+['"]lucide-react['"]/g) || []).length;
    fs.writeFileSync(file, after, 'utf8');
    files++;
    replacements += count;
  }
}

console.log(`Rewired ${replacements} import specifier(s) across ${files} file(s).`);
