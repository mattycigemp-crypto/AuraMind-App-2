import React, { useCallback, useEffect, useState } from 'react';
import {
  PRODUCT_NAME,
  PARENT_COMPANY_NAME,
  PARENT_COMPANY_LEGAL,
  PARENT_BRAND_TAGLINE,
  PARENT_BRAND_SLUG,
  LEGAL_COPYRIGHT_LINE,
  CONTACT_EMAIL,
  VENDOR_URL,
} from '../../lib/branding';
import { VectorMark } from '../../components/brand/CogniWordmark';

/**
 * AboutPage — the canonical "About AuraMind" panel.
 *
 * Lives at /about. Visible from:
 *   - the sidebar Settings row's "About AuraMind" entry;
 *   - Tauri desktop's native Help → About AuraMind menu (renders this
 *     same component in the About subwindow once round-19 wires the
 *     menu API);
 *   - mobile Settings → scroll-to-bottom → "About" link.
 *
 * Shows: product line, VectorMark glyph, parent-company byline,
 * build version, build channel, copyright, contact mailto, vendor URL,
 * and a "Check for Updates" button (Tauri only — falls back to the
 * download page on web).
 *
 * The page is intentionally read-only. It never opens external links
 * without a confirm — Tauri apps launched from a desktop App Store
 * listing need to be predictable when reviewers evaluate the binary.
 */

interface AboutPageProps {
  /** Override app version when running in tests (e.g. "2.0.0-test"). */
  versionOverride?: string;
}

type CheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'uptodate'; currentVersion: string; latestVersion: string; releaseNotes?: string }
  | { status: 'available'; currentVersion: string; latestVersion: string; releaseNotes?: string }
  | { status: 'error'; message: string };

