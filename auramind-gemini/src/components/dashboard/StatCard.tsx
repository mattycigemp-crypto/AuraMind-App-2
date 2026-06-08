import React from 'react';
import { cn } from '../../lib/utils';
import GlassCard from '../shared/GlassCard';

type CustomIcon = React.FC<{ className?: string; size?: number; fill?: string }>;

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: CustomIcon;
  variant?: 'default' | 'focus' | 'retention' | 'cosmic';
  trend?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  className
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'focus':
        return 'border-l-2 border-l-primary';
      case 'cosmic':
        return 'border-l-2 border-l-cosmic';
      default:
        return '';
    }
  };

  const getTrendColor = () => {
    switch (trend?.type) {
      case 'positive':
        return 'text-status-retention-high border-status-retention-high/30 bg-status-retention-high/5';
      case 'negative':
        return 'text-status-retention-low border-status-retention-low/30 bg-status-retention-low/5';
      default:
        return 'text-zinc-500 border-zinc-500/30 bg-zinc-500/5';
    }
  };

  return (
    <GlassCard 
      variant={variant === 'cosmic' ? 'cosmic' : 'default'}
      className={cn(
        "architectural-panel group overflow-hidden transition-all duration-500",
        getVariantClasses(),
        className
      )}
      size="none"
      hoverable
    >
      {/* Neural Scan Line Effect */}
      <div className="arch-scan-line absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
      
      {/* Grid overlay texture */}
      <div className="arch-grid-overlay absolute inset-0 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700" />

      <div className="p-6 flex flex-col justify-between h-full relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start">
          <p className="text-arch-eyebrow uppercase tracking-[0.25em] font-black">
            {title}
          </p>
          <div className="p-2 rounded-lg bg-primary/5 border border-primary/10 group-hover:border-primary/30 transition-all duration-500">
            <Icon className="text-primary/40 group-hover:text-primary transition-colors duration-500 w-4 h-4" />
          </div>
        </div>

        {/* Content */}
        <div className="mt-10">
          <span className="text-arch-metric text-gradient block leading-none">
            {value}
          </span>
          
          <div className="flex items-center gap-3 mt-4">
            {trend && (
              <p className={cn(
                "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 border rounded-full",
                getTrendColor()
              )}>
                {trend.value}
              </p>
            )}
            
            {subtitle && (
              <p className="text-[10px] text-arch-muted uppercase tracking-[0.15em] font-medium italic">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default StatCard;



