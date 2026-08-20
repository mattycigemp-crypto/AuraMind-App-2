import * as React from 'react';
import { cn } from '@/lib/utils';
import { LottiePlayer } from '../lottie/LottiePlayer';

export type IllustrationName =
  | 'empty-decks'
  | 'empty-cards'
  | 'empty-leagues'
  | 'empty-notifications'
  | 'no-search-results'
  | 'locked-feature';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  primary?: boolean;
}

export interface EmptyStateProps {
  illustration?: IllustrationName;
  /** Optional Lottie override — sets the JSON URL/path instead of using the built-in SVG. */
  lottie?: React.ComponentProps<typeof LottiePlayer>['animationUrl'];
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  badges?: string[];
  className?: string;
}

// ─── Inline SVG illustrations (defined first so the ILLUSTRATIONS map can reference them) ───
// Hand-tuned to fit AuraMind's violet-on-charcoal aesthetic; no external
// fonts/images so the empty state never blank-fails offline.

const IllustrationShell: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <svg
    viewBox="0 0 200 160"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('w-full h-full', className)}
    aria-hidden
  >
    {children}
  </svg>
);

const DeckIllustration = () => (
  <IllustrationShell>
    <defs>
      <linearGradient id="deckGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#4C1D95" stopOpacity="0.85" />
      </linearGradient>
      <radialGradient id="deckGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="100" cy="80" r="70" fill="url(#deckGlow)" />
    <rect x="50" y="40" width="80" height="100" rx="10" fill="#1A1A24" stroke="#3A3A4F" />
    <rect x="60" y="35" width="80" height="100" rx="10" fill="#1A1A24" stroke="#3A3A4F" />
    <rect x="70" y="30" width="80" height="100" rx="10" fill="url(#deckGrad)" stroke="#8B5CF6" />
    <rect x="80" y="50" width="60" height="2" rx="1" fill="#F0EFFE" opacity="0.8" />
    <rect x="80" y="62" width="40" height="2" rx="1" fill="#F0EFFE" opacity="0.5" />
    <rect x="80" y="80" width="60" height="2" rx="1" fill="#F0EFFE" opacity="0.8" />
    <rect x="80" y="92" width="48" height="2" rx="1" fill="#F0EFFE" opacity="0.5" />
    <circle cx="155" cy="50" r="14" fill="#7C3AED" opacity="0.85" />
    <path
      d="M148 50 l5 5 l8 -10"
      stroke="#fff"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IllustrationShell>
);

const CardIllustration = () => (
  <IllustrationShell>
    <defs>
      <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#0E7490" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="135" rx="70" ry="6" fill="#2A2A3A" opacity="0.4" />
    <g transform="rotate(-8 100 90)">
      <rect x="40" y="55" width="120" height="70" rx="10" fill="#1A1A24" stroke="#3A3A4F" />
      <rect x="50" y="65" width="60" height="2" rx="1" fill="#06B6D4" opacity="0.7" />
      <rect x="50" y="75" width="40" height="2" rx="1" fill="#7A7A96" />
    </g>
    <g transform="rotate(8 100 80)">
      <rect x="40" y="45" width="120" height="70" rx="10" fill="url(#cardGrad)" stroke="#06B6D4" />
      <rect x="50" y="60" width="80" height="2" rx="1" fill="#fff" opacity="0.85" />
      <rect x="50" y="72" width="60" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="50" y="84" width="50" height="2" rx="1" fill="#fff" opacity="0.4" />
    </g>
  </IllustrationShell>
);

const LeagueIllustration = () => (
  <IllustrationShell>
    <defs>
      <linearGradient id="podium1" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#FACC15" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="138" rx="65" ry="5" fill="#2A2A3A" opacity="0.4" />
    <rect x="35" y="85" width="38" height="50" rx="4" fill="#3A3A4F" />
    <rect x="80" y="55" width="38" height="80" rx="4" fill="url(#podium1)" />
    <rect x="125" y="100" width="38" height="35" rx="4" fill="#7C3AED" />
    <text x="54" y="105" textAnchor="middle" fill="#F0EFFE" fontSize="14" fontWeight="700">
      2
    </text>
    <text x="99" y="75" textAnchor="middle" fill="#111118" fontSize="14" fontWeight="700">
      1
    </text>
    <text x="144" y="120" textAnchor="middle" fill="#F0EFFE" fontSize="14" fontWeight="700">
      3
    </text>
    <circle cx="99" cy="42" r="10" fill="#FACC15" />
  </IllustrationShell>
);

const BellIllustration = () => (
  <IllustrationShell>
    <defs>
      <linearGradient id="bellGrad" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#4C1D95" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="80" r="60" fill="#1F1235" opacity="0.6" />
    <path
      d="M80 95 c0 -22 8 -36 20 -42 c12 6 20 20 20 42 c0 6 4 8 6 12 l-52 0 c2 -4 6 -6 6 -12 z"
      fill="url(#bellGrad)"
      stroke="#A78BFA"
      strokeWidth="1.5"
    />
    <path
      d="M88 116 q12 8 24 0"
      stroke="#A78BFA"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="100" cy="105" r="6" fill="#FACC15" />
    <circle cx="135" cy="40" r="3" fill="#FACC15">
      <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="65" cy="50" r="2.5" fill="#A78BFA">
      <animate
        attributeName="opacity"
        values="1;0.2;1"
        dur="2s"
        begin="0.4s"
        repeatCount="indefinite"
      />
    </circle>
  </IllustrationShell>
);

const SearchIllustration = () => (
  <IllustrationShell>
    <defs>
      <radialGradient id="searchHalo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#2A2A3A" stopOpacity="0" />
        <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.2" />
      </radialGradient>
    </defs>
    <circle cx="90" cy="70" r="55" fill="url(#searchHalo)" />
    <circle cx="90" cy="65" r="32" fill="none" stroke="#7A7A96" strokeWidth="6" />
    <line x1="116" y1="90" x2="145" y2="120" stroke="#7A7A96" strokeWidth="6" strokeLinecap="round" />
    <line x1="78" y1="55" x2="100" y2="55" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
    <line
      x1="78"
      y1="65"
      x2="95"
      y2="65"
      stroke="#7C3AED"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.6"
    />
  </IllustrationShell>
);

const LockIllustration = () => (
  <IllustrationShell>
    <defs>
      <linearGradient id="lockGrad" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#F472B6" />
        <stop offset="100%" stopColor="#9F1239" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="80" r="60" fill="#3A1A2A" opacity="0.3" />
    <rect x="65" y="80" width="70" height="50" rx="8" fill="url(#lockGrad)" />
    <path
      d="M80 80 v-12 a20 20 0 0 1 40 0 v12"
      stroke="#FBCFE8"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="100" cy="100" r="6" fill="#111118" />
    <rect x="98" y="100" width="4" height="14" fill="#111118" />
    <text x="100" y="150" textAnchor="middle" fill="#7A7A96" fontSize="11">
      AURA+ REQUIRED
    </text>
  </IllustrationShell>
);

// ─── Registry: maps the public illustration name → component. Hoisted
//    into a map so callers can switch on a single string prop. ─────────
const ILLUSTRATIONS: Record<IllustrationName, React.ReactNode> = {
  'empty-decks': <DeckIllustration />,
  'empty-cards': <CardIllustration />,
  'empty-leagues': <LeagueIllustration />,
  'empty-notifications': <BellIllustration />,
  'no-search-results': <SearchIllustration />,
  'locked-feature': <LockIllustration />,
};

/**
 * EmptyState — reusable empty / no-results surface used by Marketplace,
 * Decks list, Leagues, Notifications, etc.
 *
 * Falls back to a hand-tuned inline SVG illustration by name so the
 * component never blank-fails offline or during a CDN outage. If a
 * Lottie URL is passed, it substitutes for the SVG (useful for branded
 * marketing surfaces).
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  illustration = 'empty-decks',
  lottie,
  eyebrow,
  title,
  description,
  actions,
  badges,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-12 rounded-2xl',
        'border border-dashed border-[#2A2A3A] bg-[#0B0B12]/60',
        'gap-4',
        className,
      )}
    >
      <div className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
        {lottie ? (
          <LottiePlayer animationUrl={lottie} loop autoplay className="w-full h-full" />
        ) : (
          ILLUSTRATIONS[illustration]
        )}
      </div>

      {eyebrow && (
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#7A7A96]">
          {eyebrow}
        </span>
      )}
      <h3 className="text-lg md:text-xl font-semibold text-[#F0EFFE] max-w-md">{title}</h3>
      {description && (
        <p className="text-xs md:text-sm text-[#9090A8] max-w-md leading-relaxed">
          {description}
        </p>
      )}

      {badges && badges.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 mt-1">
          {badges.map((b) => (
            <span
              key={b}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#7C3AED]/10 text-[#8B5CF6] border border-[#7C3AED]/20"
            >
              {b}
            </span>
          ))}
        </div>
      )}

      {actions && actions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {actions.map((a) => (
            <a
              key={a.label}
              href={a.href ?? '#'}
              onClick={(e) => {
                if (a.onClick) {
                  if (!a.href) e.preventDefault();
                  a.onClick();
                }
              }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors',
                a.primary
                  ? 'bg-[#7C3AED] text-white hover:bg-[#6D28D9]'
                  : 'bg-[#111118] text-[#F0EFFE] border border-[#2A2A3A] hover:border-[#3A3A4F]',
              )}
            >
              {a.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
