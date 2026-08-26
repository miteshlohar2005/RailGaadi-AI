'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Mountain, Loader2, MapPin, AlertTriangle } from 'lucide-react';
import { TerrainFeature } from '@/lib/overpass';
import { TerrainCard } from './TerrainCard';

interface TerrainPanelProps {
  trainId: string;
}

export function TerrainPanel({ trainId }: TerrainPanelProps) {
  const [features, setFeatures] = useState<TerrainFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/terrain?trainId=${trainId}`, { signal: controller.signal });
        if (!res.ok) {
          setError(true);
          return;
        }
        const json = await res.json();
        if (json.success && json.data) {
          setFeatures(json.data);
        } else {
          setError(true);
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return;
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();

    return () => controller.abort();
  }, [trainId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 font-bold text-foreground">
        <Mountain className="h-5 w-5 text-emerald-400" />
        <span className="text-base">Terrain & Points of Interest</span>
        <span className="ml-auto text-[10px] font-normal text-muted-foreground/70">via Overpass API</span>
      </div>

      {loading && (
        <div className="glass-card flex items-center gap-3 rounded-2xl p-5 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-rail-blue" />
          <span>Fetching bridges, rivers & terrain features along route...</span>
        </div>
      )}

      {error && !loading && (
        <div className="glass-card flex items-center gap-3 rounded-2xl p-5 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span>Terrain data temporarily unavailable. Try again later.</span>
        </div>
      )}

      {!loading && !error && features.length === 0 && (
        <div className="glass-card flex items-center gap-3 rounded-2xl p-5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>No terrain features found along this route.</span>
        </div>
      )}

      {!loading && features.length > 0 && (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-3"
          style={{ scrollbarWidth: 'thin' }}
        >
          {features.map((f, i) => (
            <TerrainCard key={`${f.type}-${f.name}-${i}`} feature={f} />
          ))}
        </div>
      )}
    </div>
  );
}
