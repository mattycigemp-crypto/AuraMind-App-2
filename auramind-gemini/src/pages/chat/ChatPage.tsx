import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send, X, BookOpen, Lightbulb, HelpCircle, Wand2,
  Copy, Check, RotateCcw, ArrowUp, ChevronDown,
  Plus, Edit3, Sparkles
} from 'lucide-react';
import { useAuraContext, StudyContext, AuraEntrypoint } from '../contexts/AuraContext';
import { motion, AnimatePresence } from 'framer-motion';

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

// ─── Main ChatPage ───────────────────────────────────────────────────────

export default function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { studyContext, setStudyContext, clearContext, hasContext } = useAuraContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setShowQuickPrompts(false);
    setIsTyping(true);

    try {
      // Build context-aware system prompt
      const contextPrompt = studyContext
        ? buildContextPrompt(studyContext)
        : 'You are Aura, a study tutor. Help the student learn effectively.';

      const fullSystemPrompt = systemPrompt || contextPrompt;

      // In production, this would call the API:
      // const response = await supabase.functions.invoke('chat', {
      //   body: {
      //     messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
      //     systemPrompt: fullSystemPrompt,
      //     context: studyContext,
      //   },
      // });

      // Simulated response for demo
      await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));

      const responseContent = generateDemoResponse(content, studyContext);
      const actions = generateDemoActions(content, studyContext);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now(),
        actions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
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
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-avatar">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="chat-title">Ask Aura</h1>
            <p className="chat-subtitle">
              {studyContext ? 'Context-aware tutor' : 'Your study assistant'}
            </p>
          </div>
        </div>
        {hasContext && (
          <button className="chat-clear-btn" onClick={clearContext}>
            Clear context
          </button>
        )}
      </div>

      {/* Context Banner */}
      {studyContext && (
        <ContextBanner context={studyContext} onClear={clearContext} />
      )}

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <Sparkles size={48} />
            </div>
            <h2 className="chat-empty-title">What can I help you study?</h2>
            <p className="chat-empty-desc">
              I'm your AI tutor. I can explain concepts, quiz you, generate flashcards,
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
      {showQuickPrompts && studyContext && (
        <div className="quick-prompts">
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

function generateDemoResponse(input: string, ctx: StudyContext | null): string {
  // This is a placeholder. In production, the API would generate real responses.
  if (input.toLowerCase().includes('explain') || input.toLowerCase().includes('what is')) {
    return `## Understanding the Concept

Great question! Let me break this down for you.

**Key Idea:** The core concept here is about how information moves through a system. Think of it like a river — water (data) flows from the source (input) through various channels (processing) to the destination (output).

### How it works:
1. **Input phase** — Data enters the system through defined interfaces
2. **Processing phase** — The system transforms the data using specific rules
3. **Output phase** — Results are delivered in a usable format

### Why this matters:
- It ensures **consistency** in how data is handled
- Makes the system **predictable** and easier to debug
- Allows for **modular** design — you can swap out parts without breaking the whole

Does this make sense? I can explain it differently or quiz you on it.`;
  }

  if (input.toLowerCase().includes('quiz')) {
    return `## Quick Quiz

Let's test your understanding!

**Q1:** What is the primary purpose of this mechanism?
a) To store data permanently
b) To transform and route information
c) To display results to users
d) To authenticate requests

**Q2:** Which phase comes first in the process?
a) Output
b) Processing
c) Input
d) Validation

**Q3:** What analogy did I use to explain the concept?
a) A tree with branches
b) A river flowing
c) A building with floors
d) A chain of links

Reply with your answers (e.g., "1-b, 2-c, 3-b") and I'll explain each one!`;
  }

  if (input.toLowerCase().includes('generate') || input.toLowerCase().includes('card')) {
    return `## Generated Flashcards

Here are some cards to help you practice:

**Card 1:**
**Front:** What are the three main phases of data processing?
**Back:** Input → Processing → Output. Data enters through interfaces, gets transformed by rules, and results are delivered in a usable format.
**Tags:** fundamentals, process

**Card 2:**
**Front:** Why is modular design important in data systems?
**Back:** It allows individual components to be swapped or updated without breaking the entire system, improving maintainability and flexibility.
**Tags:** design-principles, architecture

**Card 3:**
**Front:** What analogy helps explain data flow?
**Back:** A river — water (data) flows from the source (input) through channels (processing) to the destination (output).
**Tags:** analogies, fundamentals

Want me to add these to your deck?`;
  }

  return `I understand your question. Let me help you with that.

The concept you're asking about is fundamental to how systems handle information. Here's the key insight:

**Think of it this way:** Every piece of data follows a journey from where it starts to where it needs to go. Along the way, it gets transformed, validated, and shaped into something useful.

Would you like me to:
- **Explain** this in more detail
- **Quiz** you on what we've covered
- **Generate** practice cards for this topic`;
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
