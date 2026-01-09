import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDREData } from '@/hooks/useFinancial';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function DREPage() {
  const [period, setPeriod] = useState('6');
  const { dreData, totals, isLoading } = useDREData(parseInt(period));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const margemBrutaTotal = totals.receitaBruta > 0 ? (totals.lucroBruto / totals.receitaBruta) * 100 : 0;
  const margemLiquidaTotal = totals.receitaBruta > 0 ? (totals.lucroLiquido / totals.receitaBruta) * 100 : 0;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Demonstrativo de Resultados</h2>
          <p className="text-muted-foreground">Análise consolidada de receitas e despesas</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Últimos 3 meses</SelectItem>
            <SelectItem value="6">Últimos 6 meses</SelectItem>
            <SelectItem value="12">Últimos 12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totals.receitaBruta)}</p>
            <p className="text-xs text-muted-foreground">{totals.qtdVendas} vendas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lucro Bruto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-500">{formatCurrency(totals.lucroBruto)}</p>
            <p className="text-xs text-muted-foreground">Margem: {margemBrutaTotal.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {totals.lucroLiquido >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <p className={`text-2xl font-bold ${totals.lucroLiquido >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(totals.lucroLiquido)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Margem: {margemLiquidaTotal.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Custos Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-500">
              {formatCurrency(totals.custoAquisicao + totals.custosVeiculo + totals.custosVenda + totals.comissoes + totals.cac)}
            </p>
            <p className="text-xs text-muted-foreground">
              {((1 - totals.lucroLiquido / totals.receitaBruta) * 100).toFixed(1)}% da receita
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DRE Table */}
      <Card>
        <CardHeader>
          <CardTitle>DRE por Período</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Conta</TableHead>
                {dreData.map(d => (
                  <TableHead key={d.period} className="text-right">{d.period}</TableHead>
                ))}
                <TableHead className="text-right font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-primary/5">
                <TableCell className="font-semibold">Receita Bruta</TableCell>
                {dreData.map(d => (
                  <TableCell key={d.period} className="text-right font-semibold">
                    {formatCurrency(d.receitaBruta)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold">{formatCurrency(totals.receitaBruta)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">(-) Custo Aquisição</TableCell>
                {dreData.map(d => (
                  <TableCell key={d.period} className="text-right text-muted-foreground">
                    {formatCurrency(d.custoAquisicao)}
                  </TableCell>
                ))}
                <TableCell className="text-right">{formatCurrency(totals.custoAquisicao)}</TableCell>
              </TableRow>
              <TableRow className="bg-blue-500/5">
                <TableCell className="font-semibold">= Lucro Bruto</TableCell>
                {dreData.map(d => (
                  <TableCell key={d.period} className="text-right font-semibold text-blue-600">
                    {formatCurrency(d.lucroBruto)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold text-blue-600">{formatCurrency(totals.lucroBruto)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">(-) Custos Veículo</TableCell>
                {dreData.map(d => (
                  <TableCell key={d.period} className="text-right text-muted-foreground">
                    {formatCurrency(d.custosVeiculo)}
                  </TableCell>
                ))}
                <TableCell className="text-right">{formatCurrency(totals.custosVeiculo)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">(-) Custos Venda</TableCell>
                {dreData.map(d => (
                  <TableCell key={d.period} className="text-right text-muted-foreground">
                    {formatCurrency(d.custosVenda)}
                  </TableCell>
                ))}
                <TableCell className="text-right">{formatCurrency(totals.custosVenda)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">(-) Comissões</TableCell>
                {dreData.map(d => (
                  <TableCell key={d.period} className="text-right text-muted-foreground">
                    {formatCurrency(d.comissoes)}
                  </TableCell>
                ))}
                <TableCell className="text-right">{formatCurrency(totals.comissoes)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">(-) CAC (Leads)</TableCell>
                {dreData.map(d => (
                  <TableCell key={d.period} className="text-right text-muted-foreground">
                    {formatCurrency(d.cac)}
                  </TableCell>
                ))}
                <TableCell className="text-right">{formatCurrency(totals.cac)}</TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow className={totals.lucroLiquido >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}>
                <TableCell className="font-bold">= Lucro Líquido</TableCell>
                {dreData.map(d => (
                  <TableCell 
                    key={d.period} 
                    className={`text-right font-bold ${d.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(d.lucroLiquido)}
                  </TableCell>
                ))}
                <TableCell className={`text-right font-bold ${totals.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.lucroLiquido)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Margem Líquida</TableCell>
                {dreData.map(d => (
                  <TableCell 
                    key={d.period} 
                    className={`text-right font-semibold ${d.margemLiquida >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {d.margemLiquida.toFixed(1)}%
                  </TableCell>
                ))}
                <TableCell className={`text-right font-bold ${margemLiquidaTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {margemLiquidaTotal.toFixed(1)}%
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Stacked Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Composição por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={dreData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="period" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Bar dataKey="custoAquisicao" name="Aquisição" stackId="custos" fill="hsl(var(--primary))" />
              <Bar dataKey="custosVeiculo" name="Custos Veículo" stackId="custos" fill="hsl(var(--warning))" />
              <Bar dataKey="custosVenda" name="Custos Venda" stackId="custos" fill="hsl(var(--destructive))" />
              <Bar dataKey="comissoes" name="Comissões" stackId="custos" fill="hsl(270 70% 60%)" />
              <Bar dataKey="lucroLiquido" name="Lucro Líquido" fill="hsl(142 76% 36%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
