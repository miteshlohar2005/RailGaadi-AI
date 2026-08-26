import React from 'react';
import { TerrainFeature } from '@/lib/overpass';
import { cn } from '@/utils/cn';

interface TerrainCardProps {
  feature: TerrainFeature;
}

const TYPE_CONFIG = {
  bridge: { emoji: '🌉', label: 'Bridge', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  tunnel: { emoji: '🚇', label: 'Tunnel', color: 'bg-muted text-muted-foreground border-border' },
  river: { emoji: '🌊', label: 'River', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  mountain: { emoji: '⛰️', label: 'Peak', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  tourist: { emoji: '🏛️', label: 'Attraction', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  city: { emoji: '🏙️', label: 'City', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

export function TerrainCard({ feature }: TerrainCardProps) {
  const cfg = TYPE_CONFIG[feature.type] || TYPE_CONFIG.tourist;

  return (
    <div className="glass-card flex-shrink-0 w-44 rounded-2xl p-4 space-y-2 transition-all hover:-translate-y-0.5">
      <div className="text-2xl">{cfg.emoji}</div>
      <div>
        <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', cfg.color)}>
          {cfg.label}
        </span>
        <p className="mt-1.5 text-sm font-bold text-foreground leading-tight line-clamp-2">
          {feature.name}
        </p>
        {feature.distanceKm !== undefined && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            ~{feature.distanceKm} km from origin
          </p>
        )}
      </div>
    </div>
  );
}
