export type CardSourceType = 'sample' | 'import' | 'ai' | 'lecture' | 'notes' | 'research' | 'manual';

export interface CardCitation {
  id: string;
  label: string;
  excerpt?: string;
  locator?: string;
  sourceType: CardSourceType;
}

export interface Card {
  id: string;
  question: string;
  answer: string;
  deckId: string;
  image?: string; // Optional image URL
  citations?: CardCitation[];
  sourceLabel?: string;
  sourceType?: CardSourceType;
  trustScore?: number;
  // Spaced Repetition System (SRS) data
  nextReview: number; // Timestamp
  interval: number; // Days
  easeFactor: number;
  repetition: number;
  lastReviewed?: number; // Timestamp of last review
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  cardCount: number;
  isSample?: boolean;
  sourceLabel?: string;
}

export enum ViewState {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  DECK_DETAIL = 'DECK_DETAIL',
  STUDY_MODE = 'STUDY_MODE',
  GENERATE_CARDS = 'GENERATE_CARDS',
  AURA_CHAT = 'AURA_CHAT',
  VAULT = 'VAULT',
  DEEPSEEK_CHAT = 'DEEPSEEK_CHAT',
}

// Spaced Repetition Quality ratings
export enum Rating {
  AGAIN = 0, // Forgot completely
  HARD = 3,  // Remembered with difficulty
  GOOD = 4,  // Remembered with hesitation
  EASY = 5,  // Remembered easily
}

export interface SRSResult {
  interval: number;
  repetition: number;
  easeFactor: number;
}

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
  toggleTheme: () => void
}

// Study Agent Types
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
}

export interface FlashcardData {
  question: string;
  answer: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  citations?: CardCitation[];
  sourceLabel?: string;
  sourceType?: CardSourceType;
}

export interface StudyToolAction {
  tool: 'generate_quiz' | 'explain_concept' | 'generate_flashcards' | 'create_cards' | 'schedule_review' | 'track_progress';
  data: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking?: string;
  toolAction?: StudyToolAction;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'Starter' | 'Pro' | 'Scholar';
  streak: number;
  joinedDate: number;
  isAdmin?: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  phone?: string;
  lastStudyDate?: string;
}
