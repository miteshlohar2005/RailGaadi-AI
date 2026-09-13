'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, Leaf } from 'lucide-react';

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: 'Trusted Data',
    description: 'Powered by reliable railway sources.',
  },
  {
    icon: Users,
    title: 'For Every Traveller',
    description: 'Simple. Fast. Reliable.',
  },
  {
    icon: Leaf,
    title: 'A Greener Tomorrow',
    description: 'Smarter travel. Lower emissions.',
  },
];

function NetworkLineArt() {
  return (
    <svg
      viewBox="0 0 560 220"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Subtle line art of an Indian railway station canopy"
    >
      <g fill="none" stroke="#071A3D" strokeWidth="1.6">
        {/* Canopy truss */}
        <path d="M40,150 C120,84 220,58 520,64" opacity="0.18" />
        <path d="M40,150 L120,74 L220,58 L320,60 L420,70 L520,64" opacity="0.14" />
        <line x1="120" y1="74" x2="110" y2="150" opacity="0.1" />
        <line x1="220" y1="58" x2="224" y2="150" opacity="0.1" />
        <line x1="320" y1="60" x2="330" y2="150" opacity="0.1" />
        <line x1="420" y1="70" x2="414" y2="150" opacity="0.1" />
        {/* Columns */}
        <line x1="40" y1="150" x2="40" y2="204" opacity="0.2" />
        <line x1="150" y1="150" x2="150" y2="204" opacity="0.16" />
        <line x1="260" y1="150" x2="260" y2="204" opacity="0.16" />
        <line x1="370" y1="150" x2="370" y2="204" opacity="0.16" />
        <line x1="520" y1="150" x2="520" y2="204" opacity="0.12" />
      </g>

      {/* Platform edge */}
      <path d="M20,204 H540" stroke="#071A3D" strokeWidth="2" opacity="0.22" />
      <g stroke="#071A3D" strokeWidth="1.6" opacity="0.12">
        <path d="M30,214 Q80,206 120,212 T200,210 T280,214 T360,212 T440,210 T520,214" strokeWidth="1.4" />
        <path d="M20,196 H540" strokeWidth="1.2" strokeDasharray="2 7" />
      </g>

      {/* Signal post */}
      <g stroke="#071A3D" strokeWidth="1.6" opacity="0.2">
        <line x1="486" y1="204" x2="486" y2="84" />
        <line x1="486" y1="84" x2="504" y2="84" />
        <circle cx="504" cy="84" r="7" fill="none" />
      </g>

      {/* Train front silhouette */}
      <g opacity="0.22">
        <path
          d="M60,204 L60,180 Q60,174 66,174 L150,174 Q154,174 154,170 L154,164 L168,164 Q172,164 172,168 L172,204 Z"
          fill="#071A3D"
          stroke="none"
        />
        <rect x="66" y="178" width="84" height="5" rx="2.5" fill="#FFFFFF" stroke="none" />
      </g>
    </svg>
  );
}

export function TrustSection() {
  return (
    <section id="network" className="scroll-mt-16 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55 }}
            className="lg:col-span-7"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-rail-blue">
              The Network
            </span>
            <h2 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-[42px] lg:text-[48px]">
              India&rsquo;s Rail Network,
              <br />
              Now Smarter.
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <NetworkLineArt />
          </motion.div>
        </div>

        {/* Trust points */}
        <div className="mt-14 grid grid-cols-1 gap-8 border-t border-border pt-10 md:grid-cols-3 md:gap-6">
          {TRUST_POINTS.map((point, i) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex items-start gap-4"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-rail-blue">
                <point.icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <h3 className="text-[16px] font-bold text-foreground">{point.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {point.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}