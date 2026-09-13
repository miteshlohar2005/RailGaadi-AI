'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

function RouteLineBg() {
  return (
    <svg
      viewBox="0 0 840 320"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {/* faint route network */}
      <path
        d="M0,220 Q140,150 300,190 T700,120 T840,150"
        fill="none"
        stroke="#087FE5"
        strokeWidth="1.4"
        strokeOpacity="0.14"
      />
      <path
        d="M0,220 Q140,150 300,190 T700,120 T840,150"
        fill="none"
        stroke="#087FE5"
        strokeWidth="2.4"
        strokeDasharray="2 9"
        strokeOpacity="0.4"
      />
      <path
        d="M0,380 Q200,320 420,350 T840,330"
        fill="none"
        stroke="#087FE5"
        strokeWidth="1.2"
        strokeOpacity="0.1"
      />
      {[
        [0, 220],
        [300, 190],
        [700, 120],
      ].map(([x, y]) => (
        <g key={`${x}`}>
          <circle cx={x} cy={y} r="3.5" fill="#087FE5" opacity="0.5" />
          <circle cx={x} cy={y} r="7" fill="#087FE5" opacity="0.12" />
        </g>
      ))}
      <circle cx="840" cy="150" r="3.5" fill="#087FE5" opacity="0.5" />
    </svg>
  );
}

export function CTASection() {
  return (
    <section id="api" className="scroll-mt-16 pb-20 sm:pb-24 lg:pb-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-surface"
        >
          <RouteLineBg />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage:
                'linear-gradient(hsl(var(--border-subtle)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border-subtle)) 1px, transparent 1px)',
              backgroundSize: '96px 96px',
              maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            }}
          />

          <div className="relative z-10 px-6 py-16 text-center sm:px-14 sm:py-20">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rail-blue/25 bg-rail-blue/[0.06] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-rail-blue">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
              Open for Everyone
            </span>

            <h2 className="mx-auto mt-5 max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-[42px] lg:text-[46px]">
              Ready to track your train?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Search any train number to get started with real-time tracking, delay analytics,
              weather intelligence and terrain analysis.
            </p>

            <Link
              href="/#track"
              className="group mt-8 inline-flex items-center gap-2.5 rounded-xl bg-rail-blue px-8 py-4 text-[15px] font-semibold text-white shadow-[0_14px_30px_-12px_rgba(8,127,229,0.55)] transition-all duration-200 hover:bg-rail-navy hover:shadow-[0_16px_36px_-12px_rgba(7,26,61,0.55)] active:translate-y-[1px]"
            >
              Start Tracking
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.4} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}