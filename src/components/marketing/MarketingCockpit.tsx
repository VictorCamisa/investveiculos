import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useCockpitKPIs, 
  useFunnelData, 
  useLeadOpsMetrics, 
  useAutoInsights,
  useDatePresets 
} from '@/hooks/useMarketingCockpit';
import { 
  DollarSign, Users, Target, TrendingUp, Clock, AlertTriangle,
  CheckCircle, Info, ArrowRight, Calendar, Phone, UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatNumber = (value: number) => 
  new Intl.NumberFormat('pt-BR').format(Math.round(value));

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export function MarketingCockpit() {
  const presets = useDatePresets();
  const [dateRange, setDateRange] = useState(presets.last30Days);
  const [activePreset, setActivePreset] = useState<string>('last30Days');

  const { data: kpis, isLoading: kpisLoading } = useCockpitKPIs(dateRange);
  const { data: funnel, isLoading: funnelLoading } = useFunnelData(dateRange);
  const { data: leadOps, isLoading: leadOpsLoading } = useLeadOpsMetrics(dateRange);
  const { data: insights } = useAutoInsights(kpis, leadOps);

  const handlePresetChange = (preset: string) => {
    setActivePreset(preset);
    setDateRange(presets[preset as keyof typeof presets]);
  };

  return (
    <div className="space-y-6">
      {/* Header with date selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cockpit do Dono</h1>
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

      {/* Auto Insights */}
      {insights && insights.length > 0 && (
        <div className="grid gap-3">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border flex items-start gap-3 ${
                insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20' :
                insight.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/20' :
                'bg-blue-50 border-blue-200 dark:bg-blue-900/20'
              }`}
            >
              {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />}
              {insight.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
              {insight.type === 'info' && <Info className="h-5 w-5 text-blue-600 mt-0.5" />}
              <div>
                <p className="font-medium">{insight.title}</p>
                <p className="text-sm text-muted-foreground">{insight.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {kpisLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
          ))
        ) : kpis && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <DollarSign className="h-4 w-4" />
                  Investimento
                </div>
                <p className="text-2xl font-bold mt-1">{formatCurrency(kpis.investment)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Users className="h-4 w-4" />
                  Leads
                </div>
                <p className="text-2xl font-bold mt-1">{kpis.leads}</p>
                <p className="text-xs text-muted-foreground">{kpis.qualifiedLeads} qualificados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Target className="h-4 w-4" />
                  CPL
                </div>
                <p className="text-2xl font-bold mt-1">{formatCurrency(kpis.cpl)}</p>
                <p className="text-xs text-muted-foreground">Qualif: {formatCurrency(kpis.cplQualified)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="h-4 w-4" />
                  Agendamentos
                </div>
                <p className="text-2xl font-bold mt-1">{kpis.appointments}</p>
                <p className="text-xs text-muted-foreground">{formatPercent(kpis.showRate)} comparecem</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Vendas
                </div>
                <p className="text-2xl font-bold mt-1">{kpis.sales}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(kpis.revenue)}</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <TrendingUp className="h-4 w-4" />
                  ROAS
                </div>
                <p className="text-2xl font-bold mt-1">{kpis.roas.toFixed(1)}x</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Funnel + Lead Ops */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funil de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            {funnelLoading ? (
              <Skeleton className="h-48" />
            ) : funnel && (
              <div className="space-y-3">
                {funnel.map((stage, i) => (
                  <div key={stage.name} className="flex items-center gap-3">
                    <div className="w-24 text-sm font-medium">{stage.name}</div>
                    <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-primary/80 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (stage.value / (funnel[0]?.value || 1)) * 100)}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                        {formatNumber(stage.value)}
                      </span>
                    </div>
                    {i > 0 && (
                      <Badge variant="outline" className="w-16 justify-center">
                        {formatPercent(stage.rate)}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Ops */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead Ops</CardTitle>
          </CardHeader>
          <CardContent>
            {leadOpsLoading ? (
              <Skeleton className="h-48" />
            ) : leadOps && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Tempo médio 1ª resposta</span>
                  </div>
                  <span className="font-bold">
                    {leadOps.avgFirstResponseMinutes < 60 
                      ? `${Math.round(leadOps.avgFirstResponseMinutes)} min`
                      : `${(leadOps.avgFirstResponseMinutes / 60).toFixed(1)}h`}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Taxa de contato</span>
                  </div>
                  <span className="font-bold">{formatPercent(leadOps.contactRate)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Taxa de conversão</span>
                  </div>
                  <span className="font-bold">{formatPercent(leadOps.conversionRate)}</span>
                </div>
                {leadOps.leadsWithoutResponse > 0 && (
                  <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm">Leads sem resposta</span>
                    </div>
                    <Badge variant="destructive">{leadOps.leadsWithoutResponse}</Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Media Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Métricas de Mídia</CardTitle>
        </CardHeader>
        <CardContent>
          {kpisLoading ? (
            <Skeleton className="h-20" />
          ) : kpis && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{formatNumber(kpis.impressions)}</p>
                <p className="text-xs text-muted-foreground">Impressões</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{formatNumber(kpis.reach)}</p>
                <p className="text-xs text-muted-foreground">Alcance</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{formatNumber(kpis.clicks)}</p>
                <p className="text-xs text-muted-foreground">Cliques</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{formatPercent(kpis.ctr)}</p>
                <p className="text-xs text-muted-foreground">CTR</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{formatCurrency(kpis.cpm)}</p>
                <p className="text-xs text-muted-foreground">CPM</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{kpis.frequency.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Frequência</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
