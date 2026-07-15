import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins } from 'lucide-react';
import { cn } from '../../lib/utils';
import PageShell from '../../components/dashboard/PageShell';
import {
  BrainCircuitIcon as BrainCircuit,
  GlobeIcon as Globe,
  ShieldIcon as Shield,
  TrendingUpIcon as TrendingUp,
  AlertTriangleIcon as AlertTriangle,
  CheckIcon as Check,
  XIcon as X,
  SearchIcon as Search,
  PlayIcon as Play,
  RefreshCwIcon as RefreshCw,
  ExternalLinkIcon as ExternalLink,
  LockIcon as Lock,
  EyeIcon as Eye,
  TargetIcon as Target,
  ActivityIcon as Activity,
  DatabaseIcon as Database,
  CpuIcon as Cpu,
  ArrowUpRightIcon as ArrowUp,
  ArrowDownIcon as ArrowDown,
  CreditCardIcon as Wallet,
} from '../../components/icons/CustomIcons';
import {
  fetchCryptoPrices,
  fetchMarketIntel,
  runAIAgent,
  checkBreaches,
  generatePredictions,
  scanGitHubForSecrets,
  fetchGlobalThreats,
  fetchSupplyChainTwin,
  fetchRDRadar,
  type CryptoPrice,
  type MarketIntelResult,
  type BreachResult,
  type PredictionResult,
  type GitHubScanResult,
  type ThreatNode,
  type SupplyNode,
  type SupplyRoute,
  type PatentSignal,
} from '../../services/api/nexusService';

// ────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────

type NexusTab = 'market-intel' | 'dark-web' | 'ai-agent' | 'crypto-audit' | 'predictive' | 'sentinel' | 'supply-chain' | 'rd-radar';

interface AIAgentTask {
  id: string;
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  steps: string[];
  createdAt: number;
}

interface EnrichedCrypto extends CryptoPrice {
  auditScore: number;
  vulnerabilities: number;
  recommendation: 'buy' | 'hold' | 'sell';
}

interface DarkWebHit {
  id: string;
  source: string;
  type: 'credential_leak' | 'mention' | 'data_breach' | 'impersonation' | 'github_secret';
  severity: 'low' | 'medium' | 'high' | 'critical';
  content: string;
  timestamp: number;
  status: 'new' | 'investigating' | 'resolved';
}

// ────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function deriveAuditScore(symbol: string, price: number): { auditScore: number; vulnerabilities: number; recommendation: 'buy' | 'hold' | 'sell' } {
  // Note: real smart-contract auditing requires Etherscan/Moralis/Chainalysis APIs.
  // Here we provide simulated audit metadata alongside real price data.
  const scores: Record<string, { auditScore: number; vulnerabilities: number; recommendation: 'buy' | 'hold' | 'sell' }> = {
    BTC: { auditScore: 88, vulnerabilities: 0, recommendation: 'buy' },
    ETH: { auditScore: 92, vulnerabilities: 0, recommendation: 'buy' },
    SOL: { auditScore: 76, vulnerabilities: 3, recommendation: 'hold' },
    ARB: { auditScore: 68, vulnerabilities: 5, recommendation: 'hold' },
    AAVE: { auditScore: 94, vulnerabilities: 0, recommendation: 'buy' },
  };
  if (scores[symbol]) return scores[symbol];
  // Fallback heuristic
  if (price > 1000) return { auditScore: 85, vulnerabilities: 0, recommendation: 'buy' };
  if (price > 100) return { auditScore: 75, vulnerabilities: 1, recommendation: 'hold' };
  return { auditScore: 65, vulnerabilities: 3, recommendation: 'sell' };
}

// ────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────

const NexusTabButton: React.FC<{
  active: boolean;
  icon: React.FC<{ size?: number; className?: string }>;
  label: string;
  badge?: string;
  onClick: () => void;
}> = ({ active, icon: Icon, label, badge, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.12em] transition-all border',
      active
        ? 'bg-primary/15 text-primary border-primary/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
        : 'bg-zinc-900/10 text-zinc-500 border-zinc-700/30 hover:text-zinc-300 hover:border-zinc-700/50'
    )}
  >
    <Icon size={13} />
    <span className="hidden sm:inline">{label}</span>
    {badge && (
      <span className={cn(
        'text-[8px] px-1.5 py-0.5 rounded-md border',
        badge.startsWith('LIVE') ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
        badge.startsWith('NEW') ? 'bg-primary/10 text-primary border-primary/20' :
        'bg-amber-500/10 text-amber-300 border-amber-500/20'
      )}>
        {badge}
      </span>
    )}
  </button>
);

const PulseDot: React.FC<{ color?: string }> = ({ color = '#10B981' }) => (
  <span className="relative flex h-2.5 w-2.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: color }} />
    <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: color }} />
  </span>
);

const SeverityBadge: React.FC<{ severity: DarkWebHit['severity'] }> = ({ severity }) => {
  const styles = {
    critical: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    high: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    medium: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    low: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };
  return (
    <span className={cn('text-[8px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-md border', styles[severity])}>
      {severity}
    </span>
  );
};

