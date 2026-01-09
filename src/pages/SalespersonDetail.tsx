import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  User, 
  TrendingUp, 
  Target, 
  DollarSign, 
  Phone, 
  MessageCircle, 
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useSalespersonDetail, 
  useSalespersonStats,
  useSalespersonNegotiations,
  useSalespersonCommissions,
  useSalespersonSales,
  useSalespersonLeads,
  useSalespersonActivities,
  useSalespersonMonthlySales
} from '@/hooks/useSalesperson';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function SalespersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: salesperson, isLoading } = useSalespersonDetail(id);
  const { data: stats } = useSalespersonStats(id);
  const { data: negotiations } = useSalespersonNegotiations(id);
  const { data: commissions } = useSalespersonCommissions(id);
  const { data: sales } = useSalespersonSales(id);
  const { data: leads } = useSalespersonLeads(id);
  const { data: activities } = useSalespersonActivities(id);
  const { data: monthlySales } = useSalespersonMonthlySales(id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const formatCompactCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12">Carregando...</div>;
  }

  if (!salesperson) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Vendedor não encontrado</p>
        <Button onClick={() => navigate('/vendas/equipe')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const activeNegotiations = negotiations?.filter(n => !['ganho', 'perdido'].includes(n.status)) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/vendas/equipe')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-4 border-primary/20">
              <AvatarImage src={salesperson.avatar_url || ''} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {salesperson.full_name?.charAt(0) || 'V'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{salesperson.full_name || 'Sem nome'}</h1>
              <p className="text-muted-foreground">{salesperson.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant={salesperson.is_active ? 'default' : 'secondary'}>
                  {salesperson.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
                {salesperson.role && (
                  <Badge variant="outline">{salesperson.role}</Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  Desde {format(new Date(salesperson.created_at), "MMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden lg:grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-primary">{stats?.completedSales || 0}</p>
                <p className="text-xs text-muted-foreground">Vendas</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-green-600">{formatCompactCurrency(stats?.totalRevenue || 0)}</p>
                <p className="text-xs text-muted-foreground">Faturamento</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{(stats?.conversionRate || 0).toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Conversão</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{stats?.activeNegotiations || 0}</p>
                <p className="text-xs text-muted-foreground">Em Negociação</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="negotiations" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Negociações
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Comissões
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Atividades
          </TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Vendas Concluídas</p>
                    <p className="text-2xl font-bold">{stats?.completedSales || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Faturamento Total</p>
                    <p className="text-2xl font-bold">{formatCompactCurrency(stats?.totalRevenue || 0)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    <p className="text-2xl font-bold">{formatCompactCurrency(stats?.averageTicket || 0)}</p>
                  </div>
                  <Award className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                    <p className="text-2xl font-bold">{(stats?.conversionRate || 0).toFixed(1)}%</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
                <Progress value={stats?.conversionRate || 0} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Interactions Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Interações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xl font-bold">{stats?.callsCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Ligações</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xl font-bold">{stats?.whatsappCount || 0}</p>
                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-xl font-bold">{stats?.emailsCount || 0}</p>
                    <p className="text-xs text-muted-foreground">E-mails</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-xl font-bold">{stats?.visitsCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Visitas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Sales Chart */}
          {monthlySales && monthlySales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickFormatter={(value) => {
                      const [year, month] = value.split('-');
                      return `${month}/${year.slice(2)}`;
                    }} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                      labelFormatter={(value) => `Mês: ${value}`}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Negotiations Tab */}
        <TabsContent value="negotiations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.activeNegotiations || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Ganhas</p>
                <p className="text-2xl font-bold text-green-600">{stats?.wonNegotiations || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Perdidas</p>
                <p className="text-2xl font-bold text-red-600">{stats?.lostNegotiations || 0}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Negociações Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              {activeNegotiations.length > 0 ? (
                <div className="space-y-3">
                  {activeNegotiations.map((neg: any) => (
                    <div key={neg.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{neg.lead?.name || 'Lead sem nome'}</p>
                        <p className="text-sm text-muted-foreground">
                          {neg.vehicle ? `${neg.vehicle.brand} ${neg.vehicle.model}` : 'Sem veículo'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(neg.estimated_value || 0)}</p>
                        <Badge variant="outline">{neg.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma negociação ativa</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Comissões Pagas</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats?.paidCommissions || 0)}</p>
              </CardContent>
            </Card>
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Comissões Pendentes</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(stats?.pendingCommissions || 0)}</p>
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.totalCommissions || 0)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Comissões</CardTitle>
            </CardHeader>
            <CardContent>
              {commissions && commissions.length > 0 ? (
                <div className="space-y-3">
                  {commissions.slice(0, 10).map((commission: any) => (
                    <div key={commission.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">
                          {commission.sale?.vehicle?.brand} {commission.sale?.vehicle?.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {commission.sale?.customer?.name} • {format(new Date(commission.created_at), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(commission.final_amount || 0)}</p>
                        <Badge variant={commission.paid ? 'default' : 'outline'}>
                          {commission.paid ? 'Pago' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma comissão registrada</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total de Leads</p>
                <p className="text-2xl font-bold">{stats?.totalLeads || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Convertidos</p>
                <p className="text-2xl font-bold text-green-600">{stats?.convertedLeads || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">{(stats?.conversionRate || 0).toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Leads Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {leads && leads.length > 0 ? (
                <div className="space-y-3">
                  {leads.slice(0, 10).map((lead: any) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {lead.phone} • {lead.source}
                        </p>
                      </div>
                      <Badge variant={lead.status === 'convertido' ? 'default' : 'outline'}>
                        {lead.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum lead atribuído</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {activities && activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity: any) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'whatsapp' ? 'bg-green-500/20 text-green-500' :
                        activity.type === 'ligacao' ? 'bg-blue-500/20 text-blue-500' :
                        activity.type === 'email' ? 'bg-purple-500/20 text-purple-500' :
                        'bg-amber-500/20 text-amber-500'
                      }`}>
                        {activity.type === 'whatsapp' ? <MessageCircle className="h-4 w-4" /> :
                         activity.type === 'ligacao' ? <Phone className="h-4 w-4" /> :
                         activity.type === 'email' ? <Mail className="h-4 w-4" /> :
                         <Calendar className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.lead?.name} • {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant="outline">{activity.type}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma atividade registrada</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
