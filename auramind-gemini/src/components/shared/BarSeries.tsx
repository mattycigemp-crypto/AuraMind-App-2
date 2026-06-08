import React from 'react';

interface BarSeriesProps {
  values: number[];
  labels: string[];
}

const BarSeries: React.FC<BarSeriesProps> = ({ values, labels }) => (
  <div className="flex items-end gap-4 h-56 px-4">
    {values.map((value, index) => (
      <div key={`${labels[index]}-${value}`} className="flex-1 flex flex-col items-center gap-6">
        <div className="w-full bg-arch-fg relative overflow-hidden" style={{ height: `${Math.max(12, value)}%` }}>
           <div className="absolute inset-0 bg-arch-bg/10 animate-pulse" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-arch-muted">{labels[index]}</span>
      </div>
    ))}
  </div>
);

export default BarSeries;