const ThreatMeter: React.FC<{ level: 'low' | 'medium' | 'high' | 'critical' }> = ({ level }) => {
  const width = level === 'critical' ? 100 : level === 'high' ? 75 : level === 'medium' ? 45 : 20;
  const color = level === 'critical' ? '#EF4444' : level === 'high' ? '#F59E0B' : level === 'medium' ? '#3B82F6' : '#10B981';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-zinc-800/40 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${width}%`, background: color }} />
      </div>
      <span className="text-[9px] font-bold uppercase" style={{ color }}>{level}</span>
    </div>
  );
};

const NexusStat: React.FC<{
  label: string;
  value: string | number;
  icon: React.FC<{ size?: number; className?: string }>;
  accent?: 'primary' | 'emerald' | 'rose' | 'amber' | 'cyan';
}> = ({ label, value, icon: Icon, accent }) => {
  const accentColor = accent === 'emerald' ? 'text-emerald-400' :
    accent === 'rose' ? 'text-rose-400' :
    accent === 'amber' ? 'text-amber-400' :
    accent === 'cyan' ? 'text-cyan-400' :
    'text-primary';
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm">
      <Icon size={14} className={accentColor} />
      <div>
        <p className="text-base font-black text-white leading-none">{value}</p>
        <p className="text-[8px] uppercase tracking-[0.15em] text-zinc-500 font-bold mt-1">{label}</p>
      </div>
    </div>
  );
};

const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="p-5 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 animate-pulse">
        <div className="h-4 bg-zinc-800/60 rounded w-1/3 mb-3" />
        <div className="h-3 bg-zinc-800/40 rounded w-2/3 mb-2" />
        <div className="h-3 bg-zinc-800/40 rounded w-1/2" />
      </div>
    ))}
  </div>
);

// ────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────

interface AdminNexusPageProps {
  className?: string;
}

const AdminNexusPage: React.FC<AdminNexusPageProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<NexusTab>('market-intel');

  // ─── Crypto State ───
  const [cryptoPrices, setCryptoPrices] = useState<EnrichedCrypto[]>([]);
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [cryptoError, setCryptoError] = useState('');
  const [cryptoView, setCryptoView] = useState<'grid' | 'audit'>('grid');

  // ─── Market Intel State ───
  const [marketQuery, setMarketQuery] = useState('');
  const [marketIntel, setMarketIntel] = useState<MarketIntelResult | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState('');

  // ─── AI Agent State ───
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentTasks, setAgentTasks] = useState<AIAgentTask[]>([]);
  const [agentRunning, setAgentRunning] = useState(false);

  // ─── Dark Web State ───
  const [breachEmails, setBreachEmails] = useState('');
  const [breachResults, setBreachResults] = useState<BreachResult[]>([]);
  const [githubResults, setGithubResults] = useState<GitHubScanResult[]>([]);
  const [breachLoading, setBreachLoading] = useState(false);
  const [breachError, setBreachError] = useState('');

  // ─── Predictions State ───
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState('');
  const predictedAssets = ['BTC', 'ETH', 'SOL', 'NVDA', 'S&P 500'];

  // ─── Sentinel State ───
  const [threats, setThreats] = useState<ThreatNode[]>([]);
  const [sentinelLoading, setSentinelLoading] = useState(false);
  const [sentinelError, setSentinelError] = useState('');
  const [sentinelFilter, setSentinelFilter] = useState<'all' | 'geopolitical' | 'climate' | 'biological' | 'cyber'>('all');

  // ─── Supply Chain Twin State ───
  const [supplyNodes, setSupplyNodes] = useState<SupplyNode[]>([]);
  const [supplyRoutes, setSupplyRoutes] = useState<SupplyRoute[]>([]);
  const [supplyLoading, setSupplyLoading] = useState(false);
  const [supplyError, setSupplyError] = useState('');

  // ─── R&D Radar State ───
  const [patents, setPatents] = useState<PatentSignal[]>([]);
  const [rdLoading, setRdLoading] = useState(false);
  const [rdError, setRdError] = useState('');

  // ─── Load crypto prices on mount ───
  const loadCrypto = useCallback(async () => {
    setCryptoLoading(true);
    setCryptoError('');
    try {
      const prices = await fetchCryptoPrices();
      const enriched: EnrichedCrypto[] = prices.map(p => ({
        ...p,
        ...deriveAuditScore(p.symbol, p.price),
      }));
      setCryptoPrices(enriched);
    } catch (err: unknown) {
      setCryptoError(err instanceof Error ? err.message : 'Failed to fetch crypto prices');
    } finally {
      setCryptoLoading(false);
    }
  }, []);

  useEffect(() => { loadCrypto(); }, [loadCrypto]);

  // ─── Load predictions on mount ───
  const loadPredictions = useCallback(async () => {
    setPredLoading(true);
    setPredError('');
    try {
      const results = await generatePredictions(predictedAssets);
      setPredictions(results);
    } catch (err: unknown) {
      setPredError(err instanceof Error ? err.message : 'Failed to generate predictions');
    } finally {
      setPredLoading(false);
    }
  }, [predictedAssets]);

  useEffect(() => { loadPredictions(); }, [loadPredictions]);

  // ─── Load Sentinel data ───
  const loadSentinel = useCallback(async () => {
    setSentinelLoading(true);
    setSentinelError('');
    try {
      const data = await fetchGlobalThreats();
      setThreats(data);
    } catch (err: unknown) {
      setSentinelError(err instanceof Error ? err.message : 'Failed to load Sentinel data');
    } finally {
      setSentinelLoading(false);
    }
  }, []);

  // ─── Load Supply Chain Twin data ───
  const loadSupplyChain = useCallback(async () => {
    setSupplyLoading(true);
    setSupplyError('');
    try {
      const data = await fetchSupplyChainTwin();
      setSupplyNodes(data.nodes);
      setSupplyRoutes(data.routes);
    } catch (err: unknown) {
      setSupplyError(err instanceof Error ? err.message : 'Failed to load supply chain twin');
    } finally {
      setSupplyLoading(false);
    }
  }, []);

  // ─── Load R&D Radar data ───
  const loadRDRadar = useCallback(async () => {
    setRdLoading(true);
    setRdError('');
    try {
      const data = await fetchRDRadar();
      setPatents(data);
    } catch (err: unknown) {
      setRdError(err instanceof Error ? err.message : 'Failed to load R&D radar');
    } finally {
      setRdLoading(false);
    }
  }, []);

  // ─── Auto-load default market intel ───
  const runMarketIntel = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setMarketLoading(true);
    setMarketError('');
    try {
      const result = await fetchMarketIntel(query.trim());
      setMarketIntel(result);
    } catch (err: unknown) {
      setMarketError(err instanceof Error ? err.message : 'Market intel fetch failed');
    } finally {
      setMarketLoading(false);
    }
  }, []);

  // Auto-search on first mount of market-intel tab
  useEffect(() => {
    if (activeTab === 'market-intel' && !marketIntel && !marketLoading) {
      runMarketIntel('AI flashcard app competitors 2026 funding product launches');
    }
  }, [activeTab, marketIntel, marketLoading, runMarketIntel]);

  const filteredThreats = useMemo(() => {
    return threats.filter(t => sentinelFilter === 'all' || t.type === sentinelFilter);
  }, [threats, sentinelFilter]);

  // Auto-load new tabs when first opened
  useEffect(() => {
    if (activeTab === 'sentinel' && threats.length === 0 && !sentinelLoading) {
      loadSentinel();
    }
  }, [activeTab, threats.length, sentinelLoading, loadSentinel]);

  useEffect(() => {
    if (activeTab === 'supply-chain' && supplyNodes.length === 0 && !supplyLoading) {
      loadSupplyChain();
    }
  }, [activeTab, supplyNodes.length, supplyLoading, loadSupplyChain]);

  useEffect(() => {
    if (activeTab === 'rd-radar' && patents.length === 0 && !rdLoading) {
      loadRDRadar();
    }
  }, [activeTab, patents.length, rdLoading, loadRDRadar]);

  // ─── AI Agent: real Groq-powered dispatch ───
  const dispatchAgent = useCallback(async () => {
    if (!agentPrompt.trim() || agentRunning) return;
    setAgentRunning(true);
    const task: AIAgentTask = {
      id: `agent-${Date.now().toString(36)}`,
      prompt: agentPrompt.trim(),
      status: 'running',
      steps: [],
      createdAt: Date.now(),
    };
    setAgentTasks(prev => [task, ...prev]);
    setAgentPrompt('');

    try {
      const result = await runAIAgent(task.prompt, (step) => {
        setAgentTasks(prev => prev.map(t =>
          t.id === task.id ? { ...t, steps: [...t.steps, step], result: step } : t
        ));
      });

      setAgentTasks(prev => prev.map(t =>
        t.id === task.id
          ? { ...t, status: 'completed', result: result.result, steps: result.steps }
          : t
      ));
    } catch (err: unknown) {
      setAgentTasks(prev => prev.map(t =>
        t.id === task.id
          ? { ...t, status: 'failed', result: err instanceof Error ? err.message : 'Agent task failed' }
          : t
      ));
    } finally {
      setAgentRunning(false);
    }
  }, [agentPrompt, agentRunning]);

  // ─── Dark Web: breach check + GitHub scan ───
  const runBreachCheck = useCallback(async () => {
    const emails = breachEmails.split(/[,\s]+/).filter(Boolean);
    if (emails.length === 0) return;
    setBreachLoading(true);
    setBreachError('');
    try {
      const results = await checkBreaches(emails);
      setBreachResults(results);

      // Also scan GitHub for secrets
      try {
        const gh = await scanGitHubForSecrets('auramind-app');
        setGithubResults(gh);
      } catch {
        // GitHub scan is optional
      }
    } catch (err: unknown) {
      setBreachError(err instanceof Error ? err.message : 'Breach check failed');
    } finally {
      setBreachLoading(false);
    }
  }, [breachEmails]);

  // ─── Dark Web hits: merge breach + GitHub results ───
  const darkWebHits: DarkWebHit[] = useMemo(() => {
    const hits: DarkWebHit[] = [];

    // Breach results
    breachResults.forEach(r => {
      if (r.count > 0) {
        r.breaches.forEach(breachName => {
          hits.push({
            id: `breach-${r.email}-${breachName}`,
            source: 'HIBP',
            type: 'data_breach',
            severity: r.count >= 3 ? 'critical' : r.count >= 2 ? 'high' : 'medium',
            content: `${r.email} found in ${breachName} — ${r.count} total breach(es)`,
            timestamp: Date.now(),
            status: 'new',
          });
        });
      } else if (r.count === 0) {
        hits.push({
          id: `clean-${r.email}`,
          source: 'HIBP',
          type: 'credential_leak',
          severity: 'low',
          content: `${r.email} is clean — no breaches found`,
          timestamp: Date.now(),
          status: 'resolved',
        });
      }
    });

    // GitHub scan results
    githubResults.forEach(r => {
      r.findings.forEach(f => {
        hits.push({
          id: `gh-${r.repo}-${f.path}`,
          source: r.repo,
          type: 'github_secret',
          severity: f.severity,
          content: `Potential secret in ${f.path} (${f.type})`,
          timestamp: Date.now(),
          status: 'new',
        });
      });
    });

    return hits;
  }, [breachResults, githubResults]);

  const darkWebStats = useMemo(() => ({
    total: darkWebHits.length,
    critical: darkWebHits.filter(h => h.severity === 'critical').length,
    newHits: darkWebHits.filter(h => h.status === 'new').length,
    resolved: darkWebHits.filter(h => h.status === 'resolved').length,
  }), [darkWebHits]);

  // ─── Has API keys check ───
  const hasGroqKey = useMemo(() => {
    const key = import.meta.env.VITE_GROQ_API_KEY;
    return !!key && key !== 'gsk_your_key_here';
  }, []);

  const hasGoogleSearch = useMemo(() => {
    const key = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY;
    const id = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
    return !!(key && id && key !== 'your_google_search_api_key');
  }, []);

  // ─── Crypto portfolio total ───
  const portfolioTotal = useMemo(() =>
    cryptoPrices.reduce((sum, c) => sum + c.price * (c.symbol === 'BTC' ? 0.5 : c.symbol === 'ETH' ? 4 : c.symbol === 'SOL' ? 20 : c.symbol === 'ARB' ? 500 : 30), 0),
    [cryptoPrices]
  );

  return (
    <PageShell>
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20', className)}>
        {/* ────── HEADER ────── */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-zinc-900/10 to-amber-500/[0.02] backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative z-10 p-6 lg:p-8">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <BrainCircuit size={24} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h1 className="text-xl font-black text-white tracking-tight">Nexus Command</h1>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/20">
                    CEO · OWNER ONLY
                  </span>
                  <PulseDot color="#10B981" />
                  <span className="text-[10px] font-mono text-emerald-400">
                    {hasGroqKey ? 'ALL SYSTEMS LIVE' : 'API KEY REQUIRED'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed max-w-2xl">
                  Classified intelligence dashboard. Real-time crypto prices, AI-powered market analysis, autonomous AI agents,
                  breach monitoring, predictive financial models, global risk Sentinel, Supply Chain Digital Twin, and R&D Radar.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[9px] font-mono text-zinc-500">
                <div className="flex flex-col items-end">
                  <span className="text-emerald-400 font-bold">SECURE</span>
                  <span>AES-256 · E2E</span>
                </div>
                <div className="w-px h-10 bg-zinc-700/30" />
                <div className="flex flex-col items-end">
                  <span className="text-primary font-bold">TIER 5</span>
                  <span>Eye Only</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ────── TAB BAR ────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <NexusTabButton
            active={activeTab === 'market-intel'}
            icon={Globe}
            label="Market Intel"
            badge={marketLoading ? 'FETCHING' : 'LIVE'}
            onClick={() => setActiveTab('market-intel')}
          />
          <NexusTabButton
            active={activeTab === 'dark-web'}
            icon={Shield}
            label="Dark Web"
            badge={darkWebStats.critical > 0 ? `${darkWebStats.critical} ⚠` : undefined}
            onClick={() => setActiveTab('dark-web')}
          />
          <NexusTabButton
            active={activeTab === 'ai-agent'}
            icon={Cpu}
            label="AI Agent"
            badge={hasGroqKey ? 'LIVE' : 'KEY'}
            onClick={() => setActiveTab('ai-agent')}
          />
          <NexusTabButton
            active={activeTab === 'crypto-audit'}
            icon={Wallet}
            label="Crypto Audit"
            badge="LIVE"
            onClick={() => setActiveTab('crypto-audit')}
          />
          <NexusTabButton
            active={activeTab === 'predictive'}
            icon={TrendingUp}
            label="Predictions"
            badge={hasGroqKey ? 'AI' : 'OFF'}
            onClick={() => setActiveTab('predictive')}
          />
          <NexusTabButton
            active={activeTab === 'sentinel'}
            icon={Shield}
            label="Sentinel"
            badge="LIVE"
            onClick={() => setActiveTab('sentinel')}
          />
          <NexusTabButton
            active={activeTab === 'supply-chain'}
            icon={Globe}
            label="Supply Twin"
            badge="TWIN"
            onClick={() => setActiveTab('supply-chain')}
          />
          <NexusTabButton
            active={activeTab === 'rd-radar'}
            icon={BrainCircuit}
            label="R&D Radar"
            badge="NEW"
            onClick={() => setActiveTab('rd-radar')}
          />
        </div>

        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════════════════
              TAB 1: NEURAL MARKET INTELLIGENCE (Real)
              ═══════════════════════════════════════════ */}
          {activeTab === 'market-intel' && (
            <motion.div
              key="market-intel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              {/* Search bar */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={marketQuery}
                    onChange={e => setMarketQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') runMarketIntel(marketQuery); }}
                    placeholder="Search competitor news, funding rounds, product launches..."
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-zinc-950/60 border border-zinc-700/30 text-[11px] text-zinc-200 focus:outline-none focus:border-primary/40 transition-all font-mono"
                  />
                </div>
                <button
                  onClick={() => runMarketIntel(marketQuery)}
                  disabled={marketLoading || !marketQuery.trim()}
                  className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.15em] hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                  {marketLoading ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                  Search
                </button>
              </div>

              {/* Info about data sources */}
              {!hasGoogleSearch && !hasGroqKey && (
                <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-[10px] text-amber-200/80 flex items-start gap-2">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  <span>
                    Real market intel requires Google Search API and/or Groq API keys. Set <code className="text-amber-300 bg-amber-500/10 px-1 rounded">VITE_GOOGLE_SEARCH_API_KEY</code> and <code className="text-amber-300 bg-amber-500/10 px-1 rounded">VITE_GROQ_API_KEY</code> in your .env. Groq provides AI-generated intel without Google Search.
                  </span>
                </div>
              )}

              {/* Loading */}
              {marketLoading && <LoadingSkeleton rows={4} />}

              {/* Error */}
              {marketError && !marketLoading && (
                <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-[10px] text-rose-200/80 flex items-start gap-2">
                  <X size={12} className="shrink-0 mt-0.5" />
                  <span>{marketError}</span>
                </div>
              )}

              {/* Results */}
              {marketIntel && !marketLoading && (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <NexusStat label="Results Found" value={marketIntel.results.length} icon={Target} accent="primary" />
                    <NexusStat label="Positive Sentiment" value={marketIntel.results.filter(r => r.sentiment === 'positive').length} icon={TrendingUp} accent="emerald" />
                    <NexusStat label="Negative Signals" value={marketIntel.results.filter(r => r.sentiment === 'negative').length} icon={AlertTriangle} accent="rose" />
                    <NexusStat label="Searched" value={formatTimeAgo(marketIntel.searchedAt)} icon={Activity} accent="cyan" />
                  </div>

                  {/* AI Summary */}
                  <div className="p-5 rounded-2xl border border-primary/20 bg-primary/[0.04] backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <BrainCircuit size={14} className="text-primary" />
                      <h3 className="text-[10px] font-black text-white uppercase tracking-[0.1em]">AI Executive Summary</h3>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">{marketIntel.summary}</p>
                  </div>

                  {/* Result cards */}
                  <div className="grid lg:grid-cols-2 gap-4">
                    {marketIntel.results.map((r, i) => (
                      <motion.a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-5 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm hover:border-zinc-700/50 transition-all group block"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-[11px] font-black text-white group-hover:text-primary transition-colors line-clamp-2">
                            {r.title}
                          </h3>
                          <span className={cn(
                            'text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md border shrink-0',
                            r.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                            r.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                          )}>
                            {r.sentiment}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-3">{r.snippet}</p>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-700/20">
                          <Globe size={10} className="text-zinc-500" />
                          <span className="text-[9px] font-mono text-zinc-500 truncate">{r.url}</span>
                          <ExternalLink size={10} className="text-zinc-600 ml-auto" />
                        </div>
                      </motion.a>
                    ))}
                  </div>

                  {/* Live feed */}
                  <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3">
                    <PulseDot color="#10B981" />
                    <span className="text-[10px] text-emerald-300 font-mono">
                      {hasGoogleSearch
                        ? 'Google Search API active — fetching real-time competitive intelligence.'
                        : hasGroqKey
                          ? 'Groq AI active — generating intelligence from model knowledge (may not include latest events).'
                          : 'Connect Google Search + Groq APIs for real-time competitor monitoring.'}
                    </span>
                  </div>
                </>
              )}

              {!marketIntel && !marketLoading && !marketError && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search size={40} className="text-zinc-700 mb-4" />
                  <p className="text-[11px] text-zinc-500 font-bold">Enter a search query above</p>
                  <p className="text-[10px] text-zinc-600 mt-1 max-w-md">
                    Search for competitor intelligence, market trends, funding news, or any business topic.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════
              TAB 2: DARK WEB BRAND MONITOR (Real)
              ═══════════════════════════════════════════ */}
          {activeTab === 'dark-web' && (
            <motion.div
              key="dark-web"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              {/* Email breach check */}
              <div className="p-6 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.1em] flex items-center gap-2 mb-4">
                  <Shield size={14} className="text-primary" />
                  Have I Been Pwned — Breach Check
                </h3>
                <p className="text-[10px] text-zinc-500 mb-4">Enter emails (comma-separated) to check against real breach databases via HIBP API v3.</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={breachEmails}
                    onChange={e => setBreachEmails(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') runBreachCheck(); }}
                    placeholder="e.g., admin@auramind.app, ceo@auramind.app"
                    disabled={breachLoading}
                    className="flex-1 px-4 py-3 rounded-xl bg-zinc-950/60 border border-zinc-700/30 text-[11px] text-zinc-200 focus:outline-none focus:border-primary/40 disabled:opacity-50 transition-all font-mono"
                  />
                  <button
                    onClick={runBreachCheck}
                    disabled={breachLoading || !breachEmails.trim()}
                    className="px-5 py-3 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.15em] hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-rose-500/20"
                  >
                    {breachLoading ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                    Check
                  </button>
                </div>
              </div>

              {/* Stats */}
              {darkWebHits.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <NexusStat label="Total Findings" value={darkWebStats.total} icon={Shield} />
                  <NexusStat label="Critical" value={darkWebStats.critical} icon={AlertTriangle} accent="rose" />
                  <NexusStat label="New" value={darkWebStats.newHits} icon={Eye} accent="amber" />
                  <NexusStat label="Clean / Resolved" value={darkWebStats.resolved} icon={Check} accent="emerald" />
                </div>
              )}

              {/* Loading */}
              {breachLoading && <LoadingSkeleton rows={3} />}

              {/* Error */}
              {breachError && !breachLoading && (
                <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-[10px] text-rose-200/80 flex items-start gap-2">
                  <X size={12} className="shrink-0 mt-0.5" />
                  <span>{breachError}</span>
                </div>
              )}

              {/* Results */}
              {darkWebHits.length > 0 && !breachLoading && (
                <div className="rounded-2xl border border-zinc-700/30 overflow-hidden backdrop-blur-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-700/30 bg-zinc-900/10">
                        <th className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 px-4 py-3">Source</th>
                        <th className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 px-4 py-3">Type</th>
                        <th className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 px-4 py-3">Severity</th>
                        <th className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 px-4 py-3 hidden lg:table-cell">Content</th>
                        <th className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {darkWebHits.map((hit, i) => (
                        <tr key={hit.id} className="border-b border-zinc-700/20 hover:bg-zinc-900/10 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-mono text-zinc-300">{hit.source}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase">
                              {hit.type.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <SeverityBadge severity={hit.severity} />
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <p className="text-[10px] text-zinc-400 max-w-xs truncate">{hit.content}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'text-[9px] font-bold uppercase',
                              hit.status === 'new' ? 'text-rose-400' :
                              hit.status === 'investigating' ? 'text-amber-400' :
                              'text-emerald-400'
                            )}>
                              {hit.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Threat map (decorative) */}
              <div className="p-6 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.1em] flex items-center gap-2">
                    <Globe size={14} className="text-primary" />
                    GitHub Secret Scanner
                  </h3>
                </div>
                <div className="relative h-48 rounded-xl border border-zinc-700/30 bg-zinc-950/60 overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 opacity-20">
                    {[
                      { x: '20%', y: '35%', color: '#EF4444', size: 6 },
                      { x: '45%', y: '30%', color: '#F59E0B', size: 4 },
                      { x: '75%', y: '45%', color: '#EF4444', size: 8 },
                      { x: '60%', y: '55%', color: '#3B82F6', size: 5 },
                      { x: '35%', y: '60%', color: '#F59E0B', size: 4 },
                      { x: '85%', y: '25%', color: '#EF4444', size: 5 },
                      { x: '15%', y: '50%', color: '#10B981', size: 3 },
                    ].map((dot, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full animate-pulse"
                        style={{
                          left: dot.x, top: dot.y,
                          width: dot.size, height: dot.size,
                          background: dot.color,
                          boxShadow: `0 0 ${dot.size * 3}px ${dot.color}80`,
                          animationDelay: `${i * 0.5}s`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="relative z-10 text-center">
                    <Lock size={32} className="text-zinc-700 mx-auto mb-2" />
                    <p className="text-[11px] text-zinc-500 font-bold">
                      {githubResults.length > 0
                        ? `${githubResults.length} GitHub repos scanned — ${githubResults.reduce((s, r) => s + r.findings.length, 0)} findings`
                        : 'GitHub Scanner — runs alongside breach checks'}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1">Public repo secret scanning via GitHub Code Search API</p>
                  </div>
                </div>
              </div>

              {darkWebHits.length === 0 && !breachLoading && !breachError && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Shield size={40} className="text-zinc-700 mb-4" />
                  <p className="text-[11px] text-zinc-500 font-bold">No checks run yet</p>
                  <p className="text-[10px] text-zinc-600 mt-1 max-w-md">
                    Enter emails above to check against real breach databases via Have I Been Pwned. Also scans GitHub for exposed secrets.
                  </p>
                </div>
              )}

              <div className="p-3 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 text-[10px] text-zinc-500 italic text-center">
                Breach data via Have I Been Pwned API (free tier). GitHub scan via public Code Search API (rate-limited). No API keys required for basic usage.
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════
              TAB 3: AUTONOMOUS AI AGENT SANDBOX (Real)
              ═══════════════════════════════════════════ */}
          {activeTab === 'ai-agent' && (
            <motion.div
              key="ai-agent"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              {/* Agent dispatch */}
              <div className="p-6 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.1em] flex items-center gap-2 mb-4">
                  <Cpu size={14} className="text-primary" />
                  Dispatch Autonomous Agent {hasGroqKey ? '— Groq AI Powered' : '— API Key Required'}
                </h3>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={agentPrompt}
                      onChange={e => setAgentPrompt(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') dispatchAgent(); }}
                      placeholder='e.g., "Research the top 5 AI edtech startups, their funding rounds, and competitive positioning"'
                      disabled={agentRunning || !hasGroqKey}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-zinc-700/30 text-[11px] text-zinc-200 focus:outline-none focus:border-primary/40 disabled:opacity-50 transition-all font-mono"
                    />
                  </div>
                  <button
                    onClick={dispatchAgent}
                    disabled={!agentPrompt.trim() || agentRunning || !hasGroqKey}
                    className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.15em] hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                  >
                    {agentRunning ? (
                      <><RefreshCw size={13} className="animate-spin" /> Running</>
                    ) : (
                      <><Play size={13} /> Dispatch</>
                    )}
                  </button>
                </div>

                {/* Capability showcase */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
                  {[
                    { icon: Search, label: 'Web Research', desc: 'Multi-step analysis' },
                    { icon: Globe, label: 'Competitive Intel', desc: 'Market positioning' },
                    { icon: BrainCircuit, label: 'Groq LLM', desc: 'llama3-8b reasoning' },
                    { icon: Database, label: 'Structured Output', desc: 'Actionable reports' },
                  ].map(cap => (
                    <div key={cap.label} className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-700/20 text-center">
                      <cap.icon size={14} className="text-zinc-500 mx-auto mb-1" />
                      <div className="text-[10px] font-bold text-zinc-300">{cap.label}</div>
                      <div className="text-[8px] text-zinc-600">{cap.desc}</div>
                    </div>
                  ))}
                </div>

                {!hasGroqKey && (
                  <div className="mt-4 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-[10px] text-amber-200/80 flex items-start gap-2">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    <span>
                      Groq API key required. Set <code className="text-amber-300 bg-amber-500/10 px-1 rounded">VITE_GROQ_API_KEY</code> in .env. Get a free key at <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="underline">console.groq.com/keys</a>.
                    </span>
                  </div>
                )}
              </div>

              {/* Agent tasks history */}
              {agentTasks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em]">
                    Agent History ({agentTasks.length})
                  </h3>
                  {agentTasks.map(task => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'p-4 rounded-2xl border backdrop-blur-sm',
                        task.status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/5' :
                        task.status === 'running' ? 'border-primary/20 bg-primary/[0.04]' :
                        task.status === 'failed' ? 'border-rose-500/20 bg-rose-500/5' :
                        'border-zinc-700/30 bg-zinc-900/10'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              'text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md border',
                              task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                              task.status === 'running' ? 'bg-primary/10 text-primary border-primary/20' :
                              'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            )}>
                              {task.status}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-mono">
                              {task.steps.length} steps · {formatTimeAgo(task.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-300 font-medium">{task.prompt}</p>
                        </div>
                      </div>

                      {/* Steps log */}
                      {task.steps.length > 0 && (
                        <div className="mb-3 space-y-1">
                          {task.steps.map((step, si) => (
                            <div key={si} className="text-[9px] text-zinc-500 font-mono flex items-start gap-2">
                              <span className="text-zinc-600 shrink-0">{String(si + 1).padStart(2, '0')}</span>
                              <span className="truncate">{step}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {task.result && task.status === 'completed' && (
                        <div className="p-3 rounded-lg bg-zinc-950/40 border border-emerald-500/20 font-mono text-[10px] text-emerald-200/80 leading-relaxed">
                          {task.result}
                        </div>
                      )}

                      {task.result && task.status === 'failed' && (
                        <div className="p-3 rounded-lg bg-zinc-950/40 border border-rose-500/20 font-mono text-[10px] text-rose-200/80 leading-relaxed">
                          {task.result}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {agentTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Cpu size={40} className="text-zinc-700 mb-4" />
                  <p className="text-[11px] text-zinc-500 font-bold">No agents dispatched yet</p>
                  <p className="text-[10px] text-zinc-600 mt-1 max-w-md">
                    Autonomous AI agents use Groq's LLM to research, analyze, and compile structured reports — multi-step reasoning with real-time progress.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════
              TAB 4: CRYPTO AUDITOR (Real prices)
              ═══════════════════════════════════════════ */}
          {activeTab === 'crypto-audit' && (
            <motion.div
              key="crypto-audit"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              {/* Header with refresh */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCryptoView('grid')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border transition-all',
                      cryptoView === 'grid' ? 'bg-primary/15 text-primary border-primary/30' : 'bg-zinc-900/10 text-zinc-500 border-zinc-700/30'
                    )}
                  >
                    Portfolio View
                  </button>
                  <button
                    onClick={() => setCryptoView('audit')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border transition-all',
                      cryptoView === 'audit' ? 'bg-primary/15 text-primary border-primary/30' : 'bg-zinc-900/10 text-zinc-500 border-zinc-700/30'
                    )}
                  >
                    Smart Contract Audit
                  </button>
                </div>
                <button
                  onClick={loadCrypto}
                  disabled={cryptoLoading}
                  className="px-3 py-1.5 rounded-lg text-[9px] font-bold text-zinc-500 hover:text-zinc-300 border border-zinc-700/30 hover:border-zinc-700/50 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={11} className={cn(cryptoLoading && 'animate-spin')} />
                  Refresh Prices
                </button>
              </div>

              {/* Loading */}
              {cryptoLoading && <LoadingSkeleton rows={3} />}

              {/* Error */}
              {cryptoError && !cryptoLoading && (
                <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-[10px] text-rose-200/80 flex items-start gap-2">
                  <X size={12} className="shrink-0 mt-0.5" />
                  <span>{cryptoError} — showing cached/fallback data if available.</span>
                </div>
              )}

              {/* Portfolio grid */}
              {!cryptoLoading && cryptoPrices.length > 0 && cryptoView === 'grid' && (
                <>
                  <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {cryptoPrices.map((asset, i) => (
                      <motion.div
                        key={asset.symbol}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-5 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm hover:border-zinc-700/50 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-950/60 border border-zinc-700/30 flex items-center justify-center">
                              <Coins size={16} className={asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
                            </div>
                            <div>
                              <h3 className="text-[12px] font-black text-white">{asset.symbol}</h3>
                              <p className="text-[9px] text-zinc-500">{asset.name}</p>
                            </div>
                          </div>
                          <span className={cn(
                            'text-[10px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border',
                            asset.recommendation === 'buy' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                            asset.recommendation === 'hold' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                            'bg-rose-500/10 text-rose-300 border-rose-500/20'
                          )}>
                            {asset.recommendation}
                          </span>
                        </div>

                        <div className="text-2xl font-black text-white mb-3">
                          ${asset.price.toLocaleString(undefined, { minimumFractionDigits: asset.price < 1 ? 4 : 2 })}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <div className="text-[8px] uppercase tracking-[0.1em] text-zinc-500 font-bold">24h</div>
                            <div className={cn('text-[11px] font-mono font-bold', asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                              {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-[8px] uppercase tracking-[0.1em] text-zinc-500 font-bold">Market Cap</div>
                            <div className="text-[11px] font-mono text-zinc-300">{asset.marketCap}</div>
                          </div>
                          <div>
                            <div className="text-[8px] uppercase tracking-[0.1em] text-zinc-500 font-bold">Audit*</div>
                            <div className={cn('text-[11px] font-mono font-bold',
                              asset.auditScore >= 85 ? 'text-emerald-400' : asset.auditScore >= 70 ? 'text-amber-400' : 'text-rose-400'
                            )}>
                              {asset.auditScore}/100
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Portfolio total */}
                  <div className="p-5 rounded-2xl border border-primary/20 bg-primary/[0.03] backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.1em]">Estimated Portfolio Value</h3>
                        <p className="text-[10px] text-zinc-500 mt-1">Based on hypothetical holdings (0.5 BTC + 4 ETH + 20 SOL + 500 ARB + 30 AAVE)</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-white">
                          ${portfolioTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-zinc-500">Hypothetical · not financial advice</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Smart Contract Audit view */}
              {!cryptoLoading && cryptoPrices.length > 0 && cryptoView === 'audit' && (
                <>
                  {cryptoPrices.map((asset, i) => (
                    <motion.div
                      key={asset.symbol}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="p-5 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Coins size={16} className="text-primary" />
                          <div>
                            <h3 className="text-[12px] font-black text-white">{asset.name} ({asset.symbol})</h3>
                            <p className="text-[9px] text-zinc-500">Smart Contract Audit Report · Current: ${asset.price.toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={cn(
                          'text-xs font-black px-2 py-1 rounded-lg border',
                          asset.auditScore >= 85 ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                          asset.auditScore >= 70 ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        )}>
                          Score: {asset.auditScore}/100
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-700/20">
                          <div className="text-[8px] uppercase tracking-[0.15em] text-zinc-500 font-bold mb-1">Vulnerabilities</div>
                          <div className={cn('text-lg font-black', asset.vulnerabilities > 0 ? 'text-rose-400' : 'text-emerald-400')}>
                            {asset.vulnerabilities}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-700/20">
                          <div className="text-[8px] uppercase tracking-[0.15em] text-zinc-500 font-bold mb-1">Recommendation</div>
                          <div className="text-lg font-black text-white uppercase">{asset.recommendation}</div>
                        </div>
                      </div>

                      {asset.vulnerabilities > 0 && (
                        <div className="mt-3 p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-[10px] text-rose-300">
                          <span className="font-black mr-1">⚠</span>
                          {asset.vulnerabilities} potential issue{asset.vulnerabilities > 1 ? 's' : ''} detected in {asset.symbol} ecosystem.
                          Manual review recommended before interacting with protocol.
                        </div>
                      )}
                    </motion.div>
                  ))}
                </>
              )}

              <div className="p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-[10px] text-emerald-200/80 text-center">
                <PulseDot color="#10B981" />
                <span className="ml-2">Live prices via CoinGecko free API (no key required). *Audit scores are simulated — connect Etherscan/Moralis for real smart-contract analysis.</span>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════
              TAB 5: PREDICTIVE MARKET MODELS (Real AI)
              ═══════════════════════════════════════════ */}
          {activeTab === 'predictive' && (
            <motion.div
              key="predictive"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.1em] flex items-center gap-2">
                  <TrendingUp size={14} className="text-primary" />
                  AI-Powered Market Predictions {hasGroqKey ? '— Groq · llama3-8b' : '— API Key Required'}
                </h3>
                <button
                  onClick={loadPredictions}
                  disabled={predLoading || !hasGroqKey}
                  className="px-3 py-1.5 rounded-lg text-[9px] font-bold text-zinc-500 hover:text-zinc-300 border border-zinc-700/30 hover:border-zinc-700/50 transition-all flex items-center gap-1.5 disabled:opacity-40"
                >
                  <RefreshCw size={11} className={cn(predLoading && 'animate-spin')} />
                  Regenerate
                </button>
              </div>

              {/* No key warning */}
              {!hasGroqKey && (
                <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-[10px] text-amber-200/80 flex items-start gap-2">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  <span>
                    Predictions require Groq API. Set <code className="text-amber-300 bg-amber-500/10 px-1 rounded">VITE_GROQ_API_KEY</code> in .env. Get a free key at <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="underline">console.groq.com/keys</a>.
                  </span>
                </div>
              )}

              {/* Loading */}
              {predLoading && <LoadingSkeleton rows={3} />}

              {/* Error */}
              {predError && !predLoading && (
                <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-[10px] text-rose-200/80 flex items-start gap-2">
                  <X size={12} className="shrink-0 mt-0.5" />
                  <span>{predError}</span>
                </div>
              )}

              {/* Stats */}
              {predictions.length > 0 && !predLoading && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <NexusStat label="Assets Analyzed" value={predictions.length} icon={BrainCircuit} accent="primary" />
                  <NexusStat label="Avg Confidence" value={`${Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length)}%`} icon={Target} accent="emerald" />
                  <NexusStat label="Bullish" value={predictions.filter(p => p.sentiment === 'bullish').length} icon={ArrowUp} accent="emerald" />
                  <NexusStat label="Bearish" value={predictions.filter(p => p.sentiment === 'bearish').length} icon={ArrowDown} accent="rose" />
                </div>
              )}

              {/* Predictions */}
              {!predLoading && predictions.length > 0 && (
                <div className="space-y-4">
                  {predictions.map((pred, i) => (
                    <motion.div
                      key={`${pred.asset}-${i}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="p-5 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm hover:border-zinc-700/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-sm font-black text-white">{pred.asset}</h3>
                            <span className={cn(
                              'text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md border',
                              pred.sentiment === 'bullish' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                              pred.sentiment === 'bearish' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' :
                              'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                            )}>
                              {pred.sentiment}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">{pred.timeframe}</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">{pred.prediction}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-[10px] text-zinc-500">
                              <span className="text-primary font-bold">Catalyst:</span> {pred.catalyst}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-center">
                            <div className="text-2xl font-black text-white">{pred.confidence}%</div>
                            <div className="text-[8px] uppercase tracking-[0.15em] text-zinc-500 font-bold">Confidence</div>
                          </div>
                        </div>
                      </div>

                      {/* Confidence bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.15em] font-bold mb-1.5">
                          <span className="text-zinc-500">Model Confidence</span>
                          <span className="text-primary">{pred.confidence}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-zinc-800/40 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-700"
                            style={{ width: `${pred.confidence}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {!predLoading && !predError && predictions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <TrendingUp size={40} className="text-zinc-700 mb-4" />
                  <p className="text-[11px] text-zinc-500 font-bold">No predictions loaded</p>
                  <p className="text-[10px] text-zinc-600 mt-1 max-w-md">
                    Click "Regenerate" to run AI predictions on {predictedAssets.join(', ')} via Groq.
                  </p>
                </div>
              )}

              <div className="p-3 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 text-[10px] text-zinc-500 italic text-center">
                Predictions generated by Groq AI (llama3-8b). Analysis based on model knowledge up to training cutoff. Not financial advice — for executive research purposes only.
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════
              TAB 6: SENTINEL — GLOBAL RISK INTELLIGENCE
              ═══════════════════════════════════════════ */}
          {activeTab === 'sentinel' && (
            <motion.div
              key="sentinel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.1em] flex items-center gap-2">
                  <Shield size={14} className="text-primary" />
                  Global Risk Intelligence — Geopolitical · Climate · Biological · Cyber
                </h3>
                <button
                  onClick={loadSentinel}
                  disabled={sentinelLoading}
                  className="px-3 py-1.5 rounded-lg text-[9px] font-bold text-zinc-500 hover:text-zinc-300 border border-zinc-700/30 hover:border-zinc-700/50 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={11} className={cn(sentinelLoading && 'animate-spin')} />
                  Refresh
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {(['all', 'geopolitical', 'climate', 'biological', 'cyber'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setSentinelFilter(f)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.12em] border transition-all',
                      sentinelFilter === f
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : 'bg-zinc-900/10 text-zinc-500 border-zinc-700/30 hover:text-zinc-300'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {sentinelLoading && <LoadingSkeleton rows={3} />}
              {sentinelError && !sentinelLoading && (
                <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-[10px] text-rose-200/80 flex items-start gap-2">
                  <X size={12} className="shrink-0 mt-0.5" />
                  <span>{sentinelError}</span>
                </div>
              )}

              {!sentinelLoading && threats.length > 0 && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <NexusStat label="Total Threats" value={threats.length} icon={Shield} accent="primary" />
                    <NexusStat label="Critical" value={threats.filter(t => t.severity === 'critical').length} icon={AlertTriangle} accent="rose" />
                    <NexusStat label="High" value={threats.filter(t => t.severity === 'high').length} icon={Activity} accent="amber" />
                    <NexusStat label="Active Regions" value={new Set(threats.map(t => t.region)).size} icon={Globe} accent="cyan" />
                  </div>

                  {/* World map */}
                  <div className="relative h-[400px] rounded-2xl border border-zinc-700/30 bg-zinc-950/60 overflow-hidden">
                    <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full opacity-40">
                      <path
                        d="M150,120 Q250,80 350,110 T650,100 T850,130 M100,250 Q300,220 500,250 T900,240 M120,380 Q320,350 520,380 T880,370"
                        fill="none"
                        stroke="#3f3f46"
                        strokeWidth="0.5"
                      />
                      {/* Simplified continents */}
                      <path
                        d="M180,100 Q220,60 280,80 Q320,100 300,160 Q280,220 220,240 Q160,220 150,160 Q140,120 180,100 Z"
                        fill="#27272a"
                        stroke="#3f3f46"
                        strokeWidth="0.5"
                      />
                      <path
                        d="M520,80 Q620,60 680,100 Q720,140 700,200 Q660,260 580,280 Q500,260 480,200 Q460,140 520,80 Z"
                        fill="#27272a"
                        stroke="#3f3f46"
                        strokeWidth="0.5"
                      />
                      <path
                        d="M480,280 Q560,260 620,300 Q660,340 640,400 Q600,460 520,480 Q440,460 420,400 Q400,340 480,280 Z"
                        fill="#27272a"
                        stroke="#3f3f46"
                        strokeWidth="0.5"
                      />
                      <path
                        d="M720,120 Q820,100 880,140 Q920,180 900,260 Q860,320 780,340 Q700,320 680,260 Q660,200 720,120 Z"
                        fill="#27272a"
                        stroke="#3f3f46"
                        strokeWidth="0.5"
                      />
                    </svg>
                    {filteredThreats.map(t => {
                        const x = ((t.lng + 180) / 360) * 100;
                        const y = ((90 - t.lat) / 180) * 100;
                        const color = t.severity === 'critical' ? '#EF4444' : t.severity === 'high' ? '#F59E0B' : t.severity === 'medium' ? '#3B82F6' : '#10B981';
                        return (
                          <motion.div
                            key={t.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute group"
                            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                            role="img"
                            aria-label={`${t.title} in ${t.region}`}
                          >
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: color }} />
                              <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: color }} />
                            </span>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 rounded-lg bg-zinc-950 border border-zinc-700/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              <p className="text-[10px] font-bold text-white">{t.title}</p>
                              <p className="text-[8px] text-zinc-400">{t.region} · {t.type}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>

                  <div className="grid lg:grid-cols-2 gap-4">
                    {filteredThreats.map(t => (
                        <motion.div
                          key={t.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h4 className="text-[11px] font-black text-white">{t.title}</h4>
                              <p className="text-[9px] text-zinc-500">{t.region} · {formatTimeAgo(t.timestamp)}</p>
                            </div>
                            <SeverityBadge severity={t.severity} />
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-relaxed">{t.description}</p>
                          <span className={cn(
                            'inline-block mt-2 text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md border',
                            t.type === 'geopolitical' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' :
                            t.type === 'climate' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' :
                            t.type === 'biological' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                            'bg-violet-500/10 text-violet-300 border-violet-500/20'
                          )}>
                            {t.type}
                          </span>
                        </motion.div>
                      ))}
                  </div>
                </>
              )}

              {!sentinelLoading && threats.length === 0 && !sentinelError && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Shield size={40} className="text-zinc-700 mb-4" />
                  <p className="text-[11px] text-zinc-500 font-bold">No threat data loaded</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════
              TAB 7: SUPPLY CHAIN TWIN
              ═══════════════════════════════════════════ */}
          {activeTab === 'supply-chain' && (
            <motion.div
              key="supply-chain"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.1em] flex items-center gap-2">
                  <Globe size={14} className="text-primary" />
                  Global Supply Chain Digital Twin
                </h3>
                <button
                  onClick={loadSupplyChain}
                  disabled={supplyLoading}
                  className="px-3 py-1.5 rounded-lg text-[9px] font-bold text-zinc-500 hover:text-zinc-300 border border-zinc-700/30 hover:border-zinc-700/50 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={11} className={cn(supplyLoading && 'animate-spin')} />
                  Refresh
                </button>
              </div>

              {supplyLoading && <LoadingSkeleton rows={3} />}
              {supplyError && !supplyLoading && (
                <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-[10px] text-rose-200/80 flex items-start gap-2">
                  <X size={12} className="shrink-0 mt-0.5" />
                  <span>{supplyError}</span>
                </div>
              )}

              {!supplyLoading && supplyNodes.length > 0 && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <NexusStat label="Active Nodes" value={supplyNodes.length} icon={Globe} accent="primary" />
                    <NexusStat label="Live Routes" value={supplyRoutes.length} icon={Activity} accent="cyan" />
                    <NexusStat label="Disrupted" value={supplyNodes.filter(n => n.status !== 'nominal').length} icon={AlertTriangle} accent="rose" />
                    <NexusStat label="Avg Throughput" value={`${Math.round(supplyNodes.reduce((s, n) => s + n.throughput, 0) / supplyNodes.length)}%`} icon={Target} accent="emerald" />
                  </div>

                  <div className="relative h-[400px] rounded-2xl border border-zinc-700/30 bg-zinc-950/60 overflow-hidden">
                    <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full">
                      {/* Routes */}
                      {supplyRoutes.map(r => {
                        const x1 = ((r.fromLng + 180) / 360) * 1000;
                        const y1 = ((90 - r.fromLat) / 180) * 500;
                        const x2 = ((r.toLng + 180) / 360) * 1000;
                        const y2 = ((90 - r.toLat) / 180) * 500;
                        const color = r.risk === 'critical' ? '#EF4444' : r.risk === 'high' ? '#F59E0B' : r.risk === 'medium' ? '#3B82F6' : '#10B981';
                        return (
                          <line
                            key={r.id}
                            x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke={color}
                            strokeWidth={r.risk === 'critical' ? 3 : 2}
                            strokeOpacity={0.5}
                            strokeDasharray="5,5"
                          >
                            <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite" />
                          </line>
                        );
                      })}
                      {/* Nodes */}
                      {supplyNodes.map(n => {
                        const x = ((n.lng + 180) / 360) * 1000;
                        const y = ((90 - n.lat) / 180) * 500;
                        const color = n.status === 'nominal' ? '#10B981' : n.status === 'congested' ? '#F59E0B' : n.status === 'disrupted' ? '#EF4444' : '#6B7280';
                        return (
                          <g key={n.id} role="img" aria-label={`${n.name} — ${n.status}`}>
                            <circle cx={x} cy={y} r="8" fill={color} opacity={0.8}>
                              <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                            </circle>
                            <text x={x} y={y + 20} fill="#a1a1aa" fontSize="10" textAnchor="middle">{n.name}</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl border border-zinc-700/30 bg-zinc-900/10">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-[0.1em] mb-3">Nodes</h4>
                      <div className="space-y-2">
                        {supplyNodes.map(n => (
                          <div key={n.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/40">
                            <div>
                              <p className="text-[10px] font-bold text-zinc-300">{n.name}</p>
                              <p className="text-[8px] text-zinc-500 uppercase">{n.type.replace('_', ' ')}</p>
                            </div>
                            <div className="text-right">
                              <span className={cn(
                                'text-[8px] font-black uppercase px-2 py-0.5 rounded-md border',
                                n.status === 'nominal' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                                n.status === 'congested' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                                n.status === 'disrupted' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' :
                                'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                              )}>
                                {n.status}
                              </span>
                              <p className="text-[8px] text-zinc-500 mt-1">{n.throughput}% throughput</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-zinc-700/30 bg-zinc-900/10">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-[0.1em] mb-3">Routes</h4>
                      <div className="space-y-2">
                        {supplyRoutes.map(r => (
                          <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/40">
                            <div>
                              <p className="text-[10px] font-bold text-zinc-300">{r.from} → {r.to}</p>
                              <p className="text-[8px] text-zinc-500">{r.activeShips} ships · {r.delayHours}h delay</p>
                            </div>
                            <span className={cn(
                              'text-[8px] font-black uppercase px-2 py-0.5 rounded-md border',
                              r.risk === 'critical' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' :
                              r.risk === 'high' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                              r.risk === 'medium' ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' :
                              'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            )}>
                              {r.risk}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!supplyLoading && supplyNodes.length === 0 && !supplyError && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Globe size={40} className="text-zinc-700 mb-4" />
                  <p className="text-[11px] text-zinc-500 font-bold">No supply chain data loaded</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════
              TAB 8: R&D RADAR
              ═══════════════════════════════════════════ */}
          {activeTab === 'rd-radar' && (
            <motion.div
              key="rd-radar"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.1em] flex items-center gap-2">
                  <BrainCircuit size={14} className="text-primary" />
                  R&D Radar — Patent & Emerging Technology Intelligence
                </h3>
                <button
                  onClick={loadRDRadar}
                  disabled={rdLoading}
                  className="px-3 py-1.5 rounded-lg text-[9px] font-bold text-zinc-500 hover:text-zinc-300 border border-zinc-700/30 hover:border-zinc-700/50 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={11} className={cn(rdLoading && 'animate-spin')} />
                  Refresh
                </button>
              </div>

              {rdLoading && <LoadingSkeleton rows={3} />}
              {rdError && !rdLoading && (
                <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-[10px] text-rose-200/80 flex items-start gap-2">
                  <X size={12} className="shrink-0 mt-0.5" />
                  <span>{rdError}</span>
                </div>
              )}

              {!rdLoading && patents.length > 0 && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <NexusStat label="Signals" value={patents.length} icon={BrainCircuit} accent="primary" />
                    <NexusStat label="Breakthrough" value={patents.filter(p => p.threatLevel === 'breakthrough').length} icon={Target} accent="emerald" />
                    <NexusStat label="High Threat" value={patents.filter(p => p.threatLevel === 'high').length} icon={AlertTriangle} accent="amber" />
                    <NexusStat label="Avg Maturity" value={`${Math.round(patents.reduce((s, p) => s + p.distance, 0) / patents.length)}%`} icon={Activity} accent="cyan" />
                  </div>

                  {/* Radar chart */}
                  <div className="relative h-[400px] rounded-2xl border border-zinc-700/30 bg-zinc-950/60 overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Concentric circles */}
                      {[25, 50, 75, 100].map(r => (
                        <div
                          key={r}
                          className="absolute rounded-full border border-zinc-700/30"
                          style={{ width: `${r}%`, height: `${r}%` }}
                        />
                      ))}
                      {/* Sweep */}
                      <motion.div
                        className="absolute w-full h-full rounded-full"
                        style={{
                          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(168,85,247,0.15) 60deg, transparent 120deg)',
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                      />
                      {/* Patent blips */}
                      {patents.map(p => {
                        const angleRad = (p.angle * Math.PI) / 180;
                        const radius = (p.distance / 100) * 45; // max 45% of container
                        const x = 50 + radius * Math.cos(angleRad);
                        const y = 50 + radius * Math.sin(angleRad);
                        const color = p.threatLevel === 'breakthrough' ? '#10B981' : p.threatLevel === 'high' ? '#F59E0B' : p.threatLevel === 'medium' ? '#3B82F6' : '#6B7280';
                        return (
                          <motion.div
                            key={p.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute group"
                            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                            role="img"
                            aria-label={`${p.tech} — ${p.source}`}
                          >
                            <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}80` }} />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 rounded-lg bg-zinc-950 border border-zinc-700/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              <p className="text-[10px] font-bold text-white">{p.tech}</p>
                              <p className="text-[8px] text-zinc-400">{p.source}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-4">
                    {patents.map(p => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl border border-zinc-700/30 bg-zinc-900/10 backdrop-blur-sm"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h4 className="text-[11px] font-black text-white">{p.tech}</h4>
                            <p className="text-[9px] text-zinc-500">{p.source} · {formatTimeAgo(p.filedAt)}</p>
                          </div>
                          <span className={cn(
                            'text-[8px] font-black uppercase px-2 py-0.5 rounded-md border',
                            p.threatLevel === 'breakthrough' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                            p.threatLevel === 'high' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                            p.threatLevel === 'medium' ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                          )}>
                            {p.threatLevel}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">{p.summary}</p>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[8px] uppercase tracking-[0.15em] text-zinc-500 font-bold mb-1">
                            <span>Maturity</span>
                            <span>{p.distance}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-zinc-800/40 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400" style={{ width: `${p.distance}%` }} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

              {!rdLoading && patents.length === 0 && !rdError && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <BrainCircuit size={40} className="text-zinc-700 mb-4" />
                  <p className="text-[11px] text-zinc-500 font-bold">No R&D signals loaded</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
};

export default AdminNexusPage;
