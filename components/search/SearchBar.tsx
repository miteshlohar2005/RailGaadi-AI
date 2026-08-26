'use client';

import React from 'react';
import { Search, X, Command } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onFocus?: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  className?: string;
}

export function SearchBar({ value, onChange, onFocus, inputRef, className }: SearchBarProps) {
  return (
    <div
      className={cn(
        'glass-input relative flex items-center rounded-2xl px-4 py-3 transition-all duration-300',
        className
      )}
    >
      <Search className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="Enter train number or name..."
        aria-label="Search trains by number or name"
        className="w-full bg-transparent px-3 text-sm font-medium text-foreground placeholder-muted-foreground outline-none"
      />
      {value ? (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-border bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          <Command className="h-3 w-3" /> K
        </kbd>
      )}
    </div>
  );
}
