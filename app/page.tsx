'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Train, History, MapPin, X } from 'lucide-react';
import { useSearchStore } from '@/store/search';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { IntelligenceSection } from '@/components/landing/IntelligenceSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
  const { recentSearches, clearRecentSearches } = useSearchStore();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <HeroSection />

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <section className="py-16 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <History className="h-4 w-4 text-rail-blue" />
                <span className="text-base">Recent Searches</span>
              </div>
              <button
                onClick={clearRecentSearches}
                className="text-[11px] font-semibold text-muted-foreground hover:text-rose-400 transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentSearches.map((train) => (
                <Link
                  key={train.id}
                  href={`/train/${train.number}`}
                  className="glass-card group flex items-center justify-between rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 animated-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rail-blue/10 text-rail-blue group-hover:bg-rail-blue group-hover:text-white transition-colors flex-shrink-0">
                      <Train className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-mono text-[11px] font-bold text-rail-blue block">#{train.number}</span>
                      <h4 className="font-bold text-foreground text-sm truncate">{train.name}</h4>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 group-hover:translate-x-0.5 group-hover:text-rail-blue transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <FeaturesSection />

      {/* Intelligence */}
      <IntelligenceSection />

      {/* CTA */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
