/**
 * Data Export Service (GDPR Compliance)
 * 
 * Allows users to export all their personal data in a portable format.
 * Complies with GDPR Article 20 (Right to data portability).
 */

import { Card, Deck, StudySession, UserProfile } from '../types';
import { dbService } from './database/dbService';

export interface ExportData {
  exportDate: string;
  version: string;
  user: {
    profile: Partial<UserProfile>;
    decks: Deck[];
    cards: Card[];
    studySessions: StudySession[];
    statistics: {
      totalDecks: number;
      totalCards: number;
      totalStudySessions: number;
      totalStudyTime: number;
      averageAccuracy: number;
      currentStreak: number;
      longestStreak: number;
      cardsMastered: number;
      cardsLearning: number;
      cardsNew: number;
    };
  };
}

/**
 * Export all user data
 */
export async function exportUserData(userId: string): Promise<ExportData> {
  // Fetch all user data
  const [decks, cards, sessions] = await Promise.all([
    dbService.fetchDecks(userId),
    dbService.fetchCards(userId),
    dbService.fetchStudySessions(userId),
  ]);

  // Calculate statistics
  const totalStudyTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalAccuracy = sessions.filter(s => s.accuracy !== undefined);
  const averageAccuracy = totalAccuracy.length > 0
    ? totalAccuracy.reduce((sum, s) => sum + (s.accuracy || 0), 0) / totalAccuracy.length
    : 0;

  const cardsMastered = cards.filter(c => (c.easeFactor || 2.5) >= 3.0 && (c.repetition || 0) >= 3).length;
  const cardsLearning = cards.filter(c => (c.repetition || 0) > 0 && (c.repetition || 0) < 3).length;
  const cardsNew = cards.filter(c => (c.repetition || 0) === 0).length;

  // Get user profile from auth
  let profile: Partial<UserProfile> = {};
  try {
    const { requireSupabase } = await import('./database/supabase');
    const { data: { user } } = await requireSupabase().auth.getUser();
    if (user) {
      profile = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || '',
        plan: user.user_metadata?.plan || 'Starter',
        streak: user.user_metadata?.streak || 0,
        joinedDate: new Date(user.created_at).getTime(),
      };
    }
  } catch {
    // Auth not available
  }

  return {
    exportDate: new Date().toISOString(),
    version: '2.0.0',
    user: {
      profile,
      decks,
      cards,
      studySessions: sessions,
      statistics: {
        totalDecks: decks.length,
        totalCards: cards.length,
        totalStudySessions: sessions.length,
        totalStudyTime,
        averageAccuracy,
        currentStreak: profile.streak || 0,
        longestStreak: profile.streak || 0, // Would need historical data for accurate calculation
        cardsMastered,
        cardsLearning,
        cardsNew,
      },
    },
  };
}

/**
 * Export data as JSON file download
 */
export function downloadExport(data: ExportData, format: 'json' | 'csv' = 'json'): void {
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auramind-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    // CSV export for cards
    const csv = cardsToCSV(data.user.cards);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auramind-cards-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

function cardsToCSV(cards: Card[]): string {
  const headers = ['id', 'front', 'back', 'deckId', 'interval', 'easeFactor', 'repetition', 'nextReview', 'sourceType', 'sourceLabel'];
  const rows = cards.map(c => [
    c.id,
    `"${(c.front || '').replace(/"/g, '""')}"`,
    `"${(c.back || '').replace(/"/g, '""')}"`,
    c.deckId,
    c.interval,
    c.easeFactor,
    c.repetition,
    c.nextReview,
    c.sourceType || '',
    c.sourceLabel || '',
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Delete all user data (GDPR Article 17 - Right to erasure)
 */
export async function deleteUserData(userId: string): Promise<void> {
  const { requireSupabase } = await import('./database/supabase');

  // Delete all cards
  await requireSupabase().from('cards').delete().eq('user_id', userId);

  // Delete all decks
  await requireSupabase().from('decks').delete().eq('user_id', userId);

  // Delete all study sessions
  await requireSupabase().from('study_sessions').delete().eq('user_id', userId);

  // Delete user profile
  await requireSupabase().from('user_profiles').delete().eq('user_id', userId);

  // Delete auth user (requires service role key - done server-side)
  // This should be handled by the API endpoint, not client-side
}



