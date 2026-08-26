'use client';

import React from 'react';
import { Train, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rail-blue to-rail-cyan">
              <Train className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-extrabold text-foreground">
              Rail<span className="gradient-text">Gaadi</span>
              <span className="ml-1.5 text-[9px] font-bold text-muted-foreground uppercase">AI</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>Powered by RailRadar, MapTiler, OpenWeather</span>
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
            <span>Made with</span>
            <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
            <span>for Indian Railways</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
