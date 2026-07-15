export type ChatMode = 'explain' | 'quiz' | 'generate' | 'free';

interface PromptContext {
  deckName: string;
  deckCardCount: number;
  cardsDueToday: number;
  weakCards: Array<{ term: string; againCount: number }>;
  currentCard?: { term: string; definition: string };
  mode: ChatMode;
}

const MODE_INSTRUCTIONS: Record<ChatMode, string> = {
  explain: `Explain the current card concept clearly. Use analogies and examples. Identify the common misconception that likely caused the user to get it wrong. End with a follow-up question to check understanding.`,
  quiz: `Ask the user a question about their weak cards. Present 4 multiple-choice options labeled A-D. After they answer, give brief feedback. If you generate a card worth saving, end with a JSON block on its own line: {"save_card": true, "term": "...", "definition": "..."}`,
  generate: `Generate flashcards conversationally. Suggest 2-3 cards at a time. End each card suggestion with a JSON block on its own line: {"save_card": true, "term": "...", "definition": "..."}. Keep terms concise and definitions clear.`,
  free: `Answer freely with full context of the user's deck and performance. Identify patterns in their weak areas. Suggest specific study actions.`,
};

export function buildSystemPrompt(context: PromptContext): string {
  const lines: string[] = [
    'You are a study tutor for AuraMind.',
    '',
    `Deck: ${context.deckName} (${context.deckCardCount} cards)`,
    `Cards due today: ${context.cardsDueToday}`,
  ];

  if (context.weakCards.length > 0) {
    lines.push('');
    lines.push('Weak cards (rated Again multiple times):');
    for (const card of context.weakCards) {
      lines.push(`- "${card.term}" (forgotten ${card.againCount} times)`);
    }
  }

  if (context.currentCard) {
    lines.push('');
    lines.push(`Current card:`);
    lines.push(`Front: ${context.currentCard.term}`);
    lines.push(`Back: ${context.currentCard.definition}`);
  }

  lines.push('');
  lines.push(`Mode: ${context.mode}`);
  lines.push('');
  lines.push(MODE_INSTRUCTIONS[context.mode]);
  lines.push('');
  lines.push('Keep responses under 150 words unless the user asks for detail.');

  return lines.join('\n');
}
