import React, { useState, useEffect, useRef } from 'react';
import { auraAiClient, STUDY_AGENT_SYSTEM_PROMPT } from '../../services/api/auraAiService';
import { ChevronLeftIcon as ChevronLeft, BotIcon as Bot, MusicIcon as Music, XIcon as X, SendIcon as Send, SparklesIcon as Sparkles, BrainCircuitIcon as BrainCircuit, HistoryIcon as History, TargetIcon as Target, CpuIcon as Cpu, ActivityIcon as Activity, GlobeIcon as Globe } from '../icons/CustomIcons';
import { StudyToolAction, ChatMessage, Quiz, FlashcardData, Deck, Card, Presentation } from '../../types';
import ChatQuiz from './ChatQuiz';
import ChatFlashcardPreview from './ChatFlashcardPreview';
import ChatPresentation from './ChatPresentation';
import { getInitialCardState } from '../../services/study/srs';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AuraChatProps {
  onBack?: () => void;
  onCreateDeck?: (deck: Omit<Deck, 'id' | 'createdAt' | 'cardCount'>) => void;
  onCreateCard?: (card: Omit<Card, 'id'>) => void;
}

const AuraChat: React.FC<AuraChatProps> = ({ onBack, onCreateDeck, onCreateCard }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const parseToolAction = (content: string): StudyToolAction | null => {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        if (parsed.tool && (parsed.data || parsed.cards)) {
          return {
            tool: parsed.tool,
            data: parsed.data || { cards: parsed.cards }
          } as StudyToolAction;
        }
      }
    } catch (e) {}
    return null;
  };

  const getCleanContent = (content: string): string => {
    let cleaned = content.replace(/```[a-z]*\n?[\s\S]*?```/g, '');
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const potentialJson = cleaned.substring(firstBrace, lastBrace + 1);
      if (potentialJson.includes('"tool":') || potentialJson.includes('"questions":') || potentialJson.includes('"cards":')) {
        cleaned = cleaned.substring(0, firstBrace) + cleaned.substring(lastBrace + 1);
      }
    }
    const fillers = [
      /I have generated [\s\S]*? for you:?/gi,
      /Certainly! Here is [\s\S]*?:/gi,
      /Sure, I can help with that\.?[\s\S]*?:/gi,
      /Here is the [\s\S]*? you requested:?/gi,
      /\[TOOL: [\s\S]*?\]/gi,
      /`tool`:[\s\S]*?/gi
    ];
    fillers.forEach(regex => { cleaned = cleaned.replace(regex, ''); });
    return cleaned.trim();
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);

    const assistantId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      thinking: '',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    streamAIResponse(assistantId, input);
  };

  const streamAIResponse = async (assistantId: string, messageContent: string) => {
    let fullContent = '';
    let thinkingContent = '';
    let isThinking = false;

    try {
      const stream = auraAiClient.streamChatCompletion({
        messages: [
          { role: 'system', content: STUDY_AGENT_SYSTEM_PROMPT },
          ...messages.map(m => ({ role: m.role as any, content: m.content })),
          { role: 'user', content: messageContent }
        ]
      });

      for await (const chunk of stream) {
        if (chunk.includes('<think>')) {
          isThinking = true;
          const parts = chunk.split('<think>');
          fullContent += parts[0];
          thinkingContent += parts[1] || '';
        } else if (chunk.includes('</think>')) {
          isThinking = false;
          const parts = chunk.split('</think>');
          thinkingContent += parts[0];
          fullContent += parts[1] || '';
        } else {
          if (isThinking) {
            thinkingContent += chunk;
          } else {
            fullContent += chunk;
          }
        }

        setMessages(prev => prev.map(msg =>
          msg.id === assistantId
            ? { ...msg, content: fullContent, thinking: thinkingContent }
            : msg
        ));
      }

      const toolAction = parseToolAction(fullContent);
      if (toolAction) {
        setMessages(prev => prev.map(msg =>
          msg.id === assistantId ? { ...msg, toolAction } : msg
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI response.');
      setMessages(prev => prev.filter(m => m.id !== assistantId || m.content !== ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleThinking = (id: string) => {
    setExpandedThinking(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col h-full w-full bg-arch-bg text-slate-900 dark:text-white overflow-hidden font-body relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden translate-z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/5 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-zinc-900/5 backdrop-blur-3xl z-40 relative">
        <div className="flex items-center gap-6">
          {onBack && (
            <button
onClick={onBack}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all group px-3 py-1.5 rounded-xl hover:bg-zinc-900/10"
            >
              <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back</span>
            </button>
          )}
          <div className="h-6 w-[1px] bg-zinc-800 hidden sm:block" />
          <div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-2xl bg-zinc-900/5 border border-zinc-800 flex items-center justify-center p-[2px]">
              <div className="w-full h-full rounded-[14px] bg-arch-bg flex items-center justify-center border border-zinc-800">
                <BrainCircuit size={18} className="text-zinc-400" />
              </div>
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">AI Study Assistant <span className="text-[8px] text-black/ dark:text-white/ italic mx-2 tracking-widest font-bold">Aura-V2</span></h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75 rounded-full" />
                  <span className="relative inline-flex h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                </span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">Connected</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          <div className="flex flex-col items-end">
<p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Messages</p>
            <p className="text-[11px] font-black text-zinc-400 italic tracking-tighter">1,240 / 8,000</p>
          </div>
          <button className="w-10 h-10 rounded-xl bg-zinc-900/5 border border-zinc-800 flex items-center justify-center hover:bg-zinc-900/10 hover:border-zinc-700 transition-all text-zinc-400 hover:text-white">
             <Globe size={16} />
          </button>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-30 px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 animate-fade-in text-center">
              <div className="w-20 h-20 bg-zinc-900/5 border border-zinc-800 rounded-[32px] flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(255,255,255,0.02)] relative group hover:scale-110 transition-all duration-700">
                <div className="absolute inset-0 bg-zinc-900 shadow-[0_0_80px_rgba(255,255,255,0.05)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <Sparkles size={32} className="text-slate-900 dark:text-white relative z-10" />
              </div>
              <h3 className="text-4xl sm:text-6xl font-display font-black italic uppercase tracking-tightest leading-none text-slate-900 dark:text-white mb-6">
                Ready to learn.<br />
                <span className="text-black/ dark:text-white/">Ask me anything.</span>
              </h3>
<p className="text-zinc-400 text-xs sm:text-sm max-w-sm leading-relaxed uppercase tracking-widest font-black italic">
                Your AI study assistant is ready. Type a topic or question to get started.
              </p>

              <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                {[
                  { label: "Neural Basis of Memory", icon: Cpu, detail: "Deep Analysis" },
                  { label: "Biological Systems Quiz", icon: Target, detail: "Knowledge Validation" },
                  { label: "Calculus Optimization", icon: Activity, detail: "Structured Review" },
                  { label: "Historical Timeline", icon: History, detail: "Temporal Logic" }
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s.label)}
                    className="p-6 rounded-[24px] bg-zinc-900/5 border border-zinc-800 hover:bg-zinc-900/10 hover:border-zinc-700 transition-all active:scale-[0.98] text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900/5 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 group-hover:text-white transition-all">
                        <s.icon size={18} />
                      </div>
                      <div>
<p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">{s.label}</p>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 mt-1">{s.detail}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-12 pb-32">
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => {
                  const isToolMessage = message.role === 'assistant' && message.toolAction;
                  const hasThinking = message.thinking && message.thinking.trim().length > 0;
                  const isThinkingCurrently = isLoading && index === messages.length - 1 && hasThinking;
                  const cleanText = getCleanContent(message.content);

                  return (
                    <motion.div
                      key={message.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      {/* Interaction Headers */}
                      <div className={`flex items-center gap-3 mb-4 px-1 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
<div className="w-6 h-6 rounded-lg bg-zinc-900/5 border border-zinc-800 flex items-center justify-center">
                             {message.role === 'assistant' ? <Bot size={12} className="text-zinc-400" /> : <div className="w-1 h-1 rounded-full bg-zinc-900/5" />}
                         </div>
<span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400">
                             {message.role === 'assistant' ? 'Aura' : 'You'}
                         </span>
                      </div>

                      {/* Thinking (Operator Logic) */}
                      {hasThinking && (
                        <div className="mb-6 w-full max-w-2xl">
                          <button
                            onClick={() => toggleThinking(message.id!)}
                            className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-all bg-zinc-900/5 border border-zinc-800 px-4 py-2 rounded-full backdrop-blur-xl group"
                          >
                            <Cpu size={12} className={`transition-transform duration-500 ${expandedThinking[message.id!] ? 'rotate-90' : ''}`} />
                            {isThinkingCurrently ? 'Thinking...' : 'Show thought process'}
                            <div className="w-1 h-1 rounded-full bg-zinc-800 group-hover:bg-zinc-700" />
                          </button>

                          <AnimatePresence>
                            {expandedThinking[message.id!] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 p-7 bg-zinc-900/5 border-l-2 border-zinc-800 rounded-r-3xl text-[11px] text-zinc-300 font-medium leading-relaxed italic whitespace-pre-wrap">
                                  {message.thinking}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Content Bubble */}
                      <div className={`relative max-w-[85%] group ${message.role === 'user' ? 'text-right' : 'w-full'}`}>
                        {cleanText.length > 0 && (
<div className={`text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium p-7 rounded-[32px] border transition-all duration-500 ${
                            message.role === 'user'
                              ? 'bg-zinc-900 text-white border-zinc-800 shadow-[0_10px_40px_rgba(255,255,255,0.05)] font-bold italic'
                              : 'bg-zinc-900/5 border-zinc-800 text-zinc-300 backdrop-blur-xl'
                          }`}>
                            {cleanText}
                          </div>
                        )}

                        {/* Tool UI Components */}
                        {isToolMessage && message.toolAction && (
                          <div className="mt-8 space-y-8 animate-fade-in-up">
                            {message.toolAction.tool === 'generate_quiz' && (
                              <ChatQuiz quiz={message.toolAction.data as Quiz} onComplete={(s, t) => {}} />
                            )}
                            {message.toolAction.tool === 'generate_flashcards' && (
                              <ChatFlashcardPreview cards={message.toolAction.data.cards as FlashcardData[]} onSaveCards={(c, d) => {}} />
                            )}
                            {message.toolAction.tool === 'generate_presentation' && (
                              <ChatPresentation presentation={message.toolAction.data as Presentation} />
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Module */}
      <footer className="p-6 sm:p-10 bg-gradient-to-t from-arch-bg via-arch-bg/80 to-transparent relative z-50">
        <div className="max-w-3xl mx-auto">
          <div className="relative group/input">
            {/* Input Glow */}
            <div className="absolute -inset-[2px] bg-gradient-to-r from-white/10 to-transparent rounded-[30px] blur-md opacity-20 group-focus-within/input:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="relative flex items-center bg-zinc-900/5 border border-zinc-800 rounded-[28px] overflow-hidden backdrop-blur-3xl transition-all group-focus-within/input:bg-zinc-900/5 group-focus-within/input:border-zinc-700 p-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Aura anything..."
                className="flex-1 bg-transparent border-none outline-none px-6 py-4 text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-black/ dark:text-white/ font-bold italic tracking-tight"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className={`w-14 h-14 rounded-[22px] flex items-center justify-center transition-all duration-500 shrink-0 ${
isLoading || !input.trim()
                      ? 'bg-zinc-900/5 text-zinc-400 border border-zinc-800'
                      : 'bg-zinc-900 text-white hover:scale-[1.05] active:scale-[0.95] shadow-[0_10px_30px_rgba(255,255,255,0.1)]'
                }`}
              >
                {isLoading ? (
                  <Activity size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-4 px-4">
              <div className="flex gap-4">
                <button className="text-[9px] font-black uppercase tracking-[0.2em] text-black/ dark:text-white/ hover:text-black/ dark:text-white/ transition-colors flex items-center gap-2">
                  <Music size={10} /> Study Music
                </button>
                <button className="text-[9px] font-black uppercase tracking-[0.2em] text-black/ dark:text-white/ hover:text-black/ dark:text-white/ transition-colors flex items-center gap-2">
                   <Target size={10} /> Focus Timer
                </button>
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/ dark:text-white/">Ready</p>
            </div>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        .animate-pulse-slow { animation: pulse-slow 8s infinite ease-in-out; }
      `}} />
    </div>
  );
};

export default AuraChat;



