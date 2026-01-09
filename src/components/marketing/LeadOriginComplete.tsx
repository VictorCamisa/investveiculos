import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompleteLeadOrigin } from '@/hooks/useCompleteLeadOrigin';
import { useDatePresets } from '@/hooks/useMarketingCockpit';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Info } from 'lucide-react';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export function LeadOriginComplete() {
  const presets = useDatePresets();
  const [dateRange, setDateRange] = useState(presets.last30Days);
  const [activePreset, setActivePreset] = useState<string>('last30Days');
  const [viewMode, setViewMode] = useState<'source' | 'campaign'>('source');

  const { data, isLoading } = useCompleteLeadOrigin(dateRange, viewMode);

  const handlePresetChange = (preset: string) => {
    setActivePreset(preset);
    setDateRange(presets[preset as keyof typeof presets]);
  };

  const displayData = viewMode === 'source' ? data?.bySource : data?.byCampaign;
  
  const pieData = displayData?.filter(s => s.leads > 0).map(s => ({
    name: s.channelLabel,
    value: s.leads,
  })) || [];

  const barData = displayData?.filter(s => s.leads > 0).map(s => ({
    name: s.channelLabel.length > 12 ? s.channelLabel.substring(0, 12) + '...' : s.channelLabel,
    CPL: s.cpl,
    Conversão: s.conversionRate,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Origem de Leads</h2>
          <p className="text-muted-foreground text-sm">
            {format(dateRange.from, "dd MMM", { locale: ptBR })} - {format(dateRange.to, "dd MMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'today', label: 'Hoje' },
            { key: 'last7Days', label: '7 dias' },
            { key: 'last30Days', label: '30 dias' },
            { key: 'mtd', label: 'Mês' },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={activePreset === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetChange(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* View Toggle */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'source' | 'campaign')}>
        <TabsList>
          <TabsTrigger value="source">Por Canal</TabsTrigger>
          <TabsTrigger value="campaign">Por Campanha</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
          ))}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{data.totals.leads}</p>
              <p className="text-xs text-muted-foreground">Total Leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{data.totals.qualifiedLeads}</p>
              <p className="text-xs text-muted-foreground">Qualificados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{data.totals.appointments}</p>
              <p className="text-xs text-muted-foreground">Agendamentos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{data.totals.sales}</p>
              <p className="text-xs text-muted-foreground">Vendas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{formatCurrency(data.totals.revenue)}</p>
              <p className="text-xs text-muted-foreground">Receita Total</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{data.totals.roas.toFixed(1)}x</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                ROAS 
                <span title="Calculado apenas com vendas de tráfego pago (Facebook, Instagram, Google, Site)">
                  <Info className="h-3 w-3" />
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ROAS Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>ROAS Corrigido:</strong> O ROAS é calculado considerando apenas vendas originadas de tráfego pago 
          (Facebook, Instagram, Google, Site). Vendas de indicação, WhatsApp direto e visitas espontâneas não entram no cálculo.
        </p>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por {viewMode === 'source' ? 'Canal' : 'Campanha'}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Sem dados no período</p>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CPL por {viewMode === 'source' ? 'Canal' : 'Campanha'}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'CPL' ? formatCurrency(value) : formatPercent(value),
                      name
                    ]}
                  />
                  <Bar dataKey="CPL" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Sem dados no período</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento por {viewMode === 'source' ? 'Canal' : 'Campanha'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">{viewMode === 'source' ? 'Canal' : 'Campanha'}</th>
                    <th className="text-right py-3 px-2 font-medium">Leads</th>
                    <th className="text-right py-3 px-2 font-medium">CPL</th>
                    <th className="text-right py-3 px-2 font-medium">Qualif.</th>
                    <th className="text-right py-3 px-2 font-medium">Agend.</th>
                    <th className="text-right py-3 px-2 font-medium">Vendas</th>
                    <th className="text-right py-3 px-2 font-medium">Conv.</th>
                    <th className="text-right py-3 px-2 font-medium">Receita</th>
                    <th className="text-right py-3 px-2 font-medium">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData?.map((item, i) => (
                    <tr key={item.channel} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          <span className="truncate max-w-[150px]">{item.channelLabel}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 font-medium">{item.leads}</td>
                      <td className="text-right py-3 px-2">{formatCurrency(item.cpl)}</td>
                      <td className="text-right py-3 px-2">{item.qualifiedLeads}</td>
                      <td className="text-right py-3 px-2">{item.appointments}</td>
                      <td className="text-right py-3 px-2 font-medium">{item.sales}</td>
                      <td className="text-right py-3 px-2">
                        <Badge variant={item.conversionRate > 5 ? 'default' : 'secondary'}>
                          {formatPercent(item.conversionRate)}
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-2">{formatCurrency(item.revenue)}</td>
                      <td className="text-right py-3 px-2">
                        <span className={item.roas >= 1 ? 'text-green-600' : item.roas > 0 ? 'text-destructive' : 'text-muted-foreground'}>
                          {item.investment > 0 ? `${item.roas.toFixed(1)}x` : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
