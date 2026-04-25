import React, { useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2 } from 'lucide-react';
import MathRichText from '../../components/shared/MathRichText';
import CitationStack from '../../components/shared/CitationStack';

interface DeckDetailRouteProps {
  decks: any[];
  cards: any[];
  deleteCard: (id: string) => void;
  setActiveDeckId: (id: string) => void;
}

const DeckDetailRoute: React.FC<DeckDetailRouteProps> = ({ decks, cards, deleteCard, setActiveDeckId }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  useEffect(() => {
    if (id) setActiveDeckId(id);
  }, [id, setActiveDeckId]);

  if (!id) return <Navigate to="/dashboard" replace />;
  const deck = decks.find((d: any) => d.id === id);
  const deckCards = cards.filter((c: any) => c.deckId === id);
  
  if (!deck) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-8 py-4">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-arch-eyebrow hover:text-arch-fg transition-colors group">
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-arch-impact text-[48px] lowercase">{deck.title}.</h1>
          <p className="text-arch-muted mt-4 max-w-xl font-medium tracking-tight whitespace-pre-wrap">{deck.description}</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate(`/study/${id}`)} className="btn-arch px-8">Start Study Session</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {deckCards.map((card: any) => (
          <div key={card.id} className="architectural-panel p-8 group relative flex flex-col justify-between min-h-[300px]">
            <button onClick={() => deleteCard(card.id)} className="absolute top-6 right-6 text-arch-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 size={16} />
            </button>
            <div>
              <p className="text-arch-eyebrow mb-6">Question</p>
              <h3 className="text-lg font-black italic tracking-tight mb-8 text-arch-fg">
                <MathRichText text={card.question} block />
              </h3>
            </div>
            <div className="pt-6 border-t border-arch-border">
              <p className="text-arch-eyebrow mb-3">Answer</p>
              <p className="text-xs text-arch-muted italic line-clamp-3 font-medium">
                <MathRichText text={card.answer} />
              </p>
              <CitationStack card={card} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeckDetailRoute;
