import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import {
  DatabaseIcon as Database,
  PlayIcon as Play,
  XIcon as X,
  ClockIcon as Clock,
  CopyIcon as Copy,
  CheckIcon as Check,
  AlertTriangleIcon as AlertTriangle,
  ChevronDownIcon as ChevronDown,
  TableIcon as Table,
  RefreshCwIcon as RefreshCw,
  SaveIcon as Save,
  Trash2Icon as Trash2,
  FolderOpenIcon as FolderOpen,
} from '../../components/icons/CustomIcons';

// --- SQL Keyword Highlighting ---
const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP',
  'TABLE', 'INTO', 'VALUES', 'SET', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON',
  'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS', 'NULL', 'AS', 'ORDER', 'BY',
  'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'DISTINCT', 'COUNT', 'SUM',
  'AVG', 'MAX', 'MIN', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'WITH',
  'INDEX', 'UNIQUE', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CASCADE', 'DEFAULT',
  'CONSTRAINT', 'CHECK', 'VIEW', 'FUNCTION', 'PROCEDURE', 'TRIGGER', 'SCHEMA',
  'GRANT', 'REVOKE', 'TRUNCATE', 'EXPLAIN', 'ANALYZE', 'VACUUM', 'BEGIN', 'COMMIT',
  'ROLLBACK', 'SAVEPOINT', 'RETURNING', 'ILIKE', 'SIMILAR', 'TO', 'OVER', 'PARTITION',
  'WINDOW', 'RANK', 'ROW_NUMBER', 'LAG', 'LEAD', 'COALESCE', 'CAST', 'INTERVAL',
  'TIMESTAMP', 'DATE', 'TEXT', 'VARCHAR', 'INTEGER', 'BIGINT', 'BOOLEAN', 'JSONB',
  'UUID', 'ARRAY', 'ENUM', 'SERIAL', 'TRUE', 'FALSE', 'ASC', 'DESC', 'FETCH', 'NEXT',
  'ROWS', 'ONLY', 'CROSS', 'NATURAL', 'USING', 'EXCEPT', 'INTERSECT', 'LATERAL',
];

