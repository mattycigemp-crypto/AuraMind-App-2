// Enhanced SRS optimizer that adapts the algorithm based on user performance
import { Card, Rating, SRSResult } from '../../../types';
import { calculateSRS, getInitialCardState } from '../srs';

interface UserPerformanceMetrics {
  correctStreak: number;
  totalReviews: number;
  correctReviews: number;
  averageResponseTime: number; // milliseconds
  difficultyRating: number; // 1-5 scale
}

interface AdaptiveSRSFactors {
  intervalModifier: number;
  easeFactorModifier: number;
  repetitionBoost: number;
}

export class SRSOptimizer {
  /**
   * Calculate optimized SRS parameters based on user performance
   */
  public static calculateOptimizedSRS(
    card: Card,
    quality: Rating,
    userMetrics: UserPerformanceMetrics
  ): SRSResult {
    // First, get the standard SRS calculation
    const standardResult = calculateSRS(card, quality);
    
    // Then, apply optimizations based on user performance
    const adaptiveFactors = this.calculateAdaptiveFactors(userMetrics);
    
    // Apply the adaptive factors
    const optimizedInterval = Math.round(
      standardResult.interval * adaptiveFactors.intervalModifier
    );
    
    const optimizedEaseFactor = Math.max(
      1.3,
      standardResult.easeFactor + adaptiveFactors.easeFactorModifier
    );
    
    const optimizedRepetition = standardResult.repetition + adaptiveFactors.repetitionBoost;
    
    // Ensure minimum values
    const finalInterval = Math.max(1, optimizedInterval);
    const finalRepetition = Math.max(0, optimizedRepetition);
    
    return {
      interval: finalInterval,
      repetition: finalRepetition,
      easeFactor: optimizedEaseFactor
    };
  }

  /**
   * Calculate adaptive factors based on user performance metrics
   */
  private static calculateAdaptiveFactors(
    metrics: UserPerformanceMetrics
  ): AdaptiveSRSFactors {
    // Calculate performance score (0-1)
    const performanceScore = metrics.totalReviews > 0 
      ? metrics.correctReviews / metrics.totalReviews 
      : 0.5; // Default to neutral if no data
    
    // Calculate streak bonus
    const streakBonus = Math.min(metrics.correctStreak * 0.1, 0.5); // Max 0.5 bonus
    
    // Calculate difficulty adjustment (higher difficulty rating means harder for user)
    const difficultyAdjustment = (metrics.difficultyRating - 3) * 0.05; // Centered around 3
    
    // Calculate response time factor (faster responses = better mastery)
    // Assuming average response time of 5000ms is baseline
    const timeFactor = metrics.averageResponseTime > 0
      ? Math.max(0.5, Math.min(1.5, 5000 / metrics.averageResponseTime))
      : 1.0;
    
    // Calculate interval modifier
    // Better performance = longer intervals (more efficient learning)
    // Worse performance = shorter intervals (more frequent review)
    let intervalModifier = 1.0;
    intervalModifier += (performanceScore - 0.5) * 0.8; // -0.4 to +0.4 based on performance
    intervalModifier += streakBonus; // Add streak bonus
    intervalModifier -= difficultyAdjustment * 0.5; // Adjust for perceived difficulty
    intervalModifier *= timeFactor; // Adjust for response time
    
    // Ensure reasonable bounds
    intervalModifier = Math.max(0.5, Math.min(2.0, intervalModifier));
    
    // Calculate ease factor modifier
    // Better performance = higher ease factor (easier to remember)
    let easeFactorModifier = (performanceScore - 0.5) * 0.4; // -0.2 to +0.2
    easeFactorModifier += streakBonus * 0.3; // Streak bonus
    easeFactorModifier -= difficultyAdjustment * 0.3; // Adjust for difficulty
    
    // Calculate repetition boost
    // Better performance = faster progression through levels
    let repetitionBoost = 0;
    if (performanceScore > 0.8) {
      repetitionBoost = 1; // Advance faster
    } else if (performanceScore < 0.4) {
      repetitionBoost = -1; // Slow down progression
    }
    
    return {
      intervalModifier,
      easeFactorModifier,
      repetitionBoost
    };
  }

