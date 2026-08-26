'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavoritesStore } from '@/store/favorites';
import { SearchResult } from '@/types/train';
import { cn } from '@/utils/cn';

interface FavoriteButtonProps {
  train: SearchResult;
  className?: string;
  size?: 'sm' | 'md';
}

export function FavoriteButton({ train, className, size = 'md' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const isFav = isFavorite(train.id || train.number);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(train);
      }}
      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
      aria-label={isFav ? `Remove ${train.name} from favorites` : `Add ${train.name} to favorites`}
      className={cn(
        'flex items-center justify-center rounded-xl transition-all duration-200 active:scale-90',
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
        isFav
          ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/20'
          : 'bg-secondary border border-border text-muted-foreground hover:bg-rose-500/15 hover:text-rose-400 hover:border-rose-500/20',
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isFav ? 'fav' : 'unfav'}
          initial={{ scale: 0.6, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0.6, rotate: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <Heart
            className={cn(size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5', isFav && 'fill-current')}
            style={{ width: size === 'sm' ? 14 : 18, height: size === 'sm' ? 14 : 18 }}
          />
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
