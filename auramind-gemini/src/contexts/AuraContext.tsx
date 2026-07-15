import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type AuraEntrypoint =
  | 'card-again'       // User hit "Again" on a card
  | 'quiz-wrong'       // User got quiz question wrong
  | 'deck-ask'         // User wants to ask about a deck
  | 'cards-improve'    // User wants to improve generated cards
  | 'standalone';      // Opened /tutor directly

export interface AuraContextCard {
  id: string;
  front: string;
  back: string;
  tags?: string[];
  difficulty?: number;
  lastReview?: string;
  nextReview?: string;
}

export interface AuraContextDeck {
  id: string;
  name: string;
  description?: string;
  cardCount: number;
  subject?: string;
}

export interface AuraContextQuiz {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  isCorrect: boolean;
}

export interface AuraContextSession {
  sessionId: string;
  deckId: string;
  cardsReviewed: number;
  cardsRemaining: number;
  correctCount: number;
  wrongCount: number;
}

export interface StudyContext {
  entrypoint: AuraEntrypoint;
  card?: AuraContextCard;
  deck?: AuraContextDeck;
  quiz?: AuraContextQuiz;
  session?: AuraContextSession;
  cards?: AuraContextCard[];  // For improve-cards flow
  timestamp: number;
}

interface AuraContextValue {
  studyContext: StudyContext | null;
  setStudyContext: (ctx: StudyContext | null) => void;
  clearContext: () => void;
  hasContext: boolean;
}

const AuraContext = createContext<AuraContextValue | null>(null);

export function AuraContextProvider({ children }: { children: ReactNode }) {
  const [studyContext, setStudyContextState] = useState<StudyContext | null>(null);

  const setStudyContext = useCallback((ctx: StudyContext | null) => {
    setStudyContextState(ctx);
  }, []);

  const clearContext = useCallback(() => {
    setStudyContextState(null);
  }, []);

  return (
    <AuraContext.Provider
      value={{
        studyContext,
        setStudyContext,
        clearContext,
        hasContext: studyContext !== null,
      }}
    >
      {children}
    </AuraContext.Provider>
  );
}

export function useAuraContext() {
  const ctx = useContext(AuraContext);
  if (!ctx) throw new Error('useAuraContext must be used within AuraContextProvider');
  return ctx;
}
