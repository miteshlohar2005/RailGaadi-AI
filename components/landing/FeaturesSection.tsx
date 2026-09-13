'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Activity, CloudSun, Mountain, Route } from 'lucide-react';
import { cn } from '@/utils/cn';

const GRID_V = [40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 480];
const GRID_H = [40, 80, 120, 160, 200, 240, 280];

const STATIONS = [
  { x: 40, y: 270, label: 'MMCT', major: true },
  { x: 150, y: 200, label: null },
  { x: 250, y: 150, label: 'BPL', major: true, current: true },
  { x: 360, y: 95, label: null },
  { x: 480, y: 44, label: 'NDLS', major: true },
];

function MiniMap() {
  return (
    <svg
      viewBox="0 0 520 320"
      className="block w-full select-none"
      role="img"
      aria-label="Live route preview between Mumbai Central and New Delhi"
    >
      <rect x="0" y="0" width="520" height="320" fill="#F4F8FD" rx="14" />
      {GRID_V.map((x) => (
        <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="320" stroke="#E3EDF8" strokeWidth="1" />
      ))}
      {GRID_H.map((y) => (
        <line key={`h-${y}`} x1="0" y1={y} x2="520" y2={y} stroke="#E3EDF8" strokeWidth="1" />
      ))}

      {/* Route glow + line */}
      <path
        d="M40,270 C150,240 190,180 250,150 S420,80 480,44"
        fill="none"
        stroke="#087FE5"
        strokeOpacity="0.14"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M40,270 C150,240 190,180 250,150 S420,80 480,44"
        fill="none"
        stroke="#9DC4F0"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M40,270 C150,240 190,180 250,150 S420,80 480,44"
        fill="none"
        stroke="#087FE5"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        className="route-draw-path"
        d="M40,270 C150,240 190,180 250,150 S420,80 480,44"
        fill="none"
        stroke="#19A7F2"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Stations */}
      {STATIONS.map((s) => (
        <g key={`${s.x}-${s.y}`}>
          {s.current && (
            <circle cx={s.x} cy={s.y} r="11" fill="#087FE5" opacity="0.18">
              <animate attributeName="r" values="8;15;8" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2.4s" repeatCount="indefinite" />
            </circle>
          )}
          <circle
            cx={s.x}
            cy={s.y}
            r={s.current ? 6 : 4.5}
            fill="#FFFFFF"
            stroke={s.current ? '#087FE5' : '#7FAEDC'}
            strokeWidth="2.5"
          />
          {s.label && (
            <text
              x={s.x}
              y={s.y > 250 ? s.y + 18 : s.y - 10}
              textAnchor="middle"
              fontFamily="var(--font-poppins), sans-serif"
              fontSize="10"
              fontWeight="700"
              fill={s.current ? '#087FE5' : '#6484A6'}
              letterSpacing="0.5"
            >
              {s.label}
            </text>
          )}
        </g>
      ))}

      {/* Train marker */}
      <g>
        <circle cx="302" cy="126" r="14" fill="#087FE5" opacity="0.16">
          <animate attributeName="r" values="10;18;10" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.28;0.06;0.28" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="302" cy="126" r="8" fill="#087FE5" />
        <circle cx="304" cy="124" r="3" fill="#FFFFFF" />
        <text
          x="322"
          y="122"
          fontFamily="var(--font-mono), monospace"
          fontSize="11"
          fontWeight="700"
          fill="#071A3D"
        >
          12951
        </text>
      </g>

      {/* Status chips */}
      <g fontFamily="var(--font-poppins), sans-serif">
        <circle cx="36" cy="28" r="3.5" fill="#10B981" />
        <rect x="14" y="16" width="92" height="24" rx="12" fill="#FFFFFF" stroke="#E2ECF7" />
        <text x="52" y="32" fontSize="10.5" fontWeight="700" fill="#16233B">
          72 km/h
        </text>
        <rect x="392" y="112" width="102" height="24" rx="12" fill="#FFFFFF" stroke="#E2ECF7" />
        <text x="443" y="128" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#10B981">
          ON TIME
        </text>
        <rect x="386" y="160" width="118" height="24" rx="12" fill="#FFFFFF" stroke="#E2ECF7" />
        <text x="445" y="176" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#16233B">
          ETA 06:35
        </text>
      </g>

      {/* Mock map UI: zoom controls + scale bar */}
      <g fontFamily="var(--font-poppins), sans-serif">
        <rect x="470" y="272" width="30" height="26" rx="6" fill="#FFFFFF" stroke="#DCE8F4" />
        <text x="485" y="290" textAnchor="middle" fontSize="16" fill="#52637A" fontWeight="600">
          +
        </text>
        <rect x="470" y="300" width="30" height="26" rx="6" fill="#FFFFFF" stroke="#DCE8F4" />
        <text x="485" y="318" textAnchor="middle" fontSize="16" fill="#52637A" fontWeight="600">
          -
        </text>
        <line x1="40" y1="300" x2="100" y2="300" stroke="#8FA7BF" strokeWidth="2" />
        <line x1="40" y1="300" x2="40" y2="296" stroke="#8FA7BF" strokeWidth="2" />
        <line x1="100" y1="300" x2="100" y2="296" stroke="#8FA7BF" strokeWidth="2" />
        <text x="116" y="304" fontSize="9.5" fontWeight="600" fill="#8FA7BF">
          100 km
        </text>
      </g>
    </svg>
  );
}

