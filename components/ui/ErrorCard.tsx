'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ErrorCardProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorCard({ title = 'Something went wrong', message, onRetry }: ErrorCardProps) {
  return (
    <div className="glass-card flex flex-col items-center justify-center rounded-3xl p-12 text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h3 className="font-bold text-lg text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {message || 'An unexpected error occurred. Please try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-rail-blue px-4 py-2 text-xs font-semibold text-white shadow-glow hover:bg-sky-600 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
}
