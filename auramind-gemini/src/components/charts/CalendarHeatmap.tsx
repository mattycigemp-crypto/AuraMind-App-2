import React, { useMemo } from 'react';

interface CalendarHeatmapProps {
  data: { date: string; count: number }[];
  weeks?: number;
  className?: string;
}

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ data, weeks = 13, className }) => {
  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - weeks * 7);

    const dateMap = new Map(data.map((d) => [d.date, d.count]));
    const days: { date: string; count: number; dayOfWeek: number }[] = [];

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      days.push({ date: dateStr, count: dateMap.get(dateStr) || 0, dayOfWeek: d.getDay() });
    }

    const weeksArr: { date: string; count: number }[][] = [];
    for (let w = 0; w < weeks; w++) {
      weeksArr.push(days.slice(w * 7, (w + 1) * 7));
    }
    return weeksArr;
  }, [data, weeks]);

  const getIntensity = (count: number): string => {
    if (count === 0) return 'bg-zinc-800/20';
    if (count <= 3) return 'bg-primary/20';
    if (count <= 10) return 'bg-primary/40';
    if (count <= 25) return 'bg-primary/60';
    return 'bg-primary/80';
  };

  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - weeks * 7);

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 7)) {
      const month = d.toLocaleString('default', { month: 'short' });
      const weekIndex = Math.floor((d.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (labels.length === 0 || labels[labels.length - 1].label !== month) {
        labels.push({ label: month, weekIndex });
      }
    }
    return labels;
  }, [weeks]);

  return (
    <div className={className}>
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 pt-5 mr-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-[8px] text-zinc-500 uppercase tracking-wider h-3 leading-3">
              {day[0]}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-1 mb-1">
            {monthLabels.map((m, i) => (
              <div
                key={i}
                className="text-[8px] text-zinc-500 uppercase tracking-wider"
                style={{ marginLeft: i === 0 ? 0 : `${(m.weekIndex - (monthLabels[i - 1]?.weekIndex || 0)) * 12 - 12}px` }}
              >
                {m.label}
              </div>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {heatmapData.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <div
                    key={day.date}
                    className={`w-3 h-3 rounded-sm ${getIntensity(day.count)} transition-colors`}
                    title={`${day.date}: ${day.count} cards`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[8px] text-zinc-600">Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className={`w-3 h-3 rounded-sm ${getIntensity(level * 10)}`} />
        ))}
        <span className="text-[8px] text-zinc-600">More</span>
      </div>
    </div>
  );
};

export { CalendarHeatmap };



