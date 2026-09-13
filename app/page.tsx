'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, History } from 'lucide-react';
import { useSearchStore } from '@/store/search';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { IntelligenceSection } from '@/components/landing/IntelligenceSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { CTASection } from '@/components/landing/CTASection';
import { ContactSection } from '@/components/landing/ContactSection';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
  const { recentSearches, clearRecentSearches } = useSearchStore();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <HeroSection />

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <section className="py-10 px-5 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <History className="h-4 w-4 text-rail-blue" />
                <span>Recent Searches</span>
              </div>
              <button
                onClick={clearRecentSearches}
                className="text-[11px] font-semibold text-muted-foreground hover:text-rose-500 transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {recentSearches.map((train) => (
                <motion.div key={train.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Link
                    href={`/train/${train.number}`}
                    className="group flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-rail-blue/30 hover:shadow-[0_10px_28px_-16px_rgba(7,26,61,0.25)]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="font-mono text-[11px] font-bold text-rail-blue">
                        #{train.number}
                      </span>
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-foreground">
                          {train.name}
                        </h4>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {train.origin.name} &rarr; {train.destination.name}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-rail-blue" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <FeaturesSection />

      {/* Intelligence */}
      <IntelligenceSection />

      {/* Trust / Network */}
      <TrustSection />

      {/* CTA */}
      <CTASection />

      {/* Contact support */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}