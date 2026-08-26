import React from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets } from 'lucide-react';
import { WeatherData } from '@/lib/openweather';
import { cn } from '@/utils/cn';

interface WeatherCardProps {
  label: string;
  weather: WeatherData;
  className?: string;
}

export function WeatherCard({ label, weather, className }: WeatherCardProps) {
  const isRain = weather.condition.toLowerCase().includes('rain');
  const isSun = weather.condition.toLowerCase().includes('clear');

  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-5 space-y-3 transition-all',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-rail-blue">
          {label}
        </span>
        {isSun ? (
          <Sun className="h-5 w-5 text-amber-400" />
        ) : isRain ? (
          <CloudRain className="h-5 w-5 text-sky-400" />
        ) : (
          <Cloud className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <div>
        <h4 className="font-bold text-foreground text-sm">
          {weather.stationName || 'Station'} ({weather.stationCode || '---'})
        </h4>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-2xl font-extrabold text-foreground">
            {weather.tempC}°C
          </span>
          <span className="text-xs text-muted-foreground">Feels {weather.feelsLikeC}°C</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs font-semibold text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Wind className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{weather.windSpeedKmh} km/h</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets className="h-3.5 w-3.5 text-sky-500" />
          <span>{weather.humidity}%</span>
        </div>
      </div>
    </div>
  );
}
