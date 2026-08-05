import { motion, useMotionValue } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../utils/reducedMotion';

export type ProfAuraVariant = 'rest' | 'thinking' | 'streaming' | 'badge';
export type ProfAuraMood = 'default' | 'encouraging' | 'focused';

export interface ProfAuraProps {
  variant?: ProfAuraVariant;
  size?: number;
  className?: string;
  /**
   * Mood modulates the eye colour + halo palette + orbiter orbit radius.
   * Pick this from app state (e.g., 'encouraging' when the user is on a
   * streak, 'focused' after a long break). Defaults to 'default', which
   * is the brand-neutral state.
   */
  mood?: ProfAuraMood;
  /**
   * Live mic volume in 0..1 (or undefined). When present, the orbit stars
   * expand outward in proportion to the input level AND the eye brightens
   * so dictation visibly "speaks" through the avatar.
   */
  audioLevel?: number;
}

// Head profile silhouette — clean continuous bezier outline so the mark
// reads as "thinking tutor" at a glance instead of "constellation of stars".
// Drawn looking right; sized to live in viewBox 0..100.
const HEAD_PATH =
  'M 45 15 C 55 15 63 20 67 28 C 69 32 69 36 67 39 ' +
  'C 72 40 76 46 78 51 C 79 53 78 55 76 56 ' +
  'C 73 57 71 58 72 61 C 73 63 74 65 73 66 ' +
  'C 71 67 69 67 70 69 C 71 71 72 74 69 77 ' +
  'C 65 82 55 85 40 85';

// Mouth accent — dignified closed-mouth hint. Badges skip the mouth.
const MOUTH_PATH = 'M 68 67 Q 71.5 67.6 74 66.5';

// Thinking dot trio near temple/forehead (only in 'thinking' / 'focused')
const THINKING_DOTS = [
  { cx: 44, cy: 28, r: 1.0, delay: 0.00 },
  { cx: 49, cy: 24, r: 1.4, delay: 0.15 },
  { cx: 54, cy: 27, r: 0.9, delay: 0.30 },
];

// Four ambient orbiter satellites distributed around the silhouette.
const ORBITERS = [
  { cx: 14, cy: 60, r: 1.1, dur: 14, phase: 0.0 },
  { cx: 86, cy: 30, r: 0.9, dur: 12, phase: 1.5 },
  { cx: 88, cy: 70, r: 1.0, dur: 16, phase: 3.0 },
  { cx: 12, cy: 26, r: 0.8, dur: 11, phase: 4.5 },
];

// Mood palettes — used to recolour the halo gradient and eye in real time.
// NOT a free 0..1 number; ProfAura accepts a 5-value sentinel and we map
// it back to a mood tagged colour below.
const PALETTES: Record<ProfAuraMood, { halo: [string, string, string]; eye: string; stroke: string }> = {
  default:     { halo: ['#7C3AED', '#EC4899', '#06B6D4'], eye: '#F0EFFE', stroke: '#C4B5FD' },
  encouraging: { halo: ['#F59E0B', '#F472B6', '#FBBF24'], eye: '#FEF3C7', stroke: '#FDE68A' },
  focused:     { halo: ['#3B82F6', '#06B6D4', '#6366F1'], eye: '#DBEAFE', stroke: '#BFDBFE' },
};

// Eye position in viewBox units. Mouse parallax is clamped so the pupil
// stays inside the lid ellipse instead of sliding across the head.
const EYE_BASE_X = 62;
const EYE_BASE_Y = 41;
const EYE_LID_RX = 4.5;
const EYE_LID_RY = 3.5;
const PUPIL_MAX_OFFSET = 3.5; // SVG units. Anything bigger breaks the illusion.

