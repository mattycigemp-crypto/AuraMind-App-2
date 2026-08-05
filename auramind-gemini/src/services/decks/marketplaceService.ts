/**
 * Deck Marketplace Service
 *
 * Public deck discovery — browse, search, filter, and fork ("clone")
 * community-created decks. Builds network effects: every user becomes
 * a potential creator, every published deck becomes discoverable,
 * every fork is attributed back to the original creator.
 */

import { supabase } from '../database/supabase';

export interface MarketplaceDeck {
  id: string;
  title: string;
  description: string | null;
  marketplace_category: string | null;
  marketplace_tags: string[];
  fork_count: number;
  is_public: boolean;
  is_system?: boolean;
  published_at: string | null;
  creator: {
    user_id: string;
    name: string;
    avatar?: string;
  };
  cardCount?: number;
  original_deck_id?: string | null;
}

export interface MarketplaceFilters {
  search?: string;
  category?: string;
  tags?: string[];
  sort?: 'trending' | 'newest' | 'most_forked';
  limit?: number;
}

export const MARKETPLACE_CATEGORIES = [
  'Programming',
  'Languages',
  'Medicine',
  'Law',
  'Mathematics',
  'History',
  'Science',
  'Music',
  'Art',
  'Business',
  'Other',
] as const;

/** Browse public decks with optional filters. RLS restricts to is_public=true. */
export async function browseMarketplace(filters: MarketplaceFilters = {}): Promise<MarketplaceDeck[]> {
  if (!supabase) return buildDemoMarketplace(filters);

  try {
    let query = supabase
      .from('decks')
      .select(
        // NOTE: the public.decks table uses `name`, NOT `title`. The marketplace UI
        // still surfaces the field as `title` via the `MarketplaceDeck` type so the
        // mapping below reads from `row.name`.
        'id, name, description, marketplace_category, marketplace_tags, fork_count, is_public, published_at, original_deck_id, user_id',
      )
      .eq('is_public', true);

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
      );
    }
    if (filters.category) {
      query = query.eq('marketplace_category', filters.category);
    }
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('marketplace_tags', filters.tags);
    }

    const sort = filters.sort ?? 'trending';
    if (sort === 'trending') {
      query = query.order('fork_count', { ascending: false });
    } else if (sort === 'newest') {
      query = query.order('published_at', { ascending: false });
    } else if (sort === 'most_forked') {
      query = query.order('fork_count', { ascending: false });
    }

    query = query.limit(filters.limit ?? 30);

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) return buildDemoMarketplace(filters);

    // Look up creator info from user_profiles for user-published decks.
    // user_profiles has `full_name` (and no `name`/`avatar_url` columns on the
    // base Row type), so request exactly those.
    const userIds = data.map(d => d.user_id).filter(Boolean);
    let profileMap: Record<string, { full_name: string }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      if (profiles) {
        for (const p of profiles) {
          profileMap[p.user_id] = { full_name: p.full_name ?? '' };
        }
      }
    }

    return (data ?? []).map((row: any) => {
      const profile = profileMap[row.user_id];
      return {
        id: row.id,
        title: row.name,
        description: row.description,
        marketplace_category: row.marketplace_category,
        marketplace_tags: Array.isArray(row.marketplace_tags) ? row.marketplace_tags : [],
        fork_count: row.fork_count ?? 0,
        is_public: row.is_public,
        published_at: row.published_at,
        original_deck_id: row.original_deck_id,
        creator: {
          user_id: row.user_id,
          name: profile?.full_name || row.user_id?.slice(0, 8) || 'Anonymous',
          avatar: undefined,
        },
      };
    });
  } catch {
    return buildDemoMarketplace(filters);
  }
}

/** Publish a deck to the marketplace. */
export async function publishDeckToMarketplace(
  deckId: string,
  payload: {
    category: string;
    tags: string[];
    description: string;
  },
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Offline' };
  try {
    const { error } = await supabase
      .from('decks')
      .update({
        is_public: true,
        published_at: new Date().toISOString(),
        marketplace_category: payload.category,
        marketplace_tags: payload.tags,
        marketplace_description: payload.description,
      })
      .eq('id', deckId);

    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Unknown error' };
  }
}

/**
 * Fork (clone) a public deck into the current user's library.
 * Creates a new deck owned by the current user, copies all cards,
 * tracks attribution via original_deck_id, and increments fork_count.
 */
