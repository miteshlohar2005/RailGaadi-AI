'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Zap, Cloud, Mountain, Route, BarChart3 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/utils/cn';

const features = [
  {
    icon: MapPin,
    title: 'Vector Map Tracking',
    description: 'MapTiler dark vector tiles with animated live train marker, route glow, and follow camera.',
    color: 'from-rail-blue/20 to-rail-cyan/10',
    iconColor: 'text-rail-blue',
  },
  {
    icon: Zap,
    title: 'Live 30s Auto-Refresh',
    description: 'TanStack Query polls RailRadar every 30 seconds for position, delay, and ETA updates.',
    color: 'from-emerald-500/20 to-emerald-600/10',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Cloud,
    title: 'Weather Intelligence',
    description: 'Per-station live weather from OpenWeather along your train route.',
    color: 'from-amber-500/20 to-orange-600/10',
    iconColor: 'text-amber-400',
  },
  {
    icon: Mountain,
    title: 'Terrain Analytics',
    description: 'OpenTopography SRTM elevation profiles and Overpass API terrain features.',
    color: 'from-emerald-600/20 to-teal-600/10',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Route,
    title: 'Station Timeline',
    description: 'Visual journey timeline with live status, delays, platform info, and distance.',
    color: 'from-rail-cyan/20 to-blue-600/10',
    iconColor: 'text-rail-cyan',
  },
  {
    icon: BarChart3,
    title: 'Delay Analytics',
    description: 'Per-station delay history, delay distribution, and journey analytics charts.',
    color: 'from-rose-500/20 to-pink-600/10',
    iconColor: 'text-rose-400',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-rail-blue mb-4 block">Capabilities</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            Everything you need to <span className="gradient-text">track trains</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Real-time intelligence powered by live data APIs, weather services, and terrain analysis.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <GlassCard className="h-full">
                <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br mb-4', feature.color)}>
                  <feature.icon className={cn('h-5 w-5', feature.iconColor)} />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
