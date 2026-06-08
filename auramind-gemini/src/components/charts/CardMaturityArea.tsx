import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CardMaturityData {
  date: string;
  new: number;
  young: number;
  mature: number;
}

interface CardMaturityAreaProps {
  data: CardMaturityData[];
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-primary/20 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs font-bold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

const CardMaturityArea: React.FC<CardMaturityAreaProps> = ({ data, className }) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(39 39 42 / 0.3)" />
          <XAxis
            dataKey="date"
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
          <Area
            type="monotone"
            dataKey="mature"
            name="Mature"
            stackId="1"
            stroke="#22c55e"
            fill="#22c55e"
            fillOpacity={0.3}
          />
          <Area
            type="monotone"
            dataKey="young"
            name="Young"
            stackId="1"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.3}
          />
          <Area
            type="monotone"
            dataKey="new"
            name="New"
            stackId="1"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export { CardMaturityArea };
export type { CardMaturityData };



