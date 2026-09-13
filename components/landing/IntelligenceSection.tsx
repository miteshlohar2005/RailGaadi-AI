'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Route, CloudRain, Lightbulb, ArrowRight, Cpu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Capability {
  index: string;
  icon: LucideIcon;
  title: string;
  description: string;
  status: 'soon' | 'live';
}

const CAPABILITIES: Capability[] = [
  {
    index: '01',
    icon: AlertTriangle,
    title: 'Delay Prediction',
    description: 'Historical delay pattern analysis for smarter journey planning.',
    status: 'soon',
  },
  {
    index: '02',
    icon: Route,
    title: 'Route Intelligence',
    description: 'Optimal route recommendations based on real-time network conditions.',
    status: 'soon',
  },
  {
    index: '03',
    icon: CloudRain,
    title: 'Weather Risk',
    description: 'Weather impact assessment on train schedules and route conditions.',
    status: 'live',
  },
  {
    index: '04',
    icon: Lightbulb,
    title: 'Journey Insights',
    description: 'Smart recommendations for optimal travel planning.',
    status: 'soon',
  },
];

const DATA_SOURCES = ['RailRadar', 'OpenWeather', 'OpenTopography', 'Overpass API'];

function StatusBadge({ status }: { status: 'soon' | 'live' }) {
  return status === 'live' ? (
    <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 live-dot" />
      Live
    </span>
  ) : (
    <span className="rounded-full border border-sky-300/25 bg-sky-300/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-sky-300">
      Soon
    </span>
  );
}

export function IntelligenceSection() {
  return (
    <section id="intelligence" className="scroll-mt-16 relative overflow-hidden bg-rail-navy">
      {/* Subtle control-room grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-[720px] -translate-x-1/2 rounded-full bg-rail-blue/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:py-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-rail-bright">
            Intelligence Layer
          </span>
          <h2 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-[42px] lg:text-[46px]">
            RailGaadi Intelligence
          </h2>
          <p className="mt-4 text-base leading-relaxed text-sky-200/80 sm:text-lg">
            AI-powered insights built on top of real-time railway data, weather and terrain
            analysis.
          </p>
        </motion.div>

        {/* Capabilities index */}
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-x-12 md:grid-cols-2">
          {CAPABILITIES.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
              className={cn(
                'group border-b border-white/10 py-7 transition-colors duration-300',
                'hover:border-rail-bright/50'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-bold tracking-[0.2em] text-sky-300/60">
                  {cap.index}
                </span>
                <StatusBadge status={cap.status} />
              </div>
              <div className="mt-3 flex items-start gap-4">
                <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-rail-bright">
                  <cap.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">{cap.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-sky-200/70">
                    {cap.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Data pipeline strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto mt-12 flex max-w-4xl flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-5 sm:flex-row sm:justify-between"
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-widest text-sky-300/60">
              Built on
            </span>
            {DATA_SOURCES.map((s) => (
              <span
                key={s}
                className="rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-sky-100/90"
              >
                {s}
              </span>
            ))}
          </div>
          <span className="flex shrink-0 items-center gap-2 text-[12px] font-bold text-rail-bright">
            <Cpu className="h-4 w-4" strokeWidth={1.8} />
            RailGaadi AI layer
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
          </span>
        </motion.div>
      </div>
    </section>
  );
}