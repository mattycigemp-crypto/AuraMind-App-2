import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FutureDueChartProps {
  data: { period: string; count: number; fill: string }[];
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-primary/20 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-bold text-zinc-900 dark:text-white">{payload[0].value} cards</p>
    </div>
  );
};

const FutureDueChart: React.FC<FutureDueChartProps> = ({ data, className }) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(39 39 42 / 0.3)" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fill: '#71717a', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'rgb(39 39 42 / 0.3)' }}
          />
          <YAxis
            tick={{ fill: '#71717a', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
            {data.map((entry, index) => (
              <rect key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export { FutureDueChart };



