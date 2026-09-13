'use client';

import React from 'react';
import Link from 'next/link';
import { Train, Heart } from 'lucide-react';

const FOOTER_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/train/12951', label: 'Live Tracking' },
  { href: '/favorites', label: 'Favorites' },
  { href: '/share', label: 'Share' },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex flex-col items-center justify-between gap-8 lg:flex-row lg:items-start">
          {/* Brand */}
          <div className="flex flex-col items-center gap-3 lg:items-start">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rail-navy">
                <Train className="h-4 w-4 text-rail-bright" strokeWidth={2.2} />
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-bold tracking-tight text-foreground">
                  RailGaadi
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-rail-blue">
                  AI
                </span>
              </span>
            </Link>
            <p className="max-w-[220px] text-center text-xs leading-relaxed text-muted-foreground lg:text-left">
              Real-time Indian railway intelligence &amp; train tracking.
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-rail-blue"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Credits */}
          <div className="flex flex-col items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Powered by
              <span className="font-semibold text-foreground/80">RailRadar, MapTiler, OpenWeather</span>
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground/80">
              Made with
              <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
              for Indian Railways
            </span>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-[11px] text-muted-foreground/70">
          &copy; {new Date().getFullYear()} RailGaadi AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}