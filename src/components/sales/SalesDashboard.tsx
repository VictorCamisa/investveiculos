import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BentoCard } from '@/components/ui/bento-card';
import { 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  DollarSign,
  Phone,
  MessageCircle,
  Target,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useSales, useSaleProfitReports } from '@/hooks/useSales';
import { useSalesTeamMetrics, usePendingApprovals, useTeamNegotiations } from '@/hooks/useSalesTeamMetrics';
import { useNavigate } from 'react-router-dom';

export function SalesDashboard() {
  const navigate = useNavigate();
  const { data: sales } = useSales();
  const { data: profitReports } = useSaleProfitReports();
  const { data: teamMetrics } = useSalesTeamMetrics();
  const { data: pendingApprovals } = usePendingApprovals();
  const { data: negotiations } = useTeamNegotiations();

  const formatCurrency = (value: number) => {
    if (value === 0) return 'R$ 0';
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const totalRevenue = sales?.reduce((sum, s) => 
    s.status === 'concluida' ? sum + s.sale_price : sum, 0
  ) || 0;

  const totalNetProfit = profitReports?.reduce((sum, r) => 
    sum + (r.net_profit || 0), 0
  ) || 0;

  const totalCalls = teamMetrics?.reduce((sum, m) => sum + m.calls_count, 0) || 0;
  const totalWhatsapp = teamMetrics?.reduce((sum, m) => sum + m.whatsapp_count, 0) || 0;

  const activeNegotiations = negotiations?.filter((n: any) => 
    !['ganho', 'perdido'].includes(n.status)
  ).length || 0;

  const pipelineValue = negotiations?.filter((n: any) => 
    !['ganho', 'perdido'].includes(n.status)
  ).reduce((sum: number, n: any) => sum + (n.estimated_value || 0), 0) || 0;

  const pendingCount = pendingApprovals?.length || 0;

  return (
    <div className="space-y-6">
      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div onClick={() => navigate('/vendas/aprovacoes')} className="cursor-pointer">
          <BentoCard 
            title="Pendentes de Aprovação"
            value={pendingCount}
            subtitle={pendingCount === 0 ? 'Nenhuma venda aguardando' : 'Vendas para aprovar'}
            colors={['#B71C1C', '#C62828', '#D32F2F']}
            icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        <BentoCard 
          title="Faturamento Total"
          value={formatCurrency(totalRevenue)}
          subtitle={`${sales?.filter(s => s.status === 'concluida').length || 0} vendas concluídas`}
          colors={['#E53935', '#EF5350', '#E57373']}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />

        <BentoCard 
          title="Lucro Líquido"
          value={formatCurrency(totalNetProfit)}
          subtitle="Lucro real após custos"
          colors={['#D32F2F', '#E53935', '#EF5350']}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />

        <BentoCard 
          title="Pipeline Ativo"
          value={formatCurrency(pipelineValue)}
          subtitle={`${activeNegotiations} negociações em andamento`}
          colors={['#C62828', '#D32F2F', '#E53935']}
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Activity Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Interações</p>
                <p className="text-2xl font-bold">{teamMetrics?.reduce((sum, m) => sum + m.total_interactions, 0) || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/20">
                <MessageCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-500" />
                <span>{totalCalls} ligações</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-500" />
                <span>{totalWhatsapp} WhatsApp</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Negociações Ativas</p>
                <p className="text-2xl font-bold">{activeNegotiations}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Valor médio: {formatCurrency(pipelineValue / (activeNegotiations || 1))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendedores Ativos</p>
                <p className="text-2xl font-bold">{teamMetrics?.length || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/20">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Views */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Desempenho da Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamMetrics && teamMetrics.length > 0 ? (
              <div className="space-y-4">
                {teamMetrics.slice(0, 5).map((member, index) => (
                  <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.total_sales > 0 ? `${member.total_sales} vendas • ` : ''}
                          {member.total_negotiations} negociações • {member.conversion_rate.toFixed(0)}% conversão
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">{formatCurrency(member.total_revenue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Negociações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {negotiations && negotiations.length > 0 ? (
              <div className="space-y-3">
                {negotiations.slice(0, 5).map((neg: any) => (
                  <div key={neg.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{neg.lead?.name || 'Lead sem nome'}</p>
                      <p className="text-xs text-muted-foreground">
                        {neg.vehicle ? `${neg.vehicle.brand} ${neg.vehicle.model}` : 'Sem veículo'}
                      </p>
                      <p className="text-xs text-blue-500 font-medium">
                        Vendedor: {neg.salesperson?.full_name || 'Não atribuído'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(neg.estimated_value || 0)}</p>
                      <Badge variant="outline" className="text-xs">{neg.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhuma negociação</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
