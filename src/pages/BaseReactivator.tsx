import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { RefreshCw, Users, Clock, AlertTriangle, Search, Phone, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BaseReactivator() {
  const [inactivityDays, setInactivityDays] = useState(30);
  const [search, setSearch] = useState('');

  const { data: inactiveLeads = [], isLoading } = useQuery({
    queryKey: ['inactive-leads', inactivityDays],
    queryFn: async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - inactivityDays);
      
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, phone, source, status, created_at, last_interaction_at, updated_at')
        .or(`last_interaction_at.lt.${cutoffDate.toISOString()},last_interaction_at.is.null`)
        .not('phone', 'is', null)
        .neq('phone', '')
        .order('last_interaction_at', { ascending: true, nullsFirst: true })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = inactiveLeads.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search)
  );

  const segments = {
    critical: filtered.filter(l => {
      const days = l.last_interaction_at ? differenceInDays(new Date(), new Date(l.last_interaction_at)) : 999;
      return days > 90;
    }),
    warning: filtered.filter(l => {
      const days = l.last_interaction_at ? differenceInDays(new Date(), new Date(l.last_interaction_at)) : 999;
      return days > 30 && days <= 90;
    }),
    recent: filtered.filter(l => {
      const days = l.last_interaction_at ? differenceInDays(new Date(), new Date(l.last_interaction_at)) : 999;
      return days <= 30 && days > inactivityDays;
    }),
  };

  return (
    <div>
      <ModuleHeader
        icon={RefreshCw}
        title="Reativador de Base"
        description="Identifique e reative clientes inativos"
        basePath="/reativador"
        navItems={[]}
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{inactiveLeads.length}</div>
              <p className="text-sm text-muted-foreground">Total Inativos</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/30">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">{segments.critical.length}</div>
              <p className="text-sm text-muted-foreground">Críticos (+90 dias)</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-amber-600">{segments.warning.length}</div>
              <p className="text-sm text-muted-foreground">Atenção (30-90 dias)</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{segments.recent.length}</div>
              <p className="text-sm text-muted-foreground">Recentes</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar inativos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={String(inactivityDays)} onValueChange={v => setInactivityDays(parseInt(v))}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="15">Inativos há 15+ dias</SelectItem>
              <SelectItem value="30">Inativos há 30+ dias</SelectItem>
              <SelectItem value="60">Inativos há 60+ dias</SelectItem>
              <SelectItem value="90">Inativos há 90+ dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum lead inativo encontrado</CardContent></Card>
          ) : (
            filtered.slice(0, 100).map(lead => {
              const days = lead.last_interaction_at ? differenceInDays(new Date(), new Date(lead.last_interaction_at)) : null;
              const severity = days === null || days > 90 ? 'destructive' : days > 30 ? 'warning' : 'default';
              return (
                <Card key={lead.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-10 rounded-full ${severity === 'destructive' ? 'bg-destructive' : severity === 'warning' ? 'bg-amber-500' : 'bg-primary'}`} />
                      <div>
                        <p className="font-medium">{lead.name || 'Sem nome'}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {lead.last_interaction_at ? format(new Date(lead.last_interaction_at), 'dd/MM/yyyy', { locale: ptBR }) : 'Nunca contatado'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={severity === 'destructive' ? 'destructive' : 'secondary'}>
                        {days !== null ? `${days} dias` : 'Nunca'}
                      </Badge>
                      <Badge variant="outline">{lead.source}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
