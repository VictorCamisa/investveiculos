import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Target,
  Trophy,
  Check,
  Banknote
} from 'lucide-react';
import { 
  useCommissionStats, 
  useSaleCommissions, 
  useCommissionProjections,
  useCurrentGoals,
  useSalespersonRanking,
  useApproveCommission,
  usePayCommission
} from '@/hooks/useCommissionsComplete';
import { commissionStatusLabels, commissionStatusColors } from '@/types/commissions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function CommissionDashboard() {
  const { data: stats, isLoading: statsLoading } = useCommissionStats();
  const { data: commissions } = useSaleCommissions({ status: 'pending' });
  const { data: projections } = useCommissionProjections();
  const { data: goals } = useCurrentGoals();
  const { data: ranking } = useSalespersonRanking();
  const approveCommission = useApproveCommission();
  const payCommission = usePayCommission();

  const pendingApproval = commissions?.filter(c => c.status === 'pending') || [];
  const topSellers = ranking?.slice(0, 3) || [];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-500">
              {formatCurrency(stats?.totalPending || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.countPending || 0} aguardando
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-500">
              {formatCurrency(stats?.totalApproved || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.countApproved || 0} para pagar
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagas</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">
              {formatCurrency(stats?.totalPaid || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.countPaid || 0} pagas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Projeção</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-500">
              {formatCurrency(projections?.weightedTotal || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {projections?.negotiationsCount || 0} negociações
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Approvals - Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <CardTitle>Aguardando Aprovação</CardTitle>
              {pendingApproval.length > 0 && (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                  {pendingApproval.length}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/comissoes/historico" className="flex items-center gap-1">
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingApproval.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500/50" />
                <p>Todas as comissões estão em dia!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingApproval.slice(0, 4).map((comm) => (
                  <div key={comm.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {(comm.user?.full_name || 'V')[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{comm.user?.full_name || 'Vendedor'}</p>
                        <p className="text-sm text-muted-foreground">
                          {comm.sale?.vehicle?.brand} {comm.sale?.vehicle?.model}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(comm.final_amount)}</p>
                        <Badge className={commissionStatusColors[comm.status]} variant="outline">
                          {commissionStatusLabels[comm.status]}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500/50 text-green-500 hover:bg-green-500/10"
                          onClick={() => approveCommission.mutate({ id: comm.id })}
                          disabled={approveCommission.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            approveCommission.mutate({ id: comm.id }, {
                              onSuccess: () => {
                                payCommission.mutate(comm.id);
                              }
                            });
                          }}
                          disabled={approveCommission.isPending || payCommission.isPending}
                        >
                          <Banknote className="h-4 w-4 mr-1" />
                          Pagar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingApproval.length > 4 && (
                  <p className="text-center text-sm text-muted-foreground pt-2">
                    +{pendingApproval.length - 4} mais comissões pendentes
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Sellers Mini */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <CardTitle>Top Vendedores</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/comissoes/ranking" className="flex items-center gap-1">
                Ranking <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {topSellers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Nenhum dado disponível
              </p>
            ) : (
              <div className="space-y-3">
                {topSellers.map((seller, index) => (
                  <div key={seller.user_id} className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                      ${index === 0 ? 'bg-yellow-500 text-yellow-950' : 
                        index === 1 ? 'bg-gray-400 text-gray-950' : 
                        'bg-amber-700 text-amber-100'}
                    `}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{seller.full_name || 'Vendedor'}</p>
                      <p className="text-xs text-muted-foreground">
                        {seller.sales_this_month} vendas
                      </p>
                    </div>
                    <p className="font-bold text-green-500 text-sm">
                      {formatCurrency(Number(seller.total_commissions))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current Goals Progress */}
      {goals && goals.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Metas do Mês</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/comissoes/metas" className="flex items-center gap-1">
                Gerenciar <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {goals.slice(0, 6).map((goal) => {
                const salesProgress = goal.target_sales > 0 ? (goal.current_sales / goal.target_sales) * 100 : 0;
                const revenueProgress = Number(goal.target_revenue) > 0 ? (Number(goal.current_revenue) / Number(goal.target_revenue)) * 100 : 0;
                const isAchieved = salesProgress >= 100;
                
                return (
                  <div key={goal.id} className={`p-4 rounded-lg border ${isAchieved ? 'bg-green-500/5 border-green-500/20' : 'bg-muted/30'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium truncate">{goal.user?.full_name || 'Vendedor'}</p>
                      {isAchieved && <Badge className="bg-green-500 text-xs">✓</Badge>}
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Vendas</span>
                          <span>{goal.current_sales}/{goal.target_sales}</span>
                        </div>
                        <Progress value={Math.min(salesProgress, 100)} className="h-1.5" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Faturamento</span>
                          <span>{Math.round(revenueProgress)}%</span>
                        </div>
                        <Progress value={Math.min(revenueProgress, 100)} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
