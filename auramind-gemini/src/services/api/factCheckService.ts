/**
 * AI Fact-Checking Service for Flashcard Verification
 * 
 * This service verifies the accuracy of AI-generated flashcards by
 * cross-referencing claims against reliable sources and detecting
 * potential hallucinations or inaccuracies.
 * 
 * Inspired by competitor features like Forgetless's AI fact-checking.
 */

import { Card } from '../../types';
import { auraAiClient } from './auraAiService';

export interface FactCheckResult {
  cardId: string;
  verified: boolean;
  confidence: number;           // 0-1 confidence score
  issues: FactCheckIssue[];     // List of identified issues
  suggestions: string[];        // Improvement suggestions
  sources: string[];            // Reference sources used for verification
  timestamp: number;
}

export interface FactCheckIssue {
  type: 'hallucination' | 'inaccuracy' | 'outdated' | 'ambiguous' | 'oversimplified';
  severity: 'low' | 'medium' | 'high' | 'critical';
  field: 'question' | 'answer' | 'both';
  description: string;
  suggestion: string;
}

const FACT_CHECK_SYSTEM_PROMPT = `You are an expert fact-checker and subject matter verifier. Your task is to verify the accuracy of flashcard content.

For each flashcard, analyze:
1. **Factual Accuracy**: Are the claims in the question and answer factually correct?
2. **Completeness**: Does the answer provide sufficient context and detail?
3. **Precision**: Is the information precise and unambiguous?
4. **Currency**: Is the information up-to-date (not outdated)?
5. **Appropriate Complexity**: Is the difficulty level appropriate?

Common issues to detect:
- **Hallucination**: Information that appears plausible but is fabricated
- **Inaccuracy**: Factually incorrect statements
- **Outdated**: Information that was once correct but is no longer
- **Ambiguous**: Vague or unclear statements that could be interpreted multiple ways
- **Oversimplified**: Information that loses critical nuance

Respond with a JSON object in this exact format:
{
  "verified": true/false,
  "confidence": 0.0-1.0,
  "issues": [
    {
      "type": "hallucination|inaccuracy|outdated|ambiguous|oversimplified",
      "severity": "low|medium|high|critical",
      "field": "question|answer|both",
      "description": "What is wrong",
      "suggestion": "How to fix it"
    }
  ],
  "suggestions": ["General improvement suggestions"],
  "sources": ["Reference sources or domains that confirm the information"]
}

Be thorough but fair. Only flag genuine issues. If the card is accurate, mark it as verified with high confidence.`;

/**
 * Verify a single flashcard for factual accuracy
 */
