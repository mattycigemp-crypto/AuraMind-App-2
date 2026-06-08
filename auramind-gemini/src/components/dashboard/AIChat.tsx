import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRightIcon as ArrowRight, BotIcon as Bot, Loader2Icon as Loader2, PlayIcon as Play, 
  SparklesIcon, Wand2Icon as Wand2, PlusIcon as Plus, MessageSquareIcon as MessageSquare, 
  LayersIcon as Layers, BookOpenIcon as BookOpen, ChevronRightIcon as ChevronRight, XIcon as X, 
  ClockIcon as Clock, ZapIcon as Zap, Maximize2Icon as Maximize2, 
  Minimize2Icon as Minimize2, CommandIcon as Command, SendIcon as Send, StopCircleIcon as StopCircle, 
  BookTextIcon as BookText, CheckCircle2Icon as CheckCircle, CircleIcon as Circle, ListIcon as List
} from '../icons/CustomIcons';
import ReactMarkdown from 'react-markdown';
import GlassCard from '../shared/GlassCard';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import { auraAiClient } from '../../services/api/auraAiService';
import { analyticsService } from '../../services/analytics/analyticsService';
import { wordnikService } from '../../services/wordnik/wordnikService';
import { useSourceDocuments } from '../../contexts/SourceDocumentsContext';
import { buildSourceContextForChat } from '../../services/generation/sourceGroundedService';

interface PlanStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface InteractionPlanProps {
  title: string;
  steps: PlanStep[];
  onAction?: (actionId: string) => void;
  actions?: Array<{ id: string; label: string; primary?: boolean }>;
}

