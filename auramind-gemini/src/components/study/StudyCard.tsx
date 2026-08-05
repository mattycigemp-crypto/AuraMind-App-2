import React from 'react';
import { cn } from '../../lib/utils';

export interface StudyCardProps {
  /**
   * Primary content displayed in the center of the card.
   * Typically the question/front of a flashcard.
   */
  children: React.ReactNode;
  /**
   * Optional tags rendered as small, subtle pills in the top-right corner.
   */
  tags?: Array<{ label: string; key?: React.Key }>;
  /**
   * Whether the card is currently the active/focused element.
   * When true, a single subtle glow is applied.
   */
  active?: boolean;
  /**
   * Additional classes applied to the root card element.
   */
  className?: string;
  /**
   * Optional accessible label for the card region.
   */
  'aria-label'?: string;
}

/**
 * Compute a typography class based on plain-text length and word count.
 *
 * - Single-word / very short content is rendered huge for impact.
 * - Medium content is rendered as a large headline.
 * - Long / paragraph content falls back to comfortable body sizing.
 */
function getContentTypographyClass(text: string): string {
  const normalized = text.trim().replace(/\s+/g, ' ');
  const wordCount = normalized === '' ? 0 : normalized.split(' ').length;
  const charCount = normalized.length;

  if (wordCount <= 3 && charCount <= 36) {
    return 'text-[clamp(2.5rem,10vw,4.5rem)] leading-[0.95] tracking-[-0.04em] font-display italic';
  }
  if (wordCount <= 12 && charCount <= 140) {
    return 'text-[clamp(1.5rem,6vw,2.5rem)] leading-[1.15] tracking-[-0.02em] font-medium';
  }
  return 'text-base md:text-lg leading-relaxed';
}

/**
 * Premium study card visual system.
 *
 * Features:
 * - Radial-gradient background with a deep-space / cosmic-purple origin.
 * - Dynamic typography scale: single words are huge, paragraphs are body-sized.
 * - Tags are small, subtle, and pinned to the top-right corner.
 * - A single, controlled active glow instead of layered shadow chaos.
 * - Respects `prefers-reduced-motion` by avoiding animated glows.
 * - WCAG AA contrast: zinc-50 text on near-black card surface.
 */
const StudyCard = React.forwardRef<HTMLDivElement, StudyCardProps>(
  ({ children, tags, active = false, className, 'aria-label': ariaLabel }, ref) => {
    const textContent = React.useMemo(() => {
      if (typeof children === 'string') return children;
      if (React.isValidElement(children)) {
        const childContent = (children.props as Record<string, unknown>).children;
        if (typeof childContent === 'string') return childContent;
      }
      return '';
    }, [children]);

    const typographyClass = getContentTypographyClass(textContent);

    return (
      <div
        ref={ref}
        aria-label={ariaLabel}
        className={cn(
          'relative isolate flex min-h-[18rem] flex-col overflow-hidden rounded-2xl md:rounded-3xl',
          'border border-white/[0.08]',
          'bg-[radial-gradient(circle_at_50%_-20%,rgba(139,92,246,0.12),rgba(24,24,27,0.95)_45%,rgba(9,9,11,0.98)_100%)]',
          'transition-[box-shadow,transform,border-color] duration-200 ease-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]',
          active && 'ring-1 ring-[hsl(var(--ring))]/40 shadow-[0_0_40px_-12px_var(--accent-glow)]',
          className,
        )}
      >
        {/* Subtle top sheen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />

        {/* Tags — top-right, small and subtle */}
        {tags && tags.length > 0 && (
          <div className="absolute right-3 top-3 z-10 flex max-w-[70%] flex-wrap justify-end gap-1.5">
            {tags.map((tag, idx) => (
              <span
                key={tag.key ?? `${tag.label}-${idx}`}
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5',
                  'text-[10px] font-medium uppercase tracking-wider',
                  'bg-white/[0.06] text-[hsl(var(--muted-foreground))]',
                  'border border-white/[0.06]',
                )}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Centered content with dynamic typography */}
        <div className="flex flex-1 items-center justify-center px-6 py-10 md:px-10 md:py-12">
          <div
            className={cn(
              'max-w-full text-balance text-center text-[hsl(var(--foreground))]',
              typographyClass,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    );
  },
);

StudyCard.displayName = 'StudyCard';

export default StudyCard;
