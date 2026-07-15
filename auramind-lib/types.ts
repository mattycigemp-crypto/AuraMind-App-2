/**
 * AuraMind shared types
 */

export type ViewKey =
  | "landing"
  | "auth"
  | "dashboard"
  | "study"
  | "chat"
  | "admin"
  | "health"
  | "settings";

export type AuthMode = "login" | "signup";

export type StudyRating = "again" | "hard" | "good" | "easy";

export type ChatMode = "explain" | "quiz" | "generate" | "freechat";

export interface Deck {
  id: string;
  name: string;
  category: string;
  dueCount: number;
  totalCards: number;
  retention: number;
  lastStudied: string;
  status: "healthy" | "falling-behind" | "no-due" | "weak-spots";
}

export interface FlashcardData {
  id: string;
  deckName: string;
  category: string;
  front: string;
  back: string;
  explanation?: string;
  mnemonic?: string;
  cardNumber: number;
  totalCards: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    selectedIndex?: number;
  };
}

export interface HealthCheck {
  id: string;
  name: string;
  status: "pass" | "warn" | "fail";
  duration: string;
  details: string;
  category: string;
}

export interface IssueItem {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  body: string;
  fix?: string;
  affected?: string[];
}

export interface CategoryScore {
  name: string;
  emoji: string;
  score: number;
}

export interface AdminUser {
  id: string;
  email: string;
  plan: "free" | "pro";
  cards: number;
  lastActive: string;
  churned: boolean;
}
