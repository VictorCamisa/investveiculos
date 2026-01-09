import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparklineChartProps {
  data: number[];
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
  height?: number;
  showTrend?: boolean;
}

export function SparklineChart({ 
  data, 
  className, 
  color = 'primary',
  height = 24,
  showTrend = true 
}: SparklineChartProps) {
  const { path, trend, trendPercent } = useMemo(() => {
    if (!data || data.length < 2) {
      return { path: '', trend: 0, trendPercent: 0 };
    }

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const width = 100;
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    });

    const first = data[0];
    const last = data[data.length - 1];
    const trend = last - first;
    const trendPercent = first > 0 ? ((last - first) / first) * 100 : 0;

    return {
      path: `M ${points.join(' L ')}`,
      trend,
      trendPercent,
    };
  }, [data, height]);

  const colorClasses = {
    primary: 'stroke-primary',
    success: 'stroke-success',
    warning: 'stroke-warning',
    destructive: 'stroke-destructive',
  };

  const trendColor = trend >= 0 ? 'text-success' : 'text-destructive';

  if (!data || data.length < 2) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg 
        width="60" 
        height={height} 
        viewBox={`0 0 100 ${height}`}
        className="overflow-visible"
      >
        <path
          d={path}
          fill="none"
          className={cn(colorClasses[color], 'stroke-[2]')}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showTrend && (
        <span className={cn('text-xs font-medium', trendColor)}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trendPercent).toFixed(0)}%
        </span>
      )}
    </div>
  );
}
