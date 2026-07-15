import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Send, Sparkles, ArrowLeft } from 'lucide-react';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import { useAIChat, type ChatContext, type ChatMode } from '../../hooks/useAIChat';
import { supabase } from '../../services/database/supabase';
import { dbService } from '../../services/database/dbService';
import type { Deck, Card } from '../../types';
import ContextStrip from './ContextStrip';
import ChatMessage from './ChatMessage';
import SuggestedPrompts from './SuggestedPrompts';
import PageShell from '../dashboard/PageShell';

const MODE_LABELS: Record<ChatMode, string> = {
  explain: 'Explain',
  quiz: 'Quiz me',
  generate: 'Generate',
  free: 'Free chat',
};

const MODES: ChatMode[] = ['explain', 'quiz', 'generate', 'free'];

function buildInitialContext(decks: Deck[], cards: Card[]): ChatContext {
  const deck = decks[0];
  const dueCount = cards.filter(c => c.deckId === deck?.id && c.nextReview <= Date.now()).length;
  return {
    deckId: deck?.id || '',
    deckName: deck?.title || 'No deck selected',
    deckCardCount: deck?.cardCount || 0,
    cardsDueToday: dueCount,
    weakCards: [],
  };
}

export default function AIChatPage() {
  const navigate = useNavigate();
  const workspace = useDashboardWorkspace();
  const [localDecks, setLocalDecks] = useState<Deck[]>([]);
  const [localCards, setLocalCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [context, setContext] = useState<ChatContext>(() =>
    buildInitialContext(workspace?.decks ?? [], workspace?.cards ?? []),
  );

  const decks = workspace?.decks ?? localDecks;
  const cards = workspace?.cards ?? localCards;
  const selectedDeck = decks.find(d => d.id === selectedDeckId) || decks[0];
  const dueCount = cards.filter(c => c.deckId === selectedDeck?.id && c.nextReview <= Date.now()).length;

  useEffect(() => {
    if (workspace) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id;
        if (!uid || cancelled) { setLoading(false); return; }
        const [fetchedDecks, fetchedCards] = await Promise.all([
          dbService.fetchDecks(uid),
          dbService.fetchCards(uid),
        ]);
        if (cancelled) return;
        setLocalDecks(fetchedDecks);
        setLocalCards(fetchedCards);
        if (fetchedDecks.length > 0) {
          setSelectedDeckId(fetchedDecks[0].id);
          setContext(buildInitialContext(fetchedDecks, fetchedCards));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [workspace]);

  useEffect(() => {
    if (workspace && workspace.decks.length > 0 && !selectedDeckId) {
      setSelectedDeckId(workspace.decks[0].id);
      setContext(buildInitialContext(workspace.decks, workspace.cards));
    }
  }, [workspace, selectedDeckId]);

  useEffect(() => {
    if (selectedDeck) {
      const due = cards.filter(c => c.deckId === selectedDeck.id && c.nextReview <= Date.now()).length;
      setContext(prev => ({
        ...prev,
        deckId: selectedDeck.id,
        deckName: selectedDeck.title,
        deckCardCount: selectedDeck.cardCount ?? cards.filter(c => c.deckId === selectedDeck.id).length,
        cardsDueToday: due,
      }));
    }
  }, [selectedDeck, cards]);

  const chat = useAIChat(context);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages.length]);

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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-6 lg:px-8 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between py-4 border-b border-[#2A2A3A]/50 shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {!workspace && (
              <button onClick={() => navigate('/dashboard')}
                className="w-7 h-7 rounded-lg bg-[#111118] border border-[#2A2A3A] flex items-center justify-center text-[#5A5A72] hover:text-[#F0EFFE] transition-colors"
              ><ArrowLeft size={14} /></button>
            )}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] flex items-center justify-center text-white"><Sparkles size={12} /></span>
              <h1 className="text-[#F0EFFE] text-sm font-medium">AI Tutor</h1>
            </div>
            {selectedDeck && (
              <span className="px-2 py-0.5 rounded-full bg-[#7C3AED]/10 text-[#8B5CF6] text-[10px] font-medium">
                {selectedDeck.title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {decks.length > 0 && (
              <select
                value={selectedDeck?.id || ''}
                onChange={e => setSelectedDeckId(e.target.value)}
                className="bg-[#111118] border border-[#2A2A3A] rounded-lg px-3 py-1.5 text-[#F0EFFE] text-xs outline-none focus:border-[#7C3AED]/50"
              >
                {decks.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            )}
            <div className="flex bg-[#111118] border border-[#2A2A3A] rounded-lg p-0.5">
              {MODES.map(mode => (
                <button
                  key={mode}
                  onClick={() => chat.setMode(mode)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                    chat.mode === mode
                      ? 'bg-[#7C3AED]/15 text-[#8B5CF6]'
                      : 'text-[#5A5A72] hover:text-[#F0EFFE]'
                  }`}
                >
                  {MODE_LABELS[mode]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Context Strip */}
        {selectedDeck && (
          <div className="py-2 border-b border-[#2A2A3A]/30">
            <ContextStrip
              deckName={selectedDeck.title}
              cardsDueToday={dueCount}
              lastReviewed="2h ago"
            />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {chat.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] flex items-center justify-center text-white mb-4"><Sparkles size={24} /></div>
                <h2 className="text-[#F0EFFE] text-base font-light mb-2">What do you want to study?</h2>
                <p className="text-[#5A5A72] text-xs mb-6">Ask Aura to explain a concept, quiz you, or generate new cards.</p>
                <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                  {[
                    { label: 'Explain this card', prompt: 'Explain the current card in simpler terms' },
                    { label: 'Quiz me on weak spots', prompt: 'Quiz me on concepts I struggle with' },
                    { label: 'Generate follow-up cards', prompt: 'Make 5 follow-up cards from this topic' },
                    { label: 'Give me a mnemonic', prompt: 'Give me a mnemonic for this concept' },
                  ].map((s, i) => (
                    <button
                      key={i}
                      onClick={() => chat.sendMessage(s.prompt)}
                      className="text-left p-3 rounded-lg bg-[#111118] border border-[#2A2A3A] hover:border-[#3A3A4F] text-[#F0EFFE] text-xs transition-all"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {chat.messages.map(msg => (
                  <ChatMessage key={msg.id} message={msg} onSaveCard={chat.saveCard} />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}

            {!chat.isStreaming && chat.messages.length > 0 && (
              <SuggestedPrompts
                mode={chat.mode}
                onSelect={chat.sendMessage}
                deckName={context.deckName}
              />
            )}
          </div>
        </div>

        {/* Input */}
        <div className="py-4 border-t border-[#2A2A3A]/50 shrink-0">
          <div className="max-w-4xl mx-auto flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Aura anything..."
              rows={1}
              className="flex-1 bg-[#111118] border border-[#2A2A3A] rounded-xl px-4 py-3 text-[#F0EFFE] text-sm placeholder-[#5A5A72] outline-none focus:border-[#7C3AED]/50 resize-none max-h-[120px]"
              disabled={chat.isStreaming}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || chat.isStreaming}
              className="w-10 h-10 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center hover:bg-[#6D28D9] transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-[0_0_15px_rgba(124,58,237,0.2)]"
            >
              {chat.isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