const AboutPage: React.FC<AboutPageProps> = ({ versionOverride }) => {
  const [version, setVersion] = useState<string>(versionOverride ?? '2.0.0');
  const [channel, setChannel] = useState<string>('production');
  const [checkState, setCheckState] = useState<CheckState>({ status: 'idle' });

  // Try to read real version/build from the Tauri runtime if present.
  // Web builds keep the placeholder 2.0.0 hard-coded.
  useEffect(() => {
    if (versionOverride) return;
    const w = typeof window !== 'undefined' ? (window as any) : undefined;
    const maybeTauri = w?.__TAURI_INTERNALS__ || w?.__TAURI__;
    if (!maybeTauri) return;
    let cancelled = false;
    (async () => {
      try {
        const [{ getVersion }, { getName }] = await Promise.all([
          import('../../lib/nativeShim'),
          import('../../lib/nativeShim'),
        ]);
        const v = await getVersion();
        const n = await getName();
        if (!cancelled) {
          setVersion(v);
          if (n) setChannel('tauri');
        }
      } catch {
        /* ignore — web build, no-op */
      }
    })();
    return () => { cancelled = true; };
  }, [versionOverride]);

  const runCheck = useCallback(async () => {
    setCheckState({ status: 'checking' });

    const w = (typeof window !== 'undefined' ? (window as any) : undefined);
    if (!w?.__TAURI_INTERNALS__ && !w?.__TAURI__) {
      setCheckState({
        status: 'error',
        message: 'Update checks run inside the AuraMind desktop app. On web, visit the Download page (https://auramind.app/download) for the latest release.',
      });
      return;
    }

    try {
      // Lazy-import so the updater isn't bundled into the web build.
      const { check } = await import('../../lib/nativeShim');
      const result = await check();
      if (!result) {
        setCheckState({
          status: 'uptodate',
          currentVersion: version,
          latestVersion:  version,
        });
        return;
      }
      const latestVersion = result.version ?? 'unknown';
      const isNewer = compareSemver(latestVersion, version) > 0;
      setCheckState({
        status: isNewer ? 'available' : 'uptodate',
        currentVersion: version,
        latestVersion,
        releaseNotes: result.body ?? undefined,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Update check failed with an unknown error.';
      setCheckState({ status: 'error', message });
    }
  }, [version]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white antialiased px-6 py-12 sm:py-20">
      <div className="max-w-3xl mx-auto">
        {/* Top-brand mark row */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/30 via-violet-400/15 to-transparent border border-violet-400/30 flex items-center justify-center text-violet-200 shadow-[0_0_40px_rgba(167,139,250,0.15)]">
            <VectorMark size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{PRODUCT_NAME}</h1>
            <p className="text-[12px] uppercase tracking-[0.18em] text-violet-300/80 mt-1">
              v{version} · {channel}
            </p>
          </div>
        </div>

        <hr className="border-[#2A2A3A] my-8" />

        {/* Parent-line */}
        <div className="space-y-3">
          <p className="text-[15px] text-[#C5C5D8] leading-relaxed">
            <span className="text-white font-medium">{PRODUCT_NAME}</span> is a flagship study
            platform from <span className="text-white font-semibold">{PARENT_COMPANY_LEGAL}</span>{' '}
            — <span className="text-violet-300/90">{PARENT_BRAND_TAGLINE}</span>.
          </p>
          <p className="text-[13px] text-[#7A7A93] leading-relaxed">
            {PRODUCT_NAME} is the first product in the broader {PARENT_COMPANY_NAME} family.
            Future releases will share the same reliability commitments, the same privacy
            defaults, and the same attention to your time. Visit{' '}
            <a
              href={VENDOR_URL}
              className="text-violet-300 hover:text-violet-200 underline-offset-2 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {VENDOR_URL}
            </a>{' '}
            to follow the family roadmap.
          </p>
        </div>

        <hr className="border-[#2A2A3A] my-8" />

        {/* Update check */}
        <section className="bg-[#101018] border border-[#2A2A3A] rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h2 className="text-[15px] font-semibold text-white">Updates</h2>
              <p className="text-[12px] text-[#7A7A93] mt-1">
                Latest release ships via the {PARENT_COMPANY_NAME} updater; check now from the
                desktop app to be notified in-place.
              </p>

              {checkState.status === 'checking' && (
                <p className="text-[13px] text-violet-300 mt-3 animate-pulse">
                  Reaching out to releases.cogniavect.app…
                </p>
              )}
              {checkState.status === 'uptodate' && (
                <p className="text-[13px] text-emerald-300 mt-3">
                  You are on the latest release ({checkState.currentVersion}).
                </p>
              )}
              {checkState.status === 'available' && (
                <div className="mt-3 space-y-2">
                  <p className="text-[13px] text-amber-300">
                    Update available: v{checkState.latestVersion} (you have v{checkState.currentVersion}).
                  </p>
                  {checkState.releaseNotes && (
                    <pre className="text-[11px] text-[#9090A8] whitespace-pre-wrap font-mono bg-[#09090b] border border-[#2A2A3A] rounded-md p-3 max-h-48 overflow-auto">
                      {checkState.releaseNotes}
                    </pre>
                  )}
                </div>
              )}
              {checkState.status === 'error' && (
                <p className="text-[13px] text-rose-300 mt-3">{checkState.message}</p>
              )}
              {checkState.status === 'idle' && (
                <p className="text-[12px] text-[#7A7A96] mt-3">
                  Tap the check button on the right.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={runCheck}
              disabled={checkState.status === 'checking'}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-violet-400/50 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 hover:border-violet-300/80 transition disabled:opacity-50 disabled:cursor-wait text-[13px] font-medium"
            >
              <VectorMark size={14} className="text-violet-200" />
              {checkState.status === 'checking' ? 'Checking…' : 'Check for updates'}
            </button>
          </div>
        </section>

        <hr className="border-[#2A2A3A] my-8" />

        {/* Footer copy */}
        <section className="text-[12px] text-[#7A7A93] space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#7A7A96]">/{PARENT_BRAND_SLUG}</span>
            <span className="text-[#3A3A4F]">·</span>
            <span>{LEGAL_COPYRIGHT_LINE}</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="hover:text-violet-300 underline-offset-2 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            <span className="text-[#3A3A4F]">·</span>
            <a
              href={VENDOR_URL}
              className="hover:text-violet-300 underline-offset-2 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {VENDOR_URL}
            </a>
          </div>
          <p className="text-[#3A3A4F]">
            {PRODUCT_NAME} is a trademark of {PARENT_COMPANY_LEGAL}.
          </p>
        </section>
      </div>
    </div>
  );
};

function compareSemver(a: string, b: string): number {
  const ap = (a || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  const bp = (b || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
    const d = (ap[i] || 0) - (bp[i] || 0);
    if (d) return d;
  }
  return 0;
}

export default AboutPage;
