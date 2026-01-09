import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, User, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface VehicleActiveNegotiationsProps {
  vehicleId: string;
}

interface NegotiationWithDetails {
  id: string;
  status: string;
  created_at: string;
  lead: {
    id: string;
    name: string;
    phone: string;
  } | null;
  salesperson: {
    id: string;
    full_name: string;
  } | null;
}

const statusLabels: Record<string, string> = {
  'novo': 'Novo',
  'contato_inicial': 'Contato Inicial',
  'agendamento': 'Agendamento',
  'visita': 'Visita',
  'proposta': 'Proposta',
  'negociacao': 'Negociação',
  'ganho': 'Ganho',
  'perdido': 'Perdido',
};

const statusColors: Record<string, string> = {
  'novo': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'contato_inicial': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'agendamento': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'visita': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'proposta': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'negociacao': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'ganho': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'perdido': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function VehicleActiveNegotiations({ vehicleId }: VehicleActiveNegotiationsProps) {
  const navigate = useNavigate();

  const { data: negotiations, isLoading } = useQuery({
    queryKey: ['vehicle-negotiations', vehicleId],
    queryFn: async (): Promise<NegotiationWithDetails[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('negotiations')
        .select(`
          id,
          status,
          created_at,
          lead:leads(id, name, phone),
          salesperson:profiles!negotiations_salesperson_id_fkey(id, full_name)
        `)
        .eq('vehicle_id', vehicleId)
        .not('status', 'in', '("ganho","perdido")')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as NegotiationWithDetails[];
    },
    enabled: !!vehicleId,
  });

  const handleNavigateToNegotiation = (negotiationId: string) => {
    navigate(`/crm/negociacoes?id=${negotiationId}`);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Negociações em Aberto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeCount = negotiations?.length || 0;

  return (
    <Card className={activeCount > 0 ? 'border-amber-500/50' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5 text-amber-600" />
          Negociações em Aberto
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {activeCount}
            </Badge>
          )}
        </CardTitle>
        {activeCount > 0 && (
          <CardDescription>
            Este veículo está em {activeCount} negociação{activeCount > 1 ? 'ões' : ''} ativa{activeCount > 1 ? 's' : ''}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {activeCount === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma negociação ativa para este veículo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {negotiations?.map((neg) => (
              <div
                key={neg.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                onClick={() => handleNavigateToNegotiation(neg.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{neg.lead?.name || 'Cliente'}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{neg.salesperson?.full_name || 'Vendedor'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(neg.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[neg.status] || 'bg-muted'}>
                    {statusLabels[neg.status] || neg.status}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
