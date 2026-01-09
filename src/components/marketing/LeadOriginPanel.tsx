import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useLeadOriginData } from '@/hooks/useAutomotiveKPIs';
import { useDatePresets } from '@/hooks/useMarketingCockpit';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export function LeadOriginPanel() {
  const presets = useDatePresets();
  const [dateRange, setDateRange] = useState(presets.last30Days);
  const [activePreset, setActivePreset] = useState<string>('last30Days');
  
  const { data, isLoading } = useLeadOriginData(dateRange);

  const handlePresetChange = (preset: string) => {
    setActivePreset(preset);
    setDateRange(presets[preset as keyof typeof presets]);
  };

  const pieData = data?.bySource.map(s => ({
    name: s.channelLabel,
    value: s.leads,
  })) || [];

  const barData = data?.bySource.filter(s => s.leads > 0).map(s => ({
    name: s.channelLabel.substring(0, 10),
    CPL: s.cpl,
    Conversão: s.conversionRate,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Origem de Leads</h1>
          <p className="text-muted-foreground">
            {format(dateRange.from, "dd MMM", { locale: ptBR })} - {format(dateRange.to, "dd MMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
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

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
          ))}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{data.totals.leads}</p>
              <p className="text-xs text-muted-foreground">Total de Leads</p>
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
          <Card className="bg-primary/5">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{formatCurrency(data.totals.revenue)}</p>
              <p className="text-xs text-muted-foreground">Receita</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pie Chart - Lead Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - CPL by Channel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CPL por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento por Canal</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Canal</th>
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
                  {data?.bySource.map((channel, i) => (
                    <tr key={channel.channel} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[i % COLORS.length] }} 
                          />
                          {channel.channelLabel}
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 font-medium">{channel.leads}</td>
                      <td className="text-right py-3 px-2">{formatCurrency(channel.cpl)}</td>
                      <td className="text-right py-3 px-2">{channel.qualifiedLeads}</td>
                      <td className="text-right py-3 px-2">{channel.appointments}</td>
                      <td className="text-right py-3 px-2 font-medium">{channel.sales}</td>
                      <td className="text-right py-3 px-2">
                        <Badge variant={channel.conversionRate > 5 ? 'default' : 'secondary'}>
                          {formatPercent(channel.conversionRate)}
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-2">{formatCurrency(channel.revenue)}</td>
                      <td className="text-right py-3 px-2">
                        <span className={channel.roas >= 1 ? 'text-success' : 'text-destructive'}>
                          {channel.roas.toFixed(1)}x
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
