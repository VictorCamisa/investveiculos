import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDREData, DRECategoryDetail } from '@/hooks/useFinancial';
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
import { TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ExpandableRowProps {
  label: string;
  values: number[];
  total: number;
  details: DRECategoryDetail[];
  periodDetails: DRECategoryDetail[][];
  formatCurrency: (value: number) => string;
  isExpanded: boolean;
  onToggle: () => void;
  indent?: number;
}

function ExpandableRow({ 
  label, 
  values, 
  total, 
  details, 
  periodDetails,
  formatCurrency, 
  isExpanded, 
  onToggle,
  indent = 6 
}: ExpandableRowProps) {
  const hasDetails = details.length > 0;

  return (
    <>
      <TableRow 
        className={cn(
          hasDetails && "cursor-pointer hover:bg-muted/50 transition-colors",
          isExpanded && "bg-muted/30"
        )}
        onClick={hasDetails ? onToggle : undefined}
      >
        <TableCell className={`pl-${indent} flex items-center gap-2`}>
          {hasDetails ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <span className="w-4" />
          )}
          <span>{label}</span>
          {hasDetails && (
            <span className="text-xs text-muted-foreground ml-1">
              ({details.length} {details.length === 1 ? 'categoria' : 'categorias'})
            </span>
          )}
        </TableCell>
        {values.map((value, idx) => (
          <TableCell key={idx} className="text-right text-muted-foreground">
            {formatCurrency(value)}
          </TableCell>
        ))}
        <TableCell className="text-right">{formatCurrency(total)}</TableCell>
      </TableRow>
      
      {isExpanded && details.map((detail, detailIdx) => (
        <TableRow key={detailIdx} className="bg-muted/20">
          <TableCell className="pl-12 text-sm text-muted-foreground">
            └ {detail.category}
          </TableCell>
          {periodDetails.map((pd, periodIdx) => {
            const periodDetail = pd.find(d => d.category === detail.category);
            return (
              <TableCell key={periodIdx} className="text-right text-sm text-muted-foreground">
                {formatCurrency(periodDetail?.amount || 0)}
              </TableCell>
            );
          })}
          <TableCell className="text-right text-sm text-muted-foreground">
            {formatCurrency(detail.amount)}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function DREPage() {
  const [period, setPeriod] = useState('6');
  const { dreData, totals, isLoading } = useDREData(parseInt(period));
  
  // Estado para controlar linhas expandidas
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (rowKey: string) => {
    setExpandedRows(prev => ({ ...prev, [rowKey]: !prev[rowKey] }));
  };

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
          <p className="text-sm text-muted-foreground">Clique nas linhas com categorias para expandir os detalhes</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Conta</TableHead>
                {dreData.map(d => (
                  <TableHead key={d.period} className="text-right">{d.period}</TableHead>
                ))}
                <TableHead className="text-right font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Receita Bruta */}
              <TableRow className="bg-primary/5">
                <TableCell className="font-semibold">Receita Bruta</TableCell>
                {dreData.map(d => (
                  <TableCell key={d.period} className="text-right font-semibold">
                    {formatCurrency(d.receitaBruta)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold">{formatCurrency(totals.receitaBruta)}</TableCell>
              </TableRow>

              {/* Custo Aquisição */}
              <TableRow>
                <TableCell className="pl-6">(-) Custo Aquisição</TableCell>
                {dreData.map(d => (
                  <TableCell key={d.period} className="text-right text-muted-foreground">
                    {formatCurrency(d.custoAquisicao)}
                  </TableCell>
                ))}
                <TableCell className="text-right">{formatCurrency(totals.custoAquisicao)}</TableCell>
              </TableRow>

              {/* Lucro Bruto */}
              <TableRow className="bg-blue-500/5">
                <TableCell className="font-semibold">= Lucro Bruto</TableCell>
                {dreData.map(d => (
                  <TableCell key={d.period} className="text-right font-semibold text-blue-600">
                    {formatCurrency(d.lucroBruto)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold text-blue-600">{formatCurrency(totals.lucroBruto)}</TableCell>
              </TableRow>

              {/* Custos Veículo - Expandível */}
              <ExpandableRow
                label="(-) Custos Veículo"
                values={dreData.map(d => d.custosVeiculo)}
                total={totals.custosVeiculo}
                details={totals.custosVeiculoDetails}
                periodDetails={dreData.map(d => d.custosVeiculoDetails)}
                formatCurrency={formatCurrency}
                isExpanded={expandedRows['custosVeiculo'] || false}
                onToggle={() => toggleRow('custosVeiculo')}
              />

              {/* Custos Venda - Expandível */}
              <ExpandableRow
                label="(-) Custos Venda"
                values={dreData.map(d => d.custosVenda)}
                total={totals.custosVenda}
                details={totals.custosVendaDetails}
                periodDetails={dreData.map(d => d.custosVendaDetails)}
                formatCurrency={formatCurrency}
                isExpanded={expandedRows['custosVenda'] || false}
                onToggle={() => toggleRow('custosVenda')}
              />

              {/* Comissões */}
              <TableRow>
                <TableCell className="pl-6 flex items-center gap-2">
                  <span className="w-4" />
                  (-) Comissões
                </TableCell>
                {dreData.map(d => (
                  <TableCell key={d.period} className="text-right text-muted-foreground">
                    {formatCurrency(d.comissoes)}
                  </TableCell>
                ))}
                <TableCell className="text-right">{formatCurrency(totals.comissoes)}</TableCell>
              </TableRow>

              {/* CAC */}
              <TableRow>
                <TableCell className="pl-6 flex items-center gap-2">
                  <span className="w-4" />
                  (-) CAC (Leads)
                </TableCell>
                {dreData.map(d => (
                  <TableCell key={d.period} className="text-right text-muted-foreground">
                    {formatCurrency(d.cac)}
                  </TableCell>
                ))}
                <TableCell className="text-right">{formatCurrency(totals.cac)}</TableCell>
              </TableRow>

              {/* Despesas Comerciais - Expandível */}
              <ExpandableRow
                label="(-) Despesas Comerciais"
                values={dreData.map(d => d.despesasComerciais)}
                total={totals.despesasComerciais}
                details={totals.despesasComerciaisDetails}
                periodDetails={dreData.map(d => d.despesasComerciaisDetails)}
                formatCurrency={formatCurrency}
                isExpanded={expandedRows['despesasComerciais'] || false}
                onToggle={() => toggleRow('despesasComerciais')}
              />

              {/* Despesas Administrativas - Expandível */}
              <ExpandableRow
                label="(-) Despesas Administrativas"
                values={dreData.map(d => d.despesasAdministrativas)}
                total={totals.despesasAdministrativas}
                details={totals.despesasAdministrativasDetails}
                periodDetails={dreData.map(d => d.despesasAdministrativasDetails)}
                formatCurrency={formatCurrency}
                isExpanded={expandedRows['despesasAdministrativas'] || false}
                onToggle={() => toggleRow('despesasAdministrativas')}
              />

              {/* Despesas Operacionais - Expandível */}
              <ExpandableRow
                label="(-) Despesas Operacionais"
                values={dreData.map(d => d.despesasOperacionais)}
                total={totals.despesasOperacionais}
                details={totals.despesasOperacionaisDetails}
                periodDetails={dreData.map(d => d.despesasOperacionaisDetails)}
                formatCurrency={formatCurrency}
                isExpanded={expandedRows['despesasOperacionais'] || false}
                onToggle={() => toggleRow('despesasOperacionais')}
              />

              {/* Lucro Operacional */}
              <TableRow className="bg-amber-500/5">
                <TableCell className="font-semibold">= Lucro Operacional</TableCell>
                {dreData.map(d => (
                  <TableCell key={d.period} className={`text-right font-semibold ${d.lucroOperacional >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                    {formatCurrency(d.lucroOperacional)}
                  </TableCell>
                ))}
                <TableCell className={`text-right font-bold ${totals.lucroOperacional >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.lucroOperacional)}
                </TableCell>
              </TableRow>

              {/* Outras Despesas - Expandível */}
              <ExpandableRow
                label="(-) Outras Despesas"
                values={dreData.map(d => d.outrasDespesas)}
                total={totals.outrasDespesas}
                details={totals.outrasDespesasDetails}
                periodDetails={dreData.map(d => d.outrasDespesasDetails)}
                formatCurrency={formatCurrency}
                isExpanded={expandedRows['outrasDespesas'] || false}
                onToggle={() => toggleRow('outrasDespesas')}
              />
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