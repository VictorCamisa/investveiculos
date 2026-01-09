import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSaleProfitReports } from '@/hooks/useSales';
import { ProfitReportCard } from '@/components/sales/ProfitReportCard';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export function SalesProfitPage() {
  const { data: profitReports, isLoading } = useSaleProfitReports();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const totalGrossProfit = profitReports?.reduce((sum, r) => sum + (r.gross_profit || 0), 0) || 0;
  const totalNetProfit = profitReports?.reduce((sum, r) => sum + (r.net_profit || 0), 0) || 0;
  const avgMargin = profitReports && profitReports.length > 0
    ? (totalNetProfit / profitReports.reduce((sum, r) => sum + (r.sale_price || 0), 0)) * 100
    : 0;

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Lucro Bruto Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalGrossProfit)}</p>
            <p className="text-xs text-muted-foreground">Antes de custos operacionais</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Lucro Líquido Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalNetProfit)}
            </p>
            <p className="text-xs text-muted-foreground">Lucro real após todos os custos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {avgMargin >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              Margem Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${avgMargin >= 10 ? 'text-green-600' : avgMargin >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
              {avgMargin.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Margem líquida sobre vendas</p>
          </CardContent>
        </Card>
      </div>

      {/* Profit Reports */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Relatório de Lucro por Venda</h2>
        {profitReports && profitReports.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {profitReports.map((report) => (
              <ProfitReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Nenhum relatório disponível</h3>
              <p className="text-muted-foreground">
                Os relatórios de lucro aparecerão quando houver vendas concluídas
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
