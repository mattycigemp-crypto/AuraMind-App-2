import React, { useState } from 'react';
import { PlusIcon as Plus, TypeIcon as Type, CheckCircle2Icon as CheckCircle2 } from '../icons/CustomIcons';

interface FlashcardCreatorProps {
    onAddCard: (question: string, answer: string) => Promise<void>;
    className?: string;
}

const FlashcardCreator: React.FC<FlashcardCreatorProps> = ({ onAddCard, className = "" }) => {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (question.trim() && answer.trim()) {
            setIsSubmitting(true);
            try {
                await onAddCard(question, answer);
                setQuestion('');
                setAnswer('');
                setIsSuccess(true);
                setTimeout(() => setIsSuccess(false), 2000);
            } catch (error) {
                console.error('Error adding card:', error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className={`bg-zinc-900/5 border border-zinc-800/60 rounded-[40px] p-8 relative overflow-hidden ${className}`}>
            <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-zinc-900/5 border border-zinc-800/60 rounded-xl flex items-center justify-center">
                    <Type size={20} className="text-white" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Manual Card Creator</p>
                    <p className="text-[9px] font-bold text-white uppercase tracking-[0.2em] mt-0.5 italic">Add to Deck</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-white ml-1">Question</label>
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g., What is photosynthesis?"
                        className="w-full bg-zinc-900/5 border border-zinc-800/60 px-6 py-4 outline-none focus:border-white/30 transition-all font-bold text-sm text-white placeholder:text-zinc-500 rounded-2xl"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-white ml-1">Answer</label>
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="e.g., The process by which plants convert light energy into chemical energy..."
                        className="w-full bg-zinc-900/5 border border-zinc-800/60 px-6 py-4 outline-none focus:border-white/30 transition-all font-bold text-sm text-white placeholder:text-zinc-500 rounded-2xl h-32 resize-none"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-2 ${isSuccess
                        ? 'bg-emerald-500 text-white'
                        : 'bg-zinc-900 text-white hover:scale-[1.02] active:scale-[0.98]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-current opacity-30 border-t-current rounded-full animate-spin" />
                            <span>Saving...</span>
                        </>
                    ) : isSuccess ? (
                        <>
                            <CheckCircle2 size={18} />
                            <span>Card Saved!</span>
                        </>
                    ) : (
                        <>
                            <Plus size={18} />
                            <span>Add Card</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default FlashcardCreator;



