/**
 * FSRS (Free Spaced Repetition Scheduler) v5 Algorithm Implementation
 * 
 * FSRS is a modern spaced repetition algorithm that outperforms SM-2 by up to 30%.
 * It uses a forgetting curve model with optimized parameters based on user performance.
 * 
 * Key concepts:
 * - Stability (S): How long a memory can be retained (in days)
 * - Difficulty (D): How difficult a card is to remember (0-10 scale)
 * - Retrievability (R): Probability of recalling a card at a given time (0-1)
 * - Target retention: Optimal recall probability (default 0.9)
 * 
 * Reference: https://github.com/open-spaced-repetition/fsrs4anki
 */

import { Card, Rating } from '../../types';

// FSRS default weights (optimized for general use)
// These are the default parameters from FSRS v5
export const DEFAULT_WEIGHTS: number[] = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0659,
  0.0234, 1.616, 0.1544, 0.6621, 1.0, 0.8, 0.2, 0.05,
  0.1, 0.7, 0.2, 2.5, 0.3
];

// FSRS configuration
interface FSRSConfig {
  requestRetention: number;  // Target retention rate (default 0.9)
  maximumInterval: number;   // Maximum interval in days (default 36500)
  weights: number[];         // FSRS model weights
}

const DEFAULT_CONFIG: FSRSConfig = {
  requestRetention: 0.9,
  maximumInterval: 36500,
  weights: DEFAULT_WEIGHTS,
};

// FSRS card state
export interface FSRSCardState {
  stability: number;    // Memory stability in days
  difficulty: number;   // Card difficulty (0-10)
  elapsedDays: number;  // Days since last review
  scheduledDays: number;// Days until next review
  repetitions: number;  // Number of reviews
  lapses: number;       // Number of times forgotten
  lastReview: number;   // Timestamp of last review
}

// FSRS scheduling result
export interface FSRSScheduleResult {
  stability: number;
  difficulty: number;
  interval: number;      // Days until next review
  retrievability: number;// Current recall probability
  repetitions: number;
  lapses: number;
}

// Rating to FSRS grade mapping
// FSRS uses grades 0-4: Again=0, Hard=1, Good=2, Easy=3, Manual=4
const RATING_TO_GRADE: Record<number, number> = {
  0: 0, // AGAIN -> grade 0
  3: 1, // HARD -> grade 1
  4: 2, // GOOD -> grade 2
  5: 3, // EASY -> grade 3
};

/**
 * Calculate the forgetting curve: R = (1 + factor * elapsed / stability) ^ -1
 *
 * Exported so downstream simulators (e.g. profileSimulator) can reuse the
 * exact same shape without copying the formula.
 */
export function forgettingCurve(elapsedDays: number, stability: number, factor: number = 1.0): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + (factor * elapsedDays) / stability, -1);
}

/**
 * Initialize a new FSRS card state
 */
function _initFSRSState(): FSRSCardState {
  return {
    stability: DEFAULT_WEIGHTS[0],
    difficulty: DEFAULT_WEIGHTS[1],
    elapsedDays: 0,
    scheduledDays: 0,
    repetitions: 0,
    lapses: 0,
    lastReview: 0,
  };
}

/**
 * Get FSRS state from a Card object
 * Falls back to SM-2 derived values if FSRS state is not available
 */
export function getFSRSState(card: Card): FSRSCardState {
  // Check if card has FSRS-specific fields
  const fsrsState = (card as any).fsrsState as FSRSCardState | undefined;
  
  if (fsrsState && fsrsState.stability > 0) {
    return fsrsState;
  }
  
  // Convert from SM-2 state to FSRS state
  // This provides backward compatibility for existing cards
  const easeFactor = card.easeFactor || 2.5;
  const interval = card.interval || 0;
  const repetition = card.repetition || 0;
  
  // Estimate stability from interval (rough conversion)
  // For SM-2: interval = stability * easeFactor for mature cards
  const estimatedStability = repetition > 0 ? interval / Math.max(easeFactor, 1.3) : DEFAULT_WEIGHTS[0];
  
  // Estimate difficulty from ease factor
  // SM-2 ease factor 2.5 maps to FSRS difficulty ~5 (middle)
  const estimatedDifficulty = Math.max(1, Math.min(10, 10 - (easeFactor - 1.3) * 2));
  
  const elapsedDays = card.lastReviewed
    ? Math.max(0, (Date.now() - card.lastReviewed) / (24 * 60 * 60 * 1000))
    : 0;
  
  return {
    stability: Math.max(0.1, estimatedStability),
    difficulty: estimatedDifficulty,
    elapsedDays,
    scheduledDays: interval,
    repetitions: repetition,
    lapses: 0,
    lastReview: card.lastReviewed || 0,
  };
}

