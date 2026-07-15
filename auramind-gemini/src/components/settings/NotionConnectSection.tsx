import React, { useState } from 'react';
import { useNotionIntegration } from '../../hooks/useNotionIntegration';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { useDashboardWorkspace } from '../../contexts/DashboardWorkspaceContext';
import {
  CheckIcon as Check,
  XIcon as X,
  EyeIcon as Eye,
  EyeOffIcon as EyeOff,
  ExternalLinkIcon as ExternalLink,
  Loader2Icon as Loader2,
  AlertCircleIcon as AlertCircle,
} from '../icons/CustomIcons';

// Inline Notion logo (clean monochrome glyph on white square — recognizable across themes).
const NotionLogo = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M5.7 2.97c-.45.45-.66 1.05-.66 1.65v14.76c0 .6.21 1.2.66 1.65.45.45 1.05.66 1.65.66h12.6c.6 0 1.2-.21 1.65-.66.45-.45.66-1.05.66-1.65V4.62c0-.6-.21-1.2-.66-1.65-.45-.45-1.05-.66-1.65-.66H7.35c-.6 0-1.2.21-1.65.66Zm2.31 4.62h8.04l3.39 4.4V7.6h-1.92v8.04l-3.39-4.4H8.01V16.5h1.92V9.7l4.65 6.8H18l-3.21-4.4 3.21-4.5H14.4l-3.21 4.32V7.59H8.01Z" />
  </svg>
);

function formatRelative(timestamp: number | undefined): string {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

export const NotionConnectSection: React.FC = () => {
  const workspace = useDashboardWorkspace();
  const notionEnabled = useFeatureFlag(
    'notion_sync_v2',
    workspace?.user?.id,
    workspace?.user?.role,
    workspace?.user?.plan,
    workspace?.user?.isAdmin,
  );
  const notion = useNotionIntegration();
  const [tokenInput, setTokenInput] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [showToken, setShowToken] = useState(false);

  const resetForm = () => {
    setTokenInput('');
    setWorkspaceName('');
    setShowToken(false);
  };

  const handleConnect = async () => {
    const ok = await notion.connect({ accessToken: tokenInput, workspaceName });
    if (ok) resetForm();
  };

  if (!notionEnabled) return null;

  return (
    <section
      aria-label="Notion integration"
      className="rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/60"
    >
      <header className="px-4 py-2.5 border-b border-zinc-800/60 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Integrations</span>
        <a
          href="https://www.notion.so/my-integrations"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-violet-400 transition-colors"
        >
          <ExternalLink size={10} />
          Get a Notion token
        </a>
      </header>

      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-black shrink-0 shadow-lg shadow-black/20"
            aria-hidden="true"
          >
            <NotionLogo className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">Notion</span>
              {notion.status === 'connected' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected
                </span>
              )}
              {notion.status === 'disconnected' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-500 border border-zinc-700/60">
                  Not connected
                </span>
              )}
              {notion.status === 'loading' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-500 border border-zinc-700/60">
                  <Loader2 size={10} className="animate-spin" />
                  Checking…
                </span>
              )}
            </div>
            {notion.status === 'connected' && notion.meta?.workspaceName && (
              <p className="text-xs text-zinc-400 mt-1 truncate">Workspace: {notion.meta.workspaceName}</p>
            )}
            {notion.status === 'connected' && !notion.meta?.workspaceName && (
              <p className="text-xs text-zinc-500 mt-1">Pages and databases from your connected workspace will sync on demand.</p>
            )}
            {notion.status === 'disconnected' && (
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Import pages and databases from your Notion workspace to turn them into flashcards and quizzes.
              </p>
            )}
          </div>
        </div>

        {notion.status === 'connected' ? (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => notion.disconnect()}
              disabled={notion.submitting}
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 hover:border-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {notion.submitting && <Loader2 size={12} className="animate-spin" />}
              Disconnect
            </button>
            <p className="text-[11px] text-zinc-600">
              {notion.meta?.connectedAt
                ? `Connected ${formatRelative(notion.meta.connectedAt)}`
                : 'Token stored with your account'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label
                htmlFor="notion-workspace-name"
                className="block text-[11px] font-medium text-zinc-400 mb-1.5"
              >
                Workspace name <span className="text-zinc-600 font-normal">(optional)</span>
              </label>
              <input
                id="notion-workspace-name"
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. CS 101 Notes"
                autoComplete="off"
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="notion-token"
                className="block text-[11px] font-medium text-zinc-400 mb-1.5"
              >
                Internal Integration Token
              </label>
              <div className="relative">
                <input
                  id="notion-token"
                  type={showToken ? 'text' : 'password'}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="secret_…"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full px-3 py-2 pr-10 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm font-mono placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
                  aria-label={showToken ? 'Hide token' : 'Show token'}
                  tabIndex={-1}
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-zinc-600 leading-relaxed">
                Create one at{' '}
                <a
                  href="https://www.notion.so/my-integrations"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-zinc-400 hover:text-violet-400 underline underline-offset-2"
                >
                  notion.so/my-integrations
                </a>
                , share pages with the integration, then paste the secret here.
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={notion.submitting || !tokenInput.trim()}
              className="w-full px-3 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {notion.submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Connecting…
                </>
              ) : (
                'Connect Notion'
              )}
            </button>
          </div>
        )}

        {(notion.error || notion.message) && (
          <div
            role={notion.error ? 'alert' : 'status'}
            className={`text-xs px-3 py-2 rounded-lg flex items-start gap-2 ${
              notion.error
                ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
            }`}
          >
            {notion.error ? (
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
            ) : (
              <Check size={14} className="shrink-0 mt-0.5" />
            )}
            <span className="break-words flex-1">{notion.error || notion.message}</span>
            <button
              onClick={notion.dismiss}
              className="opacity-60 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default NotionConnectSection;
