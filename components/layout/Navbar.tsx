'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Sun, Moon, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/utils/cn';
import { useTheme } from '@/providers/theme-provider';
import { motion, AnimatePresence } from 'framer-motion';

interface NavLink {
  href: string;
  label: string;
  match?: (path: string) => boolean;
}

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home', match: (path) => path === '/' },
  { href: '/train/12951', label: 'Live Tracking', match: (path) => path.startsWith('/train/') },
  { href: '/#features', label: 'Features' },
  { href: '/#intelligence', label: 'About' },
  { href: '/#contact', label: 'Contact' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollToTrack = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('track');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else router.push('/#track');
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-white/25 bg-white/65 dark:bg-background/70 backdrop-blur-md',
        scrolled
          ? 'shadow-[0_8px_24px_-12px_rgba(7,26,61,0.12)]'
          : 'shadow-none'
      )}
    >
      <nav className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex h-[78px] items-center justify-between gap-6">
          {/* Brand */}
          <Link href="/" aria-label="RailGaadi AI - Home" className="flex items-center shrink-0">
            <Image
              src="/images/railgaadi-logo.png"
              alt="RailGaadi AI"
              width={2048}
              height={682}
              priority
              className="block h-auto w-[160px] object-contain sm:w-[200px]"
            />
          </Link>

          {/* Center nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = link.match ? link.match(pathname) : false;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'relative px-3.5 py-2 text-[14px] font-medium text-muted-foreground transition-colors duration-200 rounded-lg',
                    isActive
                      ? 'text-rail-blue'
                      : 'hover:text-foreground hover:bg-secondary/70'
                  )}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute left-3 right-3 -bottom-[1px] h-[2px] rounded-full bg-rail-blue"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground transition-colors"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-[17px] w-[17px]" />
                  ) : (
                    <Moon className="h-[17px] w-[17px]" />
                  )}
                </motion.span>
              </AnimatePresence>
            </button>

            <Link
              href="/#track"
              onClick={scrollToTrack}
              scroll={false}
              className="hidden md:inline-flex items-center gap-2 rounded-lg bg-rail-blue px-5 h-9 text-[14px] font-semibold text-white transition-all duration-200 hover:bg-rail-navy hover:shadow-[0_8px_20px_-8px_rgba(7,26,61,0.6)] active:translate-y-[0.5px]"
            >
              Get Started
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground transition-colors"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="lg:hidden overflow-hidden"
            >
              <div className="space-y-1 pb-4 pt-2 border-t border-border">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/70 transition-colors"
                  >
                    {link.label}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
                <div className="flex items-center gap-2 pt-2">
                  <Link
                    href="/#track"
                    scroll={false}
                    onClick={(e) => {
                      setMobileOpen(false);
                      scrollToTrack(e);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rail-blue px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={toggleTheme}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground"
                  >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}