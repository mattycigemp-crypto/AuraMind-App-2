import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  BotIcon as Bot, SendIcon as Send, PlusIcon as Plus,
  BookOpenIcon as BookOpen, LayersIcon as Layers, ZapIcon as Zap,
  StopCircleIcon as StopCircle,
  Loader2Icon as Loader2, SearchIcon as Search, MessageSquareIcon as MessageSquare,
  Trash2Icon as Trash2, ChevronLeftIcon as ChevronLeft, ChevronDownIcon as ChevronDown,
  CopyIcon as Copy, ThumbsUpIcon as ThumbsUp, ThumbsDownIcon as ThumbsDown,
  RefreshCwIcon as RefreshCw, Mic2Icon as Mic, Volume2Icon as Volume2,
  DownloadIcon as Download, CommandIcon as Keyboard, PencilIcon as Pencil,
  XIcon as X, CheckIcon as Check, SparklesIcon as Sparkles,
  BrainIcon as Brain, BookmarkIcon as Bookmark, SaveIcon as Save,
  ShareIcon as Share, LightbulbIcon as Lightbulb, NetworkIcon as Network,
} from '../icons/CustomIcons';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import { auraAiClient } from '../../services/api/auraAiService';
import { analyticsService } from '../../services/analytics/analyticsService';
import { generateConceptMap, ConceptMapData } from '../../services/ai/conceptMapService';
import { ConceptMap } from '../study/ConceptMap';
import { MnemonicGenerator } from '../study/MnemonicGenerator';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ── Types ───────────────────────────────────────────────────────────────

type ChatMode = 'chat' | 'quiz' | 'flashcard' | 'map' | 'mnemonic';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// ── Constants ───────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Quiz me on today\'s study material',
  'Explain spaced repetition',
  'Help me create a study schedule',
  'Summarize active recall',
];

const COMMANDS = [
  { id: '/define', label: 'Define a word', icon: Search },
  { id: '/explain', label: 'Explain a concept', icon: Zap },
  { id: '/quiz', label: 'Generate a quiz', icon: Layers },
  { id: '/study', label: 'Start study session', icon: BookOpen },
];

const MODES: { id: ChatMode; label: string; icon: React.ElementType; color: string; description: string }[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare, color: 'text-zinc-400', description: 'Ask questions, get explanations, discuss topics' },
  { id: 'quiz', label: 'Quiz', icon: Layers, color: 'text-violet-400', description: 'Generate quiz questions from any topic' },
  { id: 'flashcard', label: 'Flashcards', icon: Sparkles, color: 'text-amber-400', description: 'Create study flashcards automatically' },
  { id: 'map', label: 'Concept Map', icon: Network, color: 'text-emerald-400', description: 'Generate interactive concept maps' },
  { id: 'mnemonic', label: 'Memory', icon: Brain, color: 'text-rose-400', description: 'Generate mnemonics & memory palaces' },
];

const MODE_SYSTEM_PROMPTS: Record<ChatMode, string> = {
  chat: '',
  quiz: `You are a quiz generator. Write a short one-sentence intro, then raw JSON on the next line matching the format shown in the conversation examples. No backticks. No extra text. Include 4-5 questions.`,
  flashcard: `You are a flashcard generator. Write a short one-sentence intro, then raw JSON on the next line matching the format shown in the conversation examples. No backticks. No extra text. Include 5-8 flashcards.`,
  map: `You are a concept mapping assistant. Output ONLY valid JSON describing a concept map with nodes and edges. No markdown, no backticks, no commentary.`,
  mnemonic: `You are a creative memory expert. Output ONLY valid JSON with acronyms, mnemonics, memoryPalace, and story. No markdown, no backticks, no commentary.`,
};

// ── Toast Context (simple inline) ───────────────────────────────────────

let toastIdCounter = 0;

// ── Code Block Component ────────────────────────────────────────────────

const CodeBlock: React.FC<{ language: string; code: string; onToast: (msg: string, type?: Toast['type']) => void }> = ({ language, code, onToast }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onToast('Code copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="my-3 rounded-xl border border-zinc-800 bg-black/70 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-zinc-800/60 bg-zinc-900/40">
        <span className="text-[11px] text-zinc-500 font-mono lowercase">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto">
        <code className="text-sm text-zinc-200 font-mono">{code}</code>
      </pre>
    </div>
  );
};

// ── Thinking Panel ──────────────────────────────────────────────────────

