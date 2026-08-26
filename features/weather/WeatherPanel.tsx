'use client';

import React, { useEffect, useState, useRef } from 'react';
import { CloudSun, Loader2, AlertTriangle } from 'lucide-react';
import { LiveJourney } from '@/types/train';
import { WeatherCard } from './WeatherCard';
import { WeatherData } from '@/lib/openweather';

interface WeatherPanelProps {
  journey: LiveJourney;
}

export function WeatherPanel({ journey }: WeatherPanelProps) {
  const [weatherData, setWeatherData] = useState<{
    current?: WeatherData;
    next?: WeatherData;
    dest?: WeatherData;
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function loadWeather() {
      setLoading(true);
      setError(false);
      try {
        const currSt = journey.currentStation || journey.previousStation || journey.stations[0];
        const nextSt = journey.nextStation || journey.stations[journey.stations.length - 1];
        const destSt = journey.stations[journey.stations.length - 1];

        const [currRes, nextRes, destRes] = await Promise.all([
          fetch(`/api/weather?lat=${currSt.lat}&lng=${currSt.lng}&name=${encodeURIComponent(currSt.name)}&code=${currSt.code}`, { signal: controller.signal }),
          fetch(`/api/weather?lat=${nextSt.lat}&lng=${nextSt.lng}&name=${encodeURIComponent(nextSt.name)}&code=${nextSt.code}`, { signal: controller.signal }),
          fetch(`/api/weather?lat=${destSt.lat}&lng=${destSt.lng}&name=${encodeURIComponent(destSt.name)}&code=${destSt.code}`, { signal: controller.signal }),
        ]);

        if (!currRes.ok || !nextRes.ok || !destRes.ok) {
          setError(true);
          return;
        }

        const [currJson, nextJson, destJson] = await Promise.all([
          currRes.json(),
          nextRes.json(),
          destRes.json(),
        ]);

        setWeatherData({
          current: currJson.data,
          next: nextJson.data,
          dest: destJson.data,
        });
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return;
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadWeather();

    return () => controller.abort();
  }, [journey]);

  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-rail-blue" />
          Loading live weather intelligence...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span>Weather data temporarily unavailable.</span>
        </div>
      </div>
    );
  }

  if (!weatherData.current) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 font-bold text-foreground">
        <CloudSun className="h-5 w-5 text-amber-400" />
        <span className="text-base">Weather Intelligence</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {weatherData.current && (
          <WeatherCard label="Current Station" weather={weatherData.current} />
        )}
        {weatherData.next && (
          <WeatherCard label="Next Station" weather={weatherData.next} />
        )}
        {weatherData.dest && (
          <WeatherCard label="Destination" weather={weatherData.dest} />
        )}
      </div>
    </div>
  );
}
