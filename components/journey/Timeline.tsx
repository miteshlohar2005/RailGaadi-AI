'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { CheckCircle2, Circle, Radio, Search, Crosshair, X } from 'lucide-react';
import { Station } from '@/types/train';
import { formatDelay } from '@/utils/format';
import { cn } from '@/utils/cn';

interface TimelineProps {
  stations: Station[];
  currentStationCode?: string;
  positionState?: 'AT_STATION' | 'BETWEEN_STATIONS' | 'PASSED_STATION' | 'UNKNOWN';
  previousStationName?: string;
  nextStationName?: string;
  freshnessLevel?: 'live' | 'recent' | 'stale' | 'outdated' | 'unknown';
  dataAgeSeconds?: number;
  className?: string;
}

export function Timeline({ stations, currentStationCode, positionState, previousStationName, nextStationName, freshnessLevel, dataAgeSeconds, className }: TimelineProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentStationRef = useRef<HTMLDivElement>(null);

  const filteredStations = useMemo(() => {
    if (!searchQuery.trim()) return stations;
    const q = searchQuery.toLowerCase();
    return stations.filter(
      (st) =>
        st.name.toLowerCase().includes(q) ||
        st.code.toLowerCase().includes(q)
    );
  }, [stations, searchQuery]);

  const scrollToCurrent = useCallback(() => {
    if (!currentStationRef.current || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const el = currentStationRef.current;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset = elRect.top - containerRect.top - containerRect.height / 2 + elRect.height / 2;
    container.scrollTo({ top: container.scrollTop + offset, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const timer = setTimeout(scrollToCurrent, 300);
    return () => clearTimeout(timer);
  }, [currentStationCode, stations.length, scrollToCurrent]);

  return (
    <div className={cn('glass-card rounded-3xl shadow-glass flex flex-col', className)}>
      {/* Sticky Header */}
      <div className="flex-shrink-0 p-5 pb-3 space-y-3 border-b border-border/50">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <span className={cn(
            'h-2 w-2 rounded-full animate-pulse',
            freshnessLevel === 'live' ? 'bg-emerald-500' :
            freshnessLevel === 'recent' ? 'bg-amber-500' :
            freshnessLevel === 'stale' ? 'bg-orange-500' :
            freshnessLevel === 'outdated' ? 'bg-red-500' : 'bg-rail-blue'
          )} />
          Station Route Timeline
          <span className="ml-auto text-[11px] font-medium text-muted-foreground">
            {filteredStations.length}/{stations.length}
          </span>
        </h3>

        {/* Position context */}
        {positionState && positionState !== 'UNKNOWN' && (
          <div className={cn(
            'rounded-xl border px-3 py-2 text-[11px] font-medium',
            positionState === 'AT_STATION' && 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
            positionState === 'BETWEEN_STATIONS' && 'bg-rail-blue/10 border-rail-blue/20 text-rail-blue',
            positionState === 'PASSED_STATION' && 'bg-muted/50 border-border text-muted-foreground',
          )}>
            {positionState === 'AT_STATION' && (
              <span>At <strong>{currentStationCode ? stations.find(s => s.code === currentStationCode)?.name : 'station'}</strong></span>
            )}
            {positionState === 'BETWEEN_STATIONS' && (
              <span>Between <strong>{previousStationName}</strong> → <strong>{nextStationName}</strong></span>
            )}
            {positionState === 'PASSED_STATION' && (
              <span>Journey near completion — passed all scheduled stops</span>
            )}
            {dataAgeSeconds !== undefined && dataAgeSeconds > 60 && (
              <span className="ml-1 text-muted-foreground">· {dataAgeSeconds >= 60 ? `${Math.floor(dataAgeSeconds / 60)}m ${dataAgeSeconds % 60}s ago` : `${dataAgeSeconds}s ago`}</span>
            )}
          </div>
        )}
        {positionState === 'UNKNOWN' && dataAgeSeconds !== undefined && (
          <div className="rounded-xl border bg-red-500/10 border-red-500/20 px-3 py-2 text-[11px] font-medium text-red-600 dark:text-red-400">
            Position unavailable — showing last known
            {dataAgeSeconds >= 60 && (
              <span className="ml-1 text-muted-foreground">· {Math.floor(dataAgeSeconds / 60)}m {dataAgeSeconds % 60}s ago</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Search station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-secondary border border-border py-1.5 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-rail-blue/40 focus:ring-1 focus:ring-rail-blue/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground/50 hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {currentStationCode && (
            <button
              onClick={scrollToCurrent}
              className="flex items-center gap-1.5 rounded-xl border border-rail-blue/20 bg-rail-blue/5 px-3 py-1.5 text-[11px] font-semibold text-rail-blue hover:bg-rail-blue/10 transition-all active:scale-95"
            >
              <Crosshair className="h-3 w-3" />
              Current
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Station List */}
      <div
        ref={scrollContainerRef}
        className="timeline-scroll flex-1 overflow-y-auto p-5 pt-4"
        style={{ maxHeight: '650px' }}
      >
        {filteredStations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No stations found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-rail-blue hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="relative pl-6 before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-px before:bg-gradient-to-b before:from-border before:via-border/50 before:to-transparent">
            <div className="space-y-5">
              {filteredStations.map((st, idx) => {
                const isPassed = st.status === 'passed';
                const isCurrent = st.status === 'current' || st.code === currentStationCode;
                const isUpcoming = st.status === 'upcoming';
                const delayInfo = formatDelay(st.delayMinutes);

                return (
                  <div
                    key={st.code + idx}
                    ref={isCurrent ? currentStationRef : undefined}
                    className={cn(
                      'relative flex items-start justify-between gap-4 transition-colors duration-300',
                      isCurrent && 'scroll-mt-24'
                    )}
                  >
                    {/* Dot */}
                    <div className="absolute -left-6 top-0.5 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-background">
                      {isPassed && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                      {isCurrent && (
                        <div className="relative flex items-center justify-center">
                          <Radio className="h-4 w-4 text-rail-blue animate-pulse" />
                          <span className="absolute h-7 w-7 rounded-full bg-rail-blue/20 animate-ping" />
                        </div>
                      )}
                      {isUpcoming && (
                        <Circle className="h-3 w-3 text-muted-foreground/50" />
                      )}
                    </div>

                    {/* Station Info */}
                    <div className="flex-1 pl-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={cn(
                            'font-bold',
                            isCurrent
                              ? 'text-rail-blue text-sm'
                              : isPassed
                              ? 'text-foreground/80 text-xs'
                              : 'text-muted-foreground text-xs'
                          )}
                        >
                          {st.name} ({st.code})
                        </h4>

                        {isCurrent && positionState === 'AT_STATION' && (
                          <span className="rounded-md bg-rail-blue/10 border border-rail-blue/20 px-2 py-0.5 font-mono text-[9px] font-bold text-rail-blue uppercase tracking-wider">
                            Live
                          </span>
                        )}
                        {isCurrent && positionState === 'BETWEEN_STATIONS' && (
                          <span className="rounded-md bg-rail-blue/10 border border-rail-blue/20 px-2 py-0.5 font-mono text-[9px] font-bold text-rail-blue uppercase tracking-wider">
                            Passed
                          </span>
                        )}

                        {st.platform && (
                          <span className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                            PF {st.platform}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-[11px] font-medium text-muted-foreground/70">
                        <span>{st.distanceKm} km</span>
                        {st.haltMinutes && <span>Halt: {st.haltMinutes}m</span>}
                      </div>
                    </div>

                    {/* Timing */}
                    <div className="text-right font-mono text-xs">
                      <div className="font-semibold text-foreground/80">
                        {st.actualArrival || st.scheduledArrival}
                      </div>
                      {st.delayMinutes > 0 ? (
                        <div className={cn('text-[11px] font-bold', delayInfo.color)}>
                          +{st.delayMinutes}m
                        </div>
                      ) : (
                        <div className="text-[11px] text-emerald-500 font-semibold">
                          On Time
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
