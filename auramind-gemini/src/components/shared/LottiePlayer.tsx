import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

interface LottiePlayerProps {
  /** Path to the Lottie JSON, e.g. `/lottie/feature-source-to-deck.json`. */
  src: string;
  className?: string;
  autoplay?: boolean;
  loop?: boolean;
}

/**
 * Lazy-fetches a Lottie JSON from `src` and renders it via lottie-react.
 *
 * Behavior contract:
 *   - File present  → renders the animation.
 *   - File missing  → returns an empty placeholder div with the same
 *                     className so layout dimensions are preserved, so the
 *                     page does not pop when an asset is added/removed.
 *   - Network error → same fall-through as missing file.
 *
 * Designers/devs can drop a new JSON into `public/lottie/` and reference
 * it from any layout component without touching this component.
 */
const LottiePlayer: React.FC<LottiePlayerProps> = ({
  src,
  className,
  autoplay = true,
  loop = true,
}) => {
  const [data, setData] = useState<unknown | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);

    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      // Silently swallow — the placeholder div renders instead.
      .catch(() => { /* keep data=null */ });

    return () => { cancelled = true; };
  }, [src]);

  if (!data) return <div className={className} aria-hidden />;

  return (
    <Lottie
      animationData={data as object}
      autoplay={autoplay}
      loop={loop}
      className={className}
    />
  );
};

export default LottiePlayer;
