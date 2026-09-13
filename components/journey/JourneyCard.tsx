'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Gauge, MapPin, RefreshCw, ArrowRight } from 'lucide-react';
import { LiveJourney } from '@/types/train';
import { DelayBadge } from './DelayBadge';
import { ProgressRing } from './ProgressRing';
import { ETAChip } from './ETAChip';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { formatDistance, formatTimeAgo } from '@/utils/format';
import { cn } from '@/utils/cn';

interface JourneyCardProps {
  journey: LiveJourney;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function JourneyCard({
  journey,
  onRefresh,
  isRefreshing,
  className,
}: JourneyCardProps) {
  return (
    <div
      className={cn(
        'glass-card rounded-3xl p-6 sm:p-8 transition-all duration-300 relative overflow-hidden',
        className
      )}
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-rail-blue/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-lg bg-rail-blue/10 border border-rail-blue/20 px-2.5 py-1 font-mono text-xs font-bold text-rail-blue">
              #{journey.number}
            </span>
            <StatusBadge status={journey.status} />
            <DelayBadge delayMinutes={journey.delayMinutes} />
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-foreground">
            {journey.name}
          </h2>
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span>{journey.origin.name} ({journey.origin.code})</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span>{journey.destination.name} ({journey.destination.code})</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ETAChip eta={journey.ETA} />
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary border border-border text-muted-foreground transition-all hover:bg-secondary/80 hover:text-foreground active:scale-95"
              title="Refresh Live Status"
            >
              <RefreshCw
                className={cn('h-4 w-4', isRefreshing && 'animate-spin text-rail-blue')}
              />
            </button>
          )}
        </div>
      </div>

      {/* Status Grid */}
      <div className="relative mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Current Station */}
        <div className="glass-card rounded-2xl p-5 group hover:border-rail-blue/20 transition-all">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {journey.positionState === 'BETWEEN_STATIONS'
                  ? 'Between Stations'
                  : journey.positionState === 'PASSED_STATION'
                  ? 'Near Destination'
                  : 'Current Station'}
              </span>
              {journey.positionState === 'BETWEEN_STATIONS' && journey.previousStation && journey.nextStation ? (
                <p className="mt-1 font-bold text-foreground text-sm">
                  {journey.previousStation.name} → {journey.nextStation.name}
                </p>
              ) : (
                <p className="mt-1 font-bold text-foreground text-sm">
                  {journey.currentStation?.name || journey.previousStation?.name || 'In Transit'}
                </p>
              )}
              {journey.currentStation?.platform && (
                <span className="mt-1 inline-block rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                  Platform {journey.currentStation.platform}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Speed */}
        <div className="glass-card rounded-2xl p-5 group hover:border-rail-blue/20 transition-all">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-rail-blue/10 text-rail-blue">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Live Speed
              </span>
              {journey.freshness?.speedAvailable ? (
                <div className="mt-1 flex items-baseline gap-1">
                  <AnimatedCounter
                    value={journey.speedKmh}
                    className="text-xl text-foreground"
                  />
                  <span className="text-xs font-semibold text-muted-foreground">km/h</span>
                </div>
              ) : (
                <p className="mt-1 text-sm font-medium text-muted-foreground italic">Not available</p>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="glass-card rounded-2xl p-5 group hover:border-rail-blue/20 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Journey Progress
              </span>
              <p className="mt-1 font-mono text-base font-bold text-foreground">
                {formatDistance(journey.distanceCoveredKm)} / {formatDistance(journey.totalDistanceKm)}
              </p>
              <span className="text-xs text-muted-foreground">
                {formatDistance(journey.remainingDistanceKm)} remaining
              </span>
            </div>
            <ProgressRing progress={journey.completionPercentage} size={58} strokeWidth={5} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between text-[11px] text-muted-foreground/70">
        <span>Auto-refreshes every 30 seconds</span>
        <span>Updated {formatTimeAgo(journey.lastUpdated)}</span>
      </div>
    </div>
  );
}