const highlightSQL = (sql: string): React.ReactNode[] => {
  const tokens: React.ReactNode[] = [];
  const regex = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|--[^\n]*|\b\d+\.?\d*\b|\b[A-Za-z_]\w*\b|[^\s\w]+)/g;
  let match;
  let lastIndex = 0;

  while ((match = regex.exec(sql)) !== null) {
    // Add whitespace before this token
    if (match.index > lastIndex) {
      tokens.push(sql.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("'") || token.startsWith('"')) {
      tokens.push(
        <span key={match.index} className="text-emerald-400">{token}</span>
      );
    } else if (token.startsWith('--')) {
      tokens.push(
        <span key={match.index} className="text-zinc-600 italic">{token}</span>
      );
    } else if (/^\d/.test(token)) {
      tokens.push(
        <span key={match.index} className="text-amber-400">{token}</span>
      );
    } else if (SQL_KEYWORDS.includes(token.toUpperCase())) {
      tokens.push(
        <span key={match.index} className="text-purple-400 font-semibold">{token}</span>
      );
    } else if (/^[A-Za-z_]/.test(token)) {
      tokens.push(
        <span key={match.index} className="text-blue-300">{token}</span>
      );
    } else {
      tokens.push(
        <span key={match.index} className="text-zinc-400">{token}</span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < sql.length) {
    tokens.push(sql.slice(lastIndex));
  }

  return tokens;
};

// --- Saved Queries ---
interface SavedQuery {
  id: string;
  name: string;
  query: string;
  createdAt: number;
}

const SAVED_QUERIES_KEY = 'auramind-admin-saved-queries';

const loadSavedQueries = (): SavedQuery[] => {
  try {
    return JSON.parse(localStorage.getItem(SAVED_QUERIES_KEY) || '[]');
  } catch { return []; }
};

const saveSavedQueries = (queries: SavedQuery[]) => {
  localStorage.setItem(SAVED_QUERIES_KEY, JSON.stringify(queries));
};

// --- Pre-built Queries ---
const PRESET_QUERIES = [
  { name: 'All Users', query: 'SELECT id, email, created_at, last_sign_in_at\nFROM auth.users\nORDER BY created_at DESC\nLIMIT 50;' },
  { name: 'User Count by Plan', query: "SELECT \n  COALESCE(raw_user_meta_data->>'plan', 'Starter') AS plan,\n  COUNT(*) AS user_count\nFROM auth.users\nGROUP BY plan\nORDER BY user_count DESC;" },
  { name: 'Recent Signups (7d)', query: "SELECT id, email, created_at\nFROM auth.users\nWHERE created_at > NOW() - INTERVAL '7 days'\nORDER BY created_at DESC;" },
  { name: 'Deck Statistics', query: 'SELECT \n  COUNT(*) AS total_decks,\n  COUNT(DISTINCT user_id) AS unique_users,\n  AVG(card_count) AS avg_cards_per_deck\nFROM decks;' },
  { name: 'Active Admins', query: "SELECT id, email, raw_user_meta_data\nFROM auth.users\nWHERE raw_user_meta_data->>'is_admin' = 'true'\n   OR raw_user_meta_data->>'role' IN ('admin', 'owner', 'ceo');" },
  { name: 'Schema: All Tables', query: "SELECT table_name, table_type\nFROM information_schema.tables\nWHERE table_schema = 'public'\nORDER BY table_name;" },
  { name: 'Schema: Table Columns', query: "SELECT table_name, column_name, data_type, is_nullable\nFROM information_schema.columns\nWHERE table_schema = 'public'\nORDER BY table_name, ordinal_position;" },
  { name: 'Cards Due Today', query: "SELECT d.title AS deck, COUNT(*) AS due_cards\nFROM cards c\nJOIN decks d ON d.id = c.deck_id\nWHERE c.next_review <= EXTRACT(EPOCH FROM NOW()) * 1000\nGROUP BY d.title\nORDER BY due_cards DESC;" },
];

// --- Schema Browser ---
const KNOWN_TABLES: Record<string, string[]> = {
  decks: ['id', 'user_id', 'title', 'description', 'card_count', 'created_at', 'source_label', 'is_sample'],
  cards: ['id', 'user_id', 'deck_id', 'front', 'back', 'next_review', 'interval', 'repetition', 'ease_factor', 'last_reviewed', 'source_type', 'source_label', 'citations', 'trust_score'],
  user_profiles: ['id', 'user_id', 'role', 'plan', 'streak', 'joined_date', 'last_study_date'],
  study_sessions: ['id', 'user_id', 'deck_id', 'started_at', 'ended_at', 'cards_reviewed', 'cards_correct'],
};

// --- Component ---
interface DatabaseExplorerProps {
  className?: string;
}

const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({ className }) => {
  const [query, setQuery] = useState('SELECT id, email, created_at\nFROM auth.users\nORDER BY created_at DESC\nLIMIT 20;');
  const [results, setResults] = useState<Record<string, any>[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>(loadSavedQueries);
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [schemaExpanded, setSchemaExpanded] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [presetsExpanded, setPresetsExpanded] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync scroll
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Line numbers
  const lineCount = query.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  // Execute query
  const executeQuery = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Client-side safety check
    const upperQuery = trimmed.toUpperCase();
    const dangerousKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE', 'GRANT', 'REVOKE'];
    const hasDangerous = dangerousKeywords.some(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(trimmed) && !upperQuery.startsWith('EXPLAIN') && !upperQuery.startsWith('DESCRIBE');
    });

    if (hasDangerous) {
      setError('⚠️ Write operations are disabled. Only SELECT, EXPLAIN, SHOW, and DESCRIBE queries are allowed.');
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setExecutionTime(null);

    const startTime = performance.now();

    try {
      const { supabase } = await import('../../services/database/supabase');
      const session = await supabase?.auth.getSession();
      const token = session?.data.session?.access_token;
      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: trimmed }),
      });

      const data = await res.json();
      const elapsed = performance.now() - startTime;
      setExecutionTime(elapsed);

      if (!res.ok) {
        setError(data.error || data.details || 'Query execution failed');
      } else {
        const rows = data.rows || data.data || data.results || [];
        setResults(rows);
        setColumns(rows.length > 0 ? Object.keys(rows[0]) : []);
        if (rows.length === 0) {
          setError('Query executed successfully. No rows returned.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to execute query');
      setExecutionTime(performance.now() - startTime);
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeQuery();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeQuery]);

  // Save query
  const handleSave = () => {
    if (!saveName.trim()) return;
    const newQuery: SavedQuery = {
      id: Date.now().toString(),
      name: saveName.trim(),
      query,
      createdAt: Date.now(),
    };
    const updated = [newQuery, ...savedQueries];
    setSavedQueries(updated);
    saveSavedQueries(updated);
    setSaveName('');
    setShowSaveDialog(false);
  };

  const deleteSaved = (id: string) => {
    const updated = savedQueries.filter(q => q.id !== id);
    setSavedQueries(updated);
    saveSavedQueries(updated);
  };

  // Copy results as CSV
  const copyAsCSV = () => {
    if (!results || results.length === 0) return;
    const cols = columns;
    const csv = [
      cols.join(','),
      ...results.map(row => cols.map(c => JSON.stringify(row[c] ?? '')).join(',')),
    ].join('\n');
    navigator.clipboard.writeText(csv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={cn("space-y-6 pb-20", className)}>
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <StatPill label="Saved Queries" value={savedQueries.length} icon={Save} />
        <StatPill label="Presets" value={PRESET_QUERIES.length} icon={FolderOpen} />
        <StatPill
          label="Results"
          value={results ? results.length : '-'}
          icon={Table}
          highlight={results !== null && results.length > 0}
        />
      </div>

      {/* Main Layout: Schema/History sidebar + Editor */}
      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Left Sidebar */}
        <div className="space-y-4">
          {/* Schema Browser */}
          <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-sm">
            <button
              onClick={() => setSchemaExpanded(schemaExpanded ? null : Object.keys(KNOWN_TABLES)[0])}
              className="w-full flex items-center gap-2 px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] hover:text-zinc-200 transition-colors"
            >
              <Database size={13} className="text-primary/60" />
              Schema Browser
              <ChevronDown size={12} className={cn("ml-auto transition-transform", schemaExpanded && "rotate-180")} />
            </button>
            {schemaExpanded && (
              <div className="border-t border-white/[0.04]">
                {Object.entries(KNOWN_TABLES).map(([table, cols]) => (
                  <div key={table}>
                    <button
                      onClick={() => setSchemaExpanded(schemaExpanded === table ? null : table)}
                      className="w-full flex items-center gap-2 px-5 py-2 text-[10px] font-bold text-zinc-300 hover:bg-white/[0.03] transition-colors"
                    >
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        schemaExpanded === table ? 'bg-primary' : 'bg-zinc-600'
                      )} />
                      <span className="font-mono">{table}</span>
                      <span className="ml-auto text-[9px] text-zinc-600">{cols.length} cols</span>
                    </button>
                    {schemaExpanded === table && (
                      <div className="pb-1">
                        {cols.map(col => (
                          <button
                            key={col}
                            onClick={() => {
                              setQuery(prev => {
                                const suffix = prev.endsWith('\n') ? '' : '\n';
                                return prev + `${suffix}-- ${col}`;
                              });
                            }}
                            className="w-full text-left px-8 py-1 text-[9px] text-zinc-500 font-mono hover:text-zinc-300 hover:bg-white/[0.02] transition-colors"
                          >
                            {col}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preset Queries */}
          <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-sm">
            <button
              onClick={() => setPresetsExpanded(!presetsExpanded)}
              className="w-full flex items-center gap-2 px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] hover:text-zinc-200 transition-colors"
            >
              <FolderOpen size={13} className="text-amber-400/60" />
              Preset Queries
              <ChevronDown size={12} className={cn("ml-auto transition-transform", presetsExpanded && "rotate-180")} />
            </button>
            {presetsExpanded && (
              <div className="border-t border-white/[0.04] max-h-[320px] overflow-y-auto">
                {PRESET_QUERIES.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(preset.query)}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/[0.03] transition-colors group"
                  >
                    <p className="text-[10px] font-bold text-zinc-300 group-hover:text-white">{preset.name}</p>
                    <p className="text-[8px] text-zinc-600 font-mono truncate mt-0.5">
                      {preset.query.split('\n')[0]}...
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Saved Queries */}
          {savedQueries.length > 0 && (
            <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-sm">
              <button
                onClick={() => setHistoryExpanded(!historyExpanded)}
                className="w-full flex items-center gap-2 px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] hover:text-zinc-200 transition-colors"
              >
                <Clock size={13} className="text-blue-400/60" />
                Saved ({savedQueries.length})
                <ChevronDown size={12} className={cn("ml-auto transition-transform", historyExpanded && "rotate-180")} />
              </button>
              {historyExpanded && (
                <div className="border-t border-white/[0.04] max-h-[200px] overflow-y-auto">
                  {savedQueries.map(q => (
                    <div key={q.id} className="flex items-center px-4 py-2 hover:bg-white/[0.03] transition-colors group">
                      <button
                        onClick={() => setQuery(q.query)}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="text-[10px] font-bold text-zinc-300 truncate">{q.name}</p>
                        <p className="text-[8px] text-zinc-600 font-mono truncate">{q.query.slice(0, 60)}...</p>
                      </button>
                      <button
                        onClick={() => deleteSaved(q.id)}
                        className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-2"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Editor + Results */}
        <div className="space-y-4 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <div className="w-2 h-2 rounded-full bg-green-400/60 animate-pulse" />
              <span className="text-[9px] text-zinc-500 font-bold tracking-wider font-mono">SUPABASE SQL</span>
            </div>

            <div className="flex-1" />

            {/* Save button */}
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all"
            >
              <Save size={12} />
              Save
            </button>

            {/* Run button */}
            <motion.button
              onClick={executeQuery}
              disabled={loading || !query.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all',
                loading
                  ? 'bg-zinc-800 text-zinc-600 cursor-wait'
                  : 'bg-primary text-white hover:bg-primary/90 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]'
              )}
            >
              {loading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Play size={14} className="fill-current" />
              )}
              {loading ? 'EXECUTING...' : 'RUN QUERY'}
              <span className="text-[8px] opacity-50 ml-1">⌘↵</span>
            </motion.button>
          </div>

          {/* SQL Editor */}
          <div className="relative bg-zinc-900/80 border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-sm focus-within:border-primary/30 transition-all shadow-[0_0_0_1px_rgba(168,85,247,0)] focus-within:shadow-[0_0_0_1px_rgba(168,85,247,0.1)]">
            {/* Editor header */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.04] bg-white/[0.01]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
              </div>
              <span className="text-[9px] text-zinc-600 font-mono ml-2">query.sql</span>
            </div>

            <div className="flex" style={{ minHeight: '200px', maxHeight: '400px' }}>
              {/* Line numbers */}
              <div
                ref={lineNumbersRef}
                className="shrink-0 py-3 pl-3 pr-2 text-right select-none overflow-hidden bg-white/[0.005] border-r border-white/[0.03]"
                style={{ width: '44px' }}
              >
                {lineNumbers.map(n => (
                  <div key={n} className="text-[9px] text-zinc-700 font-mono leading-6">
                    {n}
                  </div>
                ))}
              </div>

              {/* Editor with syntax highlighting overlay */}
              <div className="relative flex-1 min-w-0">
                {/* Highlighted overlay */}
                <pre
                  className="absolute inset-0 py-3 px-3 text-xs font-mono leading-6 whitespace-pre-wrap break-words pointer-events-none overflow-hidden"
                  aria-hidden="true"
                >
                  <code>{highlightSQL(query)}</code>
                </pre>

                {/* Actual textarea */}
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onScroll={handleScroll}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const start = e.currentTarget.selectionStart;
                      const end = e.currentTarget.selectionEnd;
                      const newValue = query.substring(0, start) + '  ' + query.substring(end);
                      setQuery(newValue);
                      setTimeout(() => {
                        e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                      }, 0);
                    }
                  }}
                  className="relative w-full h-full min-h-[200px] py-3 px-3 text-xs font-mono leading-6 bg-transparent text-transparent caret-zinc-200 resize-none focus:outline-none"
                  style={{ tabSize: 2 }}
                  placeholder="Write your SQL query here..."
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center gap-4 px-4 py-1.5 border-t border-white/[0.04] bg-white/[0.005]">
              <span className="text-[8px] text-zinc-600 font-mono">Ln {lineCount}, Col {query.length}</span>
              <span className="text-[8px] text-zinc-700 font-mono">SQL</span>
              <span className="text-[8px] text-zinc-700 font-mono ml-auto">UTF-8</span>
            </div>
          </div>

          {/* Save Dialog */}
          <AnimatePresence>
            {showSaveDialog && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-zinc-900 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-xl flex items-center gap-3"
              >
                <Save size={14} className="text-primary/70 shrink-0" />
                <input
                  autoFocus
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Query name..."
                  className="flex-1 bg-transparent text-xs text-zinc-200 focus:outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSaveDialog(false); }}
                />
                <button
                  onClick={handleSave}
                  disabled={!saveName.trim()}
                  className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 disabled:opacity-30 transition-all"
                >
                  Save
                </button>
                <button onClick={() => setShowSaveDialog(false)} className="text-zinc-600 hover:text-zinc-400">
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Execution Info */}
          {executionTime !== null && !loading && (
            <div className="flex items-center gap-6 text-[9px] font-mono text-zinc-600">
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {executionTime < 1000
                  ? `${Math.round(executionTime)}ms`
                  : `${(executionTime / 1000).toFixed(1)}s`}
              </span>
              {results && (
                <span>{results.length} row{results.length !== 1 ? 's' : ''} returned</span>
              )}
            </div>
          )}

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl"
              >
                <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 font-mono leading-relaxed whitespace-pre-wrap break-all">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Table */}
          {results && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.01] border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-sm"
            >
              {/* Results header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
                <Table size={13} className="text-primary/70" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">
                  Results
                </span>
                <span className="text-[9px] text-zinc-600 font-mono">
                  {results.length} row{results.length !== 1 ? 's' : ''} · {columns.length} column{columns.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={copyAsCSV}
                  className="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg text-[9px] font-bold text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] transition-all"
                >
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'CSV'}
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm">
                    <tr className="border-b border-white/[0.06]">
                      {columns.map(col => (
                        <th
                          key={col}
                          className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.15em] px-4 py-2.5 whitespace-nowrap border-r border-white/[0.02] last:border-r-0"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, i) => (
                      <tr
                        key={i}
                        className={cn(
                          'border-b border-white/[0.02] last:border-b-0 transition-colors',
                          i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.005]',
                          'hover:bg-white/[0.03]'
                        )}
                      >
                        {columns.map(col => {
                          const value = row[col];
                          const display = value === null
                            ? 'NULL'
                            : typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value);
                          return (
                            <td
                              key={col}
                              className={cn(
                                'px-4 py-2 text-[10px] font-mono whitespace-nowrap border-r border-white/[0.02] last:border-r-0 max-w-[300px] truncate',
                                value === null
                                  ? 'text-zinc-700 italic'
                                  : typeof value === 'number'
                                    ? 'text-amber-300'
                                    : typeof value === 'boolean'
                                      ? 'text-purple-300'
                                      : 'text-zinc-300'
                              )}
                              title={display}
                            >
                              {display}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Empty results */}
          {results && results.length === 0 && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-4">
                <Table size={20} className="text-zinc-600" />
              </div>
              <p className="text-xs text-zinc-500 font-bold">No rows returned</p>
              <p className="text-[10px] text-zinc-600 mt-1">The query executed successfully but returned zero rows.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Stat Pill ---
const StatPill: React.FC<{
  label: string;
  value: string | number;
  icon: React.FC<{ size?: number; className?: string }>;
  highlight?: boolean;
}> = ({ label, value, icon: Icon, highlight }) => (
  <div className={cn(
    'flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-sm transition-all',
    highlight
      ? 'bg-primary/[0.04] border-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.05)]'
      : 'bg-white/[0.01] border-white/[0.05]'
  )}>
    <Icon size={16} className={highlight ? 'text-primary' : 'text-zinc-500'} />
    <div>
      <p className="text-xs font-bold text-zinc-300">{value}</p>
      <p className="text-[8px] text-zinc-600 uppercase tracking-wider">{label}</p>
    </div>
  </div>
);

export default DatabaseExplorer;



