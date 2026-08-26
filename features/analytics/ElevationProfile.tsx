'use client';

import React from 'react';
import { Mountain, TrendingUp } from 'lucide-react';
import { ElevationPoint } from '@/lib/opentopography';

interface ElevationProfileProps {
  data: ElevationPoint[];
  highestElevationM: number;
}

export function ElevationProfile({ data, highestElevationM }: ElevationProfileProps) {
  if (!data || data.length === 0) return null;

  const maxElev = Math.max(...data.map((d) => d.elevationM), 100);
  const minElev = Math.min(...data.map((d) => d.elevationM), 0);
  const range = maxElev - minElev || 1;

  const svgWidth = 600;
  const svgHeight = 160;
  const pointsString = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * svgWidth;
      const y = svgHeight - ((d.elevationM - minElev) / range) * (svgHeight - 40) - 20;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPath = `M 0,${svgHeight} L ${pointsString} L ${svgWidth},${svgHeight} Z`;

  return (
    <div className="glass-card rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-foreground">
          <Mountain className="h-5 w-5 text-emerald-400" />
          <span className="text-base">Elevation Profile</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Peak: {highestElevationM}m</span>
        </div>
      </div>

      <div className="relative h-44 w-full pt-4">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="elevationGradPremium" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill="url(#elevationGradPremium)" />

          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsString}
          />
        </svg>
      </div>

      <div className="flex justify-between text-[11px] font-mono font-semibold text-muted-foreground">
        <span>0 km (Origin)</span>
        <span>{data[data.length - 1]?.distanceKm} km (Destination)</span>
      </div>
    </div>
  );
}
