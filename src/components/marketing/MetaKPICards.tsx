import { 
  DollarSign, 
  Eye, 
  MousePointer, 
  Target, 
  TrendingUp, 
  Users, 
  Percent,
  RefreshCw 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { MetaKPIs } from '@/types/meta-ads';

interface MetaKPICardsProps {
  kpis: MetaKPIs;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatNumber = (value: number) => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toLocaleString('pt-BR');
};

const formatPercent = (value: number) => {
  return value.toFixed(2) + '%';
};

export default function MetaKPICards({ kpis, isLoading }: MetaKPICardsProps) {
  const cards = [
    {
      title: 'Investimento',
      value: formatCurrency(kpis.totalSpend),
      icon: DollarSign,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500/10',
      iconColor: 'text-red-500',
    },
    {
      title: 'Impressões',
      value: formatNumber(kpis.totalImpressions),
      icon: Eye,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Cliques',
      value: formatNumber(kpis.totalClicks),
      icon: MousePointer,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-500',
    },
    {
      title: 'CTR',
      value: formatPercent(kpis.avgCTR),
      icon: Percent,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
    },
    {
      title: 'CPC',
      value: formatCurrency(kpis.avgCPC),
      icon: Target,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500/10',
      iconColor: 'text-orange-500',
    },
    {
      title: 'CPM',
      value: formatCurrency(kpis.avgCPM),
      icon: TrendingUp,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-500/10',
      iconColor: 'text-cyan-500',
    },
    {
      title: 'Alcance',
      value: formatNumber(kpis.totalReach),
      icon: Users,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-500/10',
      iconColor: 'text-pink-500',
    },
    {
      title: 'Frequência',
      value: kpis.avgFrequency.toFixed(2),
      icon: RefreshCw,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-500/10',
      iconColor: 'text-indigo-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card 
          key={card.title} 
          className="relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] group"
        >
          <div className={cn(
            'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity',
            `bg-gradient-to-br ${card.color}`
          )} style={{ opacity: 0.05 }} />
          
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{card.title}</span>
              <div className={cn('p-2 rounded-lg', card.bgColor)}>
                <card.icon className={cn('h-4 w-4', card.iconColor)} />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