const ThinkingPanel: React.FC<{ steps: string[] }> = ({ steps }) => {
  const [expanded, setExpanded] = useState(false);

  if (steps.length === 0) return null;

  return (
    <div className="mb-3 rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <Brain size={13} className="text-zinc-600" />
        <span>Thought process ({steps.length} steps)</span>
        <ChevronDown size={13} className={`ml-auto transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-4 pb-3 space-y-1.5 border-t border-zinc-800/30 pt-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-zinc-500">
              <span className="text-zinc-700 font-mono mt-0.5">{i + 1}.</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Quiz Renderer ───────────────────────────────────────────────────────

const QuizRenderer: React.FC<{
  quiz: { title: string; topic: string; difficulty: string; questions: QuizQuestion[] };
  onEdit: (questionIndex: number, field: string, value: string) => void;
  onSave?: () => void;
  mode: ChatMode;
}> = ({ quiz, onEdit, onSave, mode }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  if (mode !== 'quiz' || !quiz.questions?.length) return null;

  const score = quiz.questions.filter((q, i) => answers[i] === q.correctAnswer).length;

  return (
    <div className="my-2 p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{quiz.title}</h3>
          <p className="text-xs text-zinc-500">{quiz.topic} · {quiz.difficulty}</p>
        </div>
        <div className="flex gap-2">
          {onSave && (
            <button
              onClick={onSave}
              className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-300 text-xs font-medium hover:bg-green-500/30 transition-colors flex items-center gap-1"
            >
              <Save size={12} />
              Save
            </button>
          )}
          <button
            onClick={() => setShowResults(!showResults)}
            className="px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 text-xs font-medium hover:bg-violet-500/30 transition-colors"
          >
            {showResults ? `Score: ${score}/${quiz.questions.length}` : 'Check Answers'}
          </button>
        </div>
      </div>

      {quiz.questions.map((q, qi) => (
        <div key={q.id} className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-xs font-mono text-violet-400 mt-0.5">Q{qi + 1}</span>
            <p className="text-sm text-zinc-200 flex-1">{q.question}</p>
            <button
              onClick={() => {
                const newQ = prompt('Edit question:', q.question);
                if (newQ) onEdit(qi, 'question', newQ);
              }}
              className="p-1 text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-all"
              title="Edit"
            >
              <Pencil size={11} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1.5 ml-6">
            {q.options.map((opt, oi) => {
              const isAnswered = answers[qi] !== undefined;
              const isSelected = answers[qi] === oi;
              const isCorrect = oi === q.correctAnswer;
              let cls = 'px-3 py-2 rounded-lg text-xs border transition-colors ';
              if (showResults && isCorrect) cls += 'border-green-500/50 bg-green-500/10 text-green-300';
              else if (showResults && isSelected && !isCorrect) cls += 'border-red-500/50 bg-red-500/10 text-red-300';
              else if (isSelected) cls += 'border-violet-500/50 bg-violet-500/10 text-violet-300';
              else cls += 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300';

              return (
                <button
                  key={oi}
                  disabled={showResults}
                  onClick={() => setAnswers(prev => ({ ...prev, [qi]: oi }))}
                  className={cls}
                >
                  {String.fromCharCode(65 + oi)}) {opt}
                </button>
              );
            })}
          </div>
          {showResults && q.explanation && (
            <p className="ml-6 text-xs text-zinc-500 italic">{q.explanation}</p>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Flashcard Renderer ──────────────────────────────────────────────────

const FlashcardRenderer: React.FC<{
  cards: Flashcard[];
  onEdit: (cardIndex: number, field: string, value: string) => void;
  onSave?: () => void;
  mode: ChatMode;
}> = ({ cards, onEdit, onSave, mode }) => {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);

  if (mode !== 'flashcard' || !cards.length) return null;

  const card = cards[currentIdx];
  const isFlipped = flipped.has(currentIdx);

  return (
    <div className="my-2 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{currentIdx + 1} / {cards.length}</span>
        <div className="flex gap-1">
          {onSave && (
            <button
              onClick={onSave}
              className="px-2.5 py-1 rounded-lg bg-green-500/20 text-green-300 text-xs font-medium hover:bg-green-500/30 transition-colors flex items-center gap-1"
            >
              <Save size={11} />
              Save
            </button>
          )}
          <button
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            className="px-2 py-1 rounded text-xs text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors"
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentIdx(Math.min(cards.length - 1, currentIdx + 1))}
            disabled={currentIdx === cards.length - 1}
            className="px-2 py-1 rounded text-xs text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      <div
        onClick={() => setFlipped(prev => { const n = new Set(prev); n.has(currentIdx) ? n.delete(currentIdx) : n.add(currentIdx); return n; })}
        className="cursor-pointer perspective-1000 h-44 group"
      >
        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
          {/* Front */}
          <div className="absolute inset-0 backface-hidden rounded-2xl border border-amber-500/20 bg-amber-500/5 flex flex-col items-center justify-center p-6 text-center">
            <span className="text-[10px] uppercase tracking-wider text-amber-500/60 mb-2">Question</span>
            <p className="text-sm text-zinc-200">{card.front}</p>
            <span className="text-[10px] text-zinc-600 mt-4">Click to flip</span>
          </div>
          {/* Back */}
          <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] rounded-2xl border border-amber-500/20 bg-amber-500/10 flex flex-col items-center justify-center p-6 text-center">
            <span className="text-[10px] uppercase tracking-wider text-amber-500/60 mb-2">Answer</span>
            <p className="text-sm text-zinc-200">{card.back}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newFront = prompt('Edit front:', card.front);
                const newBack = prompt('Edit back:', card.back);
                if (newFront) onEdit(currentIdx, 'front', newFront);
                if (newBack) onEdit(currentIdx, 'back', newBack);
              }}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-all"
              title="Edit card"
            >
              <Pencil size={11} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 justify-center">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIdx(i)}
            className={`w-2 h-2 rounded-full transition-colors ${i === currentIdx ? 'bg-amber-400' : 'bg-zinc-800 hover:bg-zinc-700'}`}
          />
        ))}
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────

const AIChat: React.FC = () => {
  const { cards, createDeck, addCardsToDeck } = useDashboardWorkspace();

  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: '1', title: 'New chat', messages: [] }
  ]);
  const [currentConversationId, setCurrentConversationId] = useState('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [listening, setListening] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState<Set<number>>(new Set());
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [studyProgress, setStudyProgress] = useState({ reviewed: 0, total: 0 });

  // New features state
  const [mode, setMode] = useState<ChatMode>('chat');
  const [streamingText, setStreamingText] = useState<Record<number, string>>({});
  const [streamingDone, setStreamingDone] = useState<Set<number>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [thinkingSteps, setThinkingSteps] = useState<Record<number, string[]>>({});
  const [parsedQuizzes, setParsedQuizzes] = useState<Record<number, any>>({});
  const [parsedFlashcards, setParsedFlashcards] = useState<Record<number, Flashcard[]>>({});
  const [parsedConceptMaps, setParsedConceptMap] = useState<Record<number, ConceptMapData>>({});
  const [showMnemonicGenerator, setShowMnemonicGenerator] = useState(false);
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [ghostSuggestion, setGhostSuggestion] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const commandsRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(c => c.id === currentConversationId) || conversations[0];
  const messages = currentConversation?.messages || [];

  const dueCount = useMemo(() => cards.filter(c => c.nextReview <= Date.now()).length, [cards]);

  // ── Effects ─────────────────────────────────────────────────────────

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, streamingText]);

  const conversationsRef = useRef(conversations);
  const currentConversationIdRef = useRef(currentConversationId);
  const messagesRef = useRef(messages);
  const busyRef = useRef(busy);
  const modeRef = useRef(mode);

  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { currentConversationIdRef.current = currentConversationId; }, [currentConversationId]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { busyRef.current = busy; }, [busy]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (commandsRef.current && !commandsRef.current.contains(e.target as Node)) {
        setShowCommands(false);
      }
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setShowModeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowShortcuts(p => !p);
      }
      if (e.key === 'Escape') {
        setShowShortcuts(false);
        setShowCommands(false);
        setShowModeMenu(false);
        setEditingIndex(null);
      }
      // Tab to accept ghost suggestion
      if (e.key === 'Tab' && ghostSuggestion) {
        e.preventDefault();
        setInput(ghostSuggestion);
        setGhostSuggestion(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ghostSuggestion]);

  // Auto-hide welcome after first message
  useEffect(() => {
    if (messages.length > 0) setShowWelcome(false);
  }, [messages.length]);

  // Textarea auto-resize
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  // Ghost suggestions based on input
  useEffect(() => {
    const lower = input.toLowerCase();
    if (lower.startsWith('explain') || lower.startsWith('what is')) {
      setGhostSuggestion(input + ' with examples and analogies');
    } else if (lower.startsWith('quiz') || lower.startsWith('test')) {
      setGhostSuggestion(input + ' — 5 questions, medium difficulty');
    } else if (lower.startsWith('flashcard') || lower.startsWith('cards')) {
      setGhostSuggestion(input + ' — 8 cards covering key terms');
    } else {
      setGhostSuggestion(null);
    }
  }, [input]);

  // ── Helpers ─────────────────────────────────────────────────────────

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = `toast-${++toastIdCounter}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const updateMessages = (updater: (msgs: any[]) => any[] | any[]) => {
    const cid = currentConversationIdRef.current;
    setConversations(prev => prev.map(c => c.id === cid
      ? { ...c, messages: typeof updater === 'function' ? updater(c.messages) : updater }
      : c
    ));
  };

  const parseJsonFromResponse = (content: string): any | null => {
    console.log('[parseJsonFromResponse] Raw content length:', content.length);
    console.log('[parseJsonFromResponse] First 100 chars:', content.substring(0, 100));
    // Strip markdown code fences
    const stripped = content.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
    try {
      const result = JSON.parse(stripped);
      console.log('[parseJsonFromResponse] Parsed successfully, tool:', result.tool);
      return result;
    } catch (e) {
      console.log('[parseJsonFromResponse] Direct parse failed:', (e as Error).message);
      // Try to find JSON object in the text
      const match = stripped.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const result = JSON.parse(match[0]);
          console.log('[parseJsonFromResponse] Found JSON via regex match, tool:', result.tool);
          return result;
        } catch {}
      }
      // Try extracting JSON from between tool markers
      const toolMatch = content.match(/"tool"\s*:\s*"generate_(quiz|flashcards)"[\s\S]*?\}/);
      if (toolMatch) {
        const toolStart = content.indexOf('{"tool"');
        if (toolStart === -1) {
          const toolStart2 = content.indexOf('{\n  "tool"');
          if (toolStart2 !== -1) {
            const jsonBlock = content.substring(toolStart2);
            const braceMatch = jsonBlock.match(/\{[\s\S]*\}/);
            if (braceMatch) {
              try {
                const result = JSON.parse(braceMatch[0]);
                console.log('[parseJsonFromResponse] Found via tool marker, tool:', result.tool);
                return result;
              } catch {}
            }
          }
        } else {
          const jsonBlock = content.substring(toolStart);
          const braceMatch = jsonBlock.match(/\{[\s\S]*\}/);
          if (braceMatch) {
            try {
              const result = JSON.parse(braceMatch[0]);
              console.log('[parseJsonFromResponse] Found via tool start, tool:', result.tool);
              return result;
            } catch {}
          }
        }
      }
      console.log('[parseJsonFromResponse] All parsing attempts failed');
    }
    return null;
  };

  const extractThinkingSteps = (content: string): string[] => {
    const steps: string[] = [];
    const lines = content.split('\n');
    let inThinking = false;
    for (const line of lines) {
      if (line.includes('<thinking>') || line.includes('[Thinking]')) { inThinking = true; continue; }
      if (line.includes('</thinking>') || line.includes('[/Thinking]')) { inThinking = false; continue; }
      if (inThinking && line.trim()) steps.push(line.replace(/^[-•*]\s*/, ''));
    }
    return steps;
  };

  const systemPrompt = {
    role: 'system' as const,
    content: `You are Aura, a focused AI study companion for AuraMind. You answer concisely and use the Socratic method — guide, don't give direct answers.`
  };

  const getModeSystemPrompt = () => {
    const modePrompt = MODE_SYSTEM_PROMPTS[modeRef.current];
    if (modePrompt) return { role: 'system' as const, content: modePrompt };
    return systemPrompt;
  };

  // ── Streaming ───────────────────────────────────────────────────────

  const triggerAiStreaming = async (msgs: Conversation['messages']) => {
    setBusy(true);
    setFollowUps([]);
    setError(null);

    const convoId = currentConversationIdRef.current;

    // Pre-add empty assistant message
    updateMessages(prev => [...prev, { role: 'assistant' as const, content: '' }]);
    setStreamingDone(prev => { const n = new Set(prev); n.delete(-1); return n; });

    const effectivePrompt = modeRef.current !== 'chat' ? getModeSystemPrompt() : systemPrompt;

    // Few-shot examples to teach the AI the output format
    const quizExample = [
      { role: 'user' as const, content: 'Make a quiz about biology' },
      { role: 'assistant' as const, content: 'Here is your biology quiz.\n{"tool":"generate_quiz","data":{"title":"Biology Quiz","topic":"biology","difficulty":"medium","questions":[{"id":"1","question":"What is a cell?","options":["Tissue","Organ","Cell","Molecule"],"correctAnswer":2,"explanation":"The cell is the basic unit of life."}]}}' },
    ];
    const flashcardExample = [
      { role: 'user' as const, content: 'Make flashcards about chemistry' },
      { role: 'assistant' as const, content: 'Here are your chemistry flashcards.\n{"tool":"generate_flashcards","data":{"cards":[{"id":"1","front":"Proton","back":"Positively charged particle"},{"id":"2","front":"Neutron","back":"Neutral particle"}]}}' },
    ];

    const modeMessages = modeRef.current === 'quiz' ? quizExample : modeRef.current === 'flashcard' ? flashcardExample : [];

    try {
      const fullContent = await auraAiClient.chatCompletion({
        messages: [effectivePrompt, ...modeMessages, ...msgs],
        temperature: modeRef.current !== 'chat' ? 0.8 : 0.7,
        max_tokens: modeRef.current !== 'chat' ? 4096 : 2000,
      });

      const content = fullContent.choices[0]?.message?.content || 'No response';

      // Extract thinking steps
      const steps = extractThinkingSteps(content);
      if (steps.length > 0) {
        setThinkingSteps(prev => ({ ...prev, [convoId]: steps }));
      }

      // Stream the text (only in chat mode - quiz/flashcard modes show generating animation)
      const cleanContent = content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').replace(/\[Thinking\][\s\S]*?\[\/Thinking\]/gi, '');

      if (modeRef.current === 'chat') {
        let streamed = '';
        const chars = cleanContent.split('');
        for (let i = 0; i < chars.length; i++) {
          streamed += chars[i];
          setStreamingText(prev => ({ ...prev, [convoId]: streamed }));
          if (i % 3 === 0) await new Promise(r => setTimeout(r, 8));
        }
      }

      // Parse quiz/flashcard JSON for structured modes BEFORE finalizing
      let parsedQuizData: any = null;
      let parsedFlashcardData: Flashcard[] = [];
      let parsedMapData: ConceptMapData | null = null;

      if (modeRef.current === 'quiz') {
        const parsed = parseJsonFromResponse(cleanContent);
        if (parsed?.data?.questions) {
          parsedQuizData = parsed.data;
        }
      } else if (modeRef.current === 'flashcard') {
        const parsed = parseJsonFromResponse(cleanContent);
        if (parsed?.data?.cards) {
          parsedFlashcardData = parsed.data.cards.map((c: any, i: number) => ({
            id: c.id || String(i),
            front: c.front || c.question || '',
            back: c.back || c.answer || '',
          }));
        }
      } else if (modeRef.current === 'map') {
        const parsed = parseJsonFromResponse(cleanContent);
        if (parsed?.data?.nodes && parsed?.data?.edges) {
          parsedMapData = parsed.data as ConceptMapData;
        }
      }

      // Finalize — update messages and parsed data together
      updateMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: cleanContent } : m));
      setStreamingDone(prev => new Set(prev).add(-1));
      setStreamingText(prev => { const n = { ...prev }; delete n[convoId]; return n; });

      if (parsedQuizData) {
        setParsedQuizzes(prev => ({ ...prev, [convoId]: parsedQuizData }));
      }
      if (parsedFlashcardData.length > 0) {
        setParsedFlashcards(prev => ({ ...prev, [convoId]: parsedFlashcardData }));
      }
      if (parsedMapData) {
        setParsedConceptMap(prev => ({ ...prev, [convoId]: parsedMapData! }));
      }

      if (modeRef.current === 'chat') {
        setFollowUps(FOLLOWUP_SUGGESTIONS.sort(() => Math.random() - 0.5).slice(0, 3));
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        const msg = e instanceof Error ? e.message : 'AI request failed';
        setError(msg);
        addToast(msg, 'error');
        updateMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setBusy(false);
    }
  };

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || busyRef.current) return;
    setInput('');
    setError(null);
    setShowSuggestions(false);
    setGhostSuggestion(null);

    const userMessage = { role: 'user' as const, content: q };
    updateMessages(prev => [...prev, userMessage]);
    analyticsService.trackCoreAction('chat_message', { source: 'dashboard_ai_chat', mode: modeRef.current });

    const conv = conversationsRef.current.find(c => c.id === currentConversationIdRef.current);
    if (conv?.messages.length === 0) {
      setConversations(prev => prev.map(c =>
        c.id === currentConversationIdRef.current
          ? { ...c, title: q.slice(0, 40) + (q.length > 40 ? '...' : '') }
          : c
      ));
    }

    await triggerAiStreaming([...messagesRef.current, userMessage]);
  };

  const startNewChat = () => {
    const id = Date.now().toString();
    setConversations(prev => [{ id, title: 'New chat', messages: [] }, ...prev]);
    setCurrentConversationId(id);
    setShowSuggestions(true);
    setFollowUps([]);
    setParsedQuizzes({});
    setParsedFlashcards({});
    setThinkingSteps({});
    addToast('New conversation started', 'info');
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
    addToast('Conversation deleted', 'info');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val === '/') {
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
    if (e.key === 'Escape') setShowCommands(false);
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      addToast('Copied to clipboard', 'success');
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  const regenerate = () => {
    const msgs = messagesRef.current;
    if (msgs.length < 2) return;
    const lastUserMsg = [...msgs].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      updateMessages(prev => prev.slice(0, -1));
      setFollowUps([]);
      setParsedQuizzes(prev => { const n = { ...prev }; delete n[Object.keys(prev).length - 1]; return n; });
      setParsedFlashcards(prev => { const n = { ...prev }; delete n[Object.keys(prev).length - 1]; return n; });
      send(lastUserMsg.content);
    }
  };

  const startEditing = (idx: number, content: string) => {
    setEditingIndex(idx);
    setEditText(content);
  };

  const saveEdit = (idx: number) => {
    if (!editText.trim() || busyRef.current) return;
    const msgs = messagesRef.current;
    const updatedMsgs = msgs.map((m, i) =>
      i === idx ? { ...m, content: editText.trim() } : m
    ).slice(0, idx + 1);
    updateMessages(() => updatedMsgs);
    setEditingIndex(null);
    setEditText('');
    triggerAiStreaming(updatedMsgs);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditText('');
  };

  const toggleVoiceInput = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      addToast('Voice input not supported in this browser', 'error');
      return;
    }
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setInput(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    addToast('Listening...', 'info');
  };

  const toggleTts = (idx: number, content: string) => {
    if (ttsPlaying.has(idx)) {
      window.speechSynthesis.cancel();
      setTtsPlaying(prev => { const n = new Set(prev); n.delete(idx); return n; });
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content.replace(/<[^>]*>/g, ''));
    utterance.rate = 0.95;
    utterance.onend = () => setTtsPlaying(prev => { const n = new Set(prev); n.delete(idx); return n; });
    window.speechSynthesis.speak(utterance);
    setTtsPlaying(new Set([idx]));
  };

  const exportChat = () => {
    const msgs = messagesRef.current;
    if (msgs.length === 0) return;
    const md = msgs.map(m =>
      m.role === 'user' ? `## You\n\n${m.content}\n` : `## Aura\n\n${m.content}\n`
    ).join('\n---\n\n');
    const blob = new Blob([`# Chat Transcript\n\n${md}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Chat exported', 'success');
  };

  const toggleBookmark = (idx: number) => {
    setBookmarked(prev => {
      const n = new Set(prev);
      n.has(idx) ? n.delete(idx) : n.add(idx);
      addToast(n.has(idx) ? 'Bookmarked' : 'Bookmark removed', 'info');
      return n;
    });
  };

  const handleModeChange = (newMode: ChatMode) => {
    if (modeRef.current === newMode) {
      setShowModeMenu(false);
      return;
    }
    setMode(newMode);
    setShowModeMenu(false);
    const labels: Record<ChatMode, string> = { chat: 'Chat', quiz: 'Quiz', flashcard: 'Flashcard' };
    addToast(`Switched to ${labels[newMode]} mode`, 'info');
    // Start new chat when switching modes
    startNewChat();
  };

  // Quiz/Flashcard edit handlers
  const handleQuizEdit = (convoId: string, questionIndex: number, field: string, value: string) => {
    const quiz = parsedQuizzes[convoId];
    if (!quiz) return;
    quiz.questions[questionIndex] = { ...quiz.questions[questionIndex], [field]: value };
    setParsedQuizzes(prev => ({ ...prev, [convoId]: { ...quiz } }));
    addToast('Question updated', 'success');
  };

  const handleFlashcardEdit = (convoId: string, cardIndex: number, field: string, value: string) => {
    const fcs = parsedFlashcards[convoId];
    if (!fcs) return;
    fcs[cardIndex] = { ...fcs[cardIndex], [field]: value };
    setParsedFlashcards(prev => ({ ...prev, [convoId]: [...fcs] }));
    addToast('Card updated', 'success');
  };

  const handleSaveQuiz = async () => {
    const quiz = parsedQuizzes[currentConversationId];
    if (!quiz) return;
    if (!createDeck || !addCardsToDeck) { addToast('Please sign in to save decks', 'error'); return; }
    setBusy(true);
    try {
      const deck = await createDeck(
        `Quiz: ${quiz.title}`,
        `${quiz.topic} · ${quiz.difficulty} · ${quiz.questions.length} questions`
      );
      if (!deck) { addToast('Please sign in to save', 'error'); return; }

      const cards = quiz.questions.flatMap((q: QuizQuestion) => [
        { front: q.question, back: q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join('\n'), deckId: deck.id },
        ...(q.explanation ? [{ front: `Why? — ${q.question}`, back: q.explanation, deckId: deck.id }] : []),
      ]);
      await addCardsToDeck(deck.id, cards);
      addToast(`Quiz saved to "${deck.title}"`, 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      addToast(msg.includes('sign in') ? msg : 'Failed to save quiz', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveFlashcards = async () => {
    const fcs = parsedFlashcards[currentConversationId];
    if (!fcs?.length) return;
    if (!createDeck || !addCardsToDeck) { addToast('Please sign in to save decks', 'error'); return; }
    setBusy(true);
    try {
      const deck = await createDeck(
        'AI Flashcards',
        `${fcs.length} flashcards generated by Aura AI`
      );
      if (!deck) { addToast('Please sign in to save', 'error'); return; }

      const cards = fcs.map(card => ({
        front: card.front,
        back: card.back,
        deckId: deck.id,
      }));
      await addCardsToDeck(deck.id, cards);
      addToast(`${fcs.length} flashcards saved to "${deck.title}"`, 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      addToast(msg.includes('sign in') ? msg : 'Failed to save flashcards', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Custom markdown renderer with code blocks
  const MarkdownContent: React.FC<{ content: string; convoId: string }> = ({ content, convoId }) => {
    const rawContent = streamingText[convoId] ?? content;

    // Quiz mode - hide content if parsed successfully (quiz card handles display)
    if (convoId && mode === 'quiz' && parsedQuizzes[convoId]) return null;
    if (convoId && mode === 'flashcard' && parsedFlashcards[convoId]) return null;

    // Strip JSON tool blocks from display to prevent raw JSON leakage
    let displayContent = rawContent;
    if (mode === 'quiz') {
      displayContent = rawContent.replace(/\s*\{"tool"\s*:\s*"generate_quiz"[\s\S]*\}/, '').trim();
    } else if (mode === 'flashcard') {
      displayContent = rawContent.replace(/\s*\{"tool"\s*:\s*"generate_flashcards"[\s\S]*\}/, '').trim();
    }

    if (!displayContent) return null;

    return (
      <div className="prose prose-invert prose-sm max-w-none
        [&_pre]:hidden [&_code]:text-primary [&_code]:bg-zinc-800/80 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs
        [&_a]:text-primary [&_a]:hover:underline
        [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-2
        [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-white [&_h2]:mb-2
        [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-primary [&_h3]:mb-1
        [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0
        [&_ul]:list-disc [&_ul]:list-inside [&_ul]:text-sm [&_ul]:space-y-0.5 [&_ul]:mb-2
        [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:text-sm [&_ol]:space-y-0.5 [&_ol]:mb-2
        [&_li]:text-zinc-300
        [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-3 [&_blockquote]:text-zinc-500 [&_blockquote]:italic [&_blockquote]:text-sm [&_blockquote]:my-2
        [&_hr]:border-zinc-800 [&_hr]:my-3
        [&_table]:w-full [&_table]:text-sm [&_table]:border [&_table]:border-zinc-800 [&_table]:rounded-lg [&_table]:my-2
        [&_th]:border [&_th]:border-zinc-800 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-zinc-800/50 [&_th]:text-left [&_th]:font-semibold
        [&_td]:border [&_td]:border-zinc-800 [&_td]:px-3 [&_td]:py-2">
        <ReactMarkdown
          components={{
            code: ({ className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '');
              const isInline = !props?.node?.tagName || props?.node?.tagName !== 'code';
              if (match) {
                const code = String(children).replace(/\n$/, '');
                return <CodeBlock language={match[1]} code={code} onToast={addToast} />;
              }
              return <code className="text-primary bg-zinc-800/80 px-1 py-0.5 rounded text-xs" {...props}>{children}</code>;
            },
            pre: () => null,
          }}
        >
          {displayContent}
        </ReactMarkdown>
        {/* Blinking cursor while streaming */}
        {convoId && streamingText[convoId] !== undefined && (
          <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
        )}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────

  const ModeIcon = MODES.find(m => m.id === mode)!.icon;

  return (
    <div className="flex h-[calc(100dvh-8rem)] md:h-[calc(100vh-10.5rem)] rounded-xl md:rounded-2xl border border-zinc-800 bg-black overflow-hidden relative">
      {/* ── Toast Container ─────────────────────────────────────────── */}
      <div className="absolute top-4 right-4 z-[60] space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto px-3 py-2 rounded-xl text-xs font-medium shadow-lg border backdrop-blur-sm animate-in fade-in slide-in-from-right ${
              t.type === 'success' ? 'bg-green-500/15 border-green-500/30 text-green-300' :
              t.type === 'error' ? 'bg-red-500/15 border-red-500/30 text-red-300' :
              'bg-zinc-800/90 border-zinc-700/50 text-zinc-300'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* ── Mnemonic Generator Modal ──────────────────────────────── */}
      {showMnemonicGenerator && (
        <MnemonicGenerator
          initialTopic={messages.filter(m => m.role === 'user').slice(-1)[0]?.content || ''}
          onClose={() => setShowMnemonicGenerator(false)}
        />
      )}

      {/* ── Keyboard Shortcuts Modal ────────────────────────────────── */}
      {showShortcuts && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowShortcuts(false)}>
          <div className="w-80 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 mb-4">
              <Keyboard size={14} className="text-primary" />
              <span className="text-sm font-semibold text-white">Keyboard Shortcuts</span>
            </div>
            <div className="space-y-2.5">
              {SHORTCUTS.map(s => (
                <div key={s.desc} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{s.desc}</span>
                  <div className="flex gap-1">
                    {s.keys.map(k => (
                      <kbd key={k} className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono">{k}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-zinc-700 mt-4 text-center">Press ⌘K or Escape to close</p>
          </div>
        </div>
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <div className={`hidden md:flex flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-200 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="p-3 border-b border-zinc-800">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(c => (
            <div
              key={c.id}
              onClick={() => { setCurrentConversationId(c.id); setShowSuggestions(false); setFollowUps([]); }}
              className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-sm ${
                c.id === currentConversationId
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
              }`}
            >
              <MessageSquare size={14} className="shrink-0 opacity-50" />
              <span className="truncate flex-1">{c.title}</span>
              <button
                onClick={(e) => deleteConversation(c.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Chat ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-black">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
            >
              <ChevronLeft size={16} className={`transition-transform duration-200 ${sidebarOpen ? '' : 'rotate-180'}`} />
            </button>
            <span className="text-sm font-medium text-white">Aura AI</span>

            {/* Mode Selector */}
            <div className="relative" ref={modeMenuRef}>
              <button
                onClick={() => setShowModeMenu(!showModeMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
              >
                <ModeIcon size={12} />
                <span className="capitalize">{mode}</span>
                <ChevronDown size={10} className="text-zinc-600" />
              </button>
              {showModeMenu && (
                <div className="absolute top-full left-0 mt-1.5 w-56 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden z-50">
                  {MODES.map(m => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleModeChange(m.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          mode === m.id ? 'bg-zinc-900' : 'hover:bg-zinc-900/50'
                        }`}
                      >
                        <Icon size={14} className={m.color} />
                        <div>
                          <div className="text-xs font-medium text-zinc-200">{m.label}</div>
                          <div className="text-[10px] text-zinc-600">{m.description}</div>
                        </div>
                        {mode === m.id && <Check size={12} className="ml-auto text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={exportChat}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
                title="Export chat"
              >
                <Download size={14} />
              </button>
            )}
            <button
              onClick={() => setShowShortcuts(true)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
              title="Keyboard shortcuts"
            >
              <Keyboard size={14} />
            </button>
            <button
              onClick={() => setShowMnemonicGenerator(true)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
              title="Memory Wizard"
            >
              <Brain size={14} />
            </button>
            <span className="text-[11px] text-zinc-600">{dueCount} cards due</span>
          </div>
        </div>

        {/* Progress bar */}
        {studyProgress.total > 0 && (
          <div className="px-4 py-2 border-b border-zinc-800/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-zinc-600">Study session progress</span>
              <span className="text-[11px] text-zinc-500">{studyProgress.reviewed}/{studyProgress.total}</span>
            </div>
            <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(studyProgress.reviewed / studyProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Mode indicator banner */}
        {mode !== 'chat' && messages.length === 0 && (
          <div className={`px-4 py-2 border-b ${
            mode === 'quiz' ? 'border-violet-500/20 bg-violet-500/5' :
            mode === 'flashcard' ? 'border-amber-500/20 bg-amber-500/5' :
            mode === 'map' ? 'border-emerald-500/20 bg-emerald-500/5' :
            'border-rose-500/20 bg-rose-500/5'
          }`}>
            <div className="flex items-center gap-2">
              <ModeIcon size={13} className={
                mode === 'quiz' ? 'text-violet-400' :
                mode === 'flashcard' ? 'text-amber-400' :
                mode === 'map' ? 'text-emerald-400' :
                'text-rose-400'
              } />
              <span className="text-xs text-zinc-400">
                {mode === 'quiz' ? 'Quiz Mode — Send a topic and I\'ll generate a quiz' :
                 mode === 'flashcard' ? 'Flashcard Mode — Send a topic and I\'ll generate flashcards' :
                 mode === 'map' ? 'Map Mode — Send a topic and I\'ll build an interactive concept map' :
                 'Memory Mode — Send a topic and I\'ll generate mnemonics & memory palaces'}
              </span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 md:px-4 py-4 md:py-6">
          {messages.length === 0 ? (
            <div className={`h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center transition-opacity duration-500 ${showWelcome ? 'opacity-100' : 'opacity-0'}`}>
              <div className={`w-14 h-14 rounded-2xl border border-zinc-800 bg-zinc-900 flex items-center justify-center mb-6 transition-all duration-700 ${showWelcome ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
                <Bot size={28} className="text-zinc-500" />
              </div>

              {mode === 'chat' && (
                <>
                  <h1 className="text-xl font-semibold text-white mb-1.5">What do you want to study?</h1>
                  <p className="text-sm text-zinc-600 mb-8">Ask me anything about your coursework</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mb-6">
                    {SUGGESTIONS.map((s, i) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className={`px-3 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/50 text-left text-sm text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 hover:bg-zinc-900 transition-all ${
                          showWelcome ? 'opacity-0 translate-y-2' : ''
                        }`}
                        style={showWelcome ? { animation: `fadeSlideIn 0.4s ${i * 0.1}s forwards` } : {}}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {mode === 'quiz' && (
                <>
                  <h1 className="text-xl font-semibold text-white mb-1.5">Generate a Quiz</h1>
                  <p className="text-sm text-zinc-600 mb-6">Tell me any topic and I'll create quiz questions</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mb-6">
                    {['Quiz me on world history', 'Test my knowledge of biology', '5 questions about geography', 'Hard science quiz'].map((s, i) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="px-3 py-2.5 rounded-xl border border-violet-500/20 bg-violet-500/5 text-left text-sm text-zinc-400 hover:border-violet-500/40 hover:text-zinc-200 hover:bg-violet-500/10 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {mode === 'flashcard' && (
                <>
                  <h1 className="text-xl font-semibold text-white mb-1.5">Create Flashcards</h1>
                  <p className="text-sm text-zinc-600 mb-6">Send me a topic and I'll generate study cards</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mb-6">
                    {['Flashcards for Python basics', 'Make cards for anatomy', 'Vocabulary flashcards', 'Chemistry formulas'].map((s, i) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="px-3 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-left text-sm text-zinc-400 hover:border-amber-500/40 hover:text-zinc-200 hover:bg-amber-500/10 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {mode === 'map' && (
                <>
                  <h1 className="text-xl font-semibold text-white mb-1.5">Generate a Concept Map</h1>
                  <p className="text-sm text-zinc-600 mb-6">Send me a topic and I'll build an interactive map</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mb-6">
                    {['Map of photosynthesis', 'Concept map of World War II', 'Map the solar system', 'Map of machine learning'].map((s, i) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="px-3 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-left text-sm text-zinc-400 hover:border-emerald-500/40 hover:text-zinc-200 hover:bg-emerald-500/10 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {mode === 'mnemonic' && (
                <>
                  <h1 className="text-xl font-semibold text-white mb-1.5">Memory Wizard</h1>
                  <p className="text-sm text-zinc-600 mb-6">Generate mnemonics, acronyms & memory palaces</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mb-6">
                    {['Planets mnemonic', 'Acronym for biology cell parts', 'Memory palace for periodic table', 'Mnemonic for trigonometry'].map((s, i) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="px-3 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-left text-sm text-zinc-400 hover:border-rose-500/40 hover:text-zinc-200 hover:bg-rose-500/10 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="flex gap-2 flex-wrap justify-center">
                {COMMANDS.map(cmd => (
                  <button
                    key={cmd.id}
                    onClick={() => { setInput(cmd.id + ' '); inputRef.current?.focus(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
                  >
                    <cmd.icon size={12} />
                    {cmd.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {messages.map((m, idx) => {
                const isLastAssistant = m.role === 'assistant' && idx === messages.length - 1 && !busy;
                const isLastMessage = idx === messages.length - 1 && m.role === 'assistant';
                const msgKey = `${currentConversationId}-${idx}`;
                const fb = feedback[msgKey];
                const hasQuiz = parsedQuizzes[currentConversationId] !== undefined;
                const hasFlashcards = parsedFlashcards[currentConversationId] !== undefined;

                return (
                  <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                    {m.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot size={14} className="text-zinc-500" />
                      </div>
                    )}
                    <div className={`max-w-[90%] md:max-w-[85%] group ${m.role === 'user' ? 'order-first' : ''}`}>
                      {m.role === 'user' && editingIndex === idx ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(idx); }
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="w-full px-4 py-3 rounded-2xl rounded-tr-md bg-primary text-zinc-950 text-sm leading-relaxed resize-none focus:outline-none"
                            rows={3}
                            autoFocus
                          />
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => saveEdit(idx)} className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                              <Check size={12} />
                            </button>
                            <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`px-4 py-3 text-sm leading-relaxed relative ${
                          m.role === 'user'
                            ? 'bg-primary text-zinc-950 rounded-2xl rounded-tr-md'
                            : 'bg-zinc-900/60 border border-zinc-800/60 text-zinc-200 rounded-2xl rounded-tl-md'
                        }`}>
                          {m.role === 'user' && !busy && editingIndex !== idx && (
                            <button
                              onClick={() => startEditing(idx, m.content)}
                              className="absolute -top-2 -right-2 p-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Pencil size={10} />
                            </button>
                          )}
                          {m.role === 'user' ? (
                            <p className="whitespace-pre-wrap">{m.content}</p>
                          ) : (
                            <>
                              {/* Thinking Panel */}
                              {isLastMessage && <ThinkingPanel steps={thinkingSteps[currentConversationId] || []} />}

                              {/* Quiz Renderer */}
                              {hasQuiz && isLastMessage && (
                                <QuizRenderer
                                  quiz={parsedQuizzes[currentConversationId]}
                                  onEdit={(qi, field, value) => handleQuizEdit(currentConversationId, qi, field, value)}
                                  onSave={handleSaveQuiz}
                                  mode={mode}
                                />
                              )}

                              {/* Flashcard Renderer */}
                              {hasFlashcards && isLastMessage && (
                                <FlashcardRenderer
                                  cards={parsedFlashcards[currentConversationId]}
                                  onEdit={(ci, field, value) => handleFlashcardEdit(currentConversationId, ci, field, value)}
                                  onSave={handleSaveFlashcards}
                                  mode={mode}
                                />
                              )}

                              {/* Concept Map Renderer */}
                              {mode === 'map' && parsedConceptMaps[currentConversationId] && isLastMessage && (
                                <div className="my-2">
                                  <div className="w-full p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-left">
                                    <div className="flex items-center gap-3">
                                      <Network size={18} className="text-emerald-400" />
                                      <div>
                                        <h3 className="text-sm font-semibold text-white">{parsedConceptMaps[currentConversationId].topic}</h3>
                                        <p className="text-xs text-zinc-500">{parsedConceptMaps[currentConversationId].nodes.length} concepts · {parsedConceptMaps[currentConversationId].edges.length} connections</p>
                                      </div>
                                      <span className="ml-auto text-xs text-emerald-400">Exploring</span>
                                    </div>
                                  </div>
                                  <ConceptMap
                                    data={parsedConceptMaps[currentConversationId]}
                                    onClose={() => setParsedConceptMap(prev => { const n = { ...prev }; delete n[currentConversationId]; return n; })}
                                  />
                                </div>
                              )}

                              {/* Markdown Content */}
                              <MarkdownContent content={m.content} convoId={isLastMessage ? currentConversationId : ''} />

                              {/* Assistant message actions */}
                              {(!busy && (isLastMessage ? streamingDone.has(-1) : true)) && m.content && (
                                <div className="flex items-center gap-1 mt-2 -mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => copyMessage(m.content)} className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors" title="Copy">
                                    <Copy size={12} />
                                  </button>
                                  <button onClick={() => toggleTts(idx, m.content)} className={`p-1 rounded transition-colors ${ttsPlaying.has(idx) ? 'text-primary bg-primary/10' : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800'}`} title={ttsPlaying.has(idx) ? 'Stop' : 'Read aloud'}>
                                    <Volume2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => toggleBookmark(idx)}
                                    className={`p-1 rounded transition-colors ${bookmarked.has(idx) ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800'}`}
                                    title={bookmarked.has(idx) ? 'Remove bookmark' : 'Bookmark'}
                                  >
                                    <Bookmark size={12} />
                                  </button>
                                  <button
                                    onClick={() => { copyMessage(`${m.content}`); addToast('Shared to clipboard', 'success'); }}
                                    className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                                    title="Share"
                                  >
                                    <Share size={12} />
                                  </button>
                                  <div className="w-px h-3 bg-zinc-800 mx-0.5" />
                                  <button onClick={() => setFeedback(prev => ({ ...prev, [msgKey]: fb === 'up' ? undefined as any : 'up' }))} className={`p-1 rounded transition-colors ${fb === 'up' ? 'text-green-400' : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800'}`} title="Helpful">
                                    <ThumbsUp size={12} />
                                  </button>
                                  <button onClick={() => setFeedback(prev => ({ ...prev, [msgKey]: fb === 'down' ? undefined as any : 'down' }))} className={`p-1 rounded transition-colors ${fb === 'down' ? 'text-red-400' : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800'}`} title="Not helpful">
                                    <ThumbsDown size={12} />
                                  </button>
                                  {isLastAssistant && (
                                    <>
                                      <div className="w-px h-3 bg-zinc-800 mx-0.5" />
                                      <button onClick={regenerate} className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors" title="Regenerate">
                                        <RefreshCw size={12} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Busy / Thinking indicator */}
              {busy && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    <Loader2 size={14} className="text-zinc-500 animate-spin" />
                  </div>
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl rounded-tl-md bg-zinc-900/40 border border-zinc-800/40">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <span className="text-xs text-zinc-600">
                      {mode === 'quiz' ? 'Generating quiz' :
                       mode === 'flashcard' ? 'Creating flashcards' :
                       mode === 'map' ? 'Building concept map' :
                       mode === 'mnemonic' ? 'Crafting memory aids' :
                       'Thinking'}
                    </span>
                  </div>
                </div>
              )}

              {/* Follow-up suggestions */}
              {!busy && followUps.length > 0 && mode === 'chat' && (
                <div className="flex gap-2 flex-wrap justify-center max-w-lg mx-auto">
                  {followUps.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Input */}
        <div className="px-3 md:px-4 pb-3 md:pb-4 pt-2 shrink-0 relative">
          <div className="max-w-3xl mx-auto">
            {/* Inline context suggestions (above input) */}
            {mode === 'chat' && !busy && messages.length > 0 && followUps.length === 0 && (
              <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
                {['Explain more simply', 'Give examples', 'Quiz me on this'].map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/40 text-[11px] text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 whitespace-nowrap transition-colors"
                  >
                    <Lightbulb size={10} />
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex items-end gap-2 px-3 py-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 focus-within:border-zinc-700 transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === 'quiz' ? 'Enter a topic for the quiz...' :
                  mode === 'flashcard' ? 'Enter a topic for flashcards...' :
                  mode === 'map' ? 'Enter a topic for a concept map...' :
                  mode === 'mnemonic' ? 'Enter a topic for mnemonics...' :
                  'Ask Aura anything... (⌘K for shortcuts)'
                }
                rows={1}
                className="flex-1 bg-transparent text-white placeholder-zinc-600 resize-none focus:outline-none max-h-40 text-sm leading-relaxed py-1.5 relative"
                style={{ minHeight: '24px' }}
              />
              {/* Ghost suggestion */}
              {ghostSuggestion && !busy && (
                <span className="absolute right-16 bottom-2 pointer-events-none text-xs text-zinc-700 select-none">
                  {ghostSuggestion.replace(input, '').substring(0, 30)}
                  {ghostSuggestion.replace(input, '').length > 30 ? '...' : ''}
                </span>
              )}
              <button
                onClick={toggleVoiceInput}
                className={`p-2 rounded-xl transition-colors shrink-0 ${listening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                title={listening ? 'Stop recording' : 'Voice input'}
              >
                <Mic size={16} />
              </button>
              {busy ? (
                <button className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors shrink-0">
                  <StopCircle size={16} />
                </button>
              ) : (
                <button
                  onClick={() => send()}
                  disabled={!input.trim()}
                  className="p-2 rounded-xl bg-primary text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/80 transition-all shrink-0"
                >
                  <Send size={16} />
                </button>
              )}
            </div>

            {mode === 'chat' && (
              <p className="text-center text-[11px] text-zinc-700 mt-2">
                Aura can make mistakes. Verify important information.
                {ghostSuggestion && <span className="ml-1 text-zinc-600">Press Tab to accept suggestion</span>}
              </p>
            )}
          </div>

          {/* Command menu */}
          {showCommands && (
            <div ref={commandsRef} className="absolute bottom-full left-4 mb-2 w-64 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
              {COMMANDS.map(cmd => (
                <button
                  key={cmd.id}
                  onClick={() => { setInput(cmd.id + ' '); setShowCommands(false); inputRef.current?.focus(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
                >
                  <cmd.icon size={14} className="text-zinc-600" />
                  {cmd.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CSS Animations ──────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .animate-in { animation: fadeSlideIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default AIChat;
