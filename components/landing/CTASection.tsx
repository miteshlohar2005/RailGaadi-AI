'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Train } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-rail-blue/20 via-surface to-rail-cyan/10" />
          <div className="absolute inset-0 grid-pattern opacity-30" />

          <div className="relative z-10 p-10 sm:p-14 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary border border-border px-4 py-1.5 text-xs font-semibold text-foreground/80 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-rail-cyan" />
              <span>Open for Everyone</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Ready to track your train?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Search any train number to get started with real-time tracking, delay analytics, weather intelligence, and terrain analysis.
            </p>

            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-rail-blue to-rail-cyan px-8 py-4 text-sm font-bold text-white shadow-glow-strong hover:brightness-110 transition-all active:scale-95"
            >
              <Train className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
              Start Tracking
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
