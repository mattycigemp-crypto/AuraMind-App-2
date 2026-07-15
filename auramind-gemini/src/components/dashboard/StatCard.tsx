import React from 'react';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.FC<{ className?: string; size?: number }>;
  variant?: 'default' | 'cosmic';
  trend?: { value: string; type: 'positive' | 'negative' | 'neutral' };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, variant = 'default', trend, className }) => {
  return (
    <div
      className={cn(
        'rounded-2xl border p-6 transition-shadow',
        variant === 'cosmic'
          ? 'border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent'
          : 'border-zinc-800 bg-zinc-900/40',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{title}</p>
          <p className="text-3xl font-black text-white">{value}</p>
          {subtitle && <p className="text-[10px] text-zinc-600 italic">{subtitle}</p>}
          {trend && (
            <p className={cn(
              'text-[10px] font-bold',
              trend.type === 'positive' && 'text-green-400',
              trend.type === 'negative' && 'text-red-400',
              trend.type === 'neutral' && 'text-zinc-400'
            )}>
              {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-zinc-900/5 border border-white/10">
            <Icon size={18} className="text-primary/70" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
