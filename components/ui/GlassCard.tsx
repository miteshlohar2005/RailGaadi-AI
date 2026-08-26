'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, hover = true, glow = false, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-card rounded-2xl p-6 transition-all duration-300',
        hover && 'animated-border hover:-translate-y-0.5',
        glow && 'glow-blue',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
