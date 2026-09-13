'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Train, ArrowRight, Search, Loader2, AlertCircle, X, ChevronRight, Activity, Zap, MapPin
} from 'lucide-react';
import { useTrainSearch } from '@/hooks/useTrainSearch';
import { useSearchStore } from '@/store/search';
import { SearchResult } from '@/types/train';
import { cn } from '@/utils/cn';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const QUICK_TRAINS = [
  { number: '12951', name: 'New Delhi Tejas Rajdhani Express' },
  { number: '22436', name: 'Varanasi Vande Bharat Express' },
  { number: '12301', name: 'Howrah Rajdhani Express' },
  { number: '12621', name: 'Tamil Nadu Express' },
  { number: '12009', name: 'Mumbai Shatabdi Express' },
];

const HERO_STATS = [
  { label: 'Trains Tracked', value: 13847, suffix: '+', icon: Train },
  { label: 'Data Availability', value: 98, suffix: '.7%', icon: Activity },
  { label: 'Live Refresh', value: 30, suffix: 's', icon: Zap },
  { label: 'Active Railway Zones', value: 24, suffix: '', icon: MapPin },
];

export function HeroSection() {
  const router = useRouter();
  const { addRecentSearch } = useSearchStore();
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

  const handleTrackNow = () => {
    const q = inputValue.trim();
    if (!q) {
      inputRef.current?.focus();
      setIsSearchOpen(true);
      return;
    }
    const match =
      searchResults?.find(
        (r) => r.number === q || r.name.toLowerCase().includes(q.toLowerCase())
      ) ?? searchResults?.[0];
    if (match) handleSelect(match);
    else router.push(`/train/${q}`);
  };

  const showDropdown = isSearchOpen && (inputValue || debouncedQuery);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="relative flex flex-col md:h-[600px] lg:h-[630px]">
          {/* ── Full-bleed railway background (hero-scoped) ───────────── */}
          <div className="absolute inset-0">
            <Image
              src="/images/railgaadi-hero-train.png"
              alt="Rajdhani Express running through the Indian railway landscape"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center md:object-[72%_center]"
            />
          </div>

          {/* ── Transparent blending overlays (pointer-events-none) ──── */}
          {/* Left readable → transparent toward the train (right) */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(240,248,255,0.92)_0%,rgba(240,248,255,0.68)_32%,rgba(240,248,255,0.38)_55%,rgba(255,255,255,0.10)_76%,rgba(255,255,255,0)_90%)]" />
          {/* Seamless sky-blue wash from the very top, gone by mid-hero */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[62%] bg-[linear-gradient(180deg,rgba(235,246,255,0.55)_0%,rgba(235,246,255,0.25)_32%,rgba(235,246,255,0)_68%)]" />
          {/* Fade the image down into the white stats section */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/35 to-transparent" />

          {/* ── Hero content ─────────────────────────────────────────── */}
          <div id="track" className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center scroll-mt-32 px-6 py-16 sm:px-10 md:py-0 lg:px-12">
            <div className="max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-rail-blue"
              >
                <span>Real&ndash;Time</span>
                <span className="h-1 w-1 rounded-full bg-rail-blue/50" />
                <span>Intelligence</span>
                <span className="h-1 w-1 rounded-full bg-rail-blue/50" />
                <span className="hidden sm:inline">For Every Indian</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.08, ease: 'easeOut' }}
                className="mt-6 text-[36px] leading-[1.06] font-extrabold tracking-tight text-rail-navy sm:text-[46px] lg:text-[54px] xl:text-[60px]"
              >
                <span className="block">Trains Move India.</span>
                <span className="block text-rail-blue">We Keep You Ahead.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.18, ease: 'easeOut' }}
                className="mt-5 max-w-lg text-base leading-relaxed text-foreground/85 sm:text-lg"
              >
                Real-time tracking, delay predictions, weather updates and intelligent journey
                insights &mdash; all in one place.
              </motion.p>

              {/* ── Search ───────────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.26, ease: 'easeOut' }}
                className="relative mt-7 max-w-[540px]"
              >
                <div
                  className={cn(
                    'group flex flex-col sm:flex-row items-stretch overflow-hidden rounded-2xl sm:rounded-full border border-slate-200 bg-white/95 p-1.5 shadow-[0_12px_36px_-14px_rgba(7,26,61,0.25)] transition-all duration-300',
                    'focus-within:border-rail-blue/60 focus-within:ring-4 focus-within:ring-rail-blue/10 focus-within:shadow-[0_16px_44px_-14px_rgba(8,127,229,0.35)]'
                  )}
                >
                  <div className="flex flex-1 items-center gap-3 px-4">
                    {isLoading && inputValue ? (
                      <Loader2 className="h-5 w-5 flex-shrink-0 text-rail-blue animate-spin" />
                    ) : (
                      <Search className="h-5 w-5 flex-shrink-0 text-slate-400" />
                    )}
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setIsSearchOpen(true);
                      }}
                      onFocus={() => setIsSearchOpen(true)}
                      onKeyDown={handleInputKeyDown}
                      placeholder="Search train number, train name or station..."
                      className="w-full bg-transparent py-2.5 text-[15px] font-medium text-foreground placeholder:text-slate-400 outline-none"
                    />
                    {inputValue ? (
                      <button
                        onClick={() => {
                          setInputValue('');
                          setIsSearchOpen(false);
                        }}
                        aria-label="Clear search"
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : (
                      <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                        /
                      </kbd>
                    )}
                  </div>
                  <button
                    onClick={handleTrackNow}
                    className="flex items-center justify-center gap-2 rounded-xl sm:rounded-full bg-rail-blue px-6 py-3 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-rail-navy active:translate-y-[0.5px]"
                  >
                    Track Now
                    <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                  </button>
                </div>

                {/* Popular searches */}
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Popular Searches:
                  </span>
                  {QUICK_TRAINS.map(({ number }) => (
                    <button
                      key={number}
                      onClick={() => {
                        setInputValue(number);
                        setIsSearchOpen(true);
                        inputRef.current?.focus();
                      }}
                      className="rounded-full border border-slate-200 bg-white/85 px-3 py-1 font-mono text-xs font-semibold text-slate-600 transition-all hover:border-rail-blue/40 hover:bg-white hover:text-rail-blue"
                    >
                      {number}
                    </button>
                  ))}
                </div>

                {/* Search dropdown */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      ref={dropdownRef}
                      initial={{ opacity: 0, y: 8, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.99 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[340px] overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl p-2.5 shadow-[0_24px_60px_-20px_rgba(7,26,61,0.35)]"
                    >
                      {isError && (
                        <div className="flex items-center justify-center gap-2 py-4 text-xs text-rose-500">
                          <AlertCircle className="h-4 w-4" />
                          <span>Error loading trains. Please try again.</span>
                        </div>
                      )}

                      {isLoading && !searchResults && (
                        <div className="space-y-2 py-1">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-14 rounded-lg shimmer-premium" />
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
                          className="mb-1.5 flex w-full items-center gap-3 rounded-lg bg-rail-blue/10 border border-rail-blue/20 px-3 py-2.5 text-xs font-bold text-rail-blue transition-all hover:bg-rail-blue hover:text-white"
                        >
                          <Train className="h-4 w-4" />
                          <span>Track train #{inputValue.trim()} live</span>
                          <ChevronRight className="ml-auto h-3.5 w-3.5" />
                        </button>
                      )}

                      {searchResults && searchResults.length > 0 && (
                        <div className="space-y-1">
                          <p className="px-1.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {inputValue ? 'Matching Trains' : 'Popular Trains'}
                          </p>
                          {searchResults.map((train) => (
                            <button
                              key={train.id}
                              onClick={() => handleSelect(train)}
                              className="group flex w-full items-center justify-between rounded-lg p-2.5 text-left transition-colors duration-150 hover:bg-secondary"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-rail-blue/10 text-rail-blue transition-colors group-hover:bg-rail-blue group-hover:text-white">
                                  <Train className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="flex-shrink-0 rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] font-bold text-foreground">
                                      {train.number}
                                    </span>
                                    <span className="truncate text-sm font-semibold text-foreground">
                                      {train.name}
                                    </span>
                                  </div>
                                  {(train.origin.name || train.destination.name) && (
                                    <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                                      <span>{train.origin.name}</span>
                                      <ArrowRight className="h-2.5 w-2.5 flex-shrink-0" />
                                      <span>{train.destination.name}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-rail-blue" />
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Statistics strip (clean white, separate from hero) ─────── */}
      <section className="relative w-full border-t border-slate-200/70 bg-white">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-2 px-6 sm:px-10 lg:grid-cols-4 lg:px-12">
          {HERO_STATS.map(({ label, value, suffix, icon: Icon }, i) => (
            <div
              key={label}
              className={cn(
                'flex items-center justify-center gap-3 px-4 py-5 lg:px-6',
                i % 2 === 1 && 'border-l border-slate-100',
                i > 1 && 'border-t border-slate-100',
                i > 1 && 'lg:border-t-0'
              )}
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-rail-blue/[0.08] text-rail-blue">
                <Icon className="h-[17px] w-[17px]" strokeWidth={2} />
              </span>
              <div className="text-left">
                <AnimatedCounter
                  value={value}
                  suffix={suffix}
                  className="text-2xl leading-none text-foreground"
                />
                <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}