import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'stat-card animate-in-up',
        variant === 'primary' && 'stat-card-gradient',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p
            className={cn(
              'text-sm font-medium',
              variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              'text-2xl font-bold tracking-tight font-mono-numbers',
              variant === 'primary' ? 'text-primary-foreground' : 'text-foreground'
            )}
          >
            {value}
          </p>
          {subtitle && (
            <p
              className={cn(
                'text-xs',
                variant === 'primary' ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              variant === 'primary'
                ? 'bg-primary-foreground/20'
                : variant === 'success'
                ? 'bg-success/10'
                : variant === 'warning'
                ? 'bg-warning/10'
                : 'bg-muted'
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5',
                variant === 'primary'
                  ? 'text-primary-foreground'
                  : variant === 'success'
                  ? 'text-success'
                  : variant === 'warning'
                  ? 'text-warning'
                  : 'text-muted-foreground'
              )}
            />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span
            className={cn(
              'text-xs',
              variant === 'primary' ? 'text-primary-foreground/60' : 'text-muted-foreground'
            )}
          >
            vs last month
          </span>
        </div>
      )}
    </div>
  );
}
