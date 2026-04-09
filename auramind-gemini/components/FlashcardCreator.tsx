import React, { useState } from 'react';
import { Plus, X, BrainCircuit, Type, FileText, CheckCircle2 } from 'lucide-react';

interface FlashcardCreatorProps {
    onAddCard: (question: string, answer: string) => void;
    className?: string;
}

const FlashcardCreator: React.FC<FlashcardCreatorProps> = ({ onAddCard, className = "" }) => {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (question.trim() && answer.trim()) {
            onAddCard(question, answer);
            setQuestion('');
            setAnswer('');
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 2000);
        }
    };

    return (
        <div className={`glass-card rounded-3xl p-8 border dark:border-white/10 border-black/10 relative overflow-hidden ${className}`}>
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 p-8 dark:opacity-5 opacity-[0.03] pointer-events-none">
                <BrainCircuit size={120} className="dark:text-white text-black" />
            </div>

            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    <Type size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-display font-bold dark:text-white text-black tracking-tight">Manual Creator</h3>
                    <p className="text-xs dark:text-white/40 text-black/40 uppercase tracking-[0.2em] font-bold">Craft local flashcards</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="group space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] dark:text-white/30 text-black/30 ml-1">Question / Term</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g. What is Mitochondrial DNA?"
                            className="w-full dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10 rounded-2xl px-6 py-4 text-sm dark:text-white text-black focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all dark:placeholder:text-black/ dark:text-white/ placeholder:text-black/10"
                            required
                        />
                    </div>
                </div>

                <div className="group space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] dark:text-white/30 text-black/30 ml-1">Answer / Definition</label>
                    <div className="relative">
                        <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="e.g. Small circular chromosome found in the mitochondria..."
                            className="w-full dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10 rounded-2xl px-6 py-4 text-sm dark:text-white text-black focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all dark:placeholder:text-black/ dark:text-white/ placeholder:text-black/10 h-32 resize-none"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className={`w-full py-5 rounded-[24px] font-bold uppercase tracking-[0.2em] text-xs transition-all shadow-xl flex items-center justify-center gap-3 relative overflow-hidden ${isSuccess
                        ? 'bg-emerald-500 text-slate-900 dark:text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white shadow-indigo-600/20'
                        }`}
                >
                    {isSuccess ? (
                        <>
                            <CheckCircle2 size={18} className="animate-in zoom-in duration-300" />
                            <span>Card Saved!</span>
                        </>
                    ) : (
                        <>
                            <Plus size={18} />
                            <span>Add to Active Deck</span>
                        </>
                    )}

                    <div className="absolute inset-0 bg-black/5 dark:bg-white/ translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                </button>
            </form>
        </div>
    );
};

export default FlashcardCreator;
