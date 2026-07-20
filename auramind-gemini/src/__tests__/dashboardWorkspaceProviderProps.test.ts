// Regression guard for the bug class closed in PR #12.
//
// Reads each guarded source file, parses it with the TS Compiler API,
// walks every JSXOpeningElement whose tag name is "DashboardWorkspaceProvider",
// and asserts each opening element supplies every required prop on
// DashboardWorkspaceProviderProps (user, decks, cards, createDeck, deleteDeck,
// addCardsToDeck, updateProfile, onLogout).
//
// If a future commit drops or forgets any of those required props on any
// site, this test fails with a precise file:line message before the
// regression can land on main.
//
// Mirrors the required-prop set on DashboardWorkspaceProviderProps in
// auramind-gemini/src/contexts/DashboardWorkspaceContext.tsx. Update this
// list if the provider contract grows.

import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import { describe, it, expect } from 'vitest';

const REQUIRED_PROPS = [
  'user',
  'decks',
  'cards',
  'createDeck',
  'deleteDeck',
  'addCardsToDeck',
  'updateProfile',
  'onLogout',
] as const;

const FILES_TO_GUARD = [
  'src/App.tsx',
  'src/components/dashboard/ComponentVerification.tsx',
  'src/components/dashboard/DashboardTest.tsx',
] as const;

type SiteReport = {
  file: string;
  line: number;
  presentProps: ReadonlySet<string>;
};

function findDashboardWorkspaceProviderSites(file: string): SiteReport[] {
  const absolute = path.resolve(process.cwd(), file);
  if (!fs.existsSync(absolute)) {
    throw new Error(
      `[dashboardWorkspaceProviderProps] guarded file missing: ${file} (cwd=${process.cwd()})`,
    );
  }
  const source = fs.readFileSync(absolute, 'utf8');
  // createSourceFile with TSX kind so <Foo /> JSX is parsed as JsxElement
  // nodes, not as plain comparison/less-than tokens. (ScriptKind.TSX enables
  // JSX parsing implicitly — no separate `jsx` option needed.)
  const sourceFile = ts.createSourceFile(
    file,
    source,
    { languageVersion: ts.ScriptTarget.ES2022 },
    /* setParentNodes */ true,
    ts.ScriptKind.TSX,
  );

  const found: SiteReport[] = [];

  function walk(node: ts.Node): void {
    if (
      ts.isJsxOpeningElement(node) &&
      ts.isIdentifier(node.tagName) &&
      node.tagName.text === 'DashboardWorkspaceProvider'
    ) {
      const present = new Set<string>();
      for (const attr of node.attributes.properties) {
        if (ts.isJsxAttribute(attr) && ts.isIdentifier(attr.name)) {
          present.add(attr.name.text);
        }
      }
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      found.push({ file, line: line + 1, presentProps: present });
    }
    ts.forEachChild(node, walk);
  }

  walk(sourceFile);
  return found;
}

describe('DashboardWorkspaceProvider prop completeness — regression guard', () => {
  for (const file of FILES_TO_GUARD) {
    describe(file, () => {
      it('every <DashboardWorkspaceProvider> site supplies all 8 required props', () => {
        const sites = findDashboardWorkspaceProviderSites(file);
        expect(sites.length, `no <DashboardWorkspaceProvider> found in ${file}`).toBeGreaterThan(0);

        for (const site of sites) {
          for (const required of REQUIRED_PROPS) {
            expect(
              site.presentProps.has(required),
              `${site.file}:${site.line} — <DashboardWorkspaceProvider> is missing required prop "${required}". ` +
                `(present: { ${Array.from(site.presentProps).sort().join(', ') || '∅'} })`,
            ).toBe(true);
          }
        }
      });
    });
  }
});
