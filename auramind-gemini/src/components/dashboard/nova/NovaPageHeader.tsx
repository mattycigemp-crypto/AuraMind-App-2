import React from 'react';
import { FadeUp } from './motion';
import { PulsingDot } from './icons';

interface NovaPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  accent?: 'violet' | 'amber' | 'cyan' | 'fuchsia' | 'rose' | 'emerald';
}

const ACCENT: Record<NonNullable<NovaPageHeaderProps['accent']>, string> = {
  violet: 'text-violet-200/80',
  amber: 'text-amber-200/80',
  cyan: 'text-cyan-200/80',
  fuchsia: 'text-fuchsia-200/80',
  rose: 'text-rose-200/80',
  emerald: 'text-emerald-200/80',
};

const DOT: Record<NonNullable<NovaPageHeaderProps['accent']>, string> = {
  violet: '#A78BFA',
  amber: '#FCD34D',
  cyan: '#67E8F9',
  fuchsia: '#F0ABFC',
  rose: '#FDA4AF',
  emerald: '#6EE7B7',
};

export function NovaPageHeader({
  eyebrow = 'AuraMind',
  title,
  description,
  actions,
  accent = 'violet',
}: NovaPageHeaderProps) {
  return (
    <FadeUp y={8}>
      <header className="nova-card-elevated nova-sheen relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/85">
                <PulsingDot size={5} color={DOT[accent]} />
                {eyebrow}
              </span>
            </div>
            <p className={`nova-label ${ACCENT[accent]}`}>Command</p>
            <h1 className="nova-display mt-1 text-3xl text-white sm:text-4xl lg:text-[2.75rem] leading-[1.05]">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-300/85">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </header>
    </FadeUp>
  );
}
