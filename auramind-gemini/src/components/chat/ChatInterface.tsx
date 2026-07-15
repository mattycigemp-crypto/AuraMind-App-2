import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { supabase } from '../../services/database/supabase';

const SSE_BASE = import.meta.env.VITE_SSE_BASE || 'http://localhost:3001';

interface ChatInterfaceProps {
  className?: string;
}

function ChatInterface({ className }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const bufferRef = useRef('');
  const rafRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const flushBuffer = useCallback(() => {
    setAiResponse(bufferRef.current);
    rafRef.current = null;
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(flushBuffer);
    }
  }, [flushBuffer]);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const handleSend = useCallback(async () => {
    const message = input.trim();
    if (!message || isStreaming) return;

    cleanup();
    bufferRef.current = '';
    setAiResponse('');
    setError(null);
    setIsStreaming(true);

    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;
    const url = `${SSE_BASE}/api/chat/stream?message=${encodeURIComponent(message)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      if (event.data === '[DONE]') {
        cleanup();
        setIsStreaming(false);
        flushBuffer();
        return;
      }

      try {
        const parsed = JSON.parse(event.data);
        if (parsed.token) {
          bufferRef.current += parsed.token;
          scheduleFlush();
        }
        if (parsed.error) {
          setError(parsed.error);
          cleanup();
          setIsStreaming(false);
        }
      } catch {
        bufferRef.current += event.data;
        scheduleFlush();
      }
    };

    es.onerror = () => {
      setError('Connection lost. Please try again.');
      setIsStreaming(false);
      es.close();
      eventSourceRef.current = null;
    };

    setInput('');
  }, [input, isStreaming, cleanup, scheduleFlush, flushBuffer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleCancel = useCallback(() => {
    cleanup();
    setIsStreaming(false);
  }, [cleanup]);

  return (
    <div className={cn('flex flex-col h-full bg-zinc-950 text-zinc-100', className)}>
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {!aiResponse && !isStreaming && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 px-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <svg
                className="w-7 h-7 md:w-8 md:h-8 text-teal-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                />
              </svg>
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-zinc-300">
              Ask Aura anything
            </h2>
            <p className="text-xs md:text-sm text-zinc-500 max-w-xs md:max-w-md">
              Study help, concept explanations, homework guidance — powered by
              your fine-tuned Qwen model.
            </p>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 md:p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs md:text-sm"
          >
            {error}
          </motion.div>
        )}

        {aiResponse && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto w-full"
          >
            <div className="flex items-start gap-2 md:gap-3">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="w-3.5 h-3.5 md:w-4 md:h-4 text-teal-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-teal-400/80 mb-1.5 md:mb-2">
                  Aura
                </p>
                <div className="text-xs md:text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap [word-break:break-word]">
                  {aiResponse}
                  {isStreaming && (
                    <span className="inline-flex ml-0.5 align-text-bottom">
                      <span className="w-[2px] md:w-[3px] h-[1em] bg-teal-400 animate-pulse rounded-[1px]" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="border-t border-zinc-800/60 p-3 md:p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-zinc-900/80 border border-zinc-800/60 rounded-xl md:rounded-2xl p-1.5 md:p-2 focus-within:border-teal-500/40 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Aura a question..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm leading-relaxed max-h-32 md:max-h-40 disabled:opacity-50"
              style={{ minHeight: '32px' }}
            />
            {isStreaming ? (
              <button
                onClick={handleCancel}
                className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors shrink-0"
                aria-label="Stop generating"
              >
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-teal-600 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-teal-500 transition-colors shrink-0 shadow-lg shadow-teal-600/20"
                aria-label="Send message"
              >
                <svg
                  className="w-3.5 h-3.5 md:w-4 md:h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
              </button>
            )}
          </div>
          <p className="text-center text-[10px] md:text-xs text-zinc-600 mt-1.5 md:mt-2">
            Aura can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
