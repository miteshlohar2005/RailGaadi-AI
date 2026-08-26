'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Route, Cloud, Mountain, Lightbulb, Lock } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

const intelligenceFeatures = [
  {
    icon: AlertTriangle,
    title: 'Delay Prediction',
    description: 'Historical delay pattern analysis for smarter journey planning.',
    status: 'Coming Soon' as const,
    color: 'text-amber-400',
    bg: 'from-amber-500/15 to-orange-600/10',
  },
  {
    icon: Route,
    title: 'Route Intelligence',
    description: 'Optimal route recommendations based on real-time network conditions.',
    status: 'Coming Soon' as const,
    color: 'text-rail-blue',
    bg: 'from-rail-blue/15 to-rail-cyan/10',
  },
  {
    icon: Cloud,
    title: 'Weather Risk',
    description: 'Weather impact assessment on train schedules and route conditions.',
    status: 'Active' as const,
    color: 'text-emerald-400',
    bg: 'from-emerald-500/15 to-teal-600/10',
  },
  {
    icon: Mountain,
    title: 'Terrain Analysis',
    description: 'Elevation profiling and terrain feature detection along routes.',
    status: 'Active' as const,
    color: 'text-emerald-400',
    bg: 'from-emerald-500/15 to-teal-600/10',
  },
  {
    icon: Lightbulb,
    title: 'Journey Insights',
    description: 'Smart recommendations for optimal travel windows and connections.',
    status: 'Coming Soon' as const,
    color: 'text-rail-cyan',
    bg: 'from-rail-cyan/15 to-blue-600/10',
  },
];

export function IntelligenceSection() {
  return (
    <section className="py-24 px-4 sm:px-6 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] radial-glow opacity-50" />

      <div className="mx-auto max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-rail-cyan mb-4 block">Intelligence</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            RailGaadi <span className="gradient-text">Intelligence</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            AI-powered insights built on top of real-time railway data, weather, and terrain analysis.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {intelligenceFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <GlassCard className="h-full relative overflow-hidden">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${feature.bg} mb-4`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-bold text-foreground">{feature.title}</h3>
                  {feature.status === 'Coming Soon' && (
                    <span className="flex items-center gap-1 rounded-full bg-secondary border border-border px-2 py-0.5 text-[9px] font-bold text-muted-foreground uppercase">
                      <Lock className="h-2.5 w-2.5" />
                      Soon
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
