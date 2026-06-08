import React from 'react';

interface MetricTileProps {
  label: string;
  value: string | number;
  detail: string;
  accent?: string;
}

const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  detail,
  accent = 'text-arch-fg',
}) => (
  <div className="architectural-panel arch-scan-line p-10 group hover:border-arch-border-bold transition-all flex flex-col justify-between min-h-[220px]">
    <p className="text-arch-eyebrow mb-6">{label}</p>
    <div>
      <p className={`text-arch-metric ${accent}`}>{value}</p>
      <div className="mt-6 pt-6 border-t border-arch-border">
         <p className="text-[10px] text-arch-muted uppercase tracking-[0.2em] italic font-medium">{detail}</p>
      </div>
    </div>
  </div>
);

export default MetricTile;



