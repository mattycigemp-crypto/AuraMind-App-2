/**
 * WeightComparisonTable — renders the per-weight comparison between FSRS
 * defaults and the user's tuned weights. Each row shows the weight's
 * semantic purpose (so the table is readable, not just a list of numbers),
 * the FSRSpaper role, the default value, the user's value, and a delta.
 *
 * Used by /dashboard/personalization; nowhere else right now.
 */
import React from 'react';

// FSRS v5 weight meanings (paraphrased from open-spaced-repetition/fsrs4anki).
// Index -> [purpose short, purpose long]
const WEIGHT_PURPOSE: Record<number, [string, string]> = {
  0: ['Init Stab', 'Initial stability for a fresh card'],
  1: ['Init Diff', 'Initial difficulty baseline'],
  2: ['Mean Diff', 'Mean difficulty across the deck'],
  3: ['Diff Cap', 'Difficulty ceiling'],
  4: ['Diff Stem', 'Difficulty mean-reversion target'],
  5: ['Diff Step', 'Difficulty delta per recall grade'],
  6: ['Lapse Step', 'Difficulty delta after lapse'],
  7: ['Revert W', 'Difficulty mean-reversion weight'],
  8: ['Stab Exp', 'Stability growth exponent base'],
  9: ['Stab Grade', 'Stability growth grade exponent'],
  10: ['Stab S', 'Stability growth S exponent'],
  11: ['Stab Diff', 'Stability difficulty coefficient'],
  12: ['Stab D Off', 'Stability difficulty offset'],
  13: ['Stab G Off', 'Stability grade offset'],
  14: ['Curl Fact', 'Forgetting curve factor'],
  15: ['Lapse Base', 'Lapse stability base'],
  16: ['Lapse Diff', 'Lapse stability difficulty exp'],
  17: ['Lapse S', 'Lapse stability S exponent'],
  18: ['Lapse Bonus', 'Lapse stability bonus factor'],
  19: ['Lapse D Bonus', 'Lapse stability D bonus exp'],
};

interface WeightComparisonTableProps {
  defaultWeights: number[];
  userWeights: number[];
}

export const WeightComparisonTable: React.FC<WeightComparisonTableProps> = ({
  defaultWeights,
  userWeights,
}) => {
  // Length sanity check before iter.
  if (
    defaultWeights.length !== 20
    || userWeights.length !== 20
  ) {
    return (
      <div className="p-4 rounded-lg bg-[#111118] border border-[#2A2A3A] text-xs text-[#7A7A96]">
        Weight vectors aren't aligned — defaults have {defaultWeights.length}, user has {userWeights.length}.
      </div>
    );
  }

  return (
    <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl overflow-hidden">
      <div className="grid grid-cols-[64px_1fr_88px_88px_72px] gap-2 px-4 py-2 border-b border-[#2A2A3A] text-[10px] uppercase tracking-widest font-bold text-[#7A7A96]">
        <span>w#</span>
        <span>Purpose</span>
        <span className="text-right">Default</span>
        <span className="text-right">Yours</span>
        <span className="text-right">Δ</span>
      </div>
      <div className="divide-y divide-[#2A2A3A]/40">
        {defaultWeights.map((def, i) => {
          const user = userWeights[i];
          const delta = user - def;
          const deltaPct = def !== 0 ? (delta / Math.abs(def)) * 100 : 0;
          const [short] = WEIGHT_PURPOSE[i] ?? [`w${i}`, `Weight ${i}`];
          return (
            <div
              key={i}
              className="grid grid-cols-[64px_1fr_88px_88px_72px] gap-2 px-4 py-1.5 items-center text-xs font-mono tabular-nums"
            >
              <span className="text-[#7A7A96]">{`W${String(i).padStart(2, '0')}`}</span>
              <span className="text-[#F0EFFE] font-sans" title={WEIGHT_PURPOSE[i]?.[1] ?? ''}>
                {short}
              </span>
              <span className="text-right text-[#7A7A96]">{def.toFixed(4)}</span>
              <span className="text-right text-[#F0EFFE]">{user.toFixed(4)}</span>
              <DeltaBadge delta={delta} pct={deltaPct} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

function DeltaBadge({ delta, pct }: { delta: number; pct: number }) {
  if (Math.abs(delta) < 0.0001) {
    return <span className="text-right text-[#7A7A96] text-[10px]">—</span>;
  }
  const positive = delta > 0;
  const tone = positive ? 'text-emerald-400' : 'text-rose-400';
  return (
    <span className={`text-right ${tone} text-[10px]`}>
      {positive ? '+' : ''}{delta.toFixed(4)}
      <span className="ml-1 opacity-70">({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)</span>
    </span>
  );
}

export default WeightComparisonTable;
