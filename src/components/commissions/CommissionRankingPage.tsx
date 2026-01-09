import { Trophy, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCurrentGoals } from '@/hooks/useCommissionsComplete';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, format } from 'date-fns';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getRankBadge = (index: number) => {
  if (index === 0) return { color: 'bg-yellow-500 text-yellow-950', icon: '🥇' };
  if (index === 1) return { color: 'bg-gray-400 text-gray-950', icon: '🥈' };
  if (index === 2) return { color: 'bg-amber-600 text-amber-100', icon: '🥉' };
  return { color: 'bg-muted text-muted-foreground', icon: `#${index + 1}` };
};

interface RankingData {
  user_id: string;
  full_name: string;
  total_sales: number;
  total_revenue: number;
  total_commissions: number;
  sales_this_month: number;
  revenue_this_month: number;
}

interface ProfileData {
  id: string;
  full_name: string | null;
}

interface SaleData {
  salesperson_id: string;
  sale_price: number;
  sale_date: string;
  status: string;
}

interface CommissionData {
  user_id: string;
  final_amount: number;
  status: string;
}

function useSalespersonRankingRealtime() {
  return useQuery({
    queryKey: ['salesperson-ranking-realtime'],
    queryFn: async (): Promise<RankingData[]> => {
      // Get all salespeople with vendedor role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'vendedor');
      
      if (!roles?.length) return [];
      
      const userIds = (roles as { user_id: string }[]).map(r => r.user_id);
      
      // Get profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
        .eq('is_active', true);
      
      if (!profilesData?.length) return [];
      
      const profiles = profilesData as ProfileData[];
      
      // Get all sales
      const { data: salesData } = await supabase
        .from('sales')
        .select('salesperson_id, sale_price, sale_date, status')
        .in('salesperson_id', userIds);
      
      const sales = (salesData || []) as SaleData[];
      
      // Get commissions
      const { data: commissionsData } = await supabase
        .from('sale_commissions')
        .select('user_id, final_amount, status')
        .in('user_id', userIds);
      
      const commissions = (commissionsData || []) as CommissionData[];
      
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      
      // Calculate ranking
      const rankingData: RankingData[] = profiles.map(profile => {
        const userSales = sales.filter(s => 
          s.salesperson_id === profile.id && 
          (s.status === 'concluida' || s.status === 'pendente')
        );
        
        const userSalesThisMonth = userSales.filter(s => 
          s.sale_date >= monthStart
        );
        
        const userCommissions = commissions.filter(c => 
          c.user_id === profile.id && c.status === 'paid'
        );
        
        return {
          user_id: profile.id,
          full_name: profile.full_name || 'Vendedor',
          total_sales: userSales.length,
          total_revenue: userSales.reduce((sum, s) => sum + (s.sale_price || 0), 0),
          total_commissions: userCommissions.reduce((sum, c) => sum + (c.final_amount || 0), 0),
          sales_this_month: userSalesThisMonth.length,
          revenue_this_month: userSalesThisMonth.reduce((sum, s) => sum + (s.sale_price || 0), 0),
        };
      });
      
      // Sort by total revenue desc
      return rankingData.sort((a, b) => b.total_revenue - a.total_revenue);
    },
  });
}

export function CommissionRankingPage() {
  const { data: ranking, isLoading } = useSalespersonRankingRealtime();
  const { data: goals } = useCurrentGoals();

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  // Filter to show only those with activity or take top salespeople
  const activeRanking = ranking?.filter(r => r.total_sales > 0 || r.sales_this_month > 0) || [];
  const inactiveRanking = ranking?.filter(r => r.total_sales === 0 && r.sales_this_month === 0) || [];

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
      {activeRanking.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {/* 2nd place */}
          <div className="flex flex-col items-center justify-end">
            <Card className="w-full text-center bg-gradient-to-b from-gray-500/10 to-transparent border-gray-500/30">
              <CardContent className="pt-6">
                <div className="text-4xl mb-2">🥈</div>
                <p className="font-semibold">{activeRanking[1]?.full_name || 'Vendedor'}</p>
                <p className="text-2xl font-bold text-gray-400">{activeRanking[1]?.total_sales || 0}</p>
                <p className="text-xs text-muted-foreground">vendas total</p>
                <p className="text-lg font-semibold text-green-500 mt-2">
                  {formatCurrency(activeRanking[1]?.total_revenue || 0)}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* 1st place */}
          <div className="flex flex-col items-center">
            <Card className="w-full text-center bg-gradient-to-b from-yellow-500/20 to-transparent border-yellow-500/30 transform scale-105">
              <CardContent className="pt-6">
                <div className="text-5xl mb-2">🥇</div>
                <p className="font-bold text-lg">{activeRanking[0]?.full_name || 'Vendedor'}</p>
                <p className="text-3xl font-bold text-yellow-500">{activeRanking[0]?.total_sales || 0}</p>
                <p className="text-xs text-muted-foreground">vendas total</p>
                <p className="text-xl font-bold text-green-500 mt-2">
                  {formatCurrency(activeRanking[0]?.total_revenue || 0)}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* 3rd place */}
          <div className="flex flex-col items-center justify-end">
            <Card className="w-full text-center bg-gradient-to-b from-amber-600/10 to-transparent border-amber-600/30">
              <CardContent className="pt-6">
                <div className="text-4xl mb-2">🥉</div>
                <p className="font-semibold">{activeRanking[2]?.full_name || 'Vendedor'}</p>
                <p className="text-2xl font-bold text-amber-600">{activeRanking[2]?.total_sales || 0}</p>
                <p className="text-xs text-muted-foreground">vendas total</p>
                <p className="text-lg font-semibold text-green-500 mt-2">
                  {formatCurrency(activeRanking[2]?.total_revenue || 0)}
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
            {activeRanking.map((seller, index) => {
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
                    <p className="font-semibold">{seller.full_name}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{seller.total_sales} vendas total</span>
                      <span>{formatCurrency(seller.total_revenue)} faturado</span>
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
                      <span className="text-sm">{seller.sales_this_month} este mês</span>
                    </div>
                    <p className="text-lg font-bold text-green-500">
                      {formatCurrency(seller.total_commissions)}
                    </p>
                    <p className="text-xs text-muted-foreground">em comissões pagas</p>
                  </div>
                </div>
              );
            })}

            {activeRanking.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum vendedor com vendas registradas
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inactive Salespeople */}
      {inactiveRanking.length > 0 && (
        <Card className="opacity-75">
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Vendedores Sem Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {inactiveRanking.map((seller) => (
                <Badge key={seller.user_id} variant="secondary">
                  {seller.full_name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
