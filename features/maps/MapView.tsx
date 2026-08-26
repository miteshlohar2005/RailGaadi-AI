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
} from 'lucide-react';
import { LiveJourney } from '@/types/train';
import { useJourneyStore } from '@/store/journey';
import { useTheme } from '@/providers/theme-provider';
import { cn } from '@/utils/cn';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || '';

const ANIM_DURATION_MS = 1200;

interface MapViewProps {
  journey: LiveJourney;
  className?: string;
}

/* ─── Geometry helpers ────────────────────────────────────────────── */

function polylineDistance(coords: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i][0] - coords[i - 1][0];
    const dy = coords[i][1] - coords[i - 1][1];
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
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
      return [
        coords[i - 1][0] + t * (coords[i][0] - coords[i - 1][0]),
        coords[i - 1][1] + t * (coords[i][1] - coords[i - 1][1]),
      ];
    }
  }
  return coords[coords.length - 1];
}

function splitRouteAtPct(
  coords: [number, number][],
  pct: number,
): { completed: [number, number][]; upcoming: [number, number][] } {
  if (!coords || coords.length < 2) {
    return { completed: coords || [], upcoming: [] };
  }
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
        const splitPt: [number, number] = [
          coords[i - 1][0] + t * (coords[i][0] - coords[i - 1][0]),
          coords[i - 1][1] + t * (coords[i][1] - coords[i - 1][1]),
        ];
        completed.push(splitPt);
        upcoming.push(splitPt);
        splitInserted = true;
      }
      upcoming.push(coords[i]);
    }
  }

  if (!splitInserted && completed.length > 0) {
    upcoming.unshift(completed[completed.length - 1]);
  }

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

function formatAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

/* ─── Train marker HTML ───────────────────────────────────────────── */

