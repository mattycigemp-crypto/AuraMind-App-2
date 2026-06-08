import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface MasteryRadarChartProps {
  data: {
    subject: string;
    score: number;
  }[];
  width?: number;
  height?: number;
  className?: string;
}

const MasteryRadarChart: React.FC<MasteryRadarChartProps> = ({
  data,
  width = 300,
  height = 300,
  className = ''
}) => {
  // Ensure data is sorted by subject for consistent radar points
  const chartData = [...data].sort((a, b) => a.subject.localeCompare(b.subject));

  return (
    <div className={`relative w-[${width}px] h-[${height}px] mx-auto ${className}`}>
      <RadarChart
        width={width}
        height={height}
        data={chartData}
        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
      >
        <PolarGrid className="text-zinc-700" />
        <PolarAngleAxis
          dataKey="subject"
          className="text-zinc-500 text-sm"
          domain={['auto', 'auto']}
        >
          <text
            x={0}
            y={-10}
            dy=".35em"
            textAnchor="middle"
            fill="currentFontSize"
            stroke="none"
          >
            {''}
          </text>
        </PolarAngleAxis>
        <PolarRadiusAxis
          domain={[0, 100]}
          tickCount={5}
          className="text-zinc-500 text-xs"
          stroke="zinc-600"
        />
        <Radar
          dataKey="score"
          stroke="primary"
          strokeWidth={2}
          fill="primary/20"
          fillOpacity={0.6}
          dot={{ 
            r: 4, 
            strokeWidth: 2, 
            stroke: 'primary', 
            fillOpacity: 1 
          }}
        >
          {/* Animated entrance */}
          <animateTransform
            attributeName="transform"
            type="scale"
            from="0"
            to="1"
            begin="0s"
            dur="0.8s"
            fill="freeze"
          />
        </Radar>
      </RadarChart>
    </div>
  );
};

export { MasteryRadarChart };


