import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface ButtonDistributionProps {
  data: { name: string; value: number; color: string }[];
  className?: string;
}

const RADIAN = Math.PI / 180;

const CustomLabel = ({ cx, cy, midAngle, _innerRadius, outerRadius, percent }: any) => {
  const radius = outerRadius + 25;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text
      x={x}
      y={y}
      fill="#a1a1aa"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-[10px] font-bold"
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, color } = payload[0].payload;
  return (
    <div className="bg-zinc-900 border border-primary/20 rounded-xl px-4 py-3 shadow-xl">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-bold text-zinc-900 dark:text-white">{name}</span>
      </div>
      <p className="text-sm text-zinc-400">{value} ratings</p>
    </div>
  );
};

const ButtonDistribution: React.FC<ButtonDistributionProps> = ({ data, className }) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            label={CustomLabel}
            labelLine={{ stroke: '#3f3f46', strokeWidth: 1 }}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export { ButtonDistribution };



