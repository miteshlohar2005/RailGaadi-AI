'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import {
  Target,
  ZoomIn,
  ZoomOut,
  Navigation,
  Eye,
  EyeOff,
  Train,
  CircleDot,
  Radio,
  WifiOff,
} from 'lucide-react';
import { LiveJourney } from '@/types/train';
import { useJourneyStore } from '@/store/journey';
import { useTheme } from '@/providers/theme-provider';
import { cn } from '@/utils/cn';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || '';
const ANIM_DURATION_MS = 1200;
/** Only animate marker when data is <= this many seconds old */
const MAX_FRESH_FOR_ANIMATION = 300;

interface MapViewProps {
  journey: LiveJourney;
  className?: string;
}

/* ─── Helpers ─────────────────────────────────────────────────────── */

function splitRouteAtPct(
  coords: [number, number][],
  pct: number,
): { completed: [number, number][]; upcoming: [number, number][] } {
  if (!coords || coords.length < 2) return { completed: coords || [], upcoming: [] };
  const distances: number[] = [0];
  let totalDist = 0;
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i][0] - coords[i - 1][0];
    const dy = coords[i][1] - coords[i - 1][1];
    totalDist += Math.sqrt(dx * dx + dy * dy);
    distances.push(totalDist);
  }
  if (totalDist === 0) return { completed: [coords[0]], upcoming: [] };

  const targetDist = (pct / 100) * totalDist;
  const completed: [number, number][] = [];
  const upcoming: [number, number][] = [];
  let splitInserted = false;

  for (let i = 0; i < coords.length; i++) {
    if (distances[i] <= targetDist) {
      completed.push(coords[i]);
    } else {
      if (!splitInserted && i > 0) {
        const segLen = distances[i] - distances[i - 1];
        const t = segLen > 0 ? (targetDist - distances[i - 1]) / segLen : 0;
        const pt: [number, number] = [
          coords[i - 1][0] + t * (coords[i][0] - coords[i - 1][0]),
          coords[i - 1][1] + t * (coords[i][1] - coords[i - 1][1]),
        ];
        completed.push(pt);
        upcoming.push(pt);
        splitInserted = true;
      }
      upcoming.push(coords[i]);
    }
  }
  if (!splitInserted && completed.length > 0) upcoming.unshift(completed[completed.length - 1]);

  return {
    completed: completed.length < 2 ? [completed[0] || coords[0], completed[completed.length - 1] || coords[0]] : completed,
    upcoming: upcoming.length < 2 ? [upcoming[0] || coords[coords.length - 1], upcoming[upcoming.length - 1] || coords[coords.length - 1]] : upcoming,
  };
}