/**
 * Calculate next interval based on FSRS algorithm
 */
function nextInterval(stability: number, config: FSRSConfig): number {
  // R = requestRetention
  // R = (1 + factor * interval / stability) ^ -1
  // Solving for interval: interval = stability * (R^(-1/factor) - 1) / factor
  
  const R = config.requestRetention;
  const factor = DEFAULT_WEIGHTS[14]; // factor parameter
  
  let interval = stability * (Math.pow(R, -1 / factor) - 1) / factor;
  
  // Apply interval modifiers based on FSRS weights
  interval = Math.round(interval);
  
  // Apply bounds
  interval = Math.max(1, Math.min(config.maximumInterval, interval));
  
  return interval;
}

/**
 * Calculate next stability after a review
 */
function nextStability(
  state: FSRSCardState,
  grade: number,
  config: FSRSConfig
): number {
  const { stability, difficulty, elapsedDays: _elapsedDays, repetitions: _repetitions } = state;
  const w = config.weights;
  
  if (grade === 0) {
    // Again - reset stability based on difficulty
    // S_new = w[15] * difficulty^(-w[16]) * (stability^w[17] * w[18] * e^(w[19]*(1-difficulty/10)) + 1)
    const preStability = Math.pow(stability, w[17]) * w[18] * Math.exp(w[19] * (1 - difficulty / 10));
    return w[15] * Math.pow(difficulty, -w[16]) * (preStability + 1);
  }
  
  // For successful reviews (Hard=1, Good=2, Easy=3)
  // S_new = S_old * (1 + exp(w[8]) * (grade+1)^(-w[9]) * (S_old^w[10] - 1) * exp((w[11]-w[12]*difficulty)*(grade-2)))
  
  const gradeFactor = Math.pow(grade + 1, -w[9]);
  const stabilityFactor = Math.pow(stability, w[10]) - 1;
  const difficultyFactor = Math.exp((w[11] - w[12] * difficulty) * (grade - 2));
  
  return stability * (1 + Math.exp(w[8]) * gradeFactor * stabilityFactor * difficultyFactor);
}

/**
 * Calculate next difficulty after a review
 */
function nextDifficulty(
  state: FSRSCardState,
  grade: number,
  config: FSRSConfig
): number {
  const { difficulty } = state;
  const w = config.weights;
  
  if (grade === 0) {
    // Again - increase difficulty
    // D_new = min(10, D_old + w[6])
    return Math.min(10, difficulty + w[6]);
  }
  
  // For successful reviews
  // D_new = D_old - w[5] * (grade - 2)
  // Hard decreases difficulty less, Easy decreases it more
  const newDifficulty = difficulty - w[5] * (grade - 2);
  
  // Mean reversion toward initial difficulty
  const initialDifficulty = w[4];
  return w[7] * initialDifficulty + (1 - w[7]) * Math.max(1, Math.min(10, newDifficulty));
}

/**
 * Calculate retrievability at current time
 */
export function calculateRetrievability(state: FSRSCardState): number {
  if (state.stability <= 0 || state.elapsedDays < 0) return 0;
  return forgettingCurve(state.elapsedDays, state.stability);
}

/**
 * Main FSRS scheduling function
 * Takes a card and rating, returns new FSRS state and interval
 *
 * `weightsOverride` is the optional per-user tuned weight vector produced
 * by loadPersonalizedFsrs in ./fsrsAdaptation. When undefined the global
 * DEFAULT_WEIGHTS are used.
 */