function buildTrainMarkerHTML(isDark: boolean, bearing: number): string {
  const glowColor = isDark ? 'rgba(6,182,212,0.5)' : 'rgba(2,132,199,0.45)';
  const ringColor = isDark ? 'rgba(6,182,212,0.2)' : 'rgba(2,132,199,0.18)';
  const bgGradient = isDark
    ? 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)'
    : 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)';
  const borderColor = isDark ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.35)';

  return `
    <div style="position:relative;display:flex;align-items:center;justify-content:center;width:48px;height:48px;pointer-events:none;" data-train-marker>
      <div style="position:absolute;inset:-6px;border-radius:50%;background:${ringColor};animation:trainPulse 2s ease-in-out infinite;"></div>
      <div style="position:absolute;inset:-2px;border-radius:50%;background:${glowColor};filter:blur(6px);animation:trainGlow 2.5s ease-in-out infinite;"></div>
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
        <span style="font-size:18px;line-height:1;transform:rotate(${-bearing}deg);">🚆</span>
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
    fromLng: number;
    fromLat: number;
    toLng: number;
    toLat: number;
    start: number;
    bearing: number;
  } | null>(null);
  const [updatedAgo, setUpdatedAgo] = useState('');

  /* ── 1. Initialize map (runs once) ────────────────────────────── */

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

    map.on('load', () => {
      mapRef.current = map;
      setMapLoaded(true);
    });

    map.on('dragstart', () => setFollowTrainMode(false));
    map.on('zoomstart', () => {
      if (map.dragPan.isEnabled()) setFollowTrainMode(false);
    });

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 2. Theme change ──────────────────────────────────────────── */

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      map.setStyle(getMapStyle(theme) as string);
    } catch { /* style transition may fail, safe to ignore */ }
  }, [theme]);

  /* ── 3. Route layers (completed + upcoming) ───────────────────── */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const allCoords: [number, number][] =
      journey.routeGeometry ||
      journey.stations
        .filter((s) => s.lat && s.lng)
        .map((s) => [s.lng, s.lat] as [number, number]);

    if (allCoords.length < 2) return;

    const { completed, upcoming } = splitRouteAtPct(allCoords, journey.completionPercentage);

    const completedGeo: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: completed },
    };
    const upcomingGeo: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: upcoming },
    };

    if (map.getSource('route-completed')) {
      (map.getSource('route-completed') as maplibregl.GeoJSONSource).setData(completedGeo);
    } else {
      map.addSource('route-completed', { type: 'geojson', data: completedGeo });
      map.addLayer({
        id: 'route-completed-glow',
        type: 'line',
        source: 'route-completed',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#0284c7',
          'line-width': 12,
          'line-opacity': 0.12,
          'line-blur': 8,
        },
      });
      map.addLayer({
        id: 'route-completed-line',
        type: 'line',
        source: 'route-completed',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#0ea5e9',
          'line-width': 4,
          'line-opacity': 0.9,
        },
      });
    }

    if (map.getSource('route-upcoming')) {
      (map.getSource('route-upcoming') as maplibregl.GeoJSONSource).setData(upcomingGeo);
    } else {
      map.addSource('route-upcoming', { type: 'geojson', data: upcomingGeo });
      map.addLayer({
        id: 'route-upcoming-line',
        type: 'line',
        source: 'route-upcoming',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': theme === 'dark' ? '#475569' : '#94a3b8',
          'line-width': 3,
          'line-opacity': 0.5,
          'line-dasharray': [2, 2],
        },
      });
    }
  }, [journey.routeGeometry, journey.stations, journey.completionPercentage, mapLoaded, theme]);

  /* ── 4. Train marker creation + smooth animation ──────────────── */

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    let trainLng = journey.currentLocation?.lng;
    let trainLat = journey.currentLocation?.lat;

    const allCoords: [number, number][] =
      journey.routeGeometry ||
      journey.stations
        .filter((s) => s.lat && s.lng)
        .map((s) => [s.lng, s.lat] as [number, number]);

    const isAtOrigin =
      trainLng === allCoords[0]?.[0] && trainLat === allCoords[0]?.[1];
    if ((!trainLng || !trainLat || (isAtOrigin && journey.completionPercentage > 2)) && allCoords.length > 1) {
      const pt = getPolylinePoint(allCoords, journey.completionPercentage);
      trainLng = pt[0];
      trainLat = pt[1];
    }

    if (!trainLng || !trainLat) return;

    const bearing = journey.currentLocation?.heading || 0;

    if (!trainMarkerRef.current) {
      const el = document.createElement('div');
      el.style.pointerEvents = 'auto';
      el.style.cursor = 'pointer';
      el.innerHTML = buildTrainMarkerHTML(theme === 'dark', bearing);

      const popup = new maplibregl.Popup({
        offset: 20,
        closeButton: false,
        className: 'train-popup',
      }).setHTML(buildPopupHTML(journey));

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([trainLng, trainLat])
        .setPopup(popup)
        .addTo(map);

      trainMarkerRef.current = marker;
      trainMarkerElRef.current = el;
      prevPosRef.current = { lng: trainLng, lat: trainLat };
    } else {
      // Smooth animation from previous to new position
      const prev = prevPosRef.current;
      const targetLng = trainLng;
      const targetLat = trainLat;

      if (prev && (Math.abs(prev.lng - targetLng) > 1e-7 || Math.abs(prev.lat - targetLat) > 1e-7)) {
        const fromLng = prev.lng;
        const fromLat = prev.lat;
        const calculatedBearing = calcBearing(fromLng, fromLat, targetLng, targetLat);
        const finalBearing = bearing || calculatedBearing;

        cancelAnimationFrame(animFrameRef.current);
        animStateRef.current = {
          fromLng,
          fromLat,
          toLng: targetLng,
          toLat: targetLat,
          start: performance.now(),
          bearing: finalBearing,
        };

        const animate = (now: number) => {
          const state = animStateRef.current;
          if (!state) return;
          const elapsed = now - state.start;
          const t = Math.min(elapsed / ANIM_DURATION_MS, 1);
          const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

          const curLng = state.fromLng + (state.toLng - state.fromLng) * ease;
          const curLat = state.fromLat + (state.toLat - state.fromLat) * ease;

          trainMarkerRef.current?.setLngLat([curLng, curLat]);

          // Update marker rotation
          const el = trainMarkerElRef.current;
          if (el) {
            const inner = el.querySelector('[data-train-marker]') as HTMLElement;
            if (inner) {
              const body = inner.querySelector('div:nth-child(3)') as HTMLElement;
              const icon = inner.querySelector('span') as HTMLElement;
              if (body) body.style.transform = `rotate(${finalBearing}deg)`;
              if (icon) icon.style.transform = `rotate(${-finalBearing}deg)`;
            }
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
        prevPosRef.current = { lng: trainLng, lat: trainLat };
      }

      // Update marker appearance + popup
      const el = trainMarkerRef.current.getElement();
      el.innerHTML = buildTrainMarkerHTML(theme === 'dark', bearing);
      trainMarkerElRef.current = el;
      trainMarkerRef.current.setPopup(
        new maplibregl.Popup({ offset: 20, closeButton: false, className: 'train-popup' })
          .setHTML(buildPopupHTML(journey))
      );
    }

    // Camera follow
    if (followTrainMode) {
      map.easeTo({
        center: [trainLng, trainLat],
        duration: 1000,
        essential: true,
      });
    }
  }, [journey, mapLoaded, followTrainMode, theme]);

  /* ── 5. Station markers ───────────────────────────────────────── */

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
      const bg = isCurrent
        ? theme === 'dark' ? '#06b6d4' : '#0284c7'
        : isPassed
        ? '#10b981'
        : theme === 'dark' ? '#475569' : '#94a3b8';
      const ring = isCurrent ? `0 0 0 4px ${theme === 'dark' ? 'rgba(6,182,212,0.25)' : 'rgba(2,132,199,0.22)'}` : 'none';

      el.innerHTML = `<div style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        background:${bg};
        border:2px solid ${theme === 'dark' ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.8)'};
        box-shadow:${ring};
        transition:transform 0.15s;
      " onmouseover="this.style.transform='scale(1.6)'" onmouseout="this.style.transform='scale(1)'"></div>`;

      const popup = new maplibregl.Popup({ offset: 10, closeButton: false }).setHTML(`
        <div style="padding:10px;font-family:Inter,system-ui,sans-serif;background:rgba(15,23,42,0.95);color:white;border-radius:12px;border:1px solid rgba(148,163,184,0.1);min-width:140px;">
          <div style="font-weight:700;font-size:12px;">${st.name} <span style="opacity:0.5">(${st.code})</span></div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${st.distanceKm} km from origin</div>
          <div style="font-size:11px;font-weight:600;margin-top:3px;color:${st.delayMinutes > 0 ? '#fbbf24' : '#34d399'}">
            ${st.delayMinutes > 0 ? `+${st.delayMinutes}m delay` : 'On time'}
          </div>
          ${st.platform ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px;">Platform ${st.platform}</div>` : ''}
        </div>`);

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([st.lng, st.lat])
        .setPopup(popup)
        .addTo(map);
      stationMarkersRef.current.push(marker);
    });
  }, [journey.stations, mapLoaded, theme]);

  /* ── 6. "Updated X ago" timer ─────────────────────────────────── */

  useEffect(() => {
    if (!journey.lastUpdated) return;
    const tick = () => setUpdatedAgo(formatAgo(journey.lastUpdated));
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [journey.lastUpdated]);

  /* ── 7. Cleanup animation on unmount ──────────────────────────── */

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  /* ── Handlers ──────────────────────────────────────────────────── */

  const handleCenter = useCallback(() => {
    setFollowTrainMode(true);
    const j = journeyRef.current;
    const lng = j.currentLocation?.lng || j.stations[0]?.lng || 77.22;
    const lat = j.currentLocation?.lat || j.stations[0]?.lat || 28.64;
    mapRef.current?.easeTo({ center: [lng, lat], zoom: 9, duration: 800, essential: true });
  }, [setFollowTrainMode]);

  const handleToggleFollow = useCallback(() => {
    if (!followTrainMode) {
      handleCenter();
    } else {
      setFollowTrainMode(false);
    }
  }, [followTrainMode, setFollowTrainMode, handleCenter]);

  /* ── Derived data for status card ──────────────────────────────── */

  const speed = journey.speedKmh || 0;
  const nextStation = journey.nextStation;
  const isDark = theme === 'dark';

  /* ── Render ────────────────────────────────────────────────────── */

  return (
    <div className={cn('relative overflow-hidden rounded-3xl shadow-glass', className)}>
      {/* Inject keyframes for train marker animations */}
      <style jsx global>{`
        @keyframes trainPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes trainGlow {
          0%, 100% { opacity: 0.7; filter: blur(6px); }
          50% { opacity: 0.3; filter: blur(10px); }
        }
        .train-popup .maplibregl-popup-content {
          padding: 0 !important;
          background: transparent !important;
          border-radius: 12px !important;
          box-shadow: none !important;
        }
        .train-popup .maplibregl-popup-tip {
          border-top-color: rgba(15,23,42,0.95) !important;
        }
      `}</style>

      <div ref={mapContainerRef} className="h-full w-full min-h-[420px]" />

      {/* ── Floating Controls (top-right) ─────────────────────────── */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          title="Zoom In"
          className="glass-panel flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground shadow-md transition-all hover:scale-105"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          title="Zoom Out"
          className="glass-panel flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground shadow-md transition-all hover:scale-105"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={handleCenter}
          title="Center on Train"
          className={cn(
            'glass-panel flex h-9 w-9 items-center justify-center rounded-xl shadow-md transition-all hover:scale-105',
            followTrainMode ? 'text-rail-blue border border-rail-blue/30' : 'text-muted-foreground'
          )}
        >
          <Target className="h-4 w-4" />
        </button>
      </div>

      {/* ── Follow Mode Toggle (bottom-left) ──────────────────────── */}
      <div className="absolute bottom-3 left-3 z-10">
        <button
          onClick={handleToggleFollow}
          className={cn(
            'glass-panel flex items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-semibold shadow-md transition-all hover:scale-[1.02]',
            followTrainMode
              ? 'text-rail-blue border border-rail-blue/30'
              : 'text-muted-foreground'
          )}
        >
          {followTrainMode ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
          <span className={cn(
            'h-1.5 w-1.5 rounded-full',
            followTrainMode ? 'bg-rail-blue animate-pulse' : 'bg-muted-foreground'
          )} />
          {followTrainMode ? 'Following Train' : 'Follow Train'}
        </button>
      </div>

      {/* ── Live Indicator (top-left) ─────────────────────────────── */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="glass-panel flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 shadow-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Live
          </span>
        </div>
        {updatedAgo && (
          <div className="glass-panel rounded-xl px-2 py-1 shadow-md">
            <span className="text-[10px] font-medium text-muted-foreground">
              {updatedAgo}
            </span>
          </div>
        )}
      </div>

      {/* ── Current Location Card (bottom-right) ──────────────────── */}
      <div className="absolute bottom-3 right-3 z-10 max-w-[200px]">
        <div className="glass-panel rounded-2xl p-3 shadow-lg space-y-2">
          {/* Speed */}
          <div className="flex items-center gap-2">
            <CircleDot className="h-3 w-3 text-rail-blue flex-shrink-0" />
            <div>
              <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                Speed
              </div>
              <div className="text-sm font-bold text-foreground font-mono-tabular">
                {speed} <span className="text-[10px] font-semibold text-muted-foreground">km/h</span>
              </div>
            </div>
          </div>

          {/* Next Station */}
          {nextStation && (
            <div className="flex items-start gap-2">
              <Train className="h-3 w-3 text-rail-cyan flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Next Station
                </div>
                <div className="text-[11px] font-bold text-foreground truncate">
                  {nextStation.name}
                </div>
                {nextStation.platform && (
                  <div className="text-[10px] text-muted-foreground">
                    Platform {nextStation.platform}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ETA */}
          {journey.ETA && (
            <div className="flex items-center gap-2">
              <Navigation className="h-3 w-3 text-rail-cyan flex-shrink-0" />
              <div>
                <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                  ETA
                </div>
                <div className="text-xs font-bold text-foreground font-mono-tabular">
                  {journey.ETA}
                </div>
              </div>
            </div>
          )}

          {/* Delay */}
          {journey.delayMinutes > 0 && (
            <div className="text-[10px] font-semibold text-amber-500">
              +{journey.delayMinutes}m delay
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Popup HTML builder ──────────────────────────────────────────── */

function buildPopupHTML(j: LiveJourney): string {
  const delayText = j.delayMinutes > 0 ? `+${j.delayMinutes}m` : 'On time';
  const delayColor = j.delayMinutes > 0 ? '#fbbf24' : '#34d399';
  return `
    <div style="padding:10px 12px;font-family:Inter,system-ui,sans-serif;background:rgba(15,23,42,0.95);color:white;border-radius:12px;border:1px solid rgba(148,163,184,0.1);min-width:160px;">
      <div style="font-weight:700;font-size:12px;">${j.name}</div>
      <div style="font-size:11px;color:#94a3b8;">#${j.number}</div>
      <div style="font-size:11px;font-weight:600;margin-top:4px;color:#38bdf8;">
        ${j.speedKmh} km/h · <span style="color:${delayColor}">${delayText}</span>
      </div>
      ${j.currentStation ? `<div style="font-size:10px;color:#94a3b8;margin-top:3px;">At: ${j.currentStation.name}</div>` : ''}
    </div>`;
}
