import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Bell, Flame } from 'lucide-react';
import type { UserProfile, Deck, Card } from '../../types';
import PageShell from './PageShell';

type Props = {
  user: UserProfile;
  decks: Deck[];
  cards: Card[];
  createDeck: (title: string, description: string) => Promise<Deck | null>;
  deleteDeck: (id: string) => Promise<void>;
  addCardsToDeck: (deckId: string, newCards: any[]) => Promise<number | undefined>;
  onLogout: () => void;
  initialPage?: string;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

const StatCard = ({ label, value, trend, accent }: { label: string; value: string; trend?: string; accent?: string }) => (
  <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-5">
    <div className="text-[#5A5A72] text-[11px] font-medium mb-1">{label}</div>
    <div className={`text-2xl font-semibold ${accent || 'text-[#F0EFFE]'} mb-0.5`}>{value}</div>
    {trend && <div className="text-emerald-400 text-[10px]">{trend}</div>}
  </div>
);

export const UnifiedDashboard: React.FC<Props> = ({
  user, decks, cards, createDeck, deleteDeck, addCardsToDeck, onLogout, initialPage,
}) => {
  const navigate = useNavigate();
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const todayCards = useMemo(() => cards.filter(c => c.nextReview <= Date.now()).length, [cards]);
  const studiedToday = useMemo(() => cards.filter(c => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    return c.lastReviewed >= d.getTime();
  }).length, [cards]);
  
  // Real computed stats (no more mocks)
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0);
  const reviewedThisWeek = useMemo(() => cards.filter(c => c.lastReviewed && c.lastReviewed >= weekStart.getTime()).length, [cards, weekStart]);
  const totalStudiedCards = useMemo(() => cards.filter(c => (c.repetition ?? 0) > 0 || (c.lastReviewed && c.lastReviewed > 0)).length, [cards]);

  const handleCreateDeck = async () => {
    if (!newTitle.trim()) return;
    await createDeck(newTitle.trim(), newDesc.trim());
    setNewTitle(''); setNewDesc(''); setShowNewDeck(false);
  };

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#F0EFFE] text-xl font-light tracking-tight">
              Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user.name.split(' ')[0]}
            </h1>
            <p className="text-[#5A5A72] text-xs mt-0.5">{formatDate(Date.now())}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111118] border border-[#2A2A3A] text-[#5A5A72] text-xs w-48">
              <Search size={14} />
              <input
                placeholder="Search decks or cards..."
                className="bg-transparent outline-none text-[#F0EFFE] text-xs w-full placeholder-[#5A5A72]"
              />
            </div>
            <button className="w-8 h-8 rounded-lg bg-[#111118] border border-[#2A2A3A] flex items-center justify-center text-[#5A5A72] hover:text-[#F0EFFE] transition-colors">
              <Bell size={16} />
            </button>
          </div>
        </div>

        {/* Today's Goal */}
        <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#2A2A3A" strokeWidth="3" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#7C3AED" strokeWidth="3"
                    strokeDasharray={`${(studiedToday / 20) * 213.6} 213.6`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-[#F0EFFE] text-lg font-semibold leading-none">{studiedToday}</span>
                  <span className="text-[#5A5A72] text-[9px]">/ 20</span>
                </div>
              </div>
              <div>
                <div className="text-[#5A5A72] text-[10px] font-medium tracking-wider uppercase mb-0.5">Today's Goal</div>
                <div className="text-[#F0EFFE] text-sm font-medium">{studiedToday} cards reviewed today</div>
                <div className="text-[#5A5A72] text-xs mt-0.5">{Math.max(0, 20 - studiedToday)} more to hit your goal</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <Flame size={16} className="text-orange-400" />
                  <span className="text-[#F0EFFE] text-xs font-medium">{user.streak} day streak</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/study/${decks[0]?.id || ''}`)}
              className="px-5 py-2.5 bg-[#7C3AED] text-white text-xs font-medium rounded-lg hover:bg-[#6D28D9] transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)]"
            >
              Study now
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total cards studied" value={totalStudiedCards.toLocaleString()} trend={cards.length > 0 ? `${cards.length} in library` : undefined} />
          <StatCard label="Reviewed this week" value={reviewedThisWeek.toLocaleString()} trend={studiedToday > 0 ? `+${studiedToday} today` : undefined} accent={reviewedThisWeek > 0 ? 'text-[#8B5CF6]' : undefined} />
          <StatCard label="Current streak" value={`${user.streak}`} trend={user.streak >= 7 ? 'Personal best' : undefined} accent="text-orange-400" />
          <StatCard label="Decks" value={`${decks.length}`} trend={decks.length > 0 ? `${cards.length} cards total` : 'Create your first'} accent={decks.length > 0 ? 'text-emerald-400' : undefined} />
        </div>

        {/* Due Today */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[#F0EFFE] text-sm font-medium">Due today</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#7C3AED]/10 text-[#8B5CF6] text-[10px] font-medium">
                {decks.filter(d => cards.some(c => c.deckId === d.id && c.nextReview <= Date.now())).length} decks
              </span>
            </div>
            <button onClick={() => setShowNewDeck(true)} className="px-3 py-1.5 bg-[#7C3AED] text-white text-[11px] font-medium rounded-lg hover:bg-[#6D28D9] transition-all">
              + New Deck
            </button>
          </div>

          {showNewDeck && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 bg-[#111118] border border-[#2A2A3A] rounded-xl p-4"
            >
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                placeholder="Deck title"
                className="w-full bg-[#1A1A24] border border-[#2A2A3A] rounded-lg px-3 py-2 text-[#F0EFFE] text-sm placeholder-[#5A5A72] outline-none focus:border-[#7C3AED]/50 mb-2"
                onKeyDown={e => e.key === 'Enter' && handleCreateDeck()} autoFocus
              />
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-[#1A1A24] border border-[#2A2A3A] rounded-lg px-3 py-2 text-[#F0EFFE] text-sm placeholder-[#5A5A72] outline-none focus:border-[#7C3AED]/50 mb-3"
                onKeyDown={e => e.key === 'Enter' && handleCreateDeck()}
              />
              <div className="flex items-center gap-2">
                <button onClick={handleCreateDeck} className="px-4 py-1.5 bg-[#7C3AED] text-white text-[11px] font-medium rounded-lg hover:bg-[#6D28D9] transition-all">Create</button>
                <button onClick={() => setShowNewDeck(false)} className="px-4 py-1.5 text-[#5A5A72] text-[11px] hover:text-[#F0EFFE] transition-all">Cancel</button>
              </div>
            </motion.div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {decks.map((deck) => {
              const due = cards.filter(c => c.deckId === deck.id && c.nextReview <= Date.now()).length;
              const lastStudied = cards
                .filter(c => c.deckId === deck.id && c.lastReviewed)
                .sort((a, b) => b.lastReviewed - a.lastReviewed)[0];
              return (
                <motion.div key={deck.id} whileHover={{ y: -2 }}
                  className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-5 hover:border-[#3A3A4F] transition-all"
                >
                  <h3 className="text-[#F0EFFE] text-sm font-medium mb-1">{deck.title}</h3>
                  <p className={`text-xs font-medium ${due > 0 ? 'text-[#8B5CF6]' : 'text-emerald-400'}`}>
                    {due > 0 ? `${due} due` : 'All reviewed'}
                  </p>
                  {lastStudied && (
                    <p className="text-[#5A5A72] text-[10px] mt-0.5">
                      Last studied {Math.round((Date.now() - lastStudied.lastReviewed) / 3600000)}h ago
                    </p>
                  )}
                  <button onClick={() => navigate(`/study/${deck.id}`)}
                    className="mt-3 w-full py-1.5 bg-[#7C3AED]/10 text-[#8B5CF6] text-[11px] font-medium rounded-lg hover:bg-[#7C3AED]/20 transition-all"
                  >
                    Study
                  </button>
                </motion.div>
              );
            })}
            {decks.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-[#5A5A72] text-sm mb-2">No decks yet</div>
                <button onClick={() => setShowNewDeck(true)}
                  className="px-4 py-2 bg-[#7C3AED]/10 text-[#8B5CF6] text-xs font-medium rounded-lg hover:bg-[#7C3AED]/20 transition-all"
                >Create your first deck</button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Continue Learning */}
          <div>
            <h3 className="text-[#F0EFFE] text-sm font-medium mb-3">Continue learning</h3>
            <div className="space-y-2">
              {decks.slice(0, 3).map(deck => {
                const due = cards.filter(c => c.deckId === deck.id && c.nextReview <= Date.now()).length;
                const total = cards.filter(c => c.deckId === deck.id).length;
                const progress = total > 0 ? ((total - due) / total) * 100 : 0;
                return (
                  <div key={deck.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#111118] border border-[#2A2A3A]">
                    <div className="flex-1 mr-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#F0EFFE] text-xs">{deck.title}</span>
                        <span className="text-[#5A5A72] text-[10px]">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-[#2A2A3A] overflow-hidden">
                        <div className="h-full rounded-full bg-[#7C3AED] transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <button onClick={() => navigate(`/study/${deck.id}`)}
                      className="text-[#8B5CF6] text-[10px] font-medium hover:text-[#7C3AED] transition-colors shrink-0"
                    >
                      Continue
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suggested */}
          <div>
            <h3 className="text-[#F0EFFE] text-sm font-medium mb-1">Suggested for you</h3>
            <p className="text-[#5A5A72] text-[10px] mb-3">AI picks based on your study history</p>
            <div className="space-y-2">
              {decks.length > 0 ? (
                decks.slice(0, 4).map(deck => {
                  const due = cards.filter(c => c.deckId === deck.id && c.nextReview <= Date.now()).length;
                  const total = cards.filter(c => c.deckId === deck.id).length;
                  return (
                    <div key={deck.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#111118] border border-[#2A2A3A] hover:border-[#3A3A4F] transition-all">
                      <div>
                        <span className="text-[#F0EFFE] text-xs">{deck.title}</span>
                        <p className="text-[#5A5A72] text-[10px]">{total} cards{ due > 0 ? ` · ${due} due` : ''}</p>
                      </div>
                      <button onClick={() => navigate(`/study/${deck.id}`)} className="text-[#8B5CF6] text-[10px] font-medium hover:text-[#7C3AED] transition-colors shrink-0">
                        Study
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-[#5A5A72] text-xs">
                  Create your first deck to see suggestions
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};
