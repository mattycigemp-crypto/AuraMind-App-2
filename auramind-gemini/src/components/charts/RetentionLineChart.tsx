import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RetentionLineChartProps {
  data: { date: string; retention: number }[];
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-primary/20 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-bold text-primary">{payload[0].value}% retention</p>
    </div>
  );
};

const RetentionLineChart: React.FC<RetentionLineChartProps> = ({ data, className }) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(39 39 42 / 0.3)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#71717a', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'rgb(39 39 42 / 0.3)' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#71717a', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="retention"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export { RetentionLineChart };



