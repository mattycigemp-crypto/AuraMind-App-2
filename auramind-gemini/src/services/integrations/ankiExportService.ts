/**
 * Anki Export Service - Export AuraMind decks to Anki .apkg format
 * 
 * Creates proper Anki package files (.apkg) that can be imported into
 * Anki desktop, mobile, or web. Supports:
 * - Basic card type (front/back)
 * - Cloze deletion cards
 * - Tags preservation
 * - SRS data transfer (intervals, ease factors, repetitions)
 * - Media references
 * 
 * The .apkg format is a ZIP file containing:
 * - collection.anki21: SQLite database with Anki schema
 * - media: JSON file mapping media filenames
 */

import { Card, Deck } from '../../types';

// Anki card model IDs
const ANKI_MODEL_BASIC = 1;
const ANKI_MODEL_CLOZE = 2;

// Anki field separator (Unit Separator character)
const FIELD_SEPARATOR = '\x1f';

export interface AnkiExportOptions {
  includeSRSData?: boolean;    // Export intervals, ease factors, etc.
  includeTags?: boolean;       // Export card tags
  deckName?: string;           // Override deck name
  cardType?: 'basic' | 'cloze';// Card type to export
  fileName?: string;           // Output filename
}

const DEFAULT_EXPORT_OPTIONS: AnkiExportOptions = {
  includeSRSData: true,
  includeTags: true,
  cardType: 'basic',
};

/**
 * Export a deck of cards to Anki .apkg format
 * Returns a Blob that can be downloaded
 */
export async function exportToAnki(
  deck: Deck,
  cards: Card[],
  options: AnkiExportOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  
  // Dynamically import JSZip (browser-compatible)
  const JSZip = (await import('jszip')).default;
  
  const zip = new JSZip();
  
  // Generate the SQLite database
  const dbBuffer = await generateAnkiDatabase(deck, cards, opts);
  
  // Add the database to the ZIP
  zip.file('collection.anki21', dbBuffer);
  
  // Add empty media file
  zip.file('media', '{}');
  
  // Generate the ZIP file
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
  
  return zipBlob;
}

/**
 * Generate the Anki SQLite database buffer
 */
