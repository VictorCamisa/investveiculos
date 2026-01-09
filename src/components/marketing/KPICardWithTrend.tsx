import { Card, CardContent } from '@/components/ui/card';
import { SparklineChart } from './SparklineChart';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardWithTrendProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number[];
  trendLabel?: string;
  className?: string;
  onClick?: () => void;
}

export function KPICardWithTrend({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  className,
  onClick,
}: KPICardWithTrendProps) {
  return (
    <Card 
      className={cn(
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary/50',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Icon className="h-4 w-4" />
            {title}
          </div>
        </div>
        <p className="text-2xl font-bold mt-2">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && trend.length > 1 && (
          <div className="mt-2 flex items-center justify-between">
            <SparklineChart data={trend} height={20} />
            {trendLabel && (
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
