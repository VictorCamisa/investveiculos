import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Megaphone,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  CloudDownload,
  Search,
  DollarSign,
  Eye,
  MousePointer,
  Users,
  Percent,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Zap,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

type DateRangeType = "7d" | "14d" | "30d" | "60d" | "90d" | "6m" | "1y" | "all";

const dateRangeOptions: { value: DateRangeType; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "14d", label: "14 dias" },
  { value: "30d", label: "30 dias" },
  { value: "60d", label: "60 dias" },
  { value: "90d", label: "90 dias" },
  { value: "6m", label: "6 meses" },
  { value: "1y", label: "1 ano" },
  { value: "all", label: "Tudo" },
];

// Mock data for demonstration
const mockDailyMetrics = [
  { date: "01/12", spend: 850, impressions: 12500, clicks: 320, ctr: 2.56 },
  { date: "02/12", spend: 920, impressions: 14200, clicks: 385, ctr: 2.71 },
  { date: "03/12", spend: 780, impressions: 11800, clicks: 290, ctr: 2.46 },
  { date: "04/12", spend: 1050, impressions: 16500, clicks: 420, ctr: 2.55 },
  { date: "05/12", spend: 890, impressions: 13200, clicks: 355, ctr: 2.69 },
  { date: "06/12", spend: 1120, impressions: 17800, clicks: 480, ctr: 2.70 },
  { date: "07/12", spend: 950, impressions: 15000, clicks: 410, ctr: 2.73 },
];