export function scheduleFSRS(card: Card, rating: Rating, weightsOverride?: number[]): FSRSScheduleResult {
  const config: FSRSConfig = weightsOverride && weightsOverride.length === DEFAULT_WEIGHTS.length
    ? { ...DEFAULT_CONFIG, weights: weightsOverride }
    : DEFAULT_CONFIG;
  const state = getFSRSState(card);
  const grade = RATING_TO_GRADE[rating] ?? 2;
  
  // Calculate elapsed days since last review
  const now = Date.now();
  const elapsedDays = state.lastReview > 0
    ? Math.max(0, (now - state.lastReview) / (24 * 60 * 60 * 1000))
    : state.scheduledDays;
  
  // Update state with current elapsed time
  const currentState: FSRSCardState = {
    ...state,
    elapsedDays,
  };
  
  // Calculate new difficulty and stability
  const newDifficulty = nextDifficulty(currentState, grade, config);
  const newStability = nextStability(currentState, grade, config);
  
  // Calculate next interval
  const newInterval = nextInterval(newStability, config);
  
  // Calculate current retrievability
  const retrievability = calculateRetrievability(currentState);
  
  // Update repetition and lapse counts
  const newRepetitions = grade > 0 ? currentState.repetitions + 1 : 0;
  const newLapses = grade === 0 ? currentState.lapses + 1 : currentState.lapses;
  
  return {
    stability: Math.max(0.1, newStability),
    difficulty: Math.max(1, Math.min(10, newDifficulty)),
    interval: Math.max(1, Math.min(config.maximumInterval, Math.round(newInterval))),
    retrievability: Math.max(0, Math.min(1, retrievability)),
    repetitions: newRepetitions,
    lapses: newLapses,
  };
}

/**
 * Create initial FSRS state for a new card
 */
export function createInitialFSRSState(): FSRSCardState {
  return {
    stability: DEFAULT_WEIGHTS[0],
    difficulty: DEFAULT_WEIGHTS[4], // Initial difficulty
    elapsedDays: 0,
    scheduledDays: 0,
    repetitions: 0,
    lapses: 0,
    lastReview: 0,
  };
}

/**
 * Per-profile initial difficulty center (FSRS W[4] mean-reversion target).
 *
 * FSRS mean-reverts card.difficulty toward `W[4]` (~7.21) over time. By
 * picking a different per-user center we bias every NEW card and every
 * card on its first personalized review, so a tough-learner doesn't open
 * a fast-learner's pacing curve and feel punished.
 *
 * Values are hand-fit to the (avgStability, lapseRate, retention) features
 * already driving catalog lookup. Single source of truth for both the
 * DifficultyChip copy (in fsrsAdaptation) and the actual bias applied
 * to cards here.
 */
export const PROFILE_DIFFICULTY_CENTER: Readonly<Record<string, number>> = {
  aggressive: 7,
  moderate: 6.5,
  conservative: 5,
  'fast-learner': 4.5,
  'tough-learner': 7.5,
  'visual-dominant': 5.5,
};

/**
 * Apply the personalized difficulty center to a card whose initial state has
 * not yet been exercised by the user.
 *
 * Idempotent: cards whose `fsrsState.repetitions > 0` (already reviewed at
 * least once under the personal schedule) are returned untouched. Cards
 * whose existing `fsrsState.difficulty` is already close to a known center
 * are also returned untouched, so calling this on every review is cheap.
 *
 * The optional fourth arg `difficultyTargetOverride` lets per-session pacing
 * controls swap the profile-derived target for an explicit number without
 * having to manufacture a synthetic profile label.
 *
 * Returns a new card object with the bias applied and an `applied` flag so
 * callers can decide whether to persist (dbService.updateCard) or run the
 * schedule inline.
 */
export function applyPersonalizedDifficultyInit(
  card: Card,
  profileLabel: string | null,
  weightsOverride?: number[],
  difficultyTargetOverride?: number,
): { card: Card; applied: boolean } {
  // Already mid-life — don't perturb a card the user has started studying
  // under the existing curve.
  if (card.fsrsState && card.fsrsState.repetitions > 0) {
    return { card, applied: false };
  }
  const resolvedOverride = difficultyTargetOverride !== undefined
    ? Math.max(1, Math.min(10, difficultyTargetOverride))
    : null;
  // Note: `profileLabel && ...` used to leak an empty string through the
  // `??` chain (`""` is not nullish), which set `difficulty` to `""` and
  // silently corrupted the FSRS state for cards with a blank profile
  // label. Resolve to `undefined` explicitly so `??` can do its job.
  const profileCenter = profileLabel ? PROFILE_DIFFICULTY_CENTER[profileLabel] : undefined;
  const targetDifficulty = resolvedOverride ?? profileCenter ?? DEFAULT_WEIGHTS[4];
  // If existing fsrs_state already has exactly the personalized center, skip
  // a no-op write.
  if (card.fsrsState && Math.abs(card.fsrsState.difficulty - targetDifficulty) < 0.0001) {
    return { card, applied: false };
  }
  const baseInit = createInitialFSRSState();
  const personalizedInit: FSRSCardState = {
    ...(card.fsrsState ?? baseInit),
    difficulty: targetDifficulty,
    stability: weightsOverride?.[0] ?? baseInit.stability,
  };
  return {
    card: { ...card, fsrsState: personalizedInit },
    applied: true,
  };
}

