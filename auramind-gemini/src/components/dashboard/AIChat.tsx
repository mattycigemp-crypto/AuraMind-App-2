import React from "react";

/**
 * Stub shim for the deleted src/components/dashboard/AIChat.tsx.
 *
 * SourceGroundedChat.tsx still references this file path; the original
 * was a thin wrapper and the chat experience now lives in
 * src/components/chat/AIChatPage.tsx (which the /dashboard/chat route
 * points at). This shim keeps the import alive so downstream code never
 * breaks the build. If you wire SourceGroundedChat into the new hub,
 * replace this stub with the real implementation.
 */
export interface AIChatProps {
  deckId?: string;
  initialCards?: any[];
  onCardsCreated?: (cards: any[]) => void;
}

const AIChat: React.FC<AIChatProps> = () => {
  return null;
};

export default AIChat;
