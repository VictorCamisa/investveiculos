import { BentoCard } from '@/components/ui/bento-card';
import { Users, Target, DollarSign, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import type { Lead } from '@/types/crm';
import type { Negotiation } from '@/types/negotiations';
import { differenceInDays } from 'date-fns';

interface CRMStatsProps {
  leads: Lead[];
  negotiations: Negotiation[];
}

export function CRMStats({ leads, negotiations }: CRMStatsProps) {
  // Calculate stats
  const activeLeads = leads.filter(l => !['convertido', 'perdido'].includes(l.status)).length;
  const activeNegotiations = negotiations.filter(n => !['ganho', 'perdido'].includes(n.status)).length;
  
  const wonNegotiations = negotiations.filter(n => n.status === 'ganho');
  const lostNegotiations = negotiations.filter(n => n.status === 'perdido');
  const totalClosed = wonNegotiations.length + lostNegotiations.length;
  const conversionRate = totalClosed > 0 ? (wonNegotiations.length / totalClosed * 100).toFixed(0) : '0';

  const totalPipelineValue = negotiations
    .filter(n => !['ganho', 'perdido'].includes(n.status))
    .reduce((sum, n) => sum + (n.estimated_value || 0), 0);

  // Leads without contact in last 3 days
  const staleLeads = leads.filter(l => {
    if (['convertido', 'perdido'].includes(l.status)) return false;
    const daysSinceUpdate = differenceInDays(new Date(), new Date(l.updated_at));
    return daysSinceUpdate >= 3;
  }).length;

  // Average time to close (for won negotiations)
  const avgDaysToClose = wonNegotiations.length > 0
    ? Math.round(wonNegotiations.reduce((sum, n) => {
        if (n.actual_close_date) {
          return sum + differenceInDays(new Date(n.actual_close_date), new Date(n.created_at));
        }
        return sum;
      }, 0) / wonNegotiations.length)
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
      <BentoCard
        title="Leads Ativos"
        value={activeLeads}
        subtitle="Em atendimento"
        delay={0}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
      />
      <BentoCard
        title="Negociações"
        value={activeNegotiations}
        subtitle="Em andamento"
        delay={0.05}
        icon={<Target className="h-4 w-4 text-muted-foreground" />}
      />
      <BentoCard
        title="Pipeline"
        value={formatCurrency(totalPipelineValue)}
        subtitle="Valor potencial"
        delay={0.1}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />
      <BentoCard
        title="Conversão"
        value={`${conversionRate}%`}
        subtitle={`${wonNegotiations.length} de ${totalClosed} fechadas`}
        delay={0.15}
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
      />
      <BentoCard
        title="Tempo Médio"
        value={`${avgDaysToClose}d`}
        subtitle="Para fechamento"
        delay={0.2}
        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
      />
      <BentoCard
        title="Alertas"
        value={staleLeads}
        subtitle="Leads parados (+3d)"
        delay={0.25}
        icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );
}