export default function ProfAura({
  variant = 'rest',
  size = 28,
  className = '',
  mood = 'default',
  audioLevel,
}: ProfAuraProps) {
  const reduced = useReducedMotion();
  const isBadge = variant === 'badge';
  const isThinking = variant === 'thinking';
  const isStreaming = variant === 'streaming';
  const animate = reduced ? false : !isBadge;

  // Variant-specific timing knobs.
  const breathDur = isThinking ? 4.8 : isStreaming ? 2.4 : 5.0;
  const blinkDur = isThinking ? 6.0 : isStreaming ? 4.0 : 4.5;
  const haloSpinDur = isThinking ? 90 : 360; // 4°/s default, 4× faster when thinking

  const palette = PALETTES[mood];

  // Audio reactivity modulates orbiter displacement + eye brightness.
  const audioGain = typeof audioLevel === 'number' ? Math.max(0, Math.min(1, audioLevel)) : 0;
  const audioOrbitBoost = 1 + audioGain * 0.6;
  const audioEyeBoost = 1 + audioGain * 0.5;

  // ─── Parallax: head group tilts toward cursor; pupil tracks cursor ───
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  // Head tilt: ±2/-1.5 SVG units. Disabled for streaming (jitter mid-conv)
  // and badges (no meaningful surface).
  const trackingEnabled = !reduced && !isStreaming && !isBadge && size >= 28;
  // Pupil tracking: SAME trigger conditions as head tilt. The pupil adds
  // ±PUPIL_MAX_OFFSET on top of base position so it appears to look AT
  // the cursor while the head subtly faces the cursor.
  const pupilX = useMotionValue(0);
  const pupilY = useMotionValue(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || !trackingEnabled) {
      mouseX.set(0); mouseY.set(0);
      pupilX.set(0); pupilY.set(0);
      return;
    }
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dxPct = (e.clientX - cx) / rect.width;   // [-0.5, +0.5]
      const dyPct = (e.clientY - cy) / rect.height;  // [-0.5, +0.5]
      mouseX.set(dxPct * size * 0.06);
      mouseY.set(dyPct * size * 0.04);
      // Clamp pupil offset so the iris never crosses the eyelid.
      pupilX.set(Math.max(-PUPIL_MAX_OFFSET, Math.min(PUPIL_MAX_OFFSET, dxPct * 7)));
      pupilY.set(Math.max(-PUPIL_MAX_OFFSET, Math.min(PUPIL_MAX_OFFSET, dyPct * 7)));
    };
    const onLeave = () => {
      mouseX.set(0); mouseY.set(0);
      pupilX.set(0); pupilY.set(0);
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [trackingEnabled, size, mouseX, mouseY, pupilX, pupilY]);

  // Reduced-motion override: render a still composition instead of loops.
  const breathStatic = reduced;
  const eyeLidStaticRy = isStreaming ? 0.4 : isThinking ? 2.0 : EYE_LID_RY;

  return (
    <div
      ref={wrapperRef}
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="overflow-visible"
        style={{ display: 'block' }}
      >
        <defs>
          {/* Stroke gradient — multi-stop linear so the silhouette has a
              sense of light falling from upper-left. Mood shifts the stops. */}
          <linearGradient id="pa-line" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={palette.halo[0]} stopOpacity="0.95" />
            <stop offset="55%"  stopColor={palette.halo[1]} stopOpacity="0.95" />
            <stop offset="100%" stopColor={palette.halo[2]} stopOpacity="0.95" />
          </linearGradient>

          {/* Halo — radial fade. Centres burn brighter while thinking. */}
          <radialGradient id="pa-aura" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={palette.halo[0]}
                  stopOpacity={isStreaming ? 0.45 : isThinking ? 0.32 : 0.25} />
            <stop offset="40%"  stopColor={palette.halo[1]}
                  stopOpacity={isStreaming ? 0.25 : isThinking ? 0.18 : 0.15} />
            <stop offset="70%"  stopColor={palette.halo[2]}
                  stopOpacity={isStreaming ? 0.15 : isThinking ? 0.10 : 0.08} />
            <stop offset="100%" stopColor={palette.halo[2]} stopOpacity="0" />
          </radialGradient>

          {/* Ink-blot glow filter — stacked feGaussianBlur to mimic the
              Perplexity / Notion "ink" feel instead of harsh drop-shadow. */}
          <filter id="pa-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="b2" />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Halo + breathing aura */}
        <motion.circle
          cx="50" cy="50"
          r={isBadge ? 48 : 46}
          fill="url(#pa-aura)"
          animate={
            animate && !breathStatic
              ? { scale: [1, 1.04, 1], opacity: [0.85, 1, 0.85] }
              : { scale: 1, opacity: 0.95 }
          }
          transition={
            animate && !breathStatic
              ? { duration: breathDur, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0 }
          }
          style={{ transformOrigin: '50px 50px' }}
        />

        {/* Rotating halo mesh — slow 1°/s by default. Accelerates to 4°/s
            in thinking mode. We implement this with a full-circle stroke
            conic-mask using two blurred arcs that race each other. Kept
            here as a tiny SVG-level rotation to stay SMIL-free and
            framer-motion-driven end-to-end. */}
        {!isBadge && animate && (
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: haloSpinDur, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '50px 50px' }}
          >
            <circle
              cx="50" cy="50" r={42 + audioGain * 6}
              fill="none"
              stroke={palette.halo[1]}
              strokeOpacity={0.18 + audioGain * 0.2}
              strokeWidth="0.8"
              strokeDasharray="0.5 6"
            />
          </motion.g>
        )}

        {/* Head silhouette — parallaxes toward cursor; stream/variants
            disable parallax so the silhouette never jitters mid-thought. */}
        <motion.g
          style={{ x: mouseX, y: mouseY, transformOrigin: '50px 50px' }}
        >
          <motion.path
            d={HEAD_PATH}
            fill="none"
            stroke="url(#pa-line)"
            strokeWidth={isBadge ? 1.1 : 1.4}
            strokeLinejoin="round"
            strokeLinecap="round"
            filter={animate && !breathStatic ? 'url(#pa-glow)' : undefined}
            animate={
              animate && !breathStatic
                ? {
                    strokeOpacity: isStreaming
                      ? [0.55, 1, 0.55]
                      : [0.65, 1, 0.65],
                  }
                : { strokeOpacity: 0.85 }
            }
            transition={
              animate && !breathStatic
                ? {
                    duration: isStreaming ? 2.4 : breathDur,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
                : { duration: 0 }
            }
          />

          {/* Mouth accent — dignified closed-mouth hint (no smiley). */}
          {!isBadge && (
            <path
              d={MOUTH_PATH}
              fill="none"
              stroke="url(#pa-line)"
              strokeWidth="0.75"
              strokeLinecap="round"
              opacity={0.55}
            />
          )}

          {/* Eye — pupil tracks cursor; lid blinks regularly. */}
          {!isBadge && (
            <>
              {/* Lid ellipse — ry animates to 0.5 on blink */}
              <motion.ellipse
                cx={EYE_BASE_X}
                cy={EYE_BASE_Y}
                rx={EYE_LID_RX}
                ry={eyeLidStaticRy}
                fill="none"
                stroke={palette.stroke}
                strokeOpacity={0.35}
                strokeWidth="0.7"
                initial={{ ry: eyeLidStaticRy }}
                animate={
                  animate && !breathStatic
                    ? {
                        ry: isStreaming
                          ? [0.4, 0.4, EYE_LID_RY, 0.4, 0.4]
                          : isThinking
                          ? [2.0, 2.0, 0.4, 2.0, 2.0]
                          : [EYE_LID_RY, EYE_LID_RY, 0.5, EYE_LID_RY, EYE_LID_RY],
                      }
                    : { ry: eyeLidStaticRy }
                }
                transition={
                  animate && !breathStatic
                    ? { duration: blinkDur, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0 }
                }
              />
              {/* Pupil — small filled circle that follows mouse motion
                  values (clamped to ±PUPIL_MAX_OFFSET) plus an audio
                  brightness boost. */}
              <motion.circle
                cx={EYE_BASE_X}
                cy={EYE_BASE_Y}
                r={2}
                style={{ x: pupilX, y: pupilY, transformOrigin: '0 0' }}
                fill={palette.eye}
                initial={{ r: 2, opacity: 1 }}
                animate={
                  animate
                    ? {
                        opacity: [0.8, 1, 0.8],
                        r: audioGain > 0.3 ? 2.4 : 2,
                      }
                    : { opacity: 1, r: 2 }
                }
                transition={
                  animate
                    ? {
                        duration: 2.4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }
                    : { duration: 0 }
                }
              />
              {/* Audio-bright halo around the eye (additional glow when
                  user is dictating).  Discards gracefully when audioGain=0. */}
              {audioGain > 0.3 && (
                <circle
                  cx={EYE_BASE_X}
                  cy={EYE_BASE_Y}
                  r={3 * audioEyeBoost}
                  fill={palette.eye}
                  opacity={0.35}
                />
              )}
            </>
          )}

          {/* Thinking dots trio — only in thinking mode OR focused mood. */}
          {(isThinking || mood === 'focused') && !isBadge && animate && (
            <g>
              {THINKING_DOTS.map((d, i) => (
                <motion.circle
                  key={`td-${i}`}
                  cx={d.cx}
                  cy={d.cy}
                  r={d.r}
                  fill={palette.stroke}
                  animate={{ y: [0, -3.2, 0] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: d.delay,
                  }}
                />
              ))}
            </g>
          )}
        </motion.g>

        {/* Orbiters — move in slow arcs around the silhouette. */}
        {!isBadge && ORBITERS.map((o, i) => {
          const baseDisp = 3.5 * audioOrbitBoost;
          const orbitPhaseRad = (o.phase / 12) * Math.PI * 2;
          return (
            <motion.g
              key={`orbit-${i}`}
              style={{ transformBox: 'fill-box', transformOrigin: `${o.cx}px ${o.cy}px` }}
              animate={
                animate && !breathStatic
                  ? {
                      x: [0, Math.cos(orbitPhaseRad) * baseDisp, 0],
                      y: [0, Math.sin(orbitPhaseRad) * baseDisp, 0],
                      opacity: [0.5, 1, 0.5],
                    }
                  : { x: 0, y: 0, opacity: 0.65 }
              }
              transition={
                animate && !breathStatic
                  ? {
                      duration: o.dur,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }
                  : { duration: 0 }
              }
            >
              <circle cx={o.cx} cy={o.cy} r={o.r} fill={palette.stroke} />
              <circle cx={o.cx} cy={o.cy} r={o.r * 2.4} fill={palette.stroke} opacity={0.18} />
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
