import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import {
  ShieldIcon as Shield,
  SearchIcon as Search,
  XIcon as X,
  UserIcon as User,
  CreditCardIcon as CreditCard,
  AlertTriangleIcon as AlertTriangle,
  DatabaseIcon as Database,
  SettingsIcon as Settings,
  EyeIcon as Eye,
} from '../../components/icons/CustomIcons';

// --- Types ---
interface AuditLogProps {
  className?: string;
}

interface AuditEvent {
  id: string;
  timestamp: number;
  action: string;
  category: 'user' | 'subscription' | 'admin' | 'database' | 'system' | 'security';
  actor: string;
  actorEmail: string;
  target?: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

type CategoryFilter = AuditEvent['category'] | 'all';
type SeverityFilter = AuditEvent['severity'] | 'all';

// --- Component ---
const AuditLog: React.FC<AuditLogProps> = ({ className }) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { supabase } = await import('../../services/database/supabase');
        const session = await supabase?.auth.getSession();
        const token = session?.data.session?.access_token;
        if (!token) { setLoading(false); return; }

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/audit/list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ limit: 200, offset: 0, category: categoryFilter !== 'all' ? categoryFilter : undefined, severity: severityFilter !== 'all' ? severityFilter : undefined }),
        });
        if (res.ok) {
          const json = await res.json();
          setEvents(json.events || []);
          setTotalEvents(json.total || 0);
          setCategoryCounts(json.categoryCounts || {});
        }
      } catch (err) {
        console.error('Failed to fetch audit events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [categoryFilter, severityFilter]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          e.action.toLowerCase().includes(q) ||
          e.actor.toLowerCase().includes(q) ||
          e.actorEmail.toLowerCase().includes(q) ||
          e.details.toLowerCase().includes(q) ||
          (e.target && e.target.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [events, searchQuery, categoryFilter, severityFilter]);

  const categories: { value: CategoryFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All Events', count: totalEvents },
    { value: 'admin', label: 'Admin', count: categoryCounts['admin'] || 0 },
    { value: 'user', label: 'User', count: categoryCounts['user'] || 0 },
    { value: 'subscription', label: 'Billing', count: categoryCounts['subscription'] || 0 },
    { value: 'database', label: 'Database', count: categoryCounts['database'] || 0 },
    { value: 'security', label: 'Security', count: categoryCounts['security'] || 0 },
    { value: 'system', label: 'System', count: categoryCounts['system'] || 0 },
  ];

  const severityIcon = (s: AuditEvent['severity']) => {
    switch (s) {
      case 'critical': return <AlertTriangle size={12} className="text-rose-400" />;
      case 'warning': return <AlertTriangle size={12} className="text-amber-400" />;
      default: return <div className="w-2 h-2 rounded-full bg-blue-400" />;
    }
  };

  const categoryIcon = (c: AuditEvent['category']) => {
    switch (c) {
      case 'user': return <User size={12} />;
      case 'subscription': return <CreditCard size={12} />;
      case 'admin': return <Shield size={12} />;
      case 'database': return <Database size={12} />;
      case 'system': return <Settings size={12} />;
      case 'security': return <AlertTriangle size={12} />;
    }
  };

  const categoryColor = (c: AuditEvent['category']) => {
    switch (c) {
      case 'user': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'subscription': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'admin': return 'bg-primary/10 text-primary border-primary/20';
      case 'database': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'system': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      case 'security': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  const formatTime = (ts: number): string => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-96", className)}>
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 pb-20", className)}>
      {/* Summary Bar */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.slice(1).map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(categoryFilter === cat.value ? 'all' : cat.value)}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[10px] font-bold transition-all',
              categoryFilter === cat.value
                ? cat.value === 'security' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : cat.value === 'system' ? 'bg-zinc-500/10 border-zinc-500/20 text-zinc-300'
                  : 'bg-primary/10 border-primary/20 text-primary'
                : 'bg-white/[0.01] border-white/[0.05] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.1]'
            )}
          >
            {categoryIcon(cat.value as AuditEvent['category'])}
            <span>{cat.label}</span>
            <span className="ml-auto text-[9px] text-zinc-600">{cat.count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit events..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-[10px] text-zinc-300 focus:outline-none focus:border-primary/30 transition-all"
          />
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
          className="px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-[10px] text-zinc-300 focus:outline-none focus:border-primary/30 transition-all appearance-none cursor-pointer"
        >
          <option value="all">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>

        {(searchQuery || categoryFilter !== 'all' || severityFilter !== 'all') && (
          <button
            onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setSeverityFilter('all'); }}
            className="flex items-center gap-1 px-3 py-2 text-[9px] text-zinc-500 hover:text-zinc-300 font-bold transition-colors"
          >
            <X size={10} />
            Clear filters
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-white/[0.04] to-transparent" />

        <div className="space-y-2">
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-4">
                <Search size={20} className="text-zinc-600" />
              </div>
              <p className="text-xs text-zinc-500 font-bold">No events match your filters</p>
              <p className="text-[10px] text-zinc-600 mt-1">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            filteredEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.3 }}
                className="relative pl-12 group"
              >
                {/* Timeline dot */}
                <div className="absolute left-[11px] top-4 w-[17px] h-[17px] rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    event.severity === 'critical' ? 'bg-rose-400' :
                    event.severity === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
                  )} />
                </div>

                {/* Card */}
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="w-full text-left p-4 rounded-2xl bg-white/[0.01] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.02] transition-all group/card backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md border',
                          categoryColor(event.category)
                        )}>
                          {event.category}
                        </span>
                        {event.severity !== 'info' && (
                          <span className={cn(
                            'text-[7px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-md border',
                            event.severity === 'critical'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          )}>
                            {event.severity}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-zinc-200 group-hover/card:text-white transition-colors">
                        {event.action}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
                        by {event.actor} ({event.actorEmail}){event.target ? ` · Target: ${event.target}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] text-zinc-600 font-mono whitespace-nowrap">
                        {formatTime(event.timestamp)}
                      </span>
                      <Eye size={12} className="text-zinc-600 group-hover/card:text-zinc-400 transition-colors" />
                    </div>
                  </div>
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100]"
              onClick={() => setSelectedEvent(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[560px] max-w-full bg-zinc-950 border border-white/[0.08] rounded-2xl p-6 z-[101] overflow-y-auto max-h-[80vh] backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  {severityIcon(selectedEvent.severity)}
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.1em]">Event Detail</h3>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                  <p className="text-xs font-bold text-white">{selectedEvent.action}</p>
                  <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">{selectedEvent.details}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Timestamp', value: new Date(selectedEvent.timestamp).toLocaleString() },
                    { label: 'Category', value: selectedEvent.category },
                    { label: 'Actor', value: selectedEvent.actor },
                    { label: 'Actor Email', value: selectedEvent.actorEmail },
                    { label: 'Target', value: selectedEvent.target || 'N/A' },
                    { label: 'Severity', value: selectedEvent.severity },
                    { label: 'Event ID', value: selectedEvent.id },
                  ].map(field => (
                    <div key={field.label} className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl">
                      <p className="text-[8px] text-zinc-600 uppercase tracking-wider font-bold">{field.label}</p>
                      <p className="text-[10px] text-zinc-300 font-mono mt-1 break-all">{field.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditLog;



