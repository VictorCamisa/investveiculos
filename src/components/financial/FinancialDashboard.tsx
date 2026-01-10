import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BentoCard } from '@/components/ui/bento-card';
import { useFinancialDashboard, useFinancialAlerts } from '@/hooks/useFinancial';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Car, 
  Wallet,
  Target,
  AlertTriangle,
  ShoppingCart
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useDREData } from '@/hooks/useFinancial';
import { Badge } from '@/components/ui/badge';

export function FinancialDashboard() {
  const { kpis, isLoading } = useFinancialDashboard();
  const { dreData } = useDREData(6);
  const alerts = useFinancialAlerts();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const warningAlerts = alerts.filter(a => a.severity === 'warning').length;

  const costBreakdown = [
    { name: 'Aquisição', value: dreData.reduce((sum, d) => sum + d.custoAquisicao, 0), color: 'hsl(var(--primary))' },
    { name: 'Custos Veículo', value: dreData.reduce((sum, d) => sum + d.custosVeiculo, 0), color: 'hsl(var(--warning))' },
    { name: 'Custos Venda', value: dreData.reduce((sum, d) => sum + d.custosVenda, 0), color: 'hsl(var(--destructive))' },
    { name: 'Comissões', value: dreData.reduce((sum, d) => sum + d.comissoes, 0), color: 'hsl(270 70% 60%)' },
    { name: 'CAC', value: dreData.reduce((sum, d) => sum + d.cac, 0), color: 'hsl(180 70% 50%)' },
  ].filter(c => c.value > 0);

  if (isLoading || !kpis) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BentoCard
          title="Faturamento Total"
          value={formatCurrency(kpis.totalRevenue)}
          subtitle={`${kpis.completedSalesCount} vendas concluídas`}
          delay={0}
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
        />
        <BentoCard
          title="Lucro Líquido"
          value={formatCurrency(kpis.totalNetProfit)}
          subtitle={`Margem: ${kpis.avgMargin.toFixed(1)}%`}
          delay={0.1}
          icon={kpis.totalNetProfit >= 0 ? 
            <TrendingUp className="h-5 w-5 text-primary" /> : 
            <TrendingDown className="h-5 w-5 text-primary" />
          }
        />
        <BentoCard
          title="Valor em Estoque"
          value={formatCurrency(kpis.totalStockValue)}
          subtitle={`${kpis.vehiclesInStock} veículos • ${kpis.avgDaysInStock.toFixed(0)} dias média`}
          delay={0.2}
          icon={<Car className="h-5 w-5 text-muted-foreground" />}
        />
        <BentoCard
          title="Pipeline Projetado"
          value={formatCurrency(kpis.weightedPipeline)}
          subtitle={`Total: ${formatCurrency(kpis.pipelineValue)}`}
          delay={0.3}
          icon={<Target className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendas</span>
                <span className="font-semibold">{kpis.thisMonthSalesCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Faturamento</span>
                <span className="font-semibold">{formatCurrency(kpis.thisMonthRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lucro</span>
                <span className={`font-semibold ${kpis.thisMonthProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(kpis.thisMonthProfit)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pendentes</span>
                <span className="font-semibold text-orange-500">{formatCurrency(kpis.pendingCommissions)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aprovadas</span>
                <span className="font-semibold text-green-500">{formatCurrency(kpis.approvedCommissions)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Críticos</span>
                <Badge variant="destructive">{criticalAlerts}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Atenção</span>
                <Badge variant="outline" className="border-orange-500 text-orange-500">{warningAlerts}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Faturamento e Lucro (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dreData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="period" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Bar dataKey="receitaBruta" name="Faturamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lucroLiquido" name="Lucro Líquido" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Composição de Custos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {costBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Margin Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução da Margem Líquida</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dreData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="period" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Line 
                type="monotone" 
                dataKey="margemLiquida" 
                name="Margem Líquida" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
