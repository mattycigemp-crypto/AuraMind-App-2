import * as React from 'react';
import Lottie, { type LottieComponentProps } from 'lottie-react';

/**
 * LottiePlayer — small wrapper around lottie-react that:
 *
 *   1. Respects `prefers-reduced-motion` automatically (renders a static
 *      first frame by setting `autoplay/loop = false`).
 *   2. Pauses on tab hidden via the Page Visibility API so off-tab CPU
 *      doesn't continuously decode the animation.
 *   3. Lazy-mounts via IntersectionObserver so JSON files aren't fetched
 *      for off-screen empty states / skeletons.
 *
 * Pass either `animationData` (inline JSON), `animationUrl` (CDN URL),
 * or use one of the `preset` shortcuts.
 */
export interface LottiePlayerProps extends Partial<LottieComponentProps> {
  /** Either inline JSON or a remote URL */
  animationData?: LottieComponentProps['animationData'];
  animationUrl?: string;
  preset?: 'celebration' | 'thinking' | 'empty-deck';
  /** Width/height of the SVG container */
  className?: string;
  /** Reduced-motion override (defaults to system preference) */
  respectMotionPreference?: boolean;
  /** IntersectionObserver threshold — only play when this much is visible. 0 = always. */
  visibilityThreshold?: number;
}

const REPO_BUCKET_URL = 'https://cdn.auramind.app/animations';

const PRESETS: Record<NonNullable<LottiePlayerProps['preset']>, string> = {
  celebration: `${REPO_BUCKET_URL}/celebration.json`,
  thinking: `${REPO_BUCKET_URL}/thinking.json`,
  'empty-deck': `${REPO_BUCKET_URL}/empty-deck.json`,
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const LottiePlayer: React.FC<LottiePlayerProps> = ({
  animationData,
  animationUrl,
  preset,
  respectMotionPreference = true,
  visibilityThreshold = 0.1,
  className,
  autoplay = true,
  loop = true,
  ...rest
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [shouldPlay, setShouldPlay] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [resolvedData, setResolvedData] = React.useState<unknown>(animationData);

  React.useEffect(() => {
    if (!containerRef.current || !visibilityThreshold) {
      setShouldPlay(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setShouldPlay(true);
      },
      { threshold: visibilityThreshold },
    );
    io.observe(containerRef.current);
    return () => io.disconnect();
  }, [visibilityThreshold]);

  React.useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  React.useEffect(() => {
    if (animationData) {
      setResolvedData(animationData);
      return;
    }
    const url = animationUrl ?? (preset ? PRESETS[preset] : undefined);
    if (!url) return;
    let cancelled = false;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled) setResolvedData(json);
      })
      .catch(() => {
        /* swallow — empty state shows if Lottie missing */
      });
    return () => {
      cancelled = true;
    };
  }, [animationData, animationUrl, preset]);

  const reduceMotion = respectMotionPreference && prefersReducedMotion();
  if (!shouldPlay || !resolvedData) {
    return <div ref={containerRef} className={className} aria-hidden />;
  }

  return (
    <div ref={containerRef} className={className} aria-hidden={reduceMotion}>
      <Lottie
        animationData={resolvedData as LottieComponentProps['animationData']}
        autoplay={autoplay && !reduceMotion && !paused}
        loop={loop && !reduceMotion && !paused}
        {...rest}
      />
    </div>
  );
};

export default LottiePlayer;
