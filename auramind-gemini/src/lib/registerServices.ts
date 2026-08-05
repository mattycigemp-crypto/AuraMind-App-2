/**
 * Service Registration — registers all lazy-loadable services with
 * the centralized service loader. Import this module once at app root
 * to make all services available for on-demand loading.
 *
 * Usage (in main.tsx or App.tsx):
 *   import './lib/registerServices';
 */

import { registerService } from './serviceLoader';

// ─── Register all services ─────────────────────────────────────

registerService(
  'notifications',
  () => import('../services/notifications/realtimeNotifications'),
  { description: 'Real-time notification subscriptions', priority: 'high' },
);

registerService(
  'leaderboard',
  () => import('../services/gamification/leagueService'),
  { description: 'League leaderboard + weekly XP' },
);

registerService(
  'gamification',
  () => import('../services/gamification/gamificationService'),
  { description: 'Achievements, XP, streak tracking', priority: 'high' },
);

registerService(
  'spaced-repetition',
  () => import('../services/spacedRepetition'),
  { description: 'FSRS spaced repetition engine' },
);

registerService(
  'data-export',
  () => import('../services/dataExport'),
  { description: 'Flashcard export (CSV, PDF, Anki)' },
);
