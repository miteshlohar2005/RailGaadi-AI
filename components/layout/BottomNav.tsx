'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useFavoritesStore } from '@/store/favorites';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/?search=1', label: 'Search', icon: Search },
  { href: '/favorites', label: 'Favorites', icon: Heart },
];

export function BottomNav() {
  const pathname = usePathname();
  const { favorites } = useFavoritesStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="mx-3 mb-3 glass-panel-strong rounded-2xl overflow-hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/' ? pathname === '/' : pathname.startsWith(href.split('?')[0]);
            const isFavoritesTab = href === '/favorites';

            return (
              <Link
                key={href}
                href={href.split('?')[0]}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-all duration-200',
                  isActive
                    ? 'text-rail-blue'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="relative">
                  <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
                  {isFavoritesTab && favorites.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
                      {favorites.length > 9 ? '9+' : favorites.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold">{label}</span>
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-rail-blue" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
