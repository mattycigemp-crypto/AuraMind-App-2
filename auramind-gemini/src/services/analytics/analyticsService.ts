import { supabase } from '../database/supabase';
import { getFSRSAnalytics, getFSRSState, calculateRetrievability } from '../study/fsrs';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

// Check if PostHog is properly configured (not using placeholder values)
export const isPostHogConfigured = POSTHOG_KEY && POSTHOG_KEY !== 'phc_placeholder' && POSTHOG_KEY.length > 10;

let posthog: any = null;

export async function getPostHog() {
  if (!posthog && isPostHogConfigured && typeof window !== 'undefined') {
    const module = await import('posthog-js');
    posthog = module.default;
  }
  return posthog;
}

let initialized = false;

export const analyticsService = {
  init: async () => {
    if (import.meta.env.MODE === 'test' || initialized) return;
    initialized = true;
    const ph = await getPostHog();
    if (ph) {
      ph.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        autocapture: true,
        capture_pageview: true,
        capture_pageleave: true,
      });
    }
  },

  identify: async (userId: string, properties?: Record<string, any>) => {
    const ph = await getPostHog();
    if (ph) ph.identify(userId, properties);
  },

  reset: async () => {
    const ph = await getPostHog();
    if (ph) ph.reset();
  },

  track: async (eventName: string, properties?: Record<string, any>) => {
    const ph = await getPostHog();
    if (ph) ph.capture(eventName, properties);
  },

  trackHeart: async (
    dimension: 'happiness' | 'engagement' | 'adoption' | 'retention' | 'task_success',
    event: string,
    properties?: Record<string, any>
  ) => {
    const ph = await getPostHog();
    if (ph) ph.capture(`HEART:${dimension}:${event}`, properties);
  },

  trackOnboardingStep: async (stepNumber: number, stepName: string) => {
    const ph = await getPostHog();
    if (ph) ph.capture('Onboarding Step Completed', { step: stepNumber, stepName });
  },

  trackCoreAction: async (actionType: 'generate_deck' | 'study_session' | 'chat_message', details?: any) => {
    const ph = await getPostHog();
    if (ph) ph.capture(`Core Action: ${actionType}`, details);
  },

  trackSubscription: async (status: string, plan: string) => {
    const ph = await getPostHog();
    if (ph) ph.capture('Subscription Change', { status, plan });
  },

  // Enhanced analytics for learning insights
  getLearningInsights: async (userId: string) => {
    if (!isPostHogConfigured || !supabase) {
      return {
        retentionRate: 0,
        weeklyProgress: 0,
        weakSpots: [],
        studyConsistency: 0,
        predictedMasteryDate: null,
        fsrsAnalytics: null
      };
    }

    try {
      // Get user's cards and study sessions
      const { data: cards, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId);

      const { data: sessions, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false })
        .limit(30); // Last 30 sessions

      if (cardsError || sessionsError) {
        throw new Error('Failed to fetch learning data');
      }

      // Calculate retention rate (based on ease factor)
      const totalCards = cards?.length || 0;
      if (totalCards > 0) {
        const avgEaseFactor = cards.reduce((sum, card) => sum + (card.ease_factor || 2.5), 0) / totalCards;
        const retentionRate = Math.min(100, Math.max(0, (avgEaseFactor / 3.0) * 100));
        
        // Calculate weekly progress (new cards + reviewed cards in last 7 days)
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const recentSessions = sessions?.filter(session => 
          session.start_time && session.start_time > sevenDaysAgo) || [];
        
        const weeklyProgress = recentSessions.reduce((total, session) => 
          total + (session.cards_studied || 0), 0);
        
        // Identify weak spots (cards with low ease factor or high interval)
        const weakSpots = cards
          .filter(card => 
            (card.ease_factor || 2.5) < 2.0 ||  // Low ease factor
            (card.interval || 0) > 30             // Long interval (not reviewed recently)
          )
          .map(card => ({
            id: String(card.id),
            question: String(card.front),
            weakness: (card.ease_factor || 2.5) < 2.0 ? 'Low retention' : 'Not reviewed recently',
            severity: ((card.ease_factor || 2.5) < 2.0 ? 'high' : 'medium') as 'high' | 'medium' | 'low'
          }))
          .slice(0, 5); // Top 5 weak spots

        // Calculate study consistency (percentage of days with study activity in last 30 days)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const studyDates = new Set(
          sessions
            ?.filter(session => session.start_time && session.start_time > thirtyDaysAgo)
            .map(session => new Date(session.start_time).toDateString()) || []
        );
        const studyConsistency = (studyDates.size / 30) * 100;

        // Predict mastery date (when all cards will have ease factor >= 3.0)
        const cardsNeedingReview = cards.filter(card => 
          (card.ease_factor || 2.5) < 3.0
        ).length;
        
        let predictedMasteryDate: string | null = null;
        if (cardsNeedingReview > 0 && weeklyProgress > 0) {
          const daysToMastery = Math.ceil((cardsNeedingReview * 3) / (weeklyProgress / 7)); // Assuming 3 reviews per card for mastery
          predictedMasteryDate = new Date(Date.now() + (daysToMastery * 24 * 60 * 60 * 1000)).toISOString();
        }

        // Calculate FSRS analytics if cards have FSRS state
        const fsrsCards = cards.map(c => ({
          id: c.id,
          front: c.front,
          back: c.back,
          deckId: c.deck_id,
          nextReview: c.next_review || Date.now(),
          interval: c.interval || 0,
          easeFactor: c.ease_factor || 2.5,
          repetition: c.repetition || 0,
          lastReviewed: c.last_reviewed,
          fsrsState: c.fsrs_state ? (typeof c.fsrs_state === 'string' ? JSON.parse(c.fsrs_state) : c.fsrs_state) : undefined,
        }));
        
        const fsrsAnalytics = getFSRSAnalytics(fsrsCards);

        return {
          retentionRate: Math.round(retentionRate),
          weeklyProgress: Number(weeklyProgress),
          weakSpots: weakSpots as Array<{ id: string; question: string; weakness: string; severity: 'high' | 'medium' | 'low' }>,
          studyConsistency: Math.round(studyConsistency),
          predictedMasteryDate,
          fsrsAnalytics
        };
      }

      return {
        retentionRate: 0,
        weeklyProgress: 0,
        weakSpots: [] as Array<{ id: string; question: string; weakness: string; severity: 'high' | 'medium' | 'low' }>,
        studyConsistency: 0,
        predictedMasteryDate: null,
        fsrsAnalytics: null
      };
    } catch (error) {
      console.error('Error getting learning insights:', error);
      return {
        retentionRate: 0,
        weeklyProgress: 0,
        weakSpots: [],
        studyConsistency: 0,
        predictedMasteryDate: null,
        fsrsAnalytics: null
      };
    }
  }
};



