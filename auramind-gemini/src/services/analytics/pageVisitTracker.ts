/**
 * Page Visit Tracker — Records which dashboard sections the user visits
 * and returns the most-visited pages for Quick Actions.
 *
 * Uses localStorage so visit counts persist across sessions.
 * Applies exponential decay so recent visits count more than old ones.
 */

// ─── Types ───────────────────────────────────────────────────────

export interface SectionMeta {
  section: string;
  label: string;
  description: string;
  /** Icon component name from CustomIcons. Must be imported where used. */
  iconName: string;
}

export interface SectionRanking {
  section: string;
  label: string;
  description: string;
  iconName: string;
  score: number;       // Decay-weighted visit score
  visitCount: number;  // Raw visit count
}

// ─── Config ──────────────────────────────────────────────────────

const STORAGE_KEY = 'auramind:page-visits';

/** Half-life in days — visits older than this count half as much. */
const DECAY_HALF_LIFE_DAYS = 7;

/** Sections that are valid destinations for quick actions. */
const NAVIGABLE_SECTIONS: SectionMeta[] = [
  {
    section: 'cards',
    label: 'Browse Decks',
    description: 'View and manage your flashcard decks',
    iconName: 'Layers',
  },
  {
    section: 'generator',
    label: 'AI Generator',
    description: 'Create cards from topics, URLs, or files',
    iconName: 'BrainCircuit',
  },
  {
    section: 'analytics',
    label: 'Analytics',
    description: 'Track your study progress and retention',
    iconName: 'FolderOpen',
  },
  {
    section: 'paths',
    label: 'Learning Paths',
    description: 'Follow structured courses and curricula',
    iconName: 'BookOpen',
  },
  {
    section: 'chat',
    label: 'AI Chat',
    description: 'Chat with your AI study assistant',
    iconName: 'Bot',
  },
  {
    section: 'tutorial',
    label: 'Tutorial',
    description: 'Learn how to use AuraMind',
    iconName: 'Play',
  },
];

/** Sections explicitly excluded from quick actions. */
const EXCLUDED_SECTIONS = new Set(['main', 'settings', 'admin']);

// ─── Internal State ──────────────────────────────────────────────

interface VisitRecord {
  section: string;
  timestamps: number[]; // Recent visit timestamps (epoch ms)
}

function loadVisits(): VisitRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v: any) => typeof v.section === 'string' && Array.isArray(v.timestamps)
    );
  } catch {
    return [];
  }
}

function saveVisits(visits: VisitRecord[]): void {
  try {
    // Keep only records with timestamps from last 30 days
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const pruned = visits
      .map((v) => ({ ...v, timestamps: v.timestamps.filter((t) => t > cutoff) }))
      .filter((v) => v.timestamps.length > 0);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } catch {
    /* localStorage full or unavailable */
  }
}

// ─── Public API ──────────────────────────────────────────────────

/** Record a page visit for a dashboard section. */
export function trackPageVisit(section: string): void {
  if (EXCLUDED_SECTIONS.has(section)) return;
  if (!NAVIGABLE_SECTIONS.some((s) => s.section === section)) return;

  const visits = loadVisits();
  const existing = visits.find((v) => v.section === section);

  if (existing) {
    existing.timestamps.push(Date.now());
    // Keep only last 200 timestamps per section
    if (existing.timestamps.length > 200) {
      existing.timestamps = existing.timestamps.slice(-200);
    }
  } else {
    visits.push({
      section,
      timestamps: [Date.now()],
    });
  }

  saveVisits(visits);
}

/**
 * Get the top N most-visited sections, ranked by decay-weighted score.
 * Sections with no visits get a small default score so they can appear
 * as "discover" suggestions.
 */
export function getTopSections(count: number = 4): SectionRanking[] {
  const visits = loadVisits();
  const now = Date.now();
  const halfLifeMs = DECAY_HALF_LIFE_DAYS * 24 * 60 * 60 * 1000;

  const scored: SectionRanking[] = NAVIGABLE_SECTIONS.map((meta) => {
    const record = visits.find((v) => v.section === meta.section);
    if (!record || record.timestamps.length === 0) {
      return {
        ...meta,
        score: 0.01, // Tiny boost so all sections are discoverable
        visitCount: 0,
      };
    }

    // Each timestamp contributes: 2^(-age / halfLife)
    const score = record.timestamps.reduce((sum, ts) => {
      const ageMs = now - ts;
      return sum + Math.pow(2, -ageMs / halfLifeMs);
    }, 0);

    return {
      ...meta,
      score,
      visitCount: record.timestamps.length,
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, count);
}


export function resetPageVisits(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}



