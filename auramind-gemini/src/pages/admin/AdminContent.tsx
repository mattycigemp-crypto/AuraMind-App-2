import React from 'react';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import StatCard from '../../components/dashboard/StatCard';
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
    <div className={cn("space-y-10", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Your Decks" value={totalDecks} subtitle="Your knowledge clusters" icon={Layers} />
        <StatCard title="Your Cards" value={totalCards} subtitle="Your mapped concepts" icon={FileText} variant="cosmic" />
        <StatCard title="Avg Deck Size" value={avgDeckSize} subtitle="Cards per deck" icon={BookOpen} />
        <StatCard title="Decks with Cards" value={deckCardsMap.filter((d) => d.count > 0).length} subtitle="Active decks" icon={FolderOpen} />
      </div>

      <div className="bg-zinc-900/30 border border-primary/10 rounded-[32px] p-8">
        <p className="text-xs text-zinc-500 italic leading-relaxed">
          Cross-user content statistics (total cards/decks across all users, source distribution, category analysis)
          require a backend aggregation endpoint. Your personal content is shown as a reference. Aggregate stats
          will appear once the content analytics service is connected.
        </p>
      </div>
    </div>
  );
};

export default AdminContent;



