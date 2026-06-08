import React from 'react';

interface StreakCalendarHeatmapProps {
  data: { date: string; count: number }[]; // Array of { date: 'YYYY-MM-DD', count: number }
  size?: number; // size of each square
  gap?: number; // gap between squares
  className?: string;
}

const StreakCalendarHeatmap: React.FC<StreakCalendarHeatmapProps> = ({
  data,
  size = 12,
  gap = 2,
  className = ''
}) => {
  // Group data by month and year
  const grouped = data.reduce((acc, item) => {
    const date = new Date(item.date);
    const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push({ ...item, day: date.getDate(), weekday: date.getDay() });
    return acc;
  }, {} as Record<string, Array<{ date: string; count: number; day: number; weekday: number }>>);

  // Sort months chronologically
  const sortedMonths = Object.keys(grouped).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number);
    const [yearB, monthB] = b.split('-').map(Number);
    return yearA === yearB ? monthA - monthB : yearA - yearB;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {sortedMonths.map((monthKey) => {
        const [year, month] = monthKey.split('-').map(Number);
        const monthData = grouped[monthKey];

        // Create a 2D grid for the month (weeks x weekdays)
        const weeks: number[][] = Array.from({ length: 6 }, () => Array(7).fill(0)); // 6 weeks, 7 days

        monthData.forEach((item) => {
          const weekIndex = Math.floor((item.day - 1 + new Date(year, month - 1, 1).getDay()) / 7);
          const weekdayIndex = item.weekday; // 0 (Sunday) to 6 (Saturday)
          if (weekIndex >= 0 && weekIndex < 6) {
            weeks[weekIndex][weekdayIndex] = item.count;
          }
        });

        return (
          <div key={monthKey} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
                {new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}
              </h3>
              <p className="text-xs text-zinc-500">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="grid grid-cols-7 gap-[{gap}px]">
              {/* Weekday labels */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <div key={index} className="text-xs text-zinc-400">{day}</div>
              ))}
              {/* Days */}
              {weeks.flat().map((count, index) => {
                const intensity = count > 0 ? Math.min(4, Math.floor((count - 1) / 5) + 1) : 0; // 0-4 levels
                const bgColor = intensity === 0 ? 'bg-zinc-800/20' : 
                  intensity === 1 ? 'bg-primary/20' :
                  intensity === 2 ? 'bg-primary/40' :
                  intensity === 3 ? 'bg-primary/60' :
                  'bg-primary/80';
                
                return (
                  <div
                    key={index}
                    className={`w-[${size}px] h-[${size}px] rounded ${bgColor} transition-all duration-200 hover:scale-105`}
                    title={`${new Date(year, month - 1, 1).setDate(index + 1)}: ${count} cards`}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export { StreakCalendarHeatmap };


