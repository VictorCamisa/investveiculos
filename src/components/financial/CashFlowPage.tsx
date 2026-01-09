import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCashFlow } from '@/hooks/useFinancial';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BentoCard } from '@/components/ui/bento-card';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet,
  TrendingUp
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CashFlowPage() {
  const { cashFlowData, balanceData, summary } = useCashFlow();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Group by month for chart
  const monthlyBalance = balanceData.reduce((acc, item) => {
    const month = format(new Date(item.date), 'MMM/yy', { locale: ptBR });
    if (!acc[month]) {
      acc[month] = { month, entradas: 0, saidas: 0, saldo: 0 };
    }
    if (item.type === 'entrada') {
      acc[month].entradas += item.value;
    } else {
      acc[month].saidas += item.value;
    }
    acc[month].saldo = acc[month].entradas - acc[month].saidas;
    return acc;
  }, {} as Record<string, { month: string; entradas: number; saidas: number; saldo: number }>);

  const chartData = Object.values(monthlyBalance);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Fluxo de Caixa</h2>
        <p className="text-muted-foreground">Entradas, saídas e projeções financeiras</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BentoCard
          title="Entradas Realizadas"
          value={formatCurrency(summary.totalEntradas)}
          subtitle="Vendas concluídas"
          colors={["#E53935", "#EF5350", "#E57373"]}
          delay={0}
          icon={<ArrowUpCircle className="h-5 w-5 text-primary" />}
        />
        <BentoCard
          title="Saídas Realizadas"
          value={formatCurrency(summary.totalSaidas)}
          subtitle="Custos e comissões pagas"
          colors={["#D32F2F", "#E53935", "#EF5350"]}
          delay={0.1}
          icon={<ArrowDownCircle className="h-5 w-5 text-primary" />}
        />
        <BentoCard
          title="Saldo Realizado"
          value={formatCurrency(summary.saldoRealizado)}
          subtitle="Entradas - Saídas"
          colors={["#C62828", "#D32F2F", "#E53935"]}
          delay={0.2}
          icon={<Wallet className="h-5 w-5 text-muted-foreground" />}
        />
        <BentoCard
          title="Projeção Saídas"
          value={formatCurrency(summary.projecaoSaidas)}
          subtitle="Comissões a pagar"
          colors={["#B71C1C", "#C62828", "#D32F2F"]}
          delay={0.3}
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      {/* Balance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Area 
                type="monotone" 
                dataKey="entradas" 
                name="Entradas"
                stackId="1"
                stroke="hsl(142 76% 36%)" 
                fill="hsl(142 76% 36% / 0.5)" 
              />
              <Area 
                type="monotone" 
                dataKey="saidas" 
                name="Saídas"
                stackId="2"
                stroke="hsl(var(--destructive))" 
                fill="hsl(var(--destructive) / 0.5)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="entradas">Entradas</TabsTrigger>
              <TabsTrigger value="saidas">Saídas</TabsTrigger>
              <TabsTrigger value="previstos">Previstos</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <TransactionsTable data={cashFlowData} formatCurrency={formatCurrency} />
            </TabsContent>
            <TabsContent value="entradas" className="mt-4">
              <TransactionsTable 
                data={cashFlowData.filter(i => i.type === 'entrada')} 
                formatCurrency={formatCurrency} 
              />
            </TabsContent>
            <TabsContent value="saidas" className="mt-4">
              <TransactionsTable 
                data={cashFlowData.filter(i => i.type === 'saida')} 
                formatCurrency={formatCurrency} 
              />
            </TabsContent>
            <TabsContent value="previstos" className="mt-4">
              <TransactionsTable 
                data={cashFlowData.filter(i => i.status === 'previsto')} 
                formatCurrency={formatCurrency} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionsTable({ 
  data, 
  formatCurrency 
}: { 
  data: ReturnType<typeof useCashFlow>['cashFlowData'];
  formatCurrency: (value: number) => string;
}) {
  return (
    <div className="max-h-[400px] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.slice(0, 50).map((item) => (
            <TableRow key={item.id}>
              <TableCell className="whitespace-nowrap">
                {format(new Date(item.date), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell>
                <Badge variant="outline">{item.category}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={item.status === 'realizado' ? 'default' : 'secondary'}>
                  {item.status === 'realizado' ? 'Realizado' : 'Previsto'}
                </Badge>
              </TableCell>
              <TableCell className={`text-right font-semibold ${
                item.type === 'entrada' ? 'text-green-500' : 'text-red-500'
              }`}>
                {item.type === 'entrada' ? '+' : '-'}{formatCurrency(item.value)}
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Nenhuma movimentação encontrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
