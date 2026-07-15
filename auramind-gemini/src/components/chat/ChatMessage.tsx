import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';
import type { Message } from '../../hooks/useAIChat';
import QuizBlock from './QuizBlock';

interface Props {
  message: Message;
  isStreaming: boolean;
  onSaveCard: (messageId: string, term: string, definition: string) => void;
  onAnswerQuiz: (messageId: string, answerIndex: number) => void;
}

export default function ChatMessage({ message, isStreaming, onSaveCard, onAnswerQuiz }: Props) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (message.saveCardData) {
      onSaveCard(message.id, message.saveCardData.term, message.saveCardData.definition);
      setSaved(true);
    }
  };

  if (message.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15 }}
        className="ml-auto max-w-[75%]"
      >
        <div className="rounded-2xl rounded-br-sm bg-purple-600 px-4 py-2.5 text-sm text-zinc-50">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      className="mr-auto max-w-[80%]"
    >
      <div className="rounded-2xl rounded-bl-sm bg-zinc-800 border border-zinc-700 px-4 py-3 text-sm text-zinc-100">
        <div className="whitespace-pre-wrap leading-relaxed">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-0.5 h-3.5 bg-purple-400 ml-0.5 animate-pulse" />
          )}
        </div>
        {message.quizBlock && !isStreaming && (
          <QuizBlock
            question={message.quizBlock.question}
            options={message.quizBlock.options}
            correctIndex={message.quizBlock.correctIndex}
            userAnswer={message.quizBlock.userAnswer}
            onAnswer={(idx) => onAnswerQuiz(message.id, idx)}
          />
        )}
      </div>
      {message.hasSaveCard && message.role === 'assistant' && !isStreaming && (
        <div className="mt-1.5 ml-2">
          {saved ? (
            <span className="text-xs text-zinc-500">Saved</span>
          ) : (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors duration-150"
            >
              <PlusCircle size={12} />
              Save as card
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
