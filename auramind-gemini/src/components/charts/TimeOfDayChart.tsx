import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimeOfDayChartProps {
  data: { hour: string; sessions: number }[];
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-primary/20 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-bold text-primary">{payload[0].value} sessions</p>
    </div>
  );
};

const TimeOfDayChart: React.FC<TimeOfDayChartProps> = ({ data, className }) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(39 39 42 / 0.3)" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fill: '#71717a', fontSize: 9 }}
            tickLine={false}
            axisLine={{ stroke: 'rgb(39 39 42 / 0.3)' }}
            interval={1}
          />
          <YAxis
            tick={{ fill: '#71717a', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="sessions"
            fill="#8B5CF6"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            opacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export { TimeOfDayChart };



