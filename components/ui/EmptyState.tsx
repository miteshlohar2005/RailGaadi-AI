import React from 'react';
import { PackageOpen } from 'lucide-react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('glass-card flex flex-col items-center justify-center rounded-3xl p-12 text-center space-y-4', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <PackageOpen className="h-8 w-8" />
      </div>
      {title && (
        <h3 className="font-bold text-lg text-foreground">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
