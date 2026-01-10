import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLeads } from '@/hooks/useLeads';
import { useNegotiations } from '@/hooks/useNegotiations';
import { useAuth } from '@/contexts/AuthContext';
import { BentoCard } from '@/components/ui/bento-card';
import { Users, Handshake, TrendingUp, Clock } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { leadSourceLabels, leadStatusLabels } from '@/types/crm';
import { negotiationStatusLabels } from '@/types/negotiations';
import { format, subDays, eachDayOfInterval, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6b7280'];

export default function CRMAnalytics() {
  const { role } = useAuth();
  const { data: leads = [] } = useLeads();
  const { data: negotiations = [] } = useNegotiations();
  const [period, setPeriod] = useState('30');

  const isManager = role === 'gerente';
  const cutoffDate = subDays(new Date(), parseInt(period));

  // Filter by period
  const periodLeads = leads.filter(l => new Date(l.created_at) >= cutoffDate);
  const periodNegotiations = negotiations.filter(n => new Date(n.created_at) >= cutoffDate);

  // Leads by source
  const leadsBySource = Object.entries(
    periodLeads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([source, count]) => ({
    name: leadSourceLabels[source as keyof typeof leadSourceLabels] || source,
    value: count,
  }));

  // Leads by status
  const leadsByStatus = Object.entries(
    periodLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, count]) => ({
    name: leadStatusLabels[status as keyof typeof leadStatusLabels] || status,
    value: count,
  }));

  // Negotiations by status
  const negotiationsByStatus = Object.entries(
    periodNegotiations.reduce((acc, neg) => {
      acc[neg.status] = (acc[neg.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, count]) => ({
    name: negotiationStatusLabels[status as keyof typeof negotiationStatusLabels] || status,
    value: count,
  }));

  // Conversion funnel
  const wonNegotiations = periodNegotiations.filter(n => n.status === 'ganho').length;
  const lostNegotiations = periodNegotiations.filter(n => n.status === 'perdido').length;
  const totalClosed = wonNegotiations + lostNegotiations;
  const conversionRate = totalClosed > 0 ? ((wonNegotiations / totalClosed) * 100).toFixed(1) : '0';

  // Loss reasons
  const lossReasons = periodNegotiations
    .filter(n => n.status === 'perdido' && n.loss_reason)
    .reduce((acc, neg) => {
      const reason = neg.loss_reason || 'Não informado';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const lossReasonsData = Object.entries(lossReasons)
    .map(([reason, count]) => ({ name: reason, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Time to close (for won negotiations)
  const avgTimeToClose = periodNegotiations
    .filter(n => n.status === 'ganho' && n.actual_close_date)
    .reduce((sum, n, _, arr) => {
      const days = differenceInDays(new Date(n.actual_close_date!), new Date(n.created_at));
      return sum + days / arr.length;
    }, 0);

  // Daily leads trend
  const daysInterval = eachDayOfInterval({
    start: cutoffDate,
    end: new Date(),
  });

  const dailyTrend = daysInterval.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const leadsCount = periodLeads.filter(l => 
      format(new Date(l.created_at), 'yyyy-MM-dd') === dayStr
    ).length;
    const negotiationsCount = periodNegotiations.filter(n => 
      format(new Date(n.created_at), 'yyyy-MM-dd') === dayStr
    ).length;

    return {
      date: format(day, 'dd/MM', { locale: ptBR }),
      leads: leadsCount,
      negociacoes: negotiationsCount,
    };
  });

  // Performance by salesperson (manager only)
  const salesperformance = isManager ? Object.entries(
    periodNegotiations.reduce((acc, neg) => {
      const name = neg.salesperson?.full_name || 'Não atribuído';
      if (!acc[name]) {
        acc[name] = { total: 0, won: 0, lost: 0, value: 0 };
      }
      acc[name].total++;
      if (neg.status === 'ganho') {
        acc[name].won++;
        acc[name].value += neg.estimated_value || 0;
      }
      if (neg.status === 'perdido') acc[name].lost++;
      return acc;
    }, {} as Record<string, { total: number; won: number; lost: number; value: number }>)
  ).map(([name, data]) => ({
    name,
    total: data.total,
    ganhas: data.won,
    perdidas: data.lost,
    taxa: data.won + data.lost > 0 ? ((data.won / (data.won + data.lost)) * 100).toFixed(0) : '0',
    valor: data.value,
  })) : [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics do CRM</h1>
          <p className="text-muted-foreground">Métricas e insights de performance</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs with BentoCards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BentoCard
          title="Total de Leads"
          value={periodLeads.length}
          subtitle="No período selecionado"
          delay={0}
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
        />
        <BentoCard
          title="Negociações Fechadas"
          value={totalClosed}
          subtitle={`${wonNegotiations} ganhas / ${lostNegotiations} perdidas`}
          delay={0.1}
          icon={<Handshake className="h-5 w-5 text-muted-foreground" />}
        />
        <BentoCard
          title="Taxa de Conversão"
          value={`${conversionRate}%`}
          subtitle="Negociações ganhas"
          delay={0.2}
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
        />
        <BentoCard
          title="Tempo Médio de Fechamento"
          value={`${avgTimeToClose.toFixed(0)} dias`}
          subtitle="Para negociações ganhas"
          delay={0.3}
          icon={<Clock className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sources">Origens</TabsTrigger>
          <TabsTrigger value="losses">Motivos de Perda</TabsTrigger>
          {isManager && <TabsTrigger value="team">Equipe</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tendência Diária</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="leads" 
                        stroke="#3b82f6" 
                        name="Leads"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="negociacoes" 
                        stroke="#8b5cf6" 
                        name="Negociações"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status das Negociações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={negotiationsByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {negotiationsByStatus.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Leads por Origem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadsBySource} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Leads por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadsByStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {leadsByStatus.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="losses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Principais Motivos de Perda</CardTitle>
            </CardHeader>
            <CardContent>
              {lossReasonsData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lossReasonsData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum motivo de perda registrado no período</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isManager && (
          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance por Vendedor</CardTitle>
              </CardHeader>
              <CardContent>
                {salesperformance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Vendedor</th>
                          <th className="text-center py-3 px-2">Total</th>
                          <th className="text-center py-3 px-2">Ganhas</th>
                          <th className="text-center py-3 px-2">Perdidas</th>
                          <th className="text-center py-3 px-2">Taxa</th>
                          <th className="text-right py-3 px-2">Valor Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesperformance.map((sp) => (
                          <tr key={sp.name} className="border-b last:border-0">
                            <td className="py-3 px-2 font-medium">{sp.name}</td>
                            <td className="text-center py-3 px-2">{sp.total}</td>
                            <td className="text-center py-3 px-2 text-green-600">{sp.ganhas}</td>
                            <td className="text-center py-3 px-2 text-red-600">{sp.perdidas}</td>
                            <td className="text-center py-3 px-2">{sp.taxa}%</td>
                            <td className="text-right py-3 px-2">{formatCurrency(sp.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Nenhuma negociação no período</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