export async function verifyCard(card: Card): Promise<FactCheckResult> {
  try {
    const prompt = `Verify this flashcard:

QUESTION: ${card.front}
ANSWER: ${card.back}
${card.sourceLabel ? `SOURCE: ${card.sourceLabel}` : ''}
${card.sourceType ? `SOURCE TYPE: ${card.sourceType}` : ''}

Provide your fact-check analysis in JSON format.`;

    const response = await auraAiClient.chatCompletion({
      messages: [
        { role: 'system', content: FACT_CHECK_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1
    });

    // Parse the JSON response
    const content = response.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return createFallbackResult(card.id, 'Could not parse fact-check response');
    }

    const result = JSON.parse(jsonMatch[0]) as FactCheckResult;
    
    return {
      cardId: card.id,
      verified: result.verified ?? false,
      confidence: result.confidence ?? 0.5,
      issues: result.issues ?? [],
      suggestions: result.suggestions ?? [],
      sources: result.sources ?? [],
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Fact-check error:', error);
    return createFallbackResult(card.id, `Fact-check failed: ${error}`);
  }
}

/**
 * Verify multiple flashcards in batch
 */
export async function verifyCards(cards: Card[], concurrency: number = 3): Promise<FactCheckResult[]> {
  const results: FactCheckResult[] = [];
  
  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < cards.length; i += concurrency) {
    const batch = cards.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(card => verifyCard(card))
    );
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Verify cards in a deck and update their trust scores
 */
export async function verifyDeckCards(
  cards: Card[],
  onUpdate?: (cardId: string, result: FactCheckResult) => void
): Promise<FactCheckResult[]> {
  const results = await verifyCards(cards);
  
  // Calculate trust scores based on verification results
  for (const result of results) {
    const _trustScore = calculateTrustScore(result);
    
    if (onUpdate) {
      onUpdate(result.cardId, result);
    }
  }
  
  return results;
}

/**
 * Calculate a trust score (0-1) based on fact-check results
 */
function calculateTrustScore(result: FactCheckResult): number {
  if (result.verified && result.confidence > 0.8) {
    return 0.9 + (result.confidence * 0.1); // 0.9-1.0
  }
  
  if (result.verified) {
    return 0.7 + (result.confidence * 0.2); // 0.7-0.9
  }
  
  // Deduct for issues based on severity
  let score = 0.5;
  
  for (const issue of result.issues) {
    switch (issue.severity) {
      case 'critical':
        score -= 0.3;
        break;
      case 'high':
        score -= 0.2;
        break;
      case 'medium':
        score -= 0.1;
        break;
      case 'low':
        score -= 0.05;
        break;
    }
  }
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Create a fallback result when fact-checking fails
 */
function createFallbackResult(cardId: string, reason: string): FactCheckResult {
  return {
    cardId,
    verified: false,
    confidence: 0,
    issues: [{
      type: 'ambiguous',
      severity: 'low',
      field: 'both',
      description: `Fact-checking unavailable: ${reason}`,
      suggestion: 'Manually verify this card\'s accuracy'
    }],
    suggestions: ['Review this card manually to ensure accuracy'],
    sources: [],
    timestamp: Date.now(),
  };
}

/**
 * Get verification summary statistics for a deck
 */
export interface VerificationSummary {
  totalCards: number;
  verifiedCards: number;
  unverifiedCards: number;
  averageConfidence: number;
  averageTrustScore: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
}

export function getVerificationSummary(results: FactCheckResult[]): VerificationSummary {
  const totalCards = results.length;
  const verifiedCards = results.filter(r => r.verified).length;
  const unverifiedCards = totalCards - verifiedCards;
  
  const averageConfidence = totalCards > 0
    ? results.reduce((sum, r) => sum + r.confidence, 0) / totalCards
    : 0;
  
  const averageTrustScore = totalCards > 0
    ? results.reduce((sum, r) => sum + calculateTrustScore(r), 0) / totalCards
    : 0;
  
  const countIssues = (severity: string) =>
    results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === severity).length, 0);
  
  return {
    totalCards,
    verifiedCards,
    unverifiedCards,
    averageConfidence,
    averageTrustScore,
    criticalIssues: countIssues('critical'),
    highIssues: countIssues('high'),
    mediumIssues: countIssues('medium'),
    lowIssues: countIssues('low'),
  };
}

/**
 * Generate a corrected version of a card based on fact-check results
 */
export async function correctCard(
  card: Card,
  factCheckResult: FactCheckResult
): Promise<{ question: string; answer: string } | null> {
  if (factCheckResult.verified && factCheckResult.confidence > 0.8) {
    return null; // Card is already accurate
  }
  
  if (factCheckResult.issues.length === 0) {
    return null; // No issues to fix
  }
  
  try {
    const issuesDescription = factCheckResult.issues
      .map(i => `- ${i.field}: ${i.description} (Suggestion: ${i.suggestion})`)
      .join('\n');
    
    const prompt = `Fix this flashcard based on the fact-check results:

ORIGINAL QUESTION: ${card.front}
ORIGINAL ANSWER: ${card.back}

ISSUES FOUND:
${issuesDescription}

Provide a corrected version of the flashcard in JSON format:
{
  "question": "Corrected question",
  "answer": "Corrected answer with accurate information"
}`;

    const response = await auraAiClient.chatCompletion({
      messages: [
        { role: 'system', content: 'You are an expert educator correcting flashcards based on fact-check results. Provide accurate, clear, and well-structured corrections.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    });

    const content = response.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return null;
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Card correction error:', error);
    return null;
  }
}