const InteractionPlan: React.FC<InteractionPlanProps> = ({ title, steps, onAction, actions }) => {
  return (
    <motion.div 
      className="mt-4 p-5 rounded-2xl border border-violet-500/20 bg-zinc-50 dark:bg-zinc-950/50 shadow-inner overflow-hidden relative group"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <List className="w-4 h-4 text-violet-400" />
          </div>
          <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white italic">{title}</h3>
        </div>

        <div className="space-y-4 mb-6">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-start gap-4 group/step">
              <div className="mt-0.5 shrink-0 relative">
                {step.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]" />
                ) : step.status === 'in_progress' ? (
                  <div className="w-4 h-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                ) : (
                  <Circle className="w-4 h-4 text-zinc-700 group-hover/step:text-zinc-500 transition-colors" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-bold tracking-wide uppercase transition-colors ${
                  step.status === 'completed' ? 'text-zinc-400 line-through decoration-zinc-700' : 
                  step.status === 'in_progress' ? 'text-violet-300' : 'text-zinc-500'
                }`}>
                  {step.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
            {actions.map((action) => (
              <motion.button
                key={action.id}
                onClick={() => onAction?.(action.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  action.primary 
                    ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-600/20' 
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-700'
                }`}
              >
                {action.label}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const AIChat: React.FC = () => {
  const navigate = useNavigate();
  const { decks, cards, createDeck, addCardsToDeck, goToDeck, startStudyForDeck } = useDashboardWorkspace();
  const sourceCtx = (() => {
    try { return useSourceDocuments(); }
    catch { return null; }
  })();
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState<{ id: string; title: string; messages: Array<{ role: 'user' | 'assistant'; content: string; isStreaming?: boolean; editedCards?: any[] }> }[]>([
    { id: '1', title: 'New chat', messages: [] }
  ]);
  const [currentConversationId, setCurrentConversationId] = useState('1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamController, setStreamController] = useState<AbortController | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentConversation = conversations.find(c => c.id === currentConversationId) || conversations[0];
  const messages = currentConversation?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const conversationsRef = useRef(conversations);
  const currentConversationIdRef = useRef(currentConversationId);
  const messagesRef = useRef(messages);
  const streamControllerRef = useRef<AbortController | null>(null);
  const busyRef = useRef(busy);

  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { currentConversationIdRef.current = currentConversationId; }, [currentConversationId]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { streamControllerRef.current = streamController; }, [streamController]);
  useEffect(() => { busyRef.current = busy; }, [busy]);

  const updateMessages = (updater: (msgs: any[]) => any[] | any[]) => {
    const cid = currentConversationIdRef.current;
    setConversations(prev => prev.map(c => c.id === cid 
      ? { ...c, messages: typeof updater === 'function' ? updater(c.messages) : updater } 
      : c
    ));
  };

  const deckOptions = useMemo(() => decks.map((d) => ({ id: d.id, title: d.title })), [decks]);

  const extractFirstJsonObject = (text: string): { data: any, start: number, end: number } | null => {
    const start = text.indexOf('{');
    if (start === -1) return null;
    for (let end = text.length - 1; end > start; end--) {
      if (text[end] !== '}') continue;
      const candidate = text.slice(start, end + 1);
      try {
        const data = JSON.parse(candidate);
        return { data, start, end: end + 1 };
      } catch {
        // keep searching shorter candidates
      }
    }
    return null;
  };

  const runAppAction = async (tool: any) => {
    if (tool?.tool !== 'app_action') return;
    const action = tool?.data?.action as string | undefined;
    const args = tool?.data?.args ?? {};
    analyticsService.trackHeart('task_success', 'ai_operator_run', { action });

    if (action === 'create_deck') {
      try {
        const title = String(args.title ?? 'Untitled deck');
        const description = String(args.description ?? '');
        const deck = await createDeck(title, description);
        if (deck) {
          goToDeck(deck.id);
        }
      } catch (err) {
        console.error('[AIChat] Failed to create deck:', err);
      }
      return;
    }

    if (action === 'add_cards_to_deck') {
      try {
        const deckId = String(args.deckId ?? '');
        const cardsArg = Array.isArray(args.cards) ? args.cards : [];
        if (!deckId || cardsArg.length === 0) return;
        await addCardsToDeck(deckId, cardsArg);
        navigate(`/deck/${deckId}`);
      } catch (err) {
        console.error('[AIChat] Failed to add cards to deck:', err);
      }
      return;
    }

    if (action === 'open_deck') {
      const deckId = String(args.deckId ?? '');
      if (!deckId) return;
      goToDeck(deckId);
      return;
    }

    if (action === 'start_study') {
      const deckId = String(args.deckId ?? '');
      if (!deckId) return;
      startStudyForDeck(deckId);
      return;
    }

    if (action === 'go_to_section') {
      const section = String(args.section ?? '');
      if (!section) return;
      window.dispatchEvent(new CustomEvent('auramind:navigate-section', { detail: { section } }));
    }
  };

  const stopGeneration = useCallback(() => {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
      setStreamController(null);
      setBusy(false);
    }
  }, []);

  const send = async () => {
    const q = input.trim();
    if (!q || busyRef.current) return;
    setInput('');
    setError(null);
    setBusy(true);
    
    const userMessage = { role: 'user' as const, content: q };
    
    updateMessages(prev => [...prev, userMessage]);
    analyticsService.trackCoreAction('chat_message', { source: 'dashboard_ai_chat' });
    analyticsService.trackHeart('engagement', 'ai_chat_send', { length: q.length });

    const currentConv = conversationsRef.current.find(c => c.id === currentConversationIdRef.current);
    if (currentConv?.messages.length === 0) {
      setConversations(prev => prev.map(c => 
        c.id === currentConversationIdRef.current ? { ...c, title: q.slice(0, 40) + (q.length > 40 ? '...' : '') } : c
      ));
    }

    // Check for /define command
    if (q.toLowerCase().startsWith('/define ')) {
      const word = q.slice(8).trim();
      if (word) {
        try {
          const definition = await handleDefineWord(word);
          updateMessages(prev => [...prev, { role: 'assistant' as const, content: definition }]);
        } catch (error) {
          console.error('Definition error:', error);
          updateMessages(prev => [...prev, { 
            role: 'assistant' as const, 
            content: `Sorry, I couldn't find a definition for "${word}".` 
          }]);
        }
      } else {
        updateMessages(prev => [...prev, { 
          role: 'assistant' as const, 
          content: 'Please provide a word to define. Usage: /define [word]' 
        }]);
      }
      setBusy(false);
      return;
    }

    try {
      if (streamControllerRef.current) {
        streamControllerRef.current.abort();
      }
      
      const controller = new AbortController();
      streamControllerRef.current = controller;
      setStreamController(controller);
      
        const sourceContextStr = sourceCtx && sourceCtx.sources.length > 0 && sourceCtx.activeSourceIds.length > 0
          ? buildSourceContextForChat(sourceCtx.sources, sourceCtx.activeSourceIds)
          : '';

        const systemPrompt = {
          role: 'system' as const,
          content: `You are Aura, the AI study companion of **AuraMind** — a full-stack learning platform. You help students understand concepts, think critically, and work with their uploaded source documents.

## About AuraMind
AuraMind is a complete study application with these pages:

- **Dashboard** (/dashboard) — Study stats, XP, streaks, recent activity, retention charts, quick-access to decks and quizzes.
- **Generator** (/dashboard/generator) — The dedicated tool for creating flashcards, quizzes, and study decks from topics, URLs, YouTube videos, or uploaded documents. Has inline editing, difficulty selection, and one-click save.
- **Cards** (/dashboard/cards) — Browse, search, filter, manage all flashcard decks. Study mode with spaced repetition.
- **Chat** (/dashboard/chat) — The AI chat you are in right now.
- **Lessons** (/dashboard/lessons) — Structured lessons combining explanations with embedded quizzes and flashcards.
- **Settings** (/dashboard/settings) — Profile, preferences, theme, account management.

## TEACHING APPROACH (SOCRATIC METHOD)
- NEVER give direct answers to study questions immediately.
- Guide the student to the answer through probing questions.
- Break complex topics into smaller, digestible steps.
- Use analogies and real-world examples.
- Praise correct reasoning and gently correct misconceptions.

## CAPABILITIES
- Answer questions and explain concepts using the Socratic method.
- When the user asks about their uploaded documents, ALWAYS ground your answers in the provided source text. Do not use external knowledge for document-specific questions.

## What You CANNOT Do
You do NOT create flashcards, quizzes, decks, or study content in this chat. If a user asks you to generate any study material, politely redirect them to the **Generator page at /dashboard/generator**, which has dedicated AI tools for that purpose.

INTERACTION PLANS (FOR COMPLEX TASKS):
- When a user asks for something multi-step or complex that can be planned, you may propose a plan using an interaction_plan JSON tool.
- Use the following JSON format to display a plan menu:
  {
    "tool": "interaction_plan",
    "data": {
      "title": "Short Descriptive Title",
      "steps": [
        { "id": "1", "label": "Step description", "status": "pending" | "in_progress" | "completed" }
      ],
      "actions": [
        { "id": "proceed", "label": "Proceed/Generate", "primary": true },
        { "id": "modify", "label": "Edit Scope" }
      ]
    }
  }
- ALWAYS wrap your response in normal text explaining the plan, then provide the JSON object at the end of your message.
- When the user clicks an action, you will receive a message from them (e.g., "Proceed with plan: ...").${sourceContextStr}`
        };
      const conversationHistory = [systemPrompt, ...messagesRef.current, userMessage];
      const response = await auraAiClient.chatCompletion({
        messages: conversationHistory,
        temperature: 0.7,
      });
      const aiResponse = response.choices[0]?.message?.content || 'No response';
      updateMessages(prev => [...prev, { role: 'assistant' as const, content: aiResponse }]);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        const msg = e instanceof Error ? e.message : 'AI request failed';
        console.error('[AIChat] Error:', e);
        setError(msg);
        updateMessages(prev => [...prev, { 
          role: 'assistant' as const, 
          content: `I hit an error: ${msg}` 
        }]);
      }
    } finally {
      setBusy(false);
      streamControllerRef.current = null;
      setStreamController(null);
    }
  };

  const handleDefineWord = async (word: string): Promise<string> => {
    const cleanText = (text: string): string => {
      return text.replace(/<xref>(.*?)<\/xref>/g, '$1').replace(/<\/?xref>/g, '');
    };

    try {
      const wordInfo = await wordnikService.getWordInfo(word);
      
      let response = `## ${wordInfo.word}\n\n`;
      
      if (wordInfo.definitions.length > 0) {
        response += `### Definitions\n`;
        wordInfo.definitions.forEach((def, i) => {
          response += `${i + 1}. ${cleanText(def.text)}\n`;
          if (def.sourceDictionary) {
            response += `   *Source: ${def.sourceDictionary}*\n`;
          }
          response += '\n';
        });
      }
      
      if (wordInfo.examples.length > 0) {
        response += `### Examples\n`;
        wordInfo.examples.forEach((ex, i) => {
          response += `${i + 1}. "${cleanText(ex.text)}"\n`;
          if (ex.title) {
            response += `   — ${ex.title}\n`;
          }
          response += '\n';
        });
      }
      
      if (wordInfo.pronunciations.length > 0) {
        response += `### Pronunciation\n`;
        wordInfo.pronunciations.forEach((pron, i) => {
          response += `${i + 1}. ${pron.raw}\n`;
        });
        response += '\n';
      }
      
      if (wordInfo.relatedWords.length > 0) {
        response += `### Related Words\n`;
        wordInfo.relatedWords.forEach((rel) => {
          if (rel.words.length > 0) {
            response += `**${rel.relationshipType}:** ${rel.words.slice(0, 5).join(', ')}\n\n`;
          }
        });
      }
      
      return response;
    } catch (error) {
      console.error('Word definition error:', error);
      return `Sorry, I couldn't find information for "${word}".`;
    }
  };

  const startNewChat = () => {
    const newId = Date.now().toString();
    setConversations(prev => [{ id: newId, title: 'New chat', messages: [] }, ...prev]);
    setCurrentConversationId(newId);
  };

  const selectConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter(c => c.id !== id);
      if (currentConversationIdRef.current === id) {
        setCurrentConversationId(filtered[0]?.id || '');
      }
      return filtered;
    });
  };

  const quickActions = useMemo(() => {
    const dueCards = cards.filter(c => c.nextReview <= Date.now());
    return [
      {
        id: 'study',
        icon: <BookOpen className="w-5 h-5" />,
        label: 'Study Due Cards',
        description: `${dueCards.length} cards ready`,
        action: () => startStudyForDeck(decks[0]?.id || ''),
        gradient: 'from-violet-500/20 to-purple-600/20',
        border: 'border-violet-500/30',
        iconBg: 'bg-violet-500/20',
        iconColor: 'text-violet-400'
      },
      {
        id: 'create',
        icon: <Layers className="w-5 h-5" />,
        label: 'Generator',
        description: 'Create quizzes & flashcards',
        action: () => navigate('/dashboard/generator'),
        gradient: 'from-blue-500/20 to-cyan-500/20',
        border: 'border-blue-500/30',
        iconBg: 'bg-blue-500/20',
        iconColor: 'text-blue-400'
      },
      {
        id: 'explain',
        icon: <Zap className="w-5 h-5" />,
        label: 'Explain Concept',
        description: 'Get detailed explanations',
        action: () => setInput('Explain the concept of'),
        gradient: 'from-amber-500/20 to-orange-500/20',
        border: 'border-amber-500/30',
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400'
      },
    ];
  }, [cards, decks, startStudyForDeck, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 25 }
    }
  } as const;

  return (
    <div className="flex flex-col gap-0 relative" style={{ height: 'calc(100vh - 8rem)' }}>
      <AnimatePresence>
        {showCommandPalette && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-32"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCommandPalette(false)}
          >
            <motion.div
              className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden"
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
                <input
                  type="text"
                  placeholder="Type a command or search..."
                  className="w-full bg-transparent text-zinc-900 dark:text-white text-lg placeholder-zinc-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="p-2 max-h-80 overflow-y-auto">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.action();
                      setShowCommandPalette(false);
                    }}
                    className="w-full p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left flex items-center gap-3 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${action.iconBg}`}>
                      {React.cloneElement(action.icon, { className: `w-5 h-5 ${action.iconColor}` })}
                    </div>
                    <div>
                      <div className="text-zinc-900 dark:text-white font-medium">{action.label}</div>
                      <div className="text-zinc-600 dark:text-zinc-400 text-sm">{action.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <motion.div 
          className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/30"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20"
            >
              <SparklesIcon className="w-5 h-5 text-white" />
            </motion.button>
            <div>
              <h1 className="text-lg font-bold text-zinc-900 dark:text-white">Aura AI</h1>
              <p className="text-zinc-500 text-xs">Your intelligent study assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setShowCommandPalette(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              title="Command Palette (Ctrl+K)"
            >
              <Command className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={startNewChat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-6 py-8"
        >
          <div className="max-w-3xl mx-auto">
            {messages.length === 0 ? (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <motion.div 
                    className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center border border-violet-500/30"
                    animate={{ 
                      boxShadow: ['0 0 0 rgba(139, 92, 246, 0)', '0 0 40px rgba(139, 92, 246, 0.3)', '0 0 0 rgba(139, 92, 246, 0)'],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Bot className="w-10 h-10 text-violet-400" />
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-zinc-900 via-violet-700 to-zinc-700 dark:from-white dark:via-violet-200 dark:to-zinc-300 bg-clip-text text-transparent">
                    How can Aura help you today?
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-10 text-sm">
                    Explain concepts, get study help, and more.
                  </p>
                  
                  <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {quickActions.map((action) => (
                      <motion.button
                        key={action.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={action.action}
                        className={`relative p-5 rounded-xl bg-gradient-to-br ${action.gradient} border ${action.border} text-left overflow-hidden group transition-all`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <div className="relative z-10">
                          <div className={`inline-flex p-2 rounded-lg ${action.iconBg} mb-3`}>
                            {React.cloneElement(action.icon, { className: `w-5 h-5 ${action.iconColor}` })}
                          </div>
                          <div className="font-semibold text-zinc-900 dark:text-white text-sm mb-1">{action.label}</div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400">{action.description}</div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {messages.map((m, idx) => {
                    const isStreaming = m.isStreaming === true;
                    const toolResult = m.role === 'assistant' && !isStreaming ? extractFirstJsonObject(m.content) : null;
                    const tool = toolResult?.data;
                    const appAction = tool?.tool === 'app_action' ? tool : null;
                    const interactionPlan = tool?.tool === 'interaction_plan' ? tool?.data : null;
                    
                    // Hide only the JSON block that was detected as a tool
                    const displayContent = toolResult 
                      ? (m.content.slice(0, toolResult.start) + m.content.slice(toolResult.end)).trim()
                      : m.content;

                    return (
                      <motion.div
                        key={`${m.role}-${idx}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        layout
                        className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div 
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            m.role === 'assistant' 
                              ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20' 
                              : 'bg-zinc-700'
                          }`}
                        >
                          {m.role === 'assistant' ? (
                            isStreaming ? (
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                            ) : (
                              <Bot className="w-4 h-4 text-white" />
                            )
                          ) : (
                            <span className="text-xs font-bold text-white">U</span>
                          )}
                        </div>

                        <div className={`flex-1 min-w-0 ${m.role === 'user' ? 'flex justify-end' : ''}`}>
                          {isStreaming ? (
                            <motion.div 
                              className="flex items-center gap-2 text-zinc-500 py-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    className="w-1.5 h-1.5 bg-violet-400 rounded-full"
                                    animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                  />
                                ))}
                              </div>
                              <span className="text-xs">Thinking...</span>
                            </motion.div>
                          ) : (
                            <div 
                              className={`inline-block max-w-full px-5 py-4 rounded-2xl ${
                                m.role === 'user'
                                  ? 'bg-gradient-to-br from-violet-600/30 to-purple-600/30 border border-violet-500/30 text-zinc-100'
                                  : 'bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/60 text-zinc-800 dark:text-zinc-200'
                              }`}
                            >
                              <div className="prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown
                                  components={{
                                    code: ({ className, children, ...props }) => {
                                      const match = /language-(\w+)/.exec(className || '');
                                      return match ? (
                                        <pre className="bg-zinc-950/80 rounded-lg p-3 overflow-x-auto border border-zinc-800 my-2">
                                          <code className={className} {...props}>{children}</code>
                                        </pre>
                                      ) : (
                                        <code className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-violet-300 text-xs" {...props}>{children}</code>
                                      );
                                    },
                                    a: ({ href, children }) => (
                                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 hover:underline transition-colors">
                                        {children}
                                      </a>
                                    ),
                                    h1: ({ children }) => <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-2">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-sm font-semibold text-violet-300 mb-1">{children}</h3>,
                                    p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc list-inside text-sm space-y-1 mb-2">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal list-inside text-sm space-y-1 mb-2">{children}</ol>,
                                    li: ({ children }) => <li className="text-zinc-700 dark:text-zinc-300">{children}</li>,
                                    blockquote: ({ children }) => (
                                      <blockquote className="border-l-2 border-violet-500/50 pl-3 text-zinc-400 italic text-sm my-2">{children}</blockquote>
                                    ),
                                    hr: () => <hr className="border-zinc-700/50 my-3" />,
                                    table: ({ children }) => <table className="min-w-full text-sm border border-zinc-700 rounded-lg my-2">{children}</table>,
                                    th: ({ children }) => <th className="border border-zinc-700 px-3 py-2 bg-zinc-800/50 font-semibold text-left">{children}</th>,
                                    td: ({ children }) => <td className="border border-zinc-700 px-3 py-2">{children}</td>,
                                  }}
                                >
                                  {displayContent}
                                </ReactMarkdown>
                              </div>

                              {interactionPlan && (
                                <InteractionPlan 
                                  title={interactionPlan.title}
                                  steps={interactionPlan.steps}
                                  actions={interactionPlan.actions}
                                  onAction={(actionId) => {
                                    if (actionId === 'proceed' || actionId === 'start') {
                                      // Simulate user clicking "Proceed"
                                      setInput(`Proceed with plan: ${interactionPlan.title}`);
                                      setTimeout(() => send(), 100);
                                    } else {
                                      setInput(`Regarding the plan "${interactionPlan.title}": I want to ${actionId}`);
                                    }
                                  }}
                                />
                              )}

                              {appAction && (
                                <motion.div 
                                  className="mt-4 p-3 rounded-xl border border-violet-500/20 bg-violet-500/5"
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.15 }}
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <div>
                                      <div className="text-xs uppercase tracking-wider text-violet-400 font-semibold flex items-center gap-2">
                                        <Wand2 className="w-3.5 h-3.5" />
                                        Action
                                      </div>
                                      <div className="text-sm text-zinc-700 dark:text-zinc-200 mt-1">
                                        <span className="text-zinc-500">Execute:</span>{' '}
                                        <span className="font-medium">{String(appAction?.data?.action ?? '')}</span>
                                      </div>
                                    </div>
                                    <motion.button
                                      onClick={async () => {
                                        try { 
                                          const toolResult = extractFirstJsonObject(m.content);
                                          if (toolResult) await runAppAction(toolResult.data); 
                                        } 
                                        catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
                                      }}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 flex items-center gap-1.5"
                                    >
                                      <Play className="w-3 h-3" />
                                      Run
                                    </motion.button>
                                  </div>
                                </motion.div>
                              )}


                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent">
          <div className="max-w-3xl mx-auto">
            <motion.div 
              className="relative flex items-end gap-2 p-2 rounded-2xl bg-zinc-900/80 border border-zinc-800/60 shadow-xl shadow-black/20"
              whileFocus={{ borderColor: 'rgba(139, 92, 246, 0.4)' }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Message Aura..."
                rows={1}
                className="flex-1 bg-transparent text-white placeholder-zinc-500 resize-none focus:outline-none max-h-40 text-sm leading-relaxed px-3 py-2.5"
                style={{ minHeight: '40px' }}
              />
              {busy ? (
                <motion.button
                  onClick={stopGeneration}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors shrink-0"
                  title="Stop generation"
                >
                  <StopCircle className="w-4 h-4" />
                </motion.button>
              ) : (
                <>
                  <motion.button
                    onClick={() => setInput(prev => prev + '/define ')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-primary hover:border-primary/50 transition-colors shrink-0"
                    title="Define a word"
                  >
                    <BookText className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    onClick={send}
                    disabled={!input.trim()}
                    whileHover={input.trim() ? { scale: 1.05 } : {}}
                    whileTap={input.trim() ? { scale: 0.95 } : {}}
                    className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 transition-all shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </>
              )}
            </motion.div>
            <p className="text-center text-xs text-zinc-600 mt-2.5">
              Aura can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;



