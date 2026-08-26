'use client';

import React, { useEffect, useState, useRef } from 'react';
import { BarChart3, Activity, Route, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { LiveJourney } from '@/types/train';
import { ElevationProfile } from './ElevationProfile';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { formatDelay } from '@/utils/format';
import { cn } from '@/utils/cn';

interface AnalyticsData {
  trainId: string;
  totalDistanceKm: number;
  distanceCoveredKm: number;
  remainingDistanceKm: number;
  completionPercentage: number;
  highestElevationM: number;
  elevationProfile: Array<{ distanceKm: number; elevationM: number; stationName?: string }>;
  delayHistory: Array<{ stationCode: string; stationName: string; delayMinutes: number }>;
}

interface AnalyticsDashboardProps {
  journey: LiveJourney;
}

export function AnalyticsDashboard({ journey }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics/${journey.trainId}`, { signal: controller.signal });
        if (!res.ok) return;
        const json = await res.json();
        if (json.data) setAnalytics(json.data);
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return;
      } finally {
        setLoading(false);
      }
    }
    load();

    return () => controller.abort();
  }, [journey.trainId]);

  const delayInfo = formatDelay(journey.delayMinutes);

  if (loading || !analytics) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center text-sm text-muted-foreground">
        Computing journey analytics & elevation profile...
      </div>
    );
  }

  const delayData = analytics.delayHistory.filter((d) => d.delayMinutes >= 0);
  const maxDelay = Math.max(...delayData.map((d) => d.delayMinutes), 1);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Route, color: 'text-rail-blue', bg: 'bg-rail-blue/10', label: 'Total Distance', value: analytics.totalDistanceKm, suffix: ' km' },
          { icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Highest Point', value: analytics.highestElevationM, suffix: ' m' },
          { icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Covered', value: analytics.distanceCoveredKm, suffix: ' km' },
          { icon: Clock, color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'Delay', value: journey.delayMinutes, suffix: ' min' },
        ].map(({ icon: Icon, color, bg, label, value, suffix }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4 space-y-2"
          >
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', bg)}>
              <Icon className={cn('h-4 w-4', color)} />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <AnimatedCounter value={value} suffix={suffix} className="text-lg text-foreground" />
          </motion.div>
        ))}
      </div>

      <ElevationProfile data={analytics.elevationProfile} highestElevationM={analytics.highestElevationM} />

      <div className="glass-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-amber-400" />
            Per-Station Delay History
          </h3>
          <span className={cn('text-xs font-bold', delayInfo.color)}>{delayInfo.text}</span>
        </div>

        {delayData.length > 0 ? (
          <div className="space-y-2">
            {delayData.slice(0, 12).map((d, i) => {
              const widthPct = maxDelay > 0 ? Math.round((d.delayMinutes / maxDelay) * 100) : 0;
              const barColor =
                d.delayMinutes === 0
                  ? 'bg-emerald-500'
                  : d.delayMinutes < 15
                  ? 'bg-amber-400'
                  : 'bg-rose-500';

              return (
                <div key={`${d.stationCode}-${i}`} className="flex items-center gap-3">
                  <span className="w-24 truncate text-[11px] text-muted-foreground text-right font-mono flex-shrink-0">
                    {d.stationCode}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(widthPct, d.delayMinutes === 0 ? 4 : 0)}%` }}
                      transition={{ duration: 0.5, delay: i * 0.04 }}
                      className={cn('h-full rounded-full', barColor)}
                    />
                  </div>
                  <span className="w-14 text-[11px] font-mono font-semibold text-right flex-shrink-0 text-muted-foreground">
                    {d.delayMinutes > 0 ? `+${d.delayMinutes}m` : 'On time'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No delay history available.</p>
        )}
      </div>
    </div>
  );
}
