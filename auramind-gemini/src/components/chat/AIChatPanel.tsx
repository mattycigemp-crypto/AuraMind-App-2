import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Send } from 'lucide-react';
import { useAIChat, type ChatContext, type ChatMode } from '../../hooks/useAIChat';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import ContextStrip from './ContextStrip';
import ChatMessage from './ChatMessage';
import SuggestedPrompts from './SuggestedPrompts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  context: ChatContext;
  /** Optional override — callers outside DashboardWorkspaceProvider (e.g. StudyModePage)
   *  can pass their own save handler. Falls back to workspace.addCardsToDeck. */
  onSaveCard?: (deckId: string, cards: Array<{ front: string; back: string }>) => Promise<number | undefined>;
}

const MODE_LABELS: Record<ChatMode, string> = {
  explain: 'Explain',
  quiz: 'Quiz me',
  generate: 'Generate',
  free: 'Free',
};

const MODES: ChatMode[] = ['explain', 'quiz', 'generate', 'free'];

export default function AIChatPanel({ isOpen, onClose, context, onSaveCard }: Props) {
  const workspaceAddCards = useDashboardWorkspace()?.addCardsToDeck;
  const effectiveAddCardsToDeck = onSaveCard ?? workspaceAddCards;
  const chat = useAIChat(context);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages.length]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || chat.isStreaming) return;
    chat.sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveCard = useCallback(async (_messageId: string, term: string, definition: string) => {
    if (!effectiveAddCardsToDeck) return;
    try {
      await effectiveAddCardsToDeck(context.deckId, [{ front: term, back: definition }]);
    } catch {
      // Silently fail — caller can show their own toast
    }
  }, [effectiveAddCardsToDeck, context.deckId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-[420px] max-w-[100vw] z-50 bg-zinc-950 border-l border-zinc-800 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-800 shrink-0">
              <span className="text-sm font-medium text-zinc-100">Ask Aura</span>
              <div className="flex items-center gap-2">
                {/* Mode toggle */}
                <div className="flex bg-zinc-900 rounded-lg p-0.5">
                  {MODES.map(m => (
                    <button
                      key={m}
                      onClick={() => chat.setMode(m)}
                      className={`text-xs px-3 py-1.5 rounded-md transition-colors duration-150 ${
                        chat.mode === m
                          ? 'bg-zinc-700 text-zinc-100'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {MODE_LABELS[m]}
                    </button>
                  ))}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors duration-150"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Context strip */}
            <ContextStrip
              deckName={context.deckName}
              cardsDueToday={context.cardsDueToday}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {chat.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-sm text-zinc-400 mb-1">Stuck on this card?</p>
                  <p className="text-xs text-zinc-600 mb-4">
                    I can explain it, give you an analogy, quiz you, or turn the concept into new cards.
                  </p>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {['Explain this', 'Give analogy', 'Quiz me'].map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => chat.sendMessage(prompt)}
                        className="text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1.5 hover:border-purple-600 hover:text-zinc-200 transition-colors duration-150"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chat.messages.map(msg => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isStreaming={chat.isStreaming && msg.id === chat.messages[chat.messages.length - 1]?.id}
                  onSaveCard={handleSaveCard}
                  onAnswerQuiz={chat.answerQuiz}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested prompts */}
            {chat.messages.length > 0 && !chat.isStreaming && (
              <SuggestedPrompts
                mode={chat.mode}
                deckName={context.deckName}
                currentCardTerm={context.currentCard?.term}
                onSelect={(prompt) => chat.sendMessage(prompt)}
              />
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-zinc-800 flex gap-2 shrink-0">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  context.currentCard
                    ? 'Ask about this card...'
                    : `Ask about ${context.deckName}...`
                }
                rows={1}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-600 resize-none min-h-[40px] max-h-[120px]"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || chat.isStreaming}
                className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-colors duration-150"
              >
                {chat.isStreaming ? (
                  <Loader2 size={16} className="text-zinc-50 animate-spin" />
                ) : (
                  <Send size={16} className="text-zinc-50" />
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
