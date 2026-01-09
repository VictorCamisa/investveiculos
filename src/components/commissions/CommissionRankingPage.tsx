import { Trophy, TrendingUp, DollarSign, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSalespersonRanking, useCurrentGoals } from '@/hooks/useCommissionsComplete';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getRankBadge = (index: number) => {
  if (index === 0) return { color: 'bg-yellow-500 text-yellow-950', icon: '🥇' };
  if (index === 1) return { color: 'bg-gray-400 text-gray-950', icon: '🥈' };
  if (index === 2) return { color: 'bg-amber-600 text-amber-100', icon: '🥉' };
  return { color: 'bg-muted text-muted-foreground', icon: `#${index + 1}` };
};

export function CommissionRankingPage() {
  const { data: ranking, isLoading } = useSalespersonRanking();
  const { data: goals } = useCurrentGoals();

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Ranking de Vendedores
        </h2>
        <p className="text-sm text-muted-foreground">Performance e comparativo da equipe</p>
      </div>

      {/* Podium for top 3 */}
      {ranking && ranking.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {/* 2nd place */}
          <div className="flex flex-col items-center justify-end">
            <Card className="w-full text-center bg-gradient-to-b from-gray-500/10 to-transparent border-gray-500/30">
              <CardContent className="pt-6">
                <div className="text-4xl mb-2">🥈</div>
                <p className="font-semibold">{ranking[1]?.full_name || 'Vendedor'}</p>
                <p className="text-2xl font-bold text-gray-400">{ranking[1]?.sales_this_month || 0}</p>
                <p className="text-xs text-muted-foreground">vendas este mês</p>
                <p className="text-lg font-semibold text-green-500 mt-2">
                  {formatCurrency(Number(ranking[1]?.total_commissions || 0))}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* 1st place */}
          <div className="flex flex-col items-center">
            <Card className="w-full text-center bg-gradient-to-b from-yellow-500/20 to-transparent border-yellow-500/30 transform scale-105">
              <CardContent className="pt-6">
                <div className="text-5xl mb-2">🥇</div>
                <p className="font-bold text-lg">{ranking[0]?.full_name || 'Vendedor'}</p>
                <p className="text-3xl font-bold text-yellow-500">{ranking[0]?.sales_this_month || 0}</p>
                <p className="text-xs text-muted-foreground">vendas este mês</p>
                <p className="text-xl font-bold text-green-500 mt-2">
                  {formatCurrency(Number(ranking[0]?.total_commissions || 0))}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* 3rd place */}
          <div className="flex flex-col items-center justify-end">
            <Card className="w-full text-center bg-gradient-to-b from-amber-600/10 to-transparent border-amber-600/30">
              <CardContent className="pt-6">
                <div className="text-4xl mb-2">🥉</div>
                <p className="font-semibold">{ranking[2]?.full_name || 'Vendedor'}</p>
                <p className="text-2xl font-bold text-amber-600">{ranking[2]?.sales_this_month || 0}</p>
                <p className="text-xs text-muted-foreground">vendas este mês</p>
                <p className="text-lg font-semibold text-green-500 mt-2">
                  {formatCurrency(Number(ranking[2]?.total_commissions || 0))}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Full Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking Completo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ranking?.map((seller, index) => {
              const badge = getRankBadge(index);
              const goal = goals?.find(g => g.user_id === seller.user_id);
              const goalProgress = goal ? (goal.current_sales / goal.target_sales) * 100 : null;
              
              return (
                <div 
                  key={seller.user_id} 
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${badge.color}`}>
                    {badge.icon}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-semibold">{seller.full_name || 'Vendedor'}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{seller.total_sales || 0} vendas total</span>
                      <span>{formatCurrency(Number(seller.total_revenue || 0))} faturado</span>
                    </div>
                    {goalProgress !== null && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Meta: {goal?.current_sales}/{goal?.target_sales} vendas</span>
                          <span>{goalProgress.toFixed(0)}%</span>
                        </div>
                        <Progress value={Math.min(goalProgress, 100)} className="h-1.5" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">{seller.sales_this_month || 0} este mês</span>
                    </div>
                    <p className="text-lg font-bold text-green-500">
                      {formatCurrency(Number(seller.total_commissions || 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">em comissões</p>
                  </div>
                </div>
              );
            })}

            {(!ranking || ranking.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum vendedor encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