function calcBearing(fromLng: number, fromLat: number, toLng: number, toLat: number): number {
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (toLat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function getMapStyle(theme: 'light' | 'dark') {
  if (MAPTILER_KEY) {
    return theme === 'dark'
      ? `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`
      : `https://api.maptiler.com/maps/dataviz-light/style.json?key=${MAPTILER_KEY}`;
  }
  if (theme === 'dark') {
    return {
      version: 8 as const,
      sources: {
        'carto-dark': {
          type: 'raster' as const,
          tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap © CARTO',
        },
      },
      layers: [{ id: 'carto-layer', type: 'raster' as const, source: 'carto-dark' }],
    };
  }
  return {
    version: 8 as const,
    sources: {
      'carto-light': {
        type: 'raster' as const,
        tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap © CARTO',
      },
    },
    layers: [{ id: 'carto-layer', type: 'raster' as const, source: 'carto-light' }],
  };
}

function formatAgoDetailed(seconds: number): string {
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s ago` : `${m}m ago`;
}

function freshnessColor(level: LiveJourney['freshness']['freshnessLevel']): string {
  switch (level) {
    case 'live': return 'text-emerald-600 dark:text-emerald-400';
    case 'recent': return 'text-amber-500 dark:text-amber-400';
    case 'stale': return 'text-orange-500 dark:text-orange-400';
    case 'outdated': return 'text-red-500 dark:text-red-400';
    default: return 'text-muted-foreground';
  }
}

function freshnessDotColor(level: LiveJourney['freshness']['freshnessLevel']): string {
  switch (level) {
    case 'live': return 'bg-emerald-500';
    case 'recent': return 'bg-amber-500';
    case 'stale': return 'bg-orange-500';
    case 'outdated': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
}

function freshnessLabel(level: LiveJourney['freshness']['freshnessLevel']): string {
  switch (level) {
    case 'live': return 'LIVE';
    case 'recent': return 'RECENT';
    case 'stale': return 'STALE';
    case 'outdated': return 'LAST KNOWN';
    default: return 'UNKNOWN';
  }
}

/* ─── Train marker HTML ───────────────────────────────────────────── */

function buildTrainMarkerHTML(isDark: boolean, bearing: number, isStale: boolean): string {
  const glowColor = isStale
    ? isDark ? 'rgba(100,116,139,0.3)' : 'rgba(148,163,184,0.25)'
    : isDark ? 'rgba(6,182,212,0.5)' : 'rgba(2,132,199,0.45)';
  const ringColor = isStale
    ? isDark ? 'rgba(100,116,139,0.15)' : 'rgba(148,163,184,0.12)'
    : isDark ? 'rgba(6,182,212,0.2)' : 'rgba(2,132,199,0.18)';
  const bgGradient = isStale
    ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
    : isDark
    ? 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)'
    : 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)';
  const borderColor = isStale
    ? 'rgba(148,163,184,0.3)'
    : isDark ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.35)';
  const animStyle = isStale ? '' : 'animation:trainPulse 2s ease-in-out infinite;';
  const glowAnim = isStale ? '' : 'animation:trainGlow 2.5s ease-in-out infinite;';

  return `
    <div style="position:relative;display:flex;align-items:center;justify-content:center;width:48px;height:48px;pointer-events:none;" data-train-marker>
      <div style="position:absolute;inset:-6px;border-radius:50%;background:${ringColor};${animStyle}"></div>
      <div style="position:absolute;inset:-2px;border-radius:50%;background:${glowColor};filter:blur(6px);${glowAnim}"></div>
      <div style="
        position:relative;
        width:40px;height:40px;
        border-radius:50%;
        background:${bgGradient};
        border:2.5px solid ${borderColor};
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 24px ${glowColor}, 0 2px 8px rgba(0,0,0,0.3);
        transform:rotate(${bearing}deg);
        transition:transform 0.3s ease;
      ">
        <span style="font-size:18px;line-height:1;transform:rotate(${-bearing}deg);">${isStale ? '🚉' : '🚆'}</span>
      </div>
    </div>`;
}

/* ─── Popup HTML ──────────────────────────────────────────────────── */

function buildPopupHTML(j: LiveJourney): string {
  const f = j.freshness;
  const delayText = j.delayMinutes > 0 ? `+${j.delayMinutes}m` : 'On time';
  const delayColor = j.delayMinutes > 0 ? '#fbbf24' : '#34d399';
  const freshDot = freshnessColor(f.freshnessLevel);
  const freshLabel = freshnessLabel(f.freshnessLevel);
  const ageText = f.dataAgeSeconds >= 0 ? formatAgoDetailed(f.dataAgeSeconds) : '';
  const speedText = f.speedAvailable ? `${j.speedKmh} km/h` : 'Speed not available';
  const positionLabel = f.positionSource === 'gps' ? 'GPS' : f.positionSource === 'station' ? 'Station-based' : f.positionSource === 'interpolated' ? 'Interpolated' : 'Fallback';

  return `
    <div style="padding:12px 14px;font-family:Inter,system-ui,sans-serif;background:rgba(15,23,42,0.95);color:white;border-radius:14px;border:1px solid rgba(148,163,184,0.1);min-width:190px;max-width:240px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <span style="font-weight:700;font-size:13px;">${j.name}</span>
        <span style="font-size:11px;color:#94a3b8;">#${j.number}</span>
      </div>
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:6px;">
        <span style="width:6px;height:6px;border-radius:50%;background:${freshLabel === 'LIVE' ? '#34d399' : freshLabel === 'RECENT' ? '#fbbf24' : '#ef4444'};flex-shrink:0;"></span>
        <span style="font-size:10px;font-weight:700;color:${freshLabel === 'LIVE' ? '#34d399' : freshLabel === 'RECENT' ? '#fbbf24' : '#ef4444'};letter-spacing:0.5px;">${freshLabel}</span>
        <span style="font-size:10px;color:#64748b;">· ${ageText}</span>
      </div>
      <div style="border-top:1px solid rgba(148,163,184,0.1);padding-top:6px;margin-top:4px;">
        <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;">Speed: <span style="color:white;font-weight:600;">${speedText}</span></div>
        <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;">Delay: <span style="color:${delayColor};font-weight:600;">${delayText}</span></div>
        <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;">Position: <span style="color:#38bdf8;font-weight:600;">${positionLabel}</span></div>
      </div>
      ${j.currentStation ? `<div style="border-top:1px solid rgba(148,163,184,0.1);padding-top:5px;margin-top:5px;font-size:10px;color:#64748b;">Current: <span style="color:#94a3b8;">${j.currentStation.name}</span></div>` : ''}
      ${j.nextStation ? `<div style="font-size:10px;color:#64748b;margin-top:2px;">Next: <span style="color:#94a3b8;">${j.nextStation.name}</span></div>` : ''}
      <div style="border-top:1px solid rgba(148,163,184,0.1);padding-top:5px;margin-top:5px;font-size:9px;color:#475569;">
        Source: RailRadar · Mode: ${f.trackingMode}
      </div>
    </div>`;
}

/* ─── Component ───────────────────────────────────────────────────── */

export default function MapView({ journey, className }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const trainMarkerRef = useRef<maplibregl.Marker | null>(null);
  const trainMarkerElRef = useRef<HTMLElement | null>(null);
  const stationMarkersRef = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const followTrainMode = useJourneyStore((s) => s.followTrainMode);
  const setFollowTrainMode = useJourneyStore((s) => s.setFollowTrainMode);
  const { theme } = useTheme();

  const journeyRef = useRef(journey);
  journeyRef.current = journey;

  const prevPosRef = useRef<{ lng: number; lat: number } | null>(null);
  const animFrameRef = useRef<number>(0);
  const animStateRef = useRef<{
    fromLng: number; fromLat: number; toLng: number; toLat: number;
    start: number; bearing: number;
  } | null>(null);
  const [dataAge, setDataAge] = useState(journey.freshness?.dataAgeSeconds ?? 0);

  /* ── 1. Initialize map (once) ──────────────────────────────────── */

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const j = journeyRef.current;
    const center: [number, number] = [
      j.currentLocation?.lng || j.stations[0]?.lng || 77.22,
      j.currentLocation?.lat || j.stations[0]?.lat || 28.64,
    ];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getMapStyle(theme) as string,
      center,
      zoom: 7,
      pitch: 30,
      antialias: true,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => { mapRef.current = map; setMapLoaded(true); });
    map.on('dragstart', () => setFollowTrainMode(false));
    map.on('zoomstart', () => { if (map.dragPan.isEnabled()) setFollowTrainMode(false); });

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 2. Theme ──────────────────────────────────────────────────── */

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try { map.setStyle(getMapStyle(theme) as string); } catch { /* ok */ }
  }, [theme]);

  /* ── 3. Route layers ───────────────────────────────────────────── */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const allCoords: [number, number][] =
      journey.routeGeometry ||
      journey.stations.filter((s) => s.lat && s.lng).map((s) => [s.lng, s.lat] as [number, number]);
    if (allCoords.length < 2) return;

    const { completed, upcoming } = splitRouteAtPct(allCoords, journey.completionPercentage);
    const completedGeo: GeoJSON.Feature<GeoJSON.LineString> = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: completed } };
    const upcomingGeo: GeoJSON.Feature<GeoJSON.LineString> = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: upcoming } };

    if (map.getSource('route-completed')) {
      (map.getSource('route-completed') as maplibregl.GeoJSONSource).setData(completedGeo);
    } else {
      map.addSource('route-completed', { type: 'geojson', data: completedGeo });
      map.addLayer({ id: 'route-completed-glow', type: 'line', source: 'route-completed', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#0284c7', 'line-width': 12, 'line-opacity': 0.12, 'line-blur': 8 } });
      map.addLayer({ id: 'route-completed-line', type: 'line', source: 'route-completed', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#0ea5e9', 'line-width': 4, 'line-opacity': 0.9 } });
    }

    if (map.getSource('route-upcoming')) {
      (map.getSource('route-upcoming') as maplibregl.GeoJSONSource).setData(upcomingGeo);
    } else {
      map.addSource('route-upcoming', { type: 'geojson', data: upcomingGeo });
      map.addLayer({ id: 'route-upcoming-line', type: 'line', source: 'route-upcoming', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': theme === 'dark' ? '#475569' : '#94a3b8', 'line-width': 3, 'line-opacity': 0.5, 'line-dasharray': [2, 2] } });
    }
  }, [journey.routeGeometry, journey.stations, journey.completionPercentage, mapLoaded, theme]);

  /* ── 4. Train marker ───────────────────────────────────────────── */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    let trainLng = journey.currentLocation?.lng;
    let trainLat = journey.currentLocation?.lat;

    const allCoords: [number, number][] =
      journey.routeGeometry ||
      journey.stations.filter((s) => s.lat && s.lng).map((s) => [s.lng, s.lat] as [number, number]);

    // If no live coords, try to interpolate along route (but mark as interpolated)
    if ((!trainLng || !trainLat) && allCoords.length > 1) {
      const pt = getPolylinePoint(allCoords, journey.completionPercentage);
      trainLng = pt[0];
      trainLat = pt[1];
    }
    if (!trainLng || !trainLat) return;

    const bearing = journey.currentLocation?.heading || 0;
    const isStale = journey.freshness?.freshnessLevel === 'stale' || journey.freshness?.freshnessLevel === 'outdated';

    if (!trainMarkerRef.current) {
      const el = document.createElement('div');
      el.style.pointerEvents = 'auto';
      el.style.cursor = 'pointer';
      el.innerHTML = buildTrainMarkerHTML(theme === 'dark', bearing, isStale);

      const popup = new maplibregl.Popup({ offset: 20, closeButton: false, className: 'train-popup' }).setHTML(buildPopupHTML(journey));

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([trainLng, trainLat])
        .setPopup(popup)
        .addTo(map);

      trainMarkerRef.current = marker;
      trainMarkerElRef.current = el;
      prevPosRef.current = { lng: trainLng, lat: trainLat };
    } else {
      const prev = prevPosRef.current;
      const targetLng = trainLng;
      const targetLat = trainLat;
      const coordsChanged = prev && (Math.abs(prev.lng - targetLng) > 1e-7 || Math.abs(prev.lat - targetLat) > 1e-7);
      const canAnimate = coordsChanged && !isStale;

      if (canAnimate) {
        const fromLng = prev!.lng;
        const fromLat = prev!.lat;
        const calculatedBearing = calcBearing(fromLng, fromLat, targetLng, targetLat);
        const finalBearing = bearing || calculatedBearing;

        cancelAnimationFrame(animFrameRef.current);
        animStateRef.current = { fromLng, fromLat, toLng: targetLng, toLat: targetLat, start: performance.now(), bearing: finalBearing };

        const animate = (now: number) => {
          const state = animStateRef.current;
          if (!state) return;
          const t = Math.min((now - state.start) / ANIM_DURATION_MS, 1);
          const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          trainMarkerRef.current?.setLngLat([
            state.fromLng + (state.toLng - state.fromLng) * ease,
            state.fromLat + (state.toLat - state.fromLat) * ease,
          ]);
          const el = trainMarkerElRef.current;
          if (el) {
            const body = el.querySelector('[data-train-marker] > div:nth-child(3)') as HTMLElement;
            const icon = el.querySelector('[data-train-marker] > div:nth-child(3) > span') as HTMLElement;
            if (body) body.style.transform = `rotate(${finalBearing}deg)`;
            if (icon) icon.style.transform = `rotate(${-finalBearing}deg)`;
          }
          if (t < 1) {
            animFrameRef.current = requestAnimationFrame(animate);
          } else {
            prevPosRef.current = { lng: targetLng, lat: targetLat };
            animStateRef.current = null;
          }
        };
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        trainMarkerRef.current.setLngLat([trainLng, trainLat]);
        prevPosRef.current = { lng: targetLng, lat: targetLat };
      }

      // Update marker look + popup
      const el = trainMarkerRef.current.getElement();
      el.innerHTML = buildTrainMarkerHTML(theme === 'dark', bearing, isStale);
      trainMarkerElRef.current = el;
      trainMarkerRef.current.setPopup(
        new maplibregl.Popup({ offset: 20, closeButton: false, className: 'train-popup' }).setHTML(buildPopupHTML(journey))
      );
    }

    // Camera follow
    if (followTrainMode && !isStale) {
      map.easeTo({ center: [trainLng, trainLat], duration: 1000, essential: true });
    }
  }, [journey, mapLoaded, followTrainMode, theme]);

  /* ── 5. Station markers ────────────────────────────────────────── */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    stationMarkersRef.current.forEach((m) => m.remove());
    stationMarkersRef.current = [];

    journey.stations.forEach((st) => {
      if (!st.lat || !st.lng) return;
      const el = document.createElement('div');
      el.style.pointerEvents = 'auto';
      el.style.cursor = 'pointer';
      const isPassed = st.status === 'passed';
      const isCurrent = st.status === 'current';
      const size = isCurrent ? 14 : 9;
      const bg = isCurrent ? (theme === 'dark' ? '#06b6d4' : '#0284c7') : isPassed ? '#10b981' : (theme === 'dark' ? '#475569' : '#94a3b8');
      const ring = isCurrent ? `0 0 0 4px ${theme === 'dark' ? 'rgba(6,182,212,0.25)' : 'rgba(2,132,199,0.22)'}` : 'none';
      el.innerHTML = `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:2px solid ${theme === 'dark' ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.8)'};box-shadow:${ring};transition:transform 0.15s;" onmouseover="this.style.transform='scale(1.6)'" onmouseout="this.style.transform='scale(1)'"></div>`;
      const popup = new maplibregl.Popup({ offset: 10, closeButton: false }).setHTML(`
        <div style="padding:10px;font-family:Inter,system-ui,sans-serif;background:rgba(15,23,42,0.95);color:white;border-radius:12px;border:1px solid rgba(148,163,184,0.1);min-width:140px;">
          <div style="font-weight:700;font-size:12px;">${st.name} <span style="opacity:0.5">(${st.code})</span></div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${st.distanceKm} km from origin</div>
          <div style="font-size:11px;font-weight:600;margin-top:3px;color:${st.delayMinutes > 0 ? '#fbbf24' : '#34d399'}">
            ${st.delayMinutes > 0 ? `+${st.delayMinutes}m delay` : 'On time'}
          </div>
          ${st.platform ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px;">Platform ${st.platform}</div>` : ''}
        </div>`);
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([st.lng, st.lat]).setPopup(popup).addTo(map);
      stationMarkersRef.current.push(marker);
    });
  }, [journey.stations, mapLoaded, theme]);

  /* ── 6. Data age timer ─────────────────────────────────────────── */

  useEffect(() => {
    const baseAge = journey.freshness?.dataAgeSeconds ?? 0;
    setDataAge(baseAge);
    const id = setInterval(() => setDataAge((prev) => prev + 5), 5000);
    return () => clearInterval(id);
  }, [journey.lastUpdated, journey.freshness?.dataAgeSeconds]);

  /* ── 7. Cleanup ────────────────────────────────────────────────── */

  useEffect(() => () => cancelAnimationFrame(animFrameRef.current), []);

  /* ── Handlers ──────────────────────────────────────────────────── */

  const handleCenter = useCallback(() => {
    setFollowTrainMode(true);
    const j = journeyRef.current;
    const lng = j.currentLocation?.lng || j.stations[0]?.lng || 77.22;
    const lat = j.currentLocation?.lat || j.stations[0]?.lat || 28.64;
    mapRef.current?.easeTo({ center: [lng, lat], zoom: 9, duration: 800, essential: true });
  }, [setFollowTrainMode]);

  const handleToggleFollow = useCallback(() => {
    if (!followTrainMode) handleCenter();
    else setFollowTrainMode(false);
  }, [followTrainMode, setFollowTrainMode, handleCenter]);

  /* ── Derived ───────────────────────────────────────────────────── */

  const f = journey.freshness;
  const isStale = f?.freshnessLevel === 'stale' || f?.freshnessLevel === 'outdated';
  const freshColor = freshnessColor(f?.freshnessLevel || 'unknown');
  const freshDot = freshnessDotColor(f?.freshnessLevel || 'unknown');
  const freshLbl = freshnessLabel(f?.freshnessLevel || 'unknown');
  const nextStation = journey.nextStation;
  const isDark = theme === 'dark';

  return (
    <div className={cn('relative overflow-hidden rounded-3xl shadow-glass', className)}>
      <style jsx global>{`
        @keyframes trainPulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.35);opacity:0} }
        @keyframes trainGlow { 0%,100%{opacity:.7;filter:blur(6px)} 50%{opacity:.3;filter:blur(10px)} }
        .train-popup .maplibregl-popup-content { padding:0!important;background:transparent!important;border-radius:14px!important;box-shadow:none!important; }
        .train-popup .maplibregl-popup-tip { border-top-color:rgba(15,23,42,0.95)!important; }
      `}</style>

      <div ref={mapContainerRef} className="h-full w-full min-h-[420px]" />

      {/* ── Zoom + Center controls (top-right) ─────────────────────── */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <button onClick={() => mapRef.current?.zoomIn()} title="Zoom In" className="glass-panel flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground shadow-md transition-all hover:scale-105"><ZoomIn className="h-4 w-4" /></button>
        <button onClick={() => mapRef.current?.zoomOut()} title="Zoom Out" className="glass-panel flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground shadow-md transition-all hover:scale-105"><ZoomOut className="h-4 w-4" /></button>
        <button onClick={handleCenter} title="Center on Train" className={cn('glass-panel flex h-9 w-9 items-center justify-center rounded-xl shadow-md transition-all hover:scale-105', followTrainMode ? 'text-rail-blue border border-rail-blue/30' : 'text-muted-foreground')}><Target className="h-4 w-4" /></button>
      </div>

      {/* ── Follow toggle (bottom-left) ────────────────────────────── */}
      <div className="absolute bottom-3 left-3 z-10">
        <button onClick={handleToggleFollow} className={cn('glass-panel flex items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-semibold shadow-md transition-all hover:scale-[1.02]', followTrainMode ? 'text-rail-blue border border-rail-blue/30' : 'text-muted-foreground')}>
          {followTrainMode ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          <span className={cn('h-1.5 w-1.5 rounded-full', followTrainMode ? 'bg-rail-blue animate-pulse' : 'bg-muted-foreground')} />
          {followTrainMode ? 'Following Train' : 'Follow Train'}
        </button>
      </div>

      {/* ── Freshness indicator (top-left) ─────────────────────────── */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
        <div className="glass-panel flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 shadow-md">
          <span className="relative flex h-2 w-2">
            <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75', freshDot, (freshLbl === 'LIVE' || freshLbl === 'RECENT') && 'animate-ping')} />
            <span className={cn('relative inline-flex h-2 w-2 rounded-full', freshDot)} />
          </span>
          <span className={cn('text-[10px] font-bold uppercase tracking-wider', freshColor)}>
            {freshLbl}
          </span>
        </div>
        <div className="glass-panel rounded-xl px-2 py-1 shadow-md">
          <span className={cn('text-[10px] font-medium', freshColor)}>
            {formatAgoDetailed(dataAge)}
          </span>
        </div>
      </div>

      {/* ── Position source badge (below freshness) ────────────────── */}
      {f && (
        <div className="absolute top-12 left-3 z-10">
          <div className="glass-panel rounded-lg px-2 py-0.5 shadow-sm">
            <span className="text-[9px] font-medium text-muted-foreground">
              {f.positionSource === 'gps' ? '📡 GPS' : f.positionSource === 'station' ? '🏗 Station' : f.positionSource === 'interpolated' ? '📐 Interpolated' : '⚠ Fallback'}
              {f.trackingMode && f.trackingMode !== 'unknown' && ` · ${f.trackingMode}`}
            </span>
          </div>
        </div>
      )}

      {/* ── Status card (bottom-right) ─────────────────────────────── */}
      <div className="absolute bottom-3 right-3 z-10 max-w-[200px]">
        <div className="glass-panel rounded-2xl p-3 shadow-lg space-y-2">
          {/* Speed */}
          <div className="flex items-center gap-2">
            <CircleDot className="h-3 w-3 text-rail-blue flex-shrink-0" />
            <div>
              <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Speed</div>
              {f?.speedAvailable ? (
                <div className="text-sm font-bold text-foreground font-mono-tabular">
                  {journey.speedKmh} <span className="text-[10px] font-semibold text-muted-foreground">km/h</span>
                </div>
              ) : (
                <div className="text-[11px] font-medium text-muted-foreground italic">Not available</div>
              )}
            </div>
          </div>

          {/* Next Station */}
          {nextStation && (
            <div className="flex items-start gap-2">
              <Train className="h-3 w-3 text-rail-cyan flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Next Station</div>
                <div className="text-[11px] font-bold text-foreground truncate">{nextStation.name}</div>
                {nextStation.platform && <div className="text-[10px] text-muted-foreground">Platform {nextStation.platform}</div>}
              </div>
            </div>
          )}

          {/* ETA */}
          {journey.ETA && (
            <div className="flex items-center gap-2">
              <Navigation className="h-3 w-3 text-rail-cyan flex-shrink-0" />
              <div>
                <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">ETA</div>
                <div className="text-xs font-bold text-foreground font-mono-tabular">{journey.ETA}</div>
              </div>
            </div>
          )}

          {/* Delay */}
          {journey.delayMinutes > 0 && (
            <div className="text-[10px] font-semibold text-amber-500">+{journey.delayMinutes}m delay</div>
          )}

          {/* Stale warning */}
          {isStale && (
            <div className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1">
              <WifiOff className="h-3 w-3 text-red-400 flex-shrink-0" />
              <span className="text-[10px] font-semibold text-red-400">
                {freshLbl === 'LAST KNOWN' ? 'Position may be outdated' : 'Data is stale'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getPolylinePoint(coords: [number, number][], pct: number): [number, number] {
  if (!coords || coords.length === 0) return [77.2194, 28.643];
  if (coords.length === 1 || pct <= 0) return coords[0];
  if (pct >= 100) return coords[coords.length - 1];
  const distances: number[] = [0];
  let totalDist = 0;
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i][0] - coords[i - 1][0];
    const dy = coords[i][1] - coords[i - 1][1];
    totalDist += Math.sqrt(dx * dx + dy * dy);
    distances.push(totalDist);
  }
  if (totalDist === 0) return coords[0];
  const targetDist = (pct / 100) * totalDist;
  for (let i = 1; i < coords.length; i++) {
    if (distances[i] >= targetDist) {
      const segLen = distances[i] - distances[i - 1];
      const t = segLen > 0 ? (targetDist - distances[i - 1]) / segLen : 0;
      return [coords[i - 1][0] + t * (coords[i][0] - coords[i - 1][0]), coords[i - 1][1] + t * (coords[i][1] - coords[i - 1][1])];
    }
  }
  return coords[coords.length - 1];
}
