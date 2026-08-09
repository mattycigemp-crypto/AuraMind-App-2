import JSZip from 'jszip';
import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { FlashcardData } from '../../types';
import { makeImportedCard, type ParsedImportDeck } from '../study/roadmapService';

/**
 * Anki APKG parser.
 *
 * Lives in its own module (not in roadmapService) because it pulls in
 * sql.js (~1 MB) — keeping it here means the sql.js dependency only loads
 * into the bundles that actually import this parser, never the app entry.
 */
const stripHtml = (value: string) =>
  value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

export const parseApkgFile = async (file: File, fallbackTitle = 'Anki import'): Promise<ParsedImportDeck> => {
  try {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const collectionFile = zip.file('collection.anki21') || zip.file('collection.anki2');
    if (!collectionFile) {
      throw new Error('APKG does not contain a collection database. This may be a corrupted file or not a valid Anki package.');
    }

    const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl });
    const db = new SQL.Database(new Uint8Array(await collectionFile.async('uint8array')));

    const noteQuery = db.exec('SELECT flds FROM notes LIMIT 5000;');
    const rows = noteQuery?.[0]?.values || [];

    if (!rows.length) {
      db.close();
      throw new Error('No notes found in this APKG file. The package may be empty or only contain media.');
    }

    const cards = rows
      .map((row: unknown, index: number) => {
        const raw = Array.isArray(row) ? String(row[0] || '') : '';
        if (!raw) return null;
        const fields = raw.split('\x1f').map((entry) => stripHtml(entry));
        const question = fields[0] || '';
        const answer = fields.slice(1).join(' ').trim() || fields[1] || '';
        if (!question || !answer) return null;
        return makeImportedCard(question, answer, 'Anki APKG import', 'anki', `Note ${index + 1}`);
      })
      .filter((card): card is FlashcardData => Boolean(card));

    if (!cards.length) {
      db.close();
      throw new Error('No valid cards could be extracted from the notes. The notes may not contain question/answer pairs.');
    }

    const deckMeta = db.exec('SELECT decks FROM col LIMIT 1;');
    const deckJson = String(deckMeta?.[0]?.values?.[0]?.[0] || '{}');
    let detectedTitle = fallbackTitle;

    try {
      const parsedDecks = JSON.parse(deckJson) as Record<string, { name?: string }>;
      const meaningful = Object.values(parsedDecks).find((deck) => deck?.name && deck.name !== 'Default');
      if (meaningful?.name) detectedTitle = meaningful.name;
    } catch {
      // Ignore malformed deck metadata and keep fallback title.
    }

    db.close();

    return {
      title: detectedTitle,
      description: `Imported from Anki APKG: ${file.name}`,
      cards,
      detectedFormat: 'anki',
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to parse APKG file. Please ensure it is a valid Anki export package.', { cause: error });
  }
};
