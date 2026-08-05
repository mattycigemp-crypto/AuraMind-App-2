/**
 * Memory Palace Service
 *
 * Builds a structured, walkable "memory palace" from a list of items
 * to memorize. Inspired by classical Mnemonics: the Method of Loci.
 *
 * Each item is placed at a vivid station within a familiar architecture
 * (your childhood home → entryway, kitchen, living room, etc.) so that
 * walking through the palace mentally retrieves every item in order.
 */

import { auraAiClient } from '../api/auraAiService';

// Default per-walk cap. Kept as a fallback for users without a tuned profile.
const DEFAULT_MAX_PALACE_ITEMS = 12;

/**
 * Profile-aware palace capacity. Tough learners hold fewer stations cleanly
 * (more items → more cross-contamination), fast learners can carry 15+ without
 * losing recall. Each profile also gets a small bonus slot, mirroring the
 * classical duel convention of "challenge slot".
 */
const PROFILE_DENSITY: Readonly<Record<string, { maxItems: number; bonusSlots: number }>> = {
  'fast-learner':     { maxItems: 15, bonusSlots: 2 },
  'moderate':         { maxItems: 12, bonusSlots: 1 },
  'conservative':     { maxItems: 12, bonusSlots: 1 },
  'aggressive':       { maxItems: 10, bonusSlots: 1 },
  'visual-dominant':  { maxItems: 12, bonusSlots: 2 },
  'tough-learner':    { maxItems: 6,  bonusSlots: 1 },
};

export function effectiveMaxItems(profileLabel: string | null): number {
  if (!profileLabel) return DEFAULT_MAX_PALACE_ITEMS;
  const d = PROFILE_DENSITY[profileLabel];
  return d ? d.maxItems + d.bonusSlots : DEFAULT_MAX_PALACE_ITEMS;
}

export interface PalaceStation {
  /** Display label like "Front Door" or "Kitchen Counter". */
  location: string;
  /** The item to remember being placed here. */
  item: string;
  /** Vivid, surreal interaction between the item and the location. */
  imagery: string;
  /** Sensory cue tying location → item (sound/smell/touch). */
  sensoryCue?: string;
}

export interface MemoryPalace {
  topic: string;
  /** Walkable setting — usually a familiar place. */
  setting: string;
  stations: PalaceStation[];
  /** Quick review: bullet list summarising the walk. */
  recap: string[];
  /** One-line takeaway / mental hook. */
  mantra: string;
}

const PALACE_PROMPT = `You are a competitive mnemonist designing a Method-of-Loci "memory palace" walkthrough.

Given a topic or list of items to memorize, produce JSON only (no markdown) with:
{
  "topic": "Original topic",
  "setting": "One-sentence description of the palace (e.g. 'Your childhood home from the front door through to the backyard')",
  "stations": [
    {
      "location": "Name of a specific station",
      "item": "The item to remember at this station",
      "imagery": "A surreal, vivid 1-sentence interaction between item and location, easy to visualize",
      "sensoryCue": "Optional sound/smell/touch cue reinforcing the memory"
    }
  ],
  "recap": ["One-line bullet per station summarising what lives there"],
  "mantra": "One short memorable sentence that summarises the entire palace"
}

Rules:
- Stations must follow a clear walking path (front→back, top→bottom, etc.)
- Stations = the number of items (plus 2-3 bonus if helpful)
- Keep imagery concrete, vivid, slightly absurd — absurd images stick.
- Output strictly valid JSON, no commentary.`;

interface PalaceRawResponse {
  topic?: string;
  setting?: string;
  stations?: Array<{
    location?: string;
    item?: string;
    imagery?: string;
    sensoryCue?: string;
  }>;
  recap?: string[];
  mantra?: string;
}

export async function buildMemoryPalace(
  items: string[],
  settingHint?: string,
  profileLabel: string | null = null,
): Promise<MemoryPalace> {
  if (!items.length) {
    throw new Error('No items to memorize');
  }
  const cap = effectiveMaxItems(profileLabel);
  // Cap matches the user's learned density. Past the cap, encourage splitting.
  if (items.length > cap) {
    throw new Error(
      `Memory Palace supports up to ${cap} items per walk for your pace. Split larger lists into multiple palaces.`,
    );
  }

  const prompt = `Build a memory palace for these items:\n${items.map((it, i) => `${i + 1}. ${it}`).join('\n')}\n\n${settingHint ? `Walking setting hint: ${settingHint}` : ''}`;

  const response = await auraAiClient.chatCompletion({
    messages: [
      { role: 'system', content: PALACE_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.95,
    max_tokens: 2200,
  });

  const content = response.choices[0]?.message?.content ?? '';
  return parsePalace(content, items);
}

function parsePalace(raw: string, fallbackItems: string[]): MemoryPalace {
  try {
    const json = extractJson(raw);
    const parsed = json as PalaceRawResponse;
    const stations: PalaceStation[] = (parsed.stations ?? []).map((s, i) => ({
      location: s.location ?? `Station ${i + 1}`,
      item: s.item ?? fallbackItems[i] ?? `Item ${i + 1}`,
      imagery: s.imagery ?? `Imagine ${fallbackItems[i] ?? 'something'} placed here, vivid and absurd.`,
      sensoryCue: s.sensoryCue,
    }));

    if (stations.length === 0) {
      throw new Error('Empty palace');
    }

    return {
      topic: parsed.topic ?? 'Memory Palace',
      setting: parsed.setting ?? 'A space you know inside out',
      stations,
      recap: parsed.recap ?? stations.map(s => `${s.location}: ${s.item}`),
      mantra: parsed.mantra ?? 'Walk. See. Recall.',
    };
  } catch {
    // Deterministic offline fallback if AI is down: produce a working palace from plain items.
    const stations: PalaceStation[] = fallbackItems.map((item, i) => {
      const fallbackLocations = [
        'Front Door', 'Hallway Mirror', 'Coat Closet', 'Living Room Couch',
        'Kitchen Counter', 'Refrigerator Door', 'Dining Table', 'Staircase Landing',
        'Bedroom Dresser', 'Bedside Lamp', 'Bathroom Sink', 'Window Sill',
        'Bookshelf Top', 'Porch Swing', 'Backyard Tree',
      ];
      return {
        location: fallbackLocations[i % fallbackLocations.length],
        item,
        imagery: `Picture ${item} glowing absurdly bright at this spot — too big to miss.`,
        sensoryCue: i % 2 === 0 ? 'Hear it hum' : 'Smell something citrus',
      };
    });

    return {
      topic: 'Memory Palace (offline mode)',
      setting: 'Your childhood home, walked front-to-back',
      stations,
      recap: stations.map(s => `${s.location}: ${s.item}`),
      mantra: 'Walk. See. Recall.',
    };
  }
}

function extractJson(content: string): unknown {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) return JSON.parse(fence[1].trim());
    const obj = trimmed.match(/\{[\s\S]*\}/);
    if (obj) return JSON.parse(obj[0]);
  }
  throw new Error('No JSON found');
}