/**
 * Convert FSRS result to Card-compatible SRS values
 * This ensures backward compatibility with the existing Card interface
 */
export function fsrsToCardResult(result: FSRSScheduleResult): {
  interval: number;
  easeFactor: number;
  repetition: number;
  fsrsState: FSRSCardState;
} {
  // Convert FSRS stability/difficulty back to SM-2 ease factor for compatibility
  // This allows the existing UI and database to work without changes
  const easeFactor = Math.max(1.3, 1.3 + (10 - result.difficulty) * 0.12);
  
  const fsrsState: FSRSCardState = {
    stability: result.stability,
    difficulty: result.difficulty,
    elapsedDays: 0,
    scheduledDays: result.interval,
    repetitions: result.repetitions,
    lapses: result.lapses,
    lastReview: Date.now(),
  };
  
  return {
    interval: result.interval,
    easeFactor: Math.round(easeFactor * 100) / 100,
    repetition: result.repetitions,
    fsrsState,
  };
}

/**
 * Predict retention rate for a given interval
 */
export function predictRetention(stability: number, intervalDays: number): number {
  return forgettingCurve(intervalDays, stability);
}

/**
 * Calculate optimal interval for target retention
 */
export function optimalInterval(stability: number, targetRetention: number = 0.9): number {
  const factor = DEFAULT_WEIGHTS[14];
  const interval = stability * (Math.pow(targetRetention, -1 / factor) - 1) / factor;
  return Math.max(1, Math.round(interval));
}

/**
 * Get FSRS analytics for a set of cards
 */
export interface FSRSAnalytics {
  totalCards: number;
  matureCards: number;     // stability > 21 days
  youngCards: number;      // stability <= 21 days
  newCards: number;        // never reviewed
  averageStability: number;
  averageDifficulty: number;
  averageRetrievability: number;
  predictedRetention: number;
  cardsDueToday: number;
  cardsDueThisWeek: number;
  cardsDueThisMonth: number;
}

export function getFSRSAnalytics(cards: Card[]): FSRSAnalytics {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  let totalCards = 0;
  let matureCards = 0;
  let youngCards = 0;
  let newCards = 0;
  let totalStability = 0;
  let totalDifficulty = 0;
  let totalRetrievability = 0;
  let cardsDueToday = 0;
  let cardsDueThisWeek = 0;
  let cardsDueThisMonth = 0;
  
  for (const card of cards) {
    const state = getFSRSState(card);
    totalCards++;
    
    if (state.repetitions === 0) {
      newCards++;
    } else if (state.stability > 21) {
      matureCards++;
    } else {
      youngCards++;
    }
    
    totalStability += state.stability;
    totalDifficulty += state.difficulty;
    
    const retrievability = calculateRetrievability(state);
    totalRetrievability += retrievability;
    
    // Check due status
    const nextReview = card.nextReview || 0;
    if (nextReview <= now) {
      cardsDueToday++;
    } else if (nextReview <= now + 7 * dayMs) {
      cardsDueThisWeek++;
    } else if (nextReview <= now + 30 * dayMs) {
      cardsDueThisMonth++;
    }
  }
  
  return {
    totalCards,
    matureCards,
    youngCards,
    newCards,
    averageStability: totalCards > 0 ? totalStability / totalCards : 0,
    averageDifficulty: totalCards > 0 ? totalDifficulty / totalCards : 0,
    averageRetrievability: totalCards > 0 ? totalRetrievability / totalCards : 0,
    predictedRetention: totalCards > 0 ? totalRetrievability / totalCards : 0,
    cardsDueToday,
    cardsDueThisWeek,
    cardsDueThisMonth,
  };
}