  /**
   * Get optimized initial card state
   */
  public static getOptimizedInitialCardState(
    deckId: string,
    question: string,
    answer: string,
    userMetrics?: UserPerformanceMetrics
  ): Card {
    const card = getInitialCardState(deckId, question, answer);
    
    // If we have user metrics, we can adjust the initial state
    if (userMetrics) {
      // Based on user's overall performance, we might start with a different interval
      const performanceScore = userMetrics.totalReviews > 0
        ? userMetrics.correctReviews / userMetrics.totalReviews
        : 0.5;
      
      // Adjust initial interval based on performance
      if (performanceScore > 0.7) {
        // Good performer - start with longer interval
        card.interval = 2; // Start at 2 days instead of 1
      } else if (performanceScore < 0.3) {
        // Struggling learner - start with shorter interval
        card.interval = 1; // Keep at 1 day
        card.easeFactor = 2.0; // Start with slightly lower ease factor
      }
    }
    
    return card;
  }

  /**
   * Predict optimal review time based on learning curve
   */
  public static predictOptimalReviewTime(
    card: Card,
    userMetrics: UserPerformanceMetrics
  ): number {
    const performanceScore = userMetrics.totalReviews > 0
      ? userMetrics.correctReviews / userMetrics.totalReviews
      : 0.5;
    
    // Base prediction on standard SRS
    let predictedInterval = card.interval;
    
    // Adjust based on performance
    if (performanceScore > 0.8) {
      predictedInterval *= 1.5; // Good performers can wait longer
    } else if (performanceScore < 0.4) {
      predictedInterval *= 0.7; // Struggling learners need more frequent review
    }
    
    // Apply streak bonus/penalty
    if (userMetrics.correctStreak >= 5) {
      predictedInterval *= 1.2; // Reward streaks
    } else if (userMetrics.correctStreak === 0) {
      predictedInterval *= 0.8; // Penalty for breaking streak
    }
    
    // Convert to milliseconds and add to last review time
    const baseTime = card.lastReviewed || Date.now();
    return baseTime + (predictedInterval * 24 * 60 * 60 * 1000);
  }

  /**
   * Detect if a user is likely to forget based on performance patterns
   */
  public static predictForgettingLikelihood(
    card: Card,
    userMetrics: UserPerformanceMetrics
  ): number {
    // Returns a value between 0 and 1 representing likelihood of forgetting
    // 0 = very unlikely to forget, 1 = very likely to forget
    
    if (userMetrics.totalReviews === 0) {
      return 0.5; // Neutral for new cards
    }
    
    const performanceScore = userMetrics.correctReviews / userMetrics.totalReviews;
    const timeSinceLastReview = Date.now() - (card.lastReviewed || Date.now());
    const expectedInterval = card.interval * 24 * 60 * 60 * 1000;
    
    // Calculate how far we are into the expected interval
    const intervalProgress = Math.min(1, timeSinceLastReview / expectedInterval);
    
    // Base forgetting likelihood on performance and progress through interval
    let forgettingLikelihood = intervalProgress * (1 - performanceScore);
    
    // Adjust for streak (breaking streaks increases forgetting likelihood)
    if (userMetrics.correctStreak === 0 && userMetrics.totalReviews > 0) {
      forgettingLikelihood *= 1.3;
    }
    
    // Adjust for response time (slower responses indicate weaker memory)
    if (userMetrics.averageResponseTime > 10000) { // Slower than 10 seconds
      forgettingLikelihood *= 1.2;
    } else if (userMetrics.averageResponseTime < 2000) { // Faster than 2 seconds
      forgettingLikelihood *= 0.8;
    }
    
    // Ensure bounds
    return Math.max(0, Math.min(1, forgettingLikelihood));
  }
}

// Export utility functions
export const optimizeSRS = SRSOptimizer.calculateOptimizedSRS.bind(SRSOptimizer);
export const getOptimizedInitialCardState = SRSOptimizer.getOptimizedInitialCardState.bind(SRSOptimizer);
export const predictOptimalReviewTime = SRSOptimizer.predictOptimalReviewTime.bind(SRSOptimizer);
export const predictForgettingLikelihood = SRSOptimizer.predictForgettingLikelihood.bind(SRSOptimizer);