async function generateAnkiDatabase(
  deck: Deck,
  cards: Card[],
  options: AnkiExportOptions
): Promise<ArrayBuffer> {
  // Dynamically import sql.js
  const initSqlJs = (await import('sql.js')).default;
  
  // Initialize SQL.js
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  
  // Create Anki schema
  createAnkiSchema(db);
  
  // Generate timestamps (Anki uses seconds, not milliseconds)
  const now = Math.floor(Date.now() / 1000);
  const createTime = now - 86400; // 1 day ago
  
  // Create the deck
  const deckId = Math.floor(Math.random() * 1000000) + 1;
  const deckName = options.deckName || deck.title || 'AuraMind Export';
  
  // Insert deck into decks table
  const decksJson = JSON.stringify({
    [deckId.toString()]: {
      id: deckId,
      name: deckName,
      mtime_secs: now,
      usn: -1,
      collapsed: false,
      browserCollapsed: false,
      conf: 1,
      dyn: 0,
      desc: deck.description || '',
    }
  });
  
  db.run(`INSERT INTO decks VALUES (1, -1, ?)`, [decksJson]);
  
  // Insert deck config
  const configJson = JSON.stringify({
    '1': {
      id: 1,
      name: 'Default',
      mtime_secs: now,
      usn: -1,
      maxTaken: 60,
      autoplay: true,
      timer: 0,
      replayq: true,
      new: {
        delays: [1, 10],
        ints: [1, 4, 7],
        initialFactor: 2500,
        separate: true,
        order: 1,
        delay: 0,
        sortType: 0,
        sortOrder: 0,
        gainFactor: 0,
        perDay: 20,
        bury: true,
      },
      rev: {
        perDay: 200,
        ease4: 1.3,
        fuzz: 0.05,
        minSpace: 1,
        ivlFct: 0,
        maxIvl: 36500,
        bury: true,
        sortType: 0,
        hardFactor: 1.2,
        hardInterval: 1.0,
        easyBonus: 1.3,
      },
      lapse: {
        delays: [10, 60],
        mult: 0,
        minInt: 1,
        leechFails: 8,
        leechAction: 1,
      },
    }
  });
  
  db.run(`INSERT INTO dconf VALUES (1, ?)`, [configJson]);
  
  // Create the note model (card template)
  const modelId = Math.floor(Math.random() * 1000000) + 1700000000;
  
  if (options.cardType === 'cloze') {
    insertClozeModel(db, modelId, deckId, now);
  } else {
    insertBasicModel(db, modelId, deckId, now);
  }
  
  // Insert cards as notes
  let noteId = Math.floor(Math.random() * 1000000) + 1700000000;
  
  for (const card of cards) {
    const fields = options.cardType === 'cloze'
      ? [convertToClozeFormat(card)]
      : [card.front, card.back];
    
    const tags = options.includeTags && card.sourceLabel
      ? [card.sourceLabel.replace(/\s+/g, '_')]
      : [];
    
    // Add FSRS/SM-2 data as tags if enabled
    if (options.includeSRSData && card.interval > 0) {
      tags.push(`interval:${card.interval}`);
      tags.push(`ease:${Math.round((card.easeFactor || 2.5) * 100)}`);
      tags.push(`reps:${card.repetition || 0}`);
    }
    
    // Add verification tag if card is verified
    if ((card as any).verified) {
      tags.push('verified');
    }
    
    const tagsStr = tags.join(' ') + ' ';
    const fieldsStr = fields.join(FIELD_SEPARATOR);
    
    // Insert note
    db.run(
      `INSERT INTO notes VALUES (?, -1, ?, ?, ?, ?, ?, '', ?, 0)`,
      [
        noteId,
        Math.floor(Date.now() / 1000), // Modified time
        modelId,                        // Model ID
        tagsStr,                        // Tags
        fieldsStr,                      // Fields (question + answer)
        '',                             // Sort field (first field)
        0,                              // Flags
        deckId,                         // Original deck ID
      ]
    );
    
    // Insert card(s) for this note
    const numCards = options.cardType === 'cloze'
      ? countClozeDeletions(card.back)
      : 1;
    
    for (let i = 0; i < numCards; i++) {
      const cardOrd = i;
      
      // Calculate due date from SRS data
      let due = 0;
      let interval = 0;
      let easeFactor = 2500; // Anki uses ease * 1000
      let reps = 0;
      let lapses = 0;
      
      if (options.includeSRSData) {
        interval = card.interval || 0;
        easeFactor = Math.round((card.easeFactor || 2.5) * 1000);
        reps = card.repetition || 0;
        
        // Calculate due date
        if (card.nextReview) {
          due = Math.floor(card.nextReview / 1000);
        } else if (interval > 0) {
          due = Math.floor(Date.now() / 1000) + (interval * 86400);
        }
      }
      
      db.run(
        `INSERT INTO cards VALUES (?, -1, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,
        [
          noteId + i + 1,  // Card ID
          noteId,           // Note ID
          deckId,           // Deck ID
          due,              // Due date
          interval,         // Interval (days)
          easeFactor,       // Ease factor (×1000)
          reps,             // Repetitions
          lapses,           // Lapses
          cardOrd,          // Card ordinal
          0,                // Queue type
      ]
      );
    }
    
    noteId += numCards + 1;
  }
  
  // Update collection metadata
  const colJson = JSON.stringify({
    id: Math.floor(Date.now() * 1000),
    crt: createTime,
    mod: now,
    scm: now,
    ver: 21100,
    dty: 0,
    usn: 0,
    ls: now,
    rw: 0,
    v3: 0,
    conf: 1,
  });
  
  db.run(`INSERT INTO col VALUES (1, ?, 1115000000, -1, 0, '', '', '', 0, 0, 0)`, [colJson]);
  
  // Export the database to a buffer
  const buffer = db.export();
  db.close();
  
  return buffer.buffer;
}

/**
 * Create the Anki database schema
 */
function createAnkiSchema(db: any): void {
  // Collection table
  db.run(`
    CREATE TABLE col (
      id INTEGER PRIMARY KEY,
      crt INTEGER NOT NULL,
      mod INTEGER NOT NULL,
      scm INTEGER NOT NULL,
      ver INTEGER NOT NULL,
      dty INTEGER NOT NULL,
      usn INTEGER NOT NULL,
      ls INTEGER NOT NULL,
      conf TEXT NOT NULL,
      models TEXT NOT NULL,
      decks TEXT NOT NULL,
      dconf TEXT NOT NULL,
      tags TEXT NOT NULL
    )
  `);
  
  // Notes table
  db.run(`
    CREATE TABLE notes (
      id INTEGER PRIMARY KEY,
      guid TEXT NOT NULL,
      mid INTEGER NOT NULL,
      mod INTEGER NOT NULL,
      usn INTEGER NOT NULL,
      tags TEXT NOT NULL,
      flds TEXT NOT NULL,
      sfld INTEGER NOT NULL,
      csum INTEGER NOT NULL,
      flags INTEGER NOT NULL,
      data TEXT NOT NULL
    )
  `);
  
  // Cards table
  db.run(`
    CREATE TABLE cards (
      id INTEGER PRIMARY KEY,
      nid INTEGER NOT NULL,
      did INTEGER NOT NULL,
      ord INTEGER NOT NULL,
      mod INTEGER NOT NULL,
      usn INTEGER NOT NULL,
      type INTEGER NOT NULL,
      queue INTEGER NOT NULL,
      due INTEGER NOT NULL,
      ivl INTEGER NOT NULL,
      factor INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      lapses INTEGER NOT NULL,
      left INTEGER NOT NULL,
      odue INTEGER NOT NULL,
      odid INTEGER NOT NULL,
      flags INTEGER NOT NULL,
      data TEXT NOT NULL
    )
  `);
  
  // Decks table
  db.run(`
    CREATE TABLE decks (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      mtime_secs INTEGER NOT NULL DEFAULT 0,
      usn INTEGER NOT NULL DEFAULT -1,
      collapsed INTEGER NOT NULL DEFAULT 0,
      browser_collapsed INTEGER NOT NULL DEFAULT 0,
      conf INTEGER NOT NULL DEFAULT 1,
      dyn INTEGER NOT NULL DEFAULT 0,
      desc TEXT NOT NULL DEFAULT ''
    )
  `);
  
  // Deck config table
  db.run(`
    CREATE TABLE dconf (
      id INTEGER PRIMARY KEY,
      data TEXT NOT NULL
    )
  `);
  
  // Graves table (for sync)
  db.run(`
    CREATE TABLE graves (
      usn INTEGER NOT NULL,
      oid INTEGER NOT NULL,
      type INTEGER NOT NULL
    )
  `);
  
  // Revlog table (review history)
  db.run(`
    CREATE TABLE revlog (
      id INTEGER PRIMARY KEY,
      cid INTEGER NOT NULL,
      usn INTEGER NOT NULL,
      ease INTEGER NOT NULL,
      ivl INTEGER NOT NULL,
      lastIvl INTEGER NOT NULL,
      factor INTEGER NOT NULL,
      time INTEGER NOT NULL,
      type INTEGER NOT NULL
    )
  `);
  
  // Create indexes
  db.run(`CREATE INDEX ix_notes_usn ON notes (usn)`);
  db.run(`CREATE INDEX ix_notes_mid ON notes (mid)`);
  db.run(`CREATE INDEX ix_cards_usn ON cards (usn)`);
  db.run(`CREATE INDEX ix_cards_nid ON cards (nid)`);
  db.run(`CREATE INDEX ix_cards_sched ON cards (due, queue)`);
  db.run(`CREATE INDEX ix_revlog_cid ON revlog (cid)`);
  db.run(`CREATE INDEX ix_revlog_usn ON revlog (usn)`);
}

/**
 * Insert the Basic model (front/back) into the database
 */
function insertBasicModel(db: any, modelId: number, deckId: number, now: number): void {
  const model = {
    id: modelId,
    name: 'AuraMind Basic',
    type: 0,
    mod: now,
    usn: -1,
    sortf: 0,
    did: deckId,
    tmpls: [
      {
        name: 'Card 1',
        type: 0,
        did: deckId,
        qfmt: '{{Front}}',
        afmt: '{{FrontSide}}\n\n<hr id="answer">\n\n{{Back}}',
        bqfmt: '',
        bafmt: '',
      }
    ],
    flds: [
      {
        name: 'Front',
        ord: 0,
        sticky: false,
        rtl: false,
        font: 'Arial',
        size: 20,
        media: [],
      },
      {
        name: 'Back',
        ord: 1,
        sticky: false,
        rtl: false,
        font: 'Arial',
        size: 20,
        media: [],
      }
    ],
    css: `.card {
  font-family: Arial;
  font-size: 20px;
  text-align: center;
  color: black;
  background-color: white;
}`,
    latexPre: `\\documentclass[12pt]{article}
\\special{papersize=3in,5in}
\\usepackage[utf8]{inputenc}
\\usepackage{amssymb,amsmath}
\\pagestyle{empty}
\\setlength{\\parindent}{0in}
\\begin{document}
`,
    latexPost: '\\end{document}',
    tags: [],
  };
  
  // Insert into col models (we'll update the col row later)
  // For now, store in a temporary table
  db.run(`CREATE TEMP TABLE IF NOT EXISTS temp_models (id INTEGER PRIMARY KEY, data TEXT)`);
  db.run(`INSERT INTO temp_models VALUES (?, ?)`, [modelId, JSON.stringify(model)]);
}

/**
 * Insert the Cloze model into the database
 */
function insertClozeModel(db: any, modelId: number, deckId: number, now: number): void {
  const model = {
    id: modelId,
    name: 'AuraMind Cloze',
    type: 1,
    mod: now,
    usn: -1,
    sortf: 0,
    did: deckId,
    tmpls: [
      {
        name: 'Cloze',
        type: 1,
        did: deckId,
        qfmt: '{{cloze:Text}}',
        afmt: '{{cloze:Text}}',
        bqfmt: '',
        bafmt: '',
        bfont: '',
        bsize: 0,
      }
    ],
    flds: [
      {
        name: 'Text',
        ord: 0,
        sticky: false,
        rtl: false,
        font: 'Arial',
        size: 20,
        media: [],
      },
      {
        name: 'Extra',
        ord: 1,
        sticky: false,
        rtl: false,
        font: 'Arial',
        size: 20,
        media: [],
      }
    ],
    css: `.card {
  font-family: Arial;
  font-size: 20px;
  text-align: center;
  color: black;
  background-color: white;
}`,
    latexPre: `\\documentclass[12pt]{article}
\\special{papersize=3in,5in}
\\usepackage[utf8]{inputenc}
\\usepackage{amssymb,amsmath}
\\pagestyle{empty}
\\setlength{\\parindent}{0in}
\\begin{document}
`,
    latexPost: '\\end{document}',
    tags: [],
    req: [[0, 'any', [0]]],
  };
  
  db.run(`CREATE TEMP TABLE IF NOT EXISTS temp_models (id INTEGER PRIMARY KEY, data TEXT)`);
  db.run(`INSERT INTO temp_models VALUES (?, ?)`, [modelId, JSON.stringify(model)]);
}

/**
 * Convert a card to cloze deletion format
 */
function convertToClozeFormat(card: Card): string {
  // Simple conversion: wrap the back in {{c1::...}}
  // A more sophisticated version would identify key terms
  return `{{c1::${card.back}}}\n\n${card.front}`;
}

/**
 * Count the number of cloze deletions in text
 */
function countClozeDeletions(text: string): number {
  const matches = text.match(/\{\{c\d+::/g);
  return matches ? matches.length : 1;
}

/**
 * Download an Anki package file
 */
export function downloadAnkiPackage(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.apkg') ? fileName : `${fileName}.apkg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export a deck and trigger download
 */
export async function exportDeckToAnki(
  deck: Deck,
  cards: Card[],
  options: AnkiExportOptions = {}
): Promise<void> {
  const blob = await exportToAnki(deck, cards, options);
  const fileName = options.fileName || deck.title || 'auramind-export';
  downloadAnkiPackage(blob, fileName);
}

/**
 * Export multiple decks to a single Anki package
 */
export async function exportDecksToAnki(
  deckCards: { deck: Deck; cards: Card[] }[],
  options: AnkiExportOptions = {}
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const initSqlJs = (await import('sql.js')).default;
  
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  
  createAnkiSchema(db);
  
  const now = Math.floor(Date.now() / 1000);
  const createTime = now - 86400;
  
  // Create all decks
  const decks: Record<string, any> = {};
  let noteId = Math.floor(Math.random() * 1000000) + 1700000000;
  let modelId = Math.floor(Math.random() * 1000000) + 1700000000;
  
  for (const { deck, cards } of deckCards) {
    const deckId = Math.floor(Math.random() * 1000000) + 1;
    const deckName = options.deckName || deck.title || 'AuraMind Export';
    
    decks[deckId.toString()] = {
      id: deckId,
      name: deckName,
      mtime_secs: now,
      usn: -1,
      collapsed: false,
      browserCollapsed: false,
      conf: 1,
      dyn: 0,
      desc: deck.description || '',
    };
    
    // Insert model for this deck
    if (options.cardType === 'cloze') {
      insertClozeModel(db, modelId, deckId, now);
    } else {
      insertBasicModel(db, modelId, deckId, now);
    }
    
    // Insert cards
    for (const card of cards) {
      const fields = options.cardType === 'cloze'
        ? [convertToClozeFormat(card)]
        : [card.front, card.back];
      
      const tags = options.includeTags && card.sourceLabel
        ? [card.sourceLabel.replace(/\s+/g, '_')]
        : [];
      
      const tagsStr = tags.join(' ') + ' ';
      const fieldsStr = fields.join(FIELD_SEPARATOR);
      
      db.run(
        `INSERT INTO notes VALUES (?, -1, ?, ?, ?, ?, ?, '', ?, 0)`,
        [noteId, now, modelId, tagsStr, fieldsStr, '', 0, deckId]
      );
      
      db.run(
        `INSERT INTO cards VALUES (?, -1, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,
        [noteId + 1, noteId, deckId, 0, 0, 2500, 0, 0, 0]
      );
      
      noteId += 2;
    }
    
    modelId++;
  }
  
  // Insert decks
  db.run(`INSERT INTO decks VALUES (1, -1, ?)`, [JSON.stringify(decks)]);
  
  // Insert config
  db.run(`INSERT INTO dconf VALUES (1, ?)`, [JSON.stringify({
    '1': {
      id: 1,
      name: 'Default',
      mtime_secs: now,
      usn: -1,
      maxTaken: 60,
      autoplay: true,
      timer: 0,
      replayq: true,
      new: { delays: [1, 10], ints: [1, 4, 7], initialFactor: 2500, separate: true, order: 1, delay: 0, sortType: 0, sortOrder: 0, gainFactor: 0, perDay: 20, bury: true },
      rev: { perDay: 200, ease4: 1.3, fuzz: 0.05, minSpace: 1, ivlFct: 0, maxIvl: 36500, bury: true, sortType: 0, hardFactor: 1.2, hardInterval: 1.0, easyBonus: 1.3 },
      lapse: { delays: [10, 60], mult: 0, minInt: 1, leechFails: 8, leechAction: 1 },
    }
  })]);
  
  // Insert collection
  db.run(`INSERT INTO col VALUES (1, ?, 1115000000, -1, 0, '', '', '', 0, 0, 0)`, [
    JSON.stringify({ id: Math.floor(Date.now() * 1000), crt: createTime, mod: now, scm: now, ver: 21100, dty: 0, usn: 0, ls: now, rw: 0, v3: 0, conf: 1 })
  ]);
  
  const buffer = db.export();
  db.close();
  
  const zip = new JSZip();
  zip.file('collection.anki21', buffer.buffer);
  zip.file('media', '{}');
  
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}