export async function forkDeck(
  originalDeckId: string,
  currentUserId: string,
): Promise<{ success: boolean; newDeckId?: string; error?: string }> {
  if (!supabase) return { success: false, error: 'Offline' };
  try {
    // 1. Read original deck metadata. The `decks` table uses `name`, not `title`.
    const { data: original, error: origErr } = await supabase
      .from('decks')
      .select('name, description')
      .eq('id', originalDeckId)
      .single();
    if (origErr) throw origErr;

    // 2. Create a new deck owned by the current user with attribution.
    const { data: newDeck, error: deckErr } = await supabase
      .from('decks')
      .insert({
        user_id: currentUserId,
        name: `${original.name} (forked)`,
        description: `Forked from a community deck. ${original.description ?? ''}`.trim(),
        original_deck_id: originalDeckId,
        is_public: false,
      })
      .select('id')
      .single();
    if (deckErr) throw deckErr;

    // 3. Copy all cards.
    const { data: cards, error: cardsErr } = await supabase
      .from('cards')
      .select('front, back, image')
      .eq('deck_id', originalDeckId);
    if (cardsErr) throw cardsErr;

    if (cards && cards.length > 0) {
      const cloned = cards.map(c => ({
        user_id: currentUserId,
        deck_id: newDeck.id,
        front: c.front,
        back: c.back,
        image: c.image,
      }));
      const { error: insertErr } = await supabase.from('cards').insert(cloned);
      if (insertErr) throw insertErr;
    }

    // 4. Increment fork_count atomically via SECURITY DEFINER RPC.
    // The function is RPC-defined in migration 20260715 to enforce that
    // forks only bump, never mutate other columns.
    await supabase.rpc('bump_forks_and_unpublish', {
      p_deck_id: originalDeckId,
      p_unpublish: false,
    });

    return { success: true, newDeckId: newDeck.id };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Unknown error' };
  }
}

/** Unpublish a deck (owner-only, via SECURITY DEFINER RPC). */
export async function unpublishDeck(
  deckId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Offline' };
  try {
    const { error } = await supabase.rpc('bump_forks_and_unpublish', {
      p_deck_id: deckId,
      p_unpublish: true,
    });
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Unknown error' };
  }
}

/** Demo data for offline / pre-launch previews. */
function buildDemoMarketplace(filters: MarketplaceFilters): MarketplaceDeck[] {
  const all: MarketplaceDeck[] = [
    {
      id: 'demo-1', title: 'JavaScript ES2024 — Top 100', description: 'Latest JS features and APIs every senior dev should know.',
      marketplace_category: 'Programming', marketplace_tags: ['javascript', 'es2024', 'web'], fork_count: 412, is_public: true, is_system: true,
      published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      creator: { user_id: 'c1', name: 'AuraMind', avatar: undefined }, cardCount: 100,
    },
    {
      id: 'demo-2', title: 'Spanish — A1 Survival Phrases', description: 'Essential phrases for travel: ordering food, asking directions, small talk.',
      marketplace_category: 'Languages', marketplace_tags: ['spanish', 'a1', 'travel'], fork_count: 308, is_public: true, is_system: true,
      published_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      creator: { user_id: 'c2', name: 'AuraMind', avatar: undefined }, cardCount: 75,
    },
    {
      id: 'demo-3', title: 'USMLE Step 1 — Pharmacology', description: 'High-yield pharm drugs, MOA, and side effects.',
      marketplace_category: 'Medicine', marketplace_tags: ['usmle', 'pharm', 'step1'], fork_count: 1024, is_public: true, is_system: true,
      published_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      creator: { user_id: 'c3', name: 'AuraMind', avatar: undefined }, cardCount: 250,
    },
    {
      id: 'demo-4', title: 'Calculus I — Derivative Patterns', description: 'Memorize every derivative rule using spaced repetition.',
      marketplace_category: 'Mathematics', marketplace_tags: ['calc', 'derivatives'], fork_count: 187, is_public: true, is_system: true,
      published_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      creator: { user_id: 'c4', name: 'AuraMind', avatar: undefined }, cardCount: 60,
    },
    {
      id: 'demo-5', title: 'Constitutional Law — Key Cases', description: 'Marbury, Brown, Roe, Miranda and the doctrines they birthed.',
      marketplace_category: 'Law', marketplace_tags: ['conlaw', 'bar'], fork_count: 96, is_public: true, is_system: true,
      published_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      creator: { user_id: 'c5', name: 'AuraMind', avatar: undefined }, cardCount: 80,
    },
    {
      id: 'demo-6', title: 'Spanish Vocab — Top 1000', description: 'Comprehensive core Spanish vocabulary arranged by frequency.',
      marketplace_category: 'Languages', marketplace_tags: ['spanish', 'vocab'], fork_count: 287, is_public: true, is_system: true,
      published_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      creator: { user_id: 'c6', name: 'AuraMind', avatar: undefined }, cardCount: 1000,
    },
  ];

  return all
    .filter(d =>
      !filters.search ||
      d.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      (d.description ?? '').toLowerCase().includes(filters.search.toLowerCase()),
    )
    .filter(d => !filters.category || d.marketplace_category === filters.category)
    .filter(d => !filters.tags?.length || filters.tags.some(t => d.marketplace_tags.includes(t)))
    .sort((a, b) =>
      filters.sort === 'newest'
        ? new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime()
        : b.fork_count - a.fork_count,
    );
}
