'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface StatusBadgeProps {
  status: 'running' | 'delayed' | 'on_time' | 'cancelled' | 'not_started' | 'completed';
  className?: string;
}

const STATUS_CONFIG = {
  running: {
    label: 'Running',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-500',
    pulse: true,
  },
  on_time: {
    label: 'On Time',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-500',
    pulse: false,
  },
  delayed: {
    label: 'Delayed',
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-500',
    pulse: true,
  },
  not_started: {
    label: 'Not Started',
    color: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
    pulse: false,
  },
  completed: {
    label: 'Completed',
    color: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    dot: 'bg-sky-500',
    pulse: false,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-500',
    pulse: false,
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.running;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold',
        config.color,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot, config.pulse && 'animate-pulse')} />
      {config.label}
    </span>
  );
}