const mockCampaignMetrics = [
  { campaign_name: "Campanha Verão 2024", impressions: 45000, clicks: 1250, reach: 32000, spend: 3500, ctr: 2.78, cpc: 2.80, cpm: 77.78 },
  { campaign_name: "Black Friday Promo", impressions: 78000, clicks: 2100, reach: 55000, spend: 5200, ctr: 2.69, cpc: 2.48, cpm: 66.67 },
  { campaign_name: "Lançamento Novo Modelo", impressions: 32000, clicks: 890, reach: 24000, spend: 2100, ctr: 2.78, cpc: 2.36, cpm: 65.63 },
  { campaign_name: "Remarketing Geral", impressions: 25000, clicks: 720, reach: 18000, spend: 1800, ctr: 2.88, cpc: 2.50, cpm: 72.00 },
];

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function MarketingAnalyticsPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRangeType>("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Check if APIs are configured
  const savedConfig = localStorage.getItem('marketing_api_config');
  const config = savedConfig ? JSON.parse(savedConfig) : {};
  const hasMetaConfig = config.isMetaConnected;
  const hasGoogleConfig = config.isGoogleConnected;
  const hasAnyConfig = hasMetaConfig || hasGoogleConfig;

  // Calculate totals from mock data
  const totals = useMemo(() => ({
    spend: mockCampaignMetrics.reduce((sum, c) => sum + c.spend, 0),
    impressions: mockCampaignMetrics.reduce((sum, c) => sum + c.impressions, 0),
    clicks: mockCampaignMetrics.reduce((sum, c) => sum + c.clicks, 0),
    reach: mockCampaignMetrics.reduce((sum, c) => sum + c.reach, 0),
    ctr: mockCampaignMetrics.reduce((sum, c) => sum + c.clicks, 0) / mockCampaignMetrics.reduce((sum, c) => sum + c.impressions, 0) * 100,
  }), []);

  const filteredCampaigns = useMemo(() => {
    if (!searchQuery) return mockCampaignMetrics;
    return mockCampaignMetrics.filter(c => 
      c.campaign_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString('pt-BR');
  };

  const handleSync = () => {
    if (!hasAnyConfig) {
      navigate('/marketing/configuracoes');
      return;
    }
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 2000);
  };

  // KPI Cards Data
  const kpis = [
    {
      label: "Investido",
      value: formatCurrency(totals.spend),
      icon: DollarSign,
      trend: 5.2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Impressões",
      value: formatNumber(totals.impressions),
      icon: Eye,
      trend: 12.5,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      label: "Cliques",
      value: formatNumber(totals.clicks),
      icon: MousePointer,
      trend: 8.3,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      label: "Alcance",
      value: formatNumber(totals.reach),
      icon: Users,
      trend: 15.2,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      label: "CTR",
      value: `${totals.ctr.toFixed(2)}%`,
      icon: Percent,
      trend: -2.1,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      label: "Leads",
      value: "42",
      icon: Target,
      trend: 18.5,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  if (!hasAnyConfig) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuração Necessária</AlertTitle>
          <AlertDescription>
            Para visualizar os dados de analytics, você precisa configurar as chaves de API do Meta Ads ou Google Ads.
          </AlertDescription>
        </Alert>
        
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Configure suas integrações</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Conecte suas contas do Meta Ads e Google Ads para começar a visualizar dados de campanhas.
              </p>
            </div>
            <Button onClick={() => navigate('/marketing/configuracoes')}>
              <Settings className="h-4 w-4 mr-2" />
              Ir para Configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-2">
          {hasMetaConfig && (
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              Meta Ads
            </Badge>
          )}
          {hasGoogleConfig && (
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-destructive" />
              Google Ads
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/50">
            {dateRangeOptions.slice(0, 5).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  dateRange === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsLoading(true)}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>

          <Button size="sm" className="h-8 gap-1.5" onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CloudDownload className="h-3.5 w-3.5" />
            )}
            Sincronizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => (
          <Card
            key={kpi.label}
            className={cn(
              "group relative transition-all duration-300 hover:shadow-lg",
              "animate-fade-in"
            )}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("p-2 rounded-lg", kpi.bgColor)}>
                  <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                </div>
                {kpi.trend !== 0 && (
                  <div className={cn(
                    "flex items-center gap-0.5 text-xs font-medium",
                    kpi.trend > 0 ? "text-chart-2" : "text-destructive"
                  )}>
                    {kpi.trend > 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(kpi.trend)}%
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="h-9 p-1">
            <TabsTrigger value="overview" className="text-xs h-7 px-3 gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="text-xs h-7 px-3 gap-1.5">
              <Megaphone className="h-3.5 w-3.5" />
              Campanhas
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-xs h-7 px-3 gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Performance
            </TabsTrigger>
          </TabsList>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-[200px] pl-8 text-xs"
            />
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Spend Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Investimento por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockDailyMetrics}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="spend" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary)/0.2)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* CTR Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">CTR por Dia (%)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockDailyMetrics}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="ctr" 
                        stroke="hsl(var(--chart-2))" 
                        fill="hsl(var(--chart-2)/0.2)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Campaign Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Performance por Campanha</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockCampaignMetrics}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="campaign_name" className="text-xs" tick={false} />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Spend Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Distribuição de Investimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockCampaignMetrics}
                        dataKey="spend"
                        nameKey="campaign_name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {mockCampaignMetrics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <Card className="overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Campanhas</h3>
                <p className="text-xs text-muted-foreground">{filteredCampaigns.length} resultados</p>
              </div>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                Exportar
              </Button>
            </div>
            <ScrollArea className="h-[500px]">
              <table className="w-full">
                <thead className="bg-muted/30 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Nome</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Impressões</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Cliques</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Alcance</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Gasto</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">CTR</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">CPC</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">CPM</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((c, idx) => (
                    <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium line-clamp-1">{c.campaign_name}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{formatNumber(c.impressions)}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{formatNumber(c.clicks)}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{formatNumber(c.reach)}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums font-medium">{formatCurrency(c.spend)}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="secondary" className="text-xs font-mono">
                          {c.ctr.toFixed(2)}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{formatCurrency(c.cpc)}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{formatCurrency(c.cpm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Melhor CTR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-chart-2">2.88%</div>
                <p className="text-xs text-muted-foreground mt-1">Remarketing Geral</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Menor CPC</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(2.36)}</div>
                <p className="text-xs text-muted-foreground mt-1">Lançamento Novo Modelo</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Maior Alcance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-chart-3">55K</div>
                <p className="text-xs text-muted-foreground mt-1">Black Friday Promo</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
