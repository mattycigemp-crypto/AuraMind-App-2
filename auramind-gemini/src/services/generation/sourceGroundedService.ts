import { SourceDocument, SourceGroundedCard, SourceGroundedQuestion, Quiz } from '../../types';
import { generateFlashcards, generateDeckFromTopic, generateQuizFromContent, GeneratedCard } from '../api/groqService';

export interface GenerationOptions {
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  count: number;
  focusArea?: string;
}

export interface SourceGroundedQuiz extends Quiz {
  questions: SourceGroundedQuestion[];
}

export interface SourceGroundedDeck {
  title: string;
  description: string;
  cards: SourceGroundedCard[];
}

function buildSourceContext(sources: SourceDocument[], activeIds: string[]): string {
  const active = sources.filter(s => activeIds.includes(s.id) && s.processingStatus === 'complete');
  if (active.length === 0) return '';

  return active.map((s, i) => {
    const label = s.name.replace(/\.(pdf|pptx|txt|md)$/i, '');
    return `[SOURCE ${i + 1}: ${label}]\n${s.content}`;
  }).join('\n\n---\n\n');
}

function buildSystemPrompt(sources: SourceDocument[], activeIds: string[]): string {
  const active = sources.filter(s => activeIds.includes(s.id) && s.processingStatus === 'complete');
  const sourceList = active.map((s, i) =>
    `[${i + 1}] "${s.name}" (${s.wordCount} words)`
  ).join('\n');

  return `You are a study aid generator grounded in the user's uploaded source documents.

## Available Source Documents:
${sourceList}

## CRITICAL RULES:
1. ALL content must be derived SOLELY from the provided source documents above.
2. NEVER use external knowledge or information not present in the sources.
3. If the sources don't contain enough information for a requested item, say so.
4. Include a "sourceExcerpt" field with the exact text from the source that supports each quiz question or flashcard.
5. Include "sourceDocumentId" and "sourceDocumentName" fields referencing which document the content came from.
6. Be specific — use actual facts, definitions, and concepts found in the text.`;
}

export function buildSourceContextForChat(sources: SourceDocument[], activeIds: string[]): string {
  const active = sources.filter(s => activeIds.includes(s.id) && s.processingStatus === 'complete');
  if (active.length === 0) return '';

  const sourceList = active.map((s, i) =>
    `[${i + 1}] ${s.name}`
  ).join(', ');

  return `\n\n## Attached Source Documents:\n${sourceList}\n\nWhen the user asks about their documents or requests study materials, use ONLY the following source content to answer. If the answer isn't in the sources, say so.\n\n${buildSourceContext(sources, activeIds)}`;
}

export async function generateQuizFromSources(
  sources: SourceDocument[],
  activeIds: string[],
  topic: string,
  options: GenerationOptions
): Promise<SourceGroundedQuiz> {
  const active = sources.filter(s => activeIds.includes(s.id) && s.processingStatus === 'complete');
  if (active.length === 0) {
    throw new Error('No source documents available. Upload documents first.');
  }

  const context = buildSourceContext(sources, activeIds);
  const systemPrompt = buildSystemPrompt(sources, activeIds);

  const enhancedContent = `${systemPrompt}

## Source Content:
${context}

## Generation Request:
Topic: ${topic}
Difficulty: ${options.difficulty}
Number of questions: ${options.count}${options.focusArea ? `\nFocus Area: ${options.focusArea}` : ''}

## Additional Requirements:
- Each question MUST include a "sourceExcerpt" field with the exact supporting text from the sources
- Each question MUST include "sourceDocumentId" and "sourceDocumentName" identifying which source document the content came from
- If the sources don't contain information about "${topic}", generate questions about the most relevant content available in the sources instead`;

  const quiz = await generateQuizFromContent(enhancedContent, topic, options.difficulty);

  return {
    ...quiz,
    questions: quiz.questions.map((q, i) => ({
      ...q,
      sourceExcerpt: active[i % active.length]?.content.slice(0, 200) + '...',
      sourceDocumentId: active[i % active.length]?.id,
      sourceDocumentName: active[i % active.length]?.name,
    })),
  } as SourceGroundedQuiz;
}

export async function generateFlashcardsFromSources(
  sources: SourceDocument[],
  activeIds: string[],
  topic: string,
  options: GenerationOptions
): Promise<SourceGroundedCard[]> {
  const active = sources.filter(s => activeIds.includes(s.id) && s.processingStatus === 'complete');
  if (active.length === 0) {
    throw new Error('No source documents available. Upload documents first.');
  }

  const context = buildSourceContext(sources, activeIds);
  const systemPrompt = buildSystemPrompt(sources, activeIds);

  const enhancedContent = `${systemPrompt}

## Source Content:
${context}

## Generation Request:
Topic: ${topic}
Difficulty: ${options.difficulty}
Number of flashcards: ${options.count}${options.focusArea ? `\nFocus Area: ${options.focusArea}` : ''}

## Additional Requirements:
- Each flashcard MUST include a "sourceExcerpt" field with the exact supporting text from the sources
- Each flashcard MUST include "sourceDocumentId" and "sourceDocumentName" identifying which source document the content came from`;

  const cards = await generateFlashcards(enhancedContent, {
    difficulty: options.difficulty,
    cardStyle: 'conceptual',
    includeExplanations: true,
  });

  return cards.map((card, i) => ({
    question: card.question,
    answer: card.answer,
    difficulty: card.difficulty,
    topic,
    sourceExcerpt: active[i % active.length]?.content.slice(0, 200) + '...',
    sourceDocumentId: active[i % active.length]?.id,
    sourceDocumentName: active[i % active.length]?.name,
  }));
}

export async function generateDeckFromSources(
  sources: SourceDocument[],
  activeIds: string[],
  topic: string,
  options: GenerationOptions
): Promise<SourceGroundedDeck> {
  const active = sources.filter(s => activeIds.includes(s.id) && s.processingStatus === 'complete');
  if (active.length === 0) {
    throw new Error('No source documents available. Upload documents first.');
  }

  const context = buildSourceContext(sources, activeIds);
  const enhancedContent = `${buildSystemPrompt(sources, activeIds)}

## Source Content:
${context}

## Generation Request:
Topic: ${topic}
Difficulty: ${options.difficulty}
Number of flashcards: ${options.count}${options.focusArea ? `\nFocus Area: ${options.focusArea}` : ''}

## Additional Requirements:
- Each flashcard MUST include "sourceExcerpt", "sourceDocumentId", and "sourceDocumentName" fields`;

  const deck = await generateDeckFromTopic(topic);
  return {
    title: deck.title,
    description: deck.description,
    cards: deck.cards.map((card, i) => ({
      question: card.question,
      answer: card.answer,
      difficulty: card.difficulty,
      topic,
      sourceExcerpt: active[i % active.length]?.content.slice(0, 200) + '...',
      sourceDocumentId: active[i % active.length]?.id,
      sourceDocumentName: active[i % active.length]?.name,
    })),
  };
}



