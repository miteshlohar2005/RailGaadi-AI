'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Share2, Check, MapPin, CloudSun, Mountain, AlertCircle } from 'lucide-react';
import { useLiveJourney } from '@/hooks/useLiveJourney';
import { JourneyCard } from '@/components/journey/JourneyCard';
import { Timeline } from '@/components/journey/Timeline';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorCard } from '@/components/ui/ErrorCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { WeatherPanel } from '@/features/weather/WeatherPanel';
import { AnalyticsDashboard } from '@/features/analytics/AnalyticsDashboard';
import { TerrainPanel } from '@/features/terrain/TerrainPanel';
import { MobileJourneySummary } from '@/components/layout/MobileJourneySummary';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import { cn } from '@/utils/cn';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/features/maps/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] w-full items-center justify-center rounded-3xl bg-secondary">
      <Skeleton className="h-full w-full rounded-3xl" />
    </div>
  ),
});

const TABS = [
  { id: 'map', label: 'Live Map', icon: MapPin },
  { id: 'weather', label: 'Weather', icon: CloudSun },
  { id: 'analytics', label: 'Terrain & Analytics', icon: Mountain },
] as const;

type TabId = typeof TABS[number]['id'];

export default function TrainJourneyPage({ params }: { params: { id: string } }) {
  const trainId = params.id;
  const { data: journey, isLoading, isError, error, refetch, isRefetching } = useLiveJourney(trainId);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('map');

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    const shareUrl = window.location.href;
    if (typeof navigator.share === 'function') {
      navigator
        .share({ title: `RailGaadi AI – ${journey?.name || `Train #${trainId}`}`, url: shareUrl })
        .catch(() => {
          navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pt-20">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-12 w-80 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-7 h-[480px] rounded-3xl" />
          <Skeleton className="lg:col-span-5 h-[480px] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError || !journey) {
    const errMsg = (error as Error)?.message || '';
    const isQuotaError = errMsg.includes('QUOTA_EXCEEDED') || errMsg.includes('TOO_MANY_REQUESTS') || errMsg.includes('Daily quota');
    const is404 = errMsg.includes('404') || errMsg.includes('not found');

    return (
      <div className="py-12 max-w-xl mx-auto space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-rail-blue transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Search
        </Link>

        {isQuotaError ? (
          <div className="glass-card rounded-3xl p-8 text-center space-y-4 border border-amber-500/20">
            <div className="text-4xl">⏳</div>
            <h2 className="text-xl font-extrabold text-foreground">API Quota Reached</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              The RailRadar free tier allows <strong>50 requests/day</strong>. Today&apos;s quota has been exhausted.
              Live tracking will resume tomorrow, or you can upgrade your RailRadar plan.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a
                href="https://railradar.in/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-rail-blue px-4 py-2 text-xs font-semibold text-white shadow-glow hover:bg-sky-600 transition-colors"
              >
                Upgrade API Plan
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors"
              >
                Back to Search
              </Link>
            </div>
          </div>
        ) : (
          <ErrorCard
            title={is404 ? 'Train Not Found' : 'Live Data Unavailable'}
            message={
              is404
                ? `Train #${trainId} not found. Please check the train number.`
                : `Could not load live data for train #${trainId}. The train may not be running today or the service is temporarily unavailable.`
            }
            onRetry={() => refetch()}
          />
        )}
      </div>
    );
  }

  const trainForFavorite = {
    id: journey.trainId,
    number: journey.number,
    name: journey.name,
    origin: journey.origin,
    destination: journey.destination,
  };

  return (
    <div className="space-y-5 pt-20">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-secondary border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="flex items-center gap-2">
          <StatusBadge status={journey.status} />
          <FavoriteButton train={trainForFavorite} />
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rail-blue to-rail-cyan px-3.5 py-2 text-xs font-semibold text-white shadow-glow transition-all hover:brightness-110 active:scale-95"
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Summary */}
      <MobileJourneySummary journey={journey} />

      {/* Desktop Journey Card */}
      <div className="hidden md:block">
        <JourneyCard journey={journey} onRefresh={() => refetch()} isRefreshing={isRefetching} />
      </div>

      {/* Not-Started / Cancelled Banner */}
      {(journey.status === 'not_started' || journey.status === 'cancelled') && (
        <div className="glass-card flex items-center gap-3 rounded-2xl p-4 border border-amber-500/20">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-foreground/80">
            {journey.status === 'not_started'
              ? `Train #${journey.number} hasn't departed yet. Live tracking activates once the journey begins (scheduled departure: ${journey.stations[0]?.scheduledDeparture || 'check timetable'}).`
              : `Train #${journey.number} has been cancelled. Please check NTES for alternate arrangements.`}
          </p>
        </div>
      )}

      {/* Tab Selector */}
      <div className="flex items-center gap-1 glass-panel rounded-2xl p-1.5 w-fit flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap',
              activeTab === id
                ? 'bg-rail-blue text-white shadow-glow'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Main Content — Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column — Main Content */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {activeTab === 'map' && <MapView journey={journey} className="h-[480px] w-full" />}
          {activeTab === 'weather' && <WeatherPanel journey={journey} />}
          {activeTab === 'analytics' && (
            <>
              <AnalyticsDashboard journey={journey} />
              <TerrainPanel trainId={journey.trainId} />
            </>
          )}
        </div>

        {/* Right Column — Station Timeline (scrollable panel) */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20">
          <Timeline
            stations={journey.stations}
            currentStationCode={journey.currentStation?.code}
            positionState={journey.positionState}
            previousStationName={journey.previousStation?.name}
            nextStationName={journey.nextStation?.name}
            freshnessLevel={journey.freshness.freshnessLevel}
            dataAgeSeconds={journey.freshness.dataAgeSeconds}
          />
        </div>
      </div>
    </div>
  );
}
