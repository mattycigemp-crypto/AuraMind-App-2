import React from 'react';
import PageShell from '../../components/dashboard/PageShell';
import {
  LayersIcon as Layers,
  FileTextIcon as FileText,
  BookOpenIcon as BookOpen,
  FolderOpenIcon as FolderOpen,
} from '../../components/icons/CustomIcons';
import { cn } from '../../lib/utils';

interface AdminContentProps {
  className?: string;
}

const AdminContent: React.FC<AdminContentProps> = ({ className }) => {
  const { cards, decks } = useDashboardWorkspace();
  const totalCards = cards.length;
  const totalDecks = decks.length;
  const avgDeckSize = totalDecks > 0 ? (totalCards / totalDecks).toFixed(1) : '0';

  const deckCardsMap = decks.map((d) => ({
    title: d.title,
    count: cards.filter((c) => c.deckId === d.id).length,
  }));

  return (
    <PageShell>
    <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20", className)}>
      {/* Header */}
      <div>
        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
          <FileText size={12} className="text-primary" />
          Content Library
        </h3>
        <p className="text-[10px] text-zinc-500 mt-1">Knowledge base metrics across all users</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatPill label="Your Decks" value={totalDecks} subtitle="Your knowledge clusters" icon={Layers} />
        <StatPill label="Your Cards" value={totalCards} subtitle="Your mapped concepts" icon={FileText} accent="primary" />
        <StatPill label="Avg Deck Size" value={avgDeckSize} subtitle="Cards per deck" icon={BookOpen} />
        <StatPill label="Decks with Cards" value={deckCardsMap.filter((d) => d.count > 0).length} subtitle="Active decks" icon={FolderOpen} />
      </div>

      <div className="p-6 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm">
        <p className="text-[11px] text-zinc-500 italic leading-relaxed">
          Cross-user content statistics (total cards/decks across all users, source distribution, category analysis)
          require a backend aggregation endpoint. Your personal content is shown as a reference. Aggregate stats
          will appear once the content analytics service is connected.
        </p>
      </div>
    </div>
    </PageShell>
  );
};

export default AdminContent;

// --- Stat Pill ---
const StatPill: React.FC<{
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.FC<{ size?: number; className?: string }>;
  accent?: string;
}> = ({ label, value, icon: Icon, accent }) => (
  <div className={cn(
    'flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-sm transition-all',
    accent === 'primary'
      ? 'bg-primary/[0.04] border-primary/20'
      : 'bg-zinc-900/10 border-zinc-700/30'
  )}>
    <Icon size={16} className={accent === 'primary' ? 'text-primary' : 'text-zinc-500'} />
    <div>
      <p className="text-base font-black text-white leading-none">{value}</p>
      <p className="text-[8px] uppercase tracking-[0.15em] text-zinc-500 font-bold mt-1">{label}</p>
    </div>
  </div>
);



