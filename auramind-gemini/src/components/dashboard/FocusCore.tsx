import React from 'react';
import { cn } from '../../lib/utils';

interface FocusCoreProps {
  percentage?: number;
  status?: string;
  className?: string;
}

const FocusCore: React.FC<FocusCoreProps> = ({
  percentage = 88,
  status = "Optimization Required",
  className
}) => {
  return (
    <div className={cn(
      "glass-card p-6 border-l-2 border-l-primary",
      className
    )}>
      <p className="font-eyebrow text-eyebrow text-primary uppercase mb-4">
        Focus Core
      </p>
      
      {/* Circular Progress */}
      <div className="relative h-24 flex items-center justify-center">
        {/* Outer pulse ring */}
        <div className="absolute inset-0 border border-primary/10 rounded-full animate-pulse" />
        
        {/* Spinning ring */}
        <div className="w-16 h-16 rounded-full border-2 border-primary border-t-transparent animate-spin duration-[3000ms]" />
        
        {/* Center percentage */}
        <div className="absolute font-impact-lg text-xl text-primary">
          {percentage}%
        </div>
      </div>
      
      {/* Status text */}
      <p className="text-[10px] font-mono-label text-center mt-4 uppercase text-primary/60">
        {status}
      </p>
    </div>
  );
};

export default FocusCore;



