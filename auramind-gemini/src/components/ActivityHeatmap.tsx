import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * ActivityHeatmap visualizes the user's study activity over the last 30 days.
 * In a real backend, this would fetch distinct daily study sessions. 
 * For this MVP, we simulate it based on the user's streak and some randomness,
 * combined with cards that were reviewed today.
 */
interface ActivityHeatmapProps {
  streak: number;
  studiedToday: number;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ streak, studiedToday }) => {
  const days = useMemo(() => {
    const pastDays = 30; // Last 30 days
    const arr = [];
    
    for (let i = pastDays - 1; i >= 0; i--) {
      // Is today?
      if (i === 0) {
        arr.push({ date: new Date(), intensity: studiedToday > 0 ? Math.min(4, Math.ceil(studiedToday / 10)) : 0 });
        continue;
      }

      // Past days
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      // If within streak, they have activity
      let intensity = 0;
      if (i <= streak) {
        // Random intensity between 1 and 4 for simulated streak days
        intensity = Math.floor(Math.random() * 4) + 1;
      }

      arr.push({ date: d, intensity });
    }
    return arr;
  }, [streak, studiedToday]);

  const getColor = (intensity: number) => {
    switch(intensity) {
      case 0: return 'bg-black/5 border-black/5 dark:bg-white/[0.02] dark:border-white/5';
      case 1: return 'bg-emerald-500/20 border-emerald-500/10';
      case 2: return 'bg-emerald-500/40 border-emerald-500/20';
      case 3: return 'bg-emerald-500/60 border-emerald-500/30';
      case 4: return 'bg-emerald-500/80 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
      default: return 'bg-black/5 border-black/5 dark:bg-white/[0.02] dark:border-white/5';
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/40 dark:text-white/40">30-Day Deep Scan</p>
      </div>
      <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1.5 sm:gap-2">
        {days.map((day, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.02 }}
            title={`${day.date.toDateString()}: ${day.intensity > 0 ? 'Active' : 'No Activity'}`}
            className={`aspect-square rounded-sm border ${getColor(day.intensity)}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ActivityHeatmap;
