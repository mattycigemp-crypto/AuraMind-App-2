import { useState, useRef, useCallback } from 'react';
import { auraAiClient } from '../services/api/auraAiService';
import { buildSystemPrompt, type ChatMode } from '../lib/chat-prompts';

export type { ChatMode };

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  rawContent: string;
  hasSaveCard: boolean;
  saveCardData?: { term: string; definition: string };
  quizBlock?: {
    question: string;
    options: string[];
    correctIndex: number;
    userAnswer?: number;
  };
  timestamp: Date;
}

export interface ChatContext {
  deckId: string;
  deckName: string;
  deckCardCount: number;
  cardsDueToday: number;
  weakCards: Array<{ term: string; againCount: number }>;
  currentCard?: { term: string; definition: string };
}

const SAVE_CARD_REGEX = /\{"save_card"\s*:\s*true\s*,\s*"term"\s*:\s*"([^"]+)"\s*,\s*"definition"\s*:\s*"([^"]+)"\s*\}/;

function parseQuizBlock(content: string): Message['quizBlock'] | undefined {
  const lines = content.split('\n');
  let questionLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.match(/^[A-Z]\.\s/) || line.match(/^\d+\.\s/)) {
      if (questionLine === -1) questionLine = i - 1;
    }
  }

  if (questionLine === -1) return undefined;

  const question = lines[questionLine].replace(/^Q\d*:?\s*/i, '').trim();
  const options: string[] = [];
  let correctIndex = 0;

  for (let i = questionLine + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(/^([A-D])[\.\)]\s*(.+)/);
    if (match) {
      const idx = match[1].charCodeAt(0) - 65;
      options.push(match[2].trim());
      if (line.includes('**') || line.includes('✓') || line.includes('(correct)')) {
        correctIndex = idx;
      }
    }
  }

  if (options.length < 2) return undefined;

  return { question, options, correctIndex };
}

function stripJsonFromContent(content: string): string {
  return content.replace(SAVE_CARD_REGEX, '').replace(/\n{3,}/g, '\n\n').trim();
}

let messageIdCounter = 0;

export function useAIChat(initialContext: ChatContext) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<ChatMode>('explain');
  const [context, setContext] = useState<ChatContext>(initialContext);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (isStreaming || !content.trim()) return;

    const userMessage: Message = {
      id: `msg-${++messageIdCounter}-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      rawContent: content.trim(),
      hasSaveCard: false,
      timestamp: new Date(),
    };

    const assistantId = `msg-${++messageIdCounter}-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      rawContent: '',
      hasSaveCard: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);

    const systemPrompt = buildSystemPrompt({ ...context, mode });
    const apiMessages = [
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.rawContent })),
      { role: 'user' as const, content: content.trim() },
    ];

    let fullContent = '';

    try {
      const stream = auraAiClient.streamChatCompletion({
        messages: [{ role: 'system', content: systemPrompt }, ...apiMessages],
        temperature: 0.7,
        max_tokens: 2000,
      });

      for await (const chunk of stream) {
        fullContent += chunk;
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, rawContent: fullContent, content: fullContent } : m
        ));
      }

      // Parse save_card JSON
      const saveMatch = fullContent.match(SAVE_CARD_REGEX);
      const cleanContent = stripJsonFromContent(fullContent);

      // Try to parse quiz block from content
      const quizBlock = parseQuizBlock(fullContent);

      setMessages(prev => prev.map(m => {
        if (m.id !== assistantId) return m;
        return {
          ...m,
          content: cleanContent,
          rawContent: fullContent,
          hasSaveCard: !!saveMatch,
          saveCardData: saveMatch ? { term: saveMatch[1], definition: saveMatch[2] } : undefined,
          quizBlock: quizBlock && !saveMatch ? quizBlock : undefined,
        };
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'AI request failed';
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: errorMsg, rawContent: errorMsg } : m
      ));
    } finally {
      setIsStreaming(false);
    }
  }, [context, mode, messages, isStreaming]);

  const saveCard = useCallback(async (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg?.saveCardData) return;

    // Dynamically import to avoid circular deps
    const { useDashboardWorkspace } = await import('../contexts/DashboardWorkspaceContext');
    // Note: This must be called from a component that has the provider.
    // The actual save is handled by the component via addCardsToDeck.
    // This hook just exposes the data.
  }, [messages]);

  const answerQuiz = useCallback((messageId: string, answerIndex: number) => {
    setMessages(prev => {
      const updated = prev.map(m => {
        if (m.id !== messageId || !m.quizBlock) return m;
        return {
          ...m,
          quizBlock: { ...m.quizBlock, userAnswer: answerIndex },
        };
      });
      return updated;
    });

    // Send follow-up with the answer
    const msg = messages.find(m => m.id === messageId);
    if (msg?.quizBlock) {
      const selectedOption = msg.quizBlock.options[answerIndex];
      sendMessage(`I answered: ${selectedOption}`);
    }
  }, [messages, sendMessage]);

  const updateContext = useCallback((newContext: Partial<ChatContext>) => {
    setContext(prev => ({ ...prev, ...newContext }));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    mode,
    setMode,
    context,
    updateContext,
    isStreaming,
    sendMessage,
    saveCard,
    answerQuiz,
    clearMessages,
  };
}
