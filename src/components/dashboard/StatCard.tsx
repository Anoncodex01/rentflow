import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'default';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon, variant = 'default', trend }: StatCardProps) {
  const variantStyles = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-accent/10 text-accent',
    default: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="rounded-xl bg-card p-3 sm:p-5 shadow-card border border-border">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className={cn(
          "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl shrink-0",
          variantStyles[variant]
        )}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-lg sm:text-2xl font-bold text-foreground truncate">{value}</p>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
          {trend && (
            <p className={cn(
              "text-xs mt-0.5 hidden sm:block",
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
