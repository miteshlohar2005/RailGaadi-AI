'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Train, ArrowRight, Sparkles, Zap,
  Search, Loader2, AlertCircle, X, Activity, Globe,
  ChevronRight
} from 'lucide-react';
import { useTrainSearch } from '@/hooks/useTrainSearch';
import { useSearchStore } from '@/store/search';
import { SearchResult } from '@/types/train';
import { cn } from '@/utils/cn';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

const IndiaRailwayNetwork = dynamic(
  () => import('@/components/3d/IndiaRailwayNetwork').then(m => ({ default: m.IndiaRailwayNetwork })),
  { ssr: false, loading: () => <div className="h-full w-full bg-transparent" /> }
);

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const QUICK_TRAINS = [
  { number: '12951', name: 'Rajdhani Express' },
  { number: '22436', name: 'Vande Bharat' },
  { number: '12301', name: 'Howrah Rajdhani' },
  { number: '12621', name: 'Tamil Nadu Express' },
];

export function HeroSection() {
  const router = useRouter();
  const { recentSearches, addRecentSearch, clearRecentSearches } = useSearchStore();
  const [inputValue, setInputValue] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const debouncedQuery = useDebounce(inputValue, 350);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isLoading, isError } = useTrainSearch(debouncedQuery);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (train: SearchResult) => {
    addRecentSearch(train);
    setIsSearchOpen(false);
    setInputValue('');
    router.push(`/train/${train.number}`);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      const first = searchResults?.[0];
      if (first) handleSelect(first);
      else router.push(`/train/${inputValue.trim()}`);
    }
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      inputRef.current?.blur();
    }
  };

  const showDropdown = isSearchOpen && (inputValue || debouncedQuery);

  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 grid-pattern opacity-50" />

      {/* Radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] radial-glow" />

      {/* 3D Background */}
      <div className="absolute inset-0 opacity-60 pointer-events-none">
        <IndiaRailwayNetwork className="w-full h-full" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl w-full px-4 sm:px-6 pt-28 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full bg-secondary border border-border px-4 py-1.5 text-xs font-semibold text-foreground/80 backdrop-blur-md mb-8"
            >
              <Sparkles className="h-3.5 w-3.5 text-rail-cyan" />
              <span>Indian Railway Intelligence Platform</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              <span className="text-foreground">Track Every Train.</span>
              <br />
              <span className="gradient-text">Understand Every Journey.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
              Real-time Indian railway intelligence powered by live location, route, weather and terrain data.
            </p>

            {/* Search Panel */}
            <div className="mt-8 relative max-w-xl">
              <div
                className={cn(
                  'glass-input flex items-center gap-3 rounded-2xl px-5 py-4 transition-all duration-300',
                  isSearchOpen && 'border-rail-blue/40 shadow-glow-strong'
                )}
              >
                {isLoading && inputValue ? (
                  <Loader2 className="h-5 w-5 flex-shrink-0 text-rail-blue animate-spin" />
                ) : (
                  <Search className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                )}

                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); setIsSearchOpen(true); }}
                  onFocus={() => setIsSearchOpen(true)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Where is your train going?"
                  className="w-full bg-transparent text-sm font-medium text-foreground placeholder-muted-foreground outline-none"
                />

                {inputValue ? (
                  <button
                    onClick={() => { setInputValue(''); setIsSearchOpen(false); }}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-border bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground flex-shrink-0">
                    /
                  </kbd>
                )}
              </div>

              {/* Quick chips */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-muted-foreground font-medium">Popular:</span>
                {QUICK_TRAINS.map(({ number }) => (
                  <button
                    key={number}
                    onClick={() => { setInputValue(number); setIsSearchOpen(true); inputRef.current?.focus(); }}
                    className="rounded-lg bg-secondary border border-border px-2.5 py-1 text-[11px] font-mono font-semibold text-muted-foreground hover:bg-rail-blue/20 hover:text-rail-blue hover:border-rail-blue/30 transition-all"
                  >
                    {number}
                  </button>
                ))}
              </div>

              {/* Search Dropdown */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-2 z-50 max-h-[360px] overflow-y-auto rounded-2xl glass-panel-strong p-3 shadow-glass"
                  >
                    {isError && (
                      <div className="flex items-center gap-2 py-4 text-center justify-center text-xs text-rose-400">
                        <AlertCircle className="h-4 w-4" />
                        <span>Error loading trains. Please try again.</span>
                      </div>
                    )}

                    {isLoading && !searchResults && (
                      <div className="space-y-2 py-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 rounded-xl shimmer-premium" />
                        ))}
                      </div>
                    )}

                    {!isLoading && !isError && searchResults && searchResults.length === 0 && (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        No trains found. Try a number like <strong className="text-foreground">12951</strong>.
                      </div>
                    )}

                    {inputValue && /^\d{4,5}$/.test(inputValue.trim()) && (
                      <button
                        onClick={() => router.push(`/train/${inputValue.trim()}`)}
                        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 mb-2 bg-rail-blue/15 border border-rail-blue/20 text-rail-blue text-xs font-bold hover:bg-rail-blue hover:text-white transition-all"
                      >
                        <Train className="h-4 w-4" />
                        <span>Track train #{inputValue.trim()} live</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                      </button>
                    )}

                    {searchResults && searchResults.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 pb-1">
                          {inputValue ? 'Matching Trains' : 'Popular Trains'}
                        </p>
                        {searchResults.map((train) => (
                          <button
                            key={train.id}
                            onClick={() => handleSelect(train)}
                            className="w-full group flex items-center justify-between rounded-xl p-3 transition-all duration-150 hover:bg-secondary text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-rail-blue/10 text-rail-blue group-hover:bg-rail-blue group-hover:text-white transition-colors">
                                <Train className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[11px] font-bold text-foreground flex-shrink-0">
                                    {train.number}
                                  </span>
                                  <span className="font-semibold text-foreground text-sm truncate">
                                    {train.name}
                                  </span>
                                </div>
                                {(train.origin.name || train.destination.name) && (
                                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                                    <span>{train.origin.name}</span>
                                    <ArrowRight className="h-2.5 w-2.5 flex-shrink-0" />
                                    <span>{train.destination.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 group-hover:text-rail-blue group-hover:translate-x-0.5 transition-all" />
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CTA buttons */}
            <div className="mt-8 flex items-center gap-3 flex-wrap">
              <button
                onClick={() => inputRef.current?.focus()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rail-blue to-rail-cyan px-6 py-3 text-sm font-bold text-white shadow-glow-strong hover:shadow-glow-strong hover:brightness-110 transition-all active:scale-95"
              >
                <Search className="h-4 w-4" />
                Track a Train
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('network-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-6 py-3 text-sm font-bold text-foreground/80 hover:bg-secondary/80 hover:text-foreground transition-all"
              >
                <Globe className="h-4 w-4" />
                Explore Network
              </button>
            </div>
          </motion.div>

          {/* Right - Live Stats Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
            className="hidden lg:block"
          >
            <div className="glass-card rounded-3xl p-8 animate-float">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Live Network</span>
              </div>

              <div className="space-y-6">
                {[
                  { label: 'Trains Monitored', value: 13847, suffix: '+', icon: Train, color: 'text-rail-blue' },
                  { label: 'Data Availability', value: 98, suffix: '.7%', icon: Activity, color: 'text-emerald-400' },
                  { label: 'Live Refresh', value: 30, suffix: 's', icon: Zap, color: 'text-rail-cyan' },
                ].map(({ label, value, suffix, icon: Icon, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('h-10 w-10 rounded-xl bg-secondary flex items-center justify-center', color)}>
                        <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                      </div>
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                    <AnimatedCounter
                      value={value}
                      suffix={suffix}
                      className="text-2xl text-foreground"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-7 w-7 rounded-full border-2 border-background bg-gradient-to-br from-rail-blue/30 to-rail-cyan/30" />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Active across <span className="text-foreground font-semibold">24</span> railway zones
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