const FEATURES = [
  {
    index: '01',
    title: 'Live Tracking',
    description: 'Track any train in real-time with an interactive map.',
    icon: MapPin,
    large: true,
  },
  {
    index: '02',
    title: 'Delay Analytics',
    description: 'Predict delays using AI-powered insights.',
    icon: Activity,
    large: false,
  },
  {
    index: '03',
    title: 'Weather Intelligence',
    description: 'Live weather along your train route.',
    icon: CloudSun,
    large: false,
  },
  {
    index: '04',
    title: 'Terrain Analysis',
    description: 'Elevation profiles and route intelligence.',
    icon: Mountain,
    large: false,
  },
  {
    index: '05',
    title: 'Station Timeline',
    description: 'Complete journey timeline and platform information.',
    icon: Route,
    large: false,
  },
];

function ModuleCard({
  feature,
  className,
  delay,
  children,
}: {
  feature: (typeof FEATURES)[number];
  className?: string;
  delay: number;
  children?: React.ReactNode;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-border bg-surface p-7 transition-all duration-300',
        'hover:-translate-y-1 hover:border-rail-blue/30 hover:shadow-[0_18px_40px_-20px_rgba(7,26,61,0.25)]',
        className
      )}
    >
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {feature.index}
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rail-blue/[0.08] text-rail-blue transition-colors duration-300 group-hover:bg-rail-blue group-hover:text-white">
          <feature.icon className="h-5 w-5" strokeWidth={1.9} />
        </span>
      </div>
      <h3 className="mt-5 text-xl font-bold tracking-tight text-foreground">{feature.title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
        {feature.description}
      </p>
      {children}
    </motion.article>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-16 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Editorial heading */}
        <div className="mb-14 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55 }}
            className="lg:col-span-7"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-rail-blue">
              Capabilities
            </span>
            <h2 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-[42px] lg:text-[48px]">
              Everything you need
              <br />
              for a smarter journey.
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-base leading-relaxed text-muted-foreground lg:col-span-5 lg:justify-self-end lg:max-w-md sm:text-lg"
          >
            Real-time intelligence powered by live railway data, weather services and terrain
            analysis.
          </motion.p>
        </div>

        {/* Asymmetric editorial grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12">
          <ModuleCard
            feature={FEATURES[0]}
            delay={0}
            className="md:col-span-2 lg:col-span-7"
          >
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-100 ring-1 ring-slate-100/60">
              <MiniMap />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 text-[12.5px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 live-dot" />
                Next stop: Bhopal
              </span>
              <span>ETA 06:35</span>
              <span>Distance left 1,137 km</span>
            </div>
          </ModuleCard>

          <ModuleCard feature={FEATURES[1]} delay={0.06} className="lg:col-span-5" />

          <ModuleCard feature={FEATURES[2]} delay={0.1} className="lg:col-span-4" />
          <ModuleCard feature={FEATURES[3]} delay={0.14} className="lg:col-span-3" />
          <ModuleCard feature={FEATURES[4]} delay={0.18} className="lg:col-span-5" />
        </div>
      </div>
    </section>
  );
}