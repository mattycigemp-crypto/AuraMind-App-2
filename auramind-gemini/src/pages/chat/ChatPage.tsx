import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send, X, BookOpen, Lightbulb, HelpCircle, Wand2,
  Copy, Check, RotateCcw, ArrowUp, ChevronDown,
  Plus, Edit3, Sparkles, Target, MessageCircle, BrainCircuit,
} from 'lucide-react';
import { useAuraContext, StudyContext, AuraEntrypoint } from '../../contexts/AuraContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import { TextSplit } from '../../lib/effects';
import { groqChat, groqChatStream } from '../../services/api/groqClient';

// ─── Types ────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  actions?: MessageAction[];
}

interface MessageAction {
  id: string;
  label: string;
  type: 'add-card' | 'generate-cards' | 'start-quiz' | 'explain-differently';
  data?: Record<string, unknown>;
}

interface QuickPrompt {
  id: string;
  label: string;
  icon: React.ReactNode;
  buildMessage: (ctx: StudyContext) => string;
  buildSystem: (ctx: StudyContext) => string;
}

// ─── Context Banner ──────────────────────────────────────────────────────

function ContextBanner({
  context,
  onClear,
}: {
  context: StudyContext;
  onClear: () => void;
}) {
  const getEntrypointLabel = (e: AuraEntrypoint) => {
    switch (e) {
      case 'card-again': return 'Reviewing card';
      case 'quiz-wrong': return 'Quiz review';
      case 'deck-ask': return 'Deck context';
      case 'cards-improve': return 'Card improvement';
      case 'standalone': return 'Study assistant';
    }
  };

  const getDetail = () => {
    if (context.card) return context.card.front;
    if (context.deck) return context.deck.name;
    if (context.quiz) return context.quiz.question;
    if (context.cards) return `${context.cards.length} cards selected`;
    return null;
  };

  return (
    <div className="context-banner">
      <div className="context-banner-content">
        <div className="context-banner-label">
          <BookOpen size={14} />
          {getEntrypointLabel(context.entrypoint)}
        </div>
        {getDetail() && (
          <div className="context-banner-detail">{getDetail()}</div>
        )}
      </div>
      <button className="context-banner-close" onClick={onClear}>
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────────

function MessageBubble({
  message,
  onAction,
}: {
  message: Message;
  onAction?: (action: MessageAction) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = (content: string) => {
    // Basic markdown-ish rendering
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let codeLang = '';

    lines.forEach((line, i) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${i}`} className="message-code-block">
              <code>{codeContent.trim()}</code>
            </pre>
          );
          codeContent = '';
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLang = line.slice(3);
        }
        return;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        return;
      }

      // Bold
      const boldProcessed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Inline code
      const codeProcessed = boldProcessed.replace(
        /`(.*?)`/g,
        '<code class="message-inline-code">$1</code>'
      );

      if (line.startsWith('## ')) {
        elements.push(
          <h3 key={i} className="message-h3" dangerouslySetInnerHTML={{ __html: codeProcessed.slice(3) }} />
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h4 key={i} className="message-h4" dangerouslySetInnerHTML={{ __html: codeProcessed.slice(4) }} />
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={i} className="message-li" dangerouslySetInnerHTML={{ __html: codeProcessed.slice(2) }} />
        );
      } else if (line.match(/^\d+\. /)) {
        const text = line.replace(/^\d+\. /, '');
        elements.push(
          <li key={i} className="message-li message-li-num" dangerouslySetInnerHTML={{ __html: text }} />
        );
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="message-spacer" />);
      } else {
        elements.push(
          <p key={i} className="message-p" dangerouslySetInnerHTML={{ __html: codeProcessed }} />
        );
      }
    });

    return elements;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`message-bubble message-${message.role}`}
    >
      <div className="message-content">
        {renderContent(message.content)}

        {message.actions && message.actions.length > 0 && (
          <div className="message-actions-row">
            {message.actions.map((action) => (
              <button
                key={action.id}
                className="message-action-btn"
                onClick={() => onAction?.(action)}
              >
                {action.type === 'add-card' && <Plus size={14} />}
                {action.type === 'generate-cards' && <Wand2 size={14} />}
                {action.type === 'start-quiz' && <HelpCircle size={14} />}
                {action.type === 'explain-differently' && <Lightbulb size={14} />}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {message.role === 'assistant' && (
        <div className="message-controls">
          <button
            className="message-control-btn"
            onClick={handleCopy}
            title="Copy"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Typing Indicator ────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  );
}

// ─── Quick Prompts ───────────────────────────────────────────────────────

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'explain',
    label: 'Explain this',
    icon: <Lightbulb size={16} />,
    buildMessage: (ctx) => {
      if (ctx.card) return `Explain this flashcard to me:\n\n**Front:** ${ctx.card.front}\n**Back:** ${ctx.card.back}`;
      if (ctx.quiz) return `Explain why this answer is wrong:\n\n**Question:** ${ctx.quiz.question}\n**My answer:** ${ctx.quiz.userAnswer}\n**Correct answer:** ${ctx.quiz.correctAnswer}`;
      return 'Can you explain the concept I\'m studying?';
    },
    buildSystem: (ctx) => {
      return `You are Aura, a study tutor. The student is reviewing flashcards. Explain the concept clearly, using analogies and examples. If a card is provided, explain WHY the answer is what it is, not just restating it. Keep it concise (3-5 paragraphs max). Use markdown formatting.`;
    },
  },
  {
    id: 'quiz-me',
    label: 'Quiz me',
    icon: <HelpCircle size={16} />,
    buildMessage: (ctx) => {
      if (ctx.card) return `Quiz me on this flashcard and related concepts:\n\n**Front:** ${ctx.card.front}\n**Back:** ${ctx.card.back}`;
      if (ctx.deck) return `Quiz me on key concepts from the "${ctx.deck.name}" deck.`;
      return 'Quiz me on what I\'m studying.';
    },
    buildSystem: () => {
      return `You are Aura, a study tutor. Generate a short quiz (3-5 questions) to test understanding. Format each question as:

**Q1:** [question]
a) [option]
b) [option]
c) [option]
d) [option]

After the student answers, explain why the correct answer is right and why the wrong ones are wrong. Make questions progressively harder.`;
    },
  },
  {
    id: 'generate-cards',
    label: 'Generate cards',
    icon: <Wand2 size={16} />,
    buildMessage: (ctx) => {
      if (ctx.card) return `Generate 5 related flashcards based on this card:\n\n**Front:** ${ctx.card.front}\n**Back:** ${ctx.card.back}`;
      if (ctx.deck) return `Generate 5 flashcards for the "${ctx.deck.name}" deck to fill gaps.`;
      return 'Generate flashcards on this topic.';
    },
    buildSystem: () => {
      return `You are Aura, a flashcard generator. Create well-structured flashcards. For each card, use this format:

**Card [N]:**
**Front:** [question/term]
**Back:** [answer/definition]
**Tags:** [tag1, tag2]

Make cards test understanding, not just recall. Include application and analysis questions, not just definitions. Avoid duplicates with existing cards.`;
    },
  },
  {
    id: 'fix-cards',
    label: 'Fix cards',
    icon: <Edit3 size={16} />,
    buildMessage: (ctx) => {
      if (ctx.cards && ctx.cards.length > 0) {
        const cardList = ctx.cards.map((c, i) => `**Card ${i + 1}:**\nFront: ${c.front}\nBack: ${c.back}`).join('\n\n');
        return `Review these flashcards and suggest improvements:\n\n${cardList}`;
      }
      if (ctx.card) return `Is this a good flashcard? How can it be improved?\n\n**Front:** ${ctx.card.front}\n**Back:** ${ctx.card.back}`;
      return 'Help me improve my flashcards.';
    },
    buildSystem: () => {
      return `You are Aura, a flashcard quality reviewer. Evaluate cards for:
1. Clarity — is the question unambiguous?
2. Specificity — is it testing one concept?
3. Difficulty — is it appropriately challenging?
4. Redundancy — are there overlapping cards?

For each card, rate it (Good/Needs Work/Poor) and suggest specific fixes. If a card should be split or merged, say so.`;
    },
  },
];

// ─── Quick diagnostic quiz (from ProfessorPage) ──────────────────────────

const DIAGNOSTIC_QUESTIONS = [
  {
    id: 'q1',
    question: 'What\'s your biggest study challenge?',
    options: [
      { value: 'retention', label: 'Forgetting what I learned' },
      { value: 'focus', label: 'Staying focused during study' },
      { value: 'time', label: 'Finding time to study' },
      { value: 'motivation', label: 'Staying motivated' },
    ],
  },
  {
    id: 'q2',
    question: 'How many cards do you review daily?',
    options: [
      { value: '0-10', label: '0–10 — just starting' },
      { value: '10-30', label: '10–30 — building momentum' },
      { value: '30-50', label: '30–50 — consistent' },
      { value: '50+', label: '50+ — power user' },
    ],
  },
  {
    id: 'q3',
    question: 'What subjects are you studying?',
    options: [
      { value: 'med', label: 'Medicine / Biology' },
      { value: 'tech', label: 'CS / Engineering' },
      { value: 'lang', label: 'Languages' },
      { value: 'other', label: 'Other / General' },
    ],
  },
];

// ─── Main ChatPage with Prof. Aura personality ────────────────────────────

export default function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { studyContext, setStudyContext, clearContext, hasContext } = useAuraContext();
  const ws = useDashboardWorkspace();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagAnswers, setDiagAnswers] = useState<Record<string, string>>({});
  const [diagStep, setDiagStep] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const deckCount = ws?.decks?.length ?? 0;
  const cardCount = ws?.cards?.length ?? 0;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Initialize context from URL params
  useEffect(() => {
    const entrypoint = searchParams.get('from') as AuraEntrypoint | null;
    if (entrypoint && !studyContext) {
      // In a real app, we'd fetch the card/deck data from the URL params
      // For now, set up the entrypoint
      setStudyContext({
        entrypoint,
        timestamp: Date.now(),
      });
    }
  }, [searchParams, studyContext, setStudyContext]);

  // Handle diagnostic completion
  const handleDiagComplete = () => {
    const answers = Object.values(diagAnswers).join(', ');
    const params = new URLSearchParams();
    params.set('q', `I'm a ${diagAnswers.q3 || 'student'} who struggles with ${diagAnswers.q1 || 'retention'}. I review ${diagAnswers.q2 || '10-30'} cards daily. Help me build a personalized study plan.`);
    setShowDiagnostic(false);
    setDiagAnswers({});
    setDiagStep(0);
    // Send the diagnostic result as first message
    sendMessage(params.get('q') || '');
  };

  // Auto-send first message if context has an entrypoint
  useEffect(() => {
    if (studyContext && messages.length === 0 && showQuickPrompts) {
      // Don't auto-send, let user choose a quick prompt
    }
  }, [studyContext, messages.length, showQuickPrompts]);

  const sendMessage = useCallback(async (content: string, systemPrompt?: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInputValue('');
    setShowQuickPrompts(false);
    setIsTyping(true);

    try {
      // Build context-aware system prompt
      const contextPrompt = studyContext
        ? buildContextPrompt(studyContext)
        : 'You are Aura, a study tutor. Help the student learn effectively.';

      const fullSystemPrompt = systemPrompt || contextPrompt;

      // Stream response via SSE Edge Function (Vercel or Supabase)
      let streamedContent = '';
      try {
        const useSupabaseSSE = import.meta.env.VITE_USE_SUPABASE_SSE === 'true';
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const sseUrl = useSupabaseSSE && supabaseUrl
          ? `${supabaseUrl}/functions/v1/chat-stream`
          : `${apiBase}/api/chat/stream`;
        const res = await fetch(sseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: fullSystemPrompt },
              { role: 'user', content },
            ],
            maxTokens: 2000,
            temperature: 0.7,
          }),
        });

        if (!res.ok) throw new Error(`SSE server ${res.status}`);

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No reader');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.content || parsed?.choices?.[0]?.delta?.content;
              if (delta) {
                streamedContent += delta;
                setMessages(prev => prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: streamedContent }
                    : m
                ));
              }
              if (parsed.error) {
                console.warn('SSE stream error:', parsed.error);
                break;
              }
            } catch { /* skip malformed */ }
          }
        }
      } catch {
        // Fallback to direct Groq API on network/SSE failure
        console.warn('SSE failed, falling back to direct Groq streaming');
        try {
          const stream = groqChatStream({
            messages: [
              { role: 'system', content: fullSystemPrompt },
              { role: 'user', content },
            ],
            maxTokens: 2000,
            temperature: 0.7,
          });

          for await (const chunk of stream) {
            streamedContent += chunk;
            setMessages(prev => prev.map(m =>
              m.id === assistantId
                ? { ...m, content: streamedContent }
                : m
            ));
          }
        } catch {
          // Non-streaming fallback as last resort
          const { content: fallbackContent } = await groqChat({
            messages: [
              { role: 'system', content: fullSystemPrompt },
              { role: 'user', content },
            ],
            maxTokens: 2000,
            temperature: 0.7,
          });
          streamedContent = fallbackContent;
        }
      }

      const actions = generateDemoActions(content, studyContext);
      // Attach actions to the streaming message after tokens arrive
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, actions, content: streamedContent }
          : m
      ));
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [messages, studyContext]);

  const handleQuickPrompt = (prompt: QuickPrompt) => {
    if (!studyContext) {
      // Create standalone context
      setStudyContext({
        entrypoint: 'standalone',
        timestamp: Date.now(),
      });
    }
    const ctx = studyContext || { entrypoint: 'standalone' as AuraEntrypoint, timestamp: Date.now() };
    sendMessage(prompt.buildMessage(ctx), prompt.buildSystem(ctx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleAction = (action: MessageAction) => {
    switch (action.type) {
      case 'add-card':
        // In production: call addCard API
        sendMessage('Add this card to my deck.');
        break;
      case 'generate-cards':
        sendMessage('Generate more cards like this.');
        break;
      case 'start-quiz':
        sendMessage('Quiz me on this topic.');
        break;
      case 'explain-differently':
        sendMessage('Explain this differently — maybe with an analogy or example.');
        break;
    }
  };

  const getPlaceholder = () => {
    if (studyContext?.card) return 'Ask about this card...';
    if (studyContext?.quiz) return 'Ask about this question...';
    if (studyContext?.deck) return `Ask about ${studyContext.deck.name}...`;
    return 'Ask Aura anything...';
  };

  return (
    <div className="chat-page">
      {/* Prof. Aura Personality Header */}
      <div className="chat-header relative overflow-visible">
        <div className="chat-header-left">
          <div className="relative">
            <div className="chat-avatar bg-gradient-to-br from-[#7C3AED] via-[#EC4899] to-[#06B6D4]">
              <BrainCircuit size={20} className="text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#111118]">
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="chat-title text-[#F0EFFE]">Prof. Aura</h1>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-medium leading-none">
                Online
              </span>
            </div>
            <p className="chat-subtitle">
              {studyContext
                ? <span className="text-[#8A8AA3]">Context-aware tutor</span>
                : <span className="text-[#8A8AA3]">
                    <TextSplit as="words" wrapperTag="span" stagger={30} duration={320}>
                      AI Study Coach
                    </TextSplit>
                  </span>
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!hasContext && messages.length === 0 && (
            <button
              onClick={() => setShowDiagnostic(true)}
              className="hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-[#1A1A24] border border-[#2A2A3A] hover:border-[#7C3AED]/40 text-[#8A8AA3] hover:text-[#F0EFFE] transition-all text-[10px]"
            >
              <Target size={12} />
              Quick diagnostic
            </button>
          )}
          {hasContext && (
            <button className="chat-clear-btn" onClick={clearContext}>
              Clear context
            </button>
          )}
        </div>
      </div>

      {/* Context Banner */}
      {studyContext && (
        <ContextBanner context={studyContext} onClear={clearContext} />
      )}

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            {/* Prof. Aura personality banner */}
            <div className="mb-6 rounded-2xl border border-[#7C3AED]/20 bg-gradient-to-r from-[#111118] via-[#15151D] to-[#111118] p-5 text-left relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-[0.06]"
                style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)', filter: 'blur(40px)' }}
              />
              <div className="relative z-10">
                <p className="text-[#F0EFFE] text-sm font-medium">Hey, I'm Prof. Aura! 👋</p>
                <p className="text-[#8A8AA3] text-xs mt-1 leading-relaxed max-w-lg">
                  I see your <strong className="text-[#F0EFFE]">{deckCount}</strong> decks and{' '}
                  <strong className="text-[#F0EFFE]">{cardCount}</strong> cards.
                  I can quiz you, explain concepts, generate decks, or build a cram plan.
                </p>
              </div>
            </div>

            <div className="chat-empty-icon">
              <Sparkles size={36} />
            </div>
            <h2 className="chat-empty-title">What can I help you study?</h2>
            <p className="chat-empty-desc">
              I'm your AI study coach. I can explain concepts, quiz you, generate flashcards,
              and help you understand difficult material.
            </p>
            {!studyContext && (
              <p className="chat-empty-hint">
                Tip: Rate a card "Again" or get a quiz question wrong to get contextual help.
              </p>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onAction={handleAction} />
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {showQuickPrompts && messages.length === 0 && (
        <div className="quick-prompts px-4 py-3">
          <p className="text-[#5A5A72] text-[10px] uppercase tracking-wider mb-2 font-medium">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt.id}
                className="quick-prompt-btn"
                onClick={() => handleQuickPrompt(prompt)}
              >
                {prompt.icon}
                <span>{prompt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form className="chat-input-area" onSubmit={handleSubmit}>
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            rows={1}
            disabled={isTyping}
          />
          <button
            className="chat-send-btn"
            type="submit"
            disabled={!inputValue.trim() || isTyping}
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </form>

      {/* Diagnostic Quiz Modal */}
      {showDiagnostic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="max-w-md w-full bg-[#111118] border border-[#2A2A3A] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#F0EFFE] text-sm font-semibold flex items-center gap-2">
                <Target size={14} className="text-[#7C3AED]" />
                Quick diagnostic
              </h3>
              <span className="text-[#5A5A72] text-xs">{diagStep + 1} / {DIAGNOSTIC_QUESTIONS.length}</span>
            </div>

            <div className="w-full h-1 rounded-full bg-[#2A2A3A] mb-6">
              <div
                className="h-1 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] transition-all duration-300"
                style={{ width: `${((diagStep + 1) / DIAGNOSTIC_QUESTIONS.length) * 100}%` }}
              />
            </div>

            <p className="text-[#F0EFFE] text-sm font-medium mb-4">
              {DIAGNOSTIC_QUESTIONS[diagStep].question}
            </p>

            <div className="space-y-2">
              {DIAGNOSTIC_QUESTIONS[diagStep].options.map((opt) => {
                const selected = diagAnswers[DIAGNOSTIC_QUESTIONS[diagStep].id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setDiagAnswers((prev) => ({
                        ...prev,
                        [DIAGNOSTIC_QUESTIONS[diagStep].id]: opt.value,
                      }));
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs transition-all border ${
                      selected
                        ? 'bg-[#7C3AED]/10 border-[#7C3AED]/40 text-[#F0EFFE]'
                        : 'bg-[#1A1A24] border-[#2A2A3A] text-[#8A8AA3] hover:border-[#3A3A4F]'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selected ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-[#3A3A4F]'
                      }`}>
                        {selected && <Check size={10} className="text-white" />}
                      </span>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => { setShowDiagnostic(false); setDiagAnswers({}); setDiagStep(0); }}
                className="px-4 py-2 rounded-lg border border-[#2A2A3A] text-[#5A5A72] text-xs hover:text-[#F0EFFE] transition-colors"
              >
                Skip
              </button>
              {diagStep < DIAGNOSTIC_QUESTIONS.length - 1 ? (
                <button
                  onClick={() => setDiagStep((s) => s + 1)}
                  disabled={!diagAnswers[DIAGNOSTIC_QUESTIONS[diagStep].id]}
                  className="px-4 py-2 rounded-lg bg-[#7C3AED] text-white text-xs font-medium hover:bg-[#6D28D9] transition-all disabled:opacity-30"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleDiagComplete}
                  disabled={!diagAnswers.q1 || !diagAnswers.q2 || !diagAnswers.q3}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-xs font-medium hover:opacity-90 transition-all disabled:opacity-30 flex items-center gap-2"
                >
                  <MessageCircle size={12} />
                  Start personalized chat
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function buildContextPrompt(ctx: StudyContext): string {
  let prompt = 'You are Aura, a study tutor. ';

  switch (ctx.entrypoint) {
    case 'card-again':
      prompt += 'The student is reviewing a flashcard and rated it "Again" (didn\'t remember). Explain the concept clearly, use analogies, and offer to quiz them. ';
      if (ctx.card) {
        prompt += `\nCard being reviewed:\nFront: ${ctx.card.front}\nBack: ${ctx.card.back}`;
      }
      break;
    case 'quiz-wrong':
      prompt += 'The student got a quiz question wrong. Explain WHY the correct answer is right and address their specific misconception. ';
      if (ctx.quiz) {
        prompt += `\nQuestion: ${ctx.quiz.question}\nStudent's answer: ${ctx.quiz.userAnswer}\nCorrect answer: ${ctx.quiz.correctAnswer}`;
      }
      break;
    case 'deck-ask':
      prompt += 'The student wants to learn more about a deck of flashcards. ';
      if (ctx.deck) {
        prompt += `Deck: "${ctx.deck.name}" (${ctx.deck.cardCount} cards)`;
      }
      break;
    case 'cards-improve':
      prompt += 'The student wants to improve their flashcards. Review them for clarity, specificity, and learning effectiveness. ';
      if (ctx.cards) {
        prompt += `\nCards to review:\n${ctx.cards.map((c, i) => `${i + 1}. Front: ${c.front}\n   Back: ${c.back}`).join('\n')}`;
      }
      break;
    case 'standalone':
      prompt += 'Help the student with their study questions. Be concise and use examples.';
      break;
  }

  prompt += '\n\nUse markdown formatting. Be concise (3-5 paragraphs max unless asked for more). Use bold for key terms. Use analogies and examples to explain complex concepts.';

  return prompt;
}

function generateDemoActions(input: string, ctx: StudyContext | null): MessageAction[] {
  const actions: MessageAction[] = [];

  if (input.toLowerCase().includes('explain') || input.toLowerCase().includes('what is')) {
    actions.push({
      id: 'quiz-me',
      label: 'Quiz me on this',
      type: 'start-quiz',
    });
    actions.push({
      id: 'generate-cards',
      label: 'Generate cards',
      type: 'generate-cards',
    });
  }

  if (input.toLowerCase().includes('quiz')) {
    actions.push({
      id: 'explain',
      label: 'Explain more',
      type: 'explain-differently',
    });
  }

  if (input.toLowerCase().includes('generate') || input.toLowerCase().includes('card')) {
    actions.push({
      id: 'add-cards',
      label: 'Add to deck',
      type: 'add-card',
    });
    actions.push({
      id: 'regenerate',
      label: 'Generate more',
      type: 'generate-cards',
    });
  }

  return actions;
}
