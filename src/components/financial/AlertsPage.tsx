import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinancialAlerts } from '@/hooks/useFinancial';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  AlertCircle, 
  TrendingDown, 
  Clock, 
  Wallet,
  Target,
  Car,
  DollarSign
} from 'lucide-react';
import { BentoCard } from '@/components/ui/bento-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AlertsPage() {
  const alerts = useFinancialAlerts();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  const marginAlerts = alerts.filter(a => a.type === 'margem_baixa');
  const stockAlerts = alerts.filter(a => a.type === 'estoque_parado');
  const commissionAlerts = alerts.filter(a => a.type === 'comissao_pendente');
  const goalAlerts = alerts.filter(a => a.type === 'meta_risco');

  const getIcon = (type: string) => {
    switch (type) {
      case 'margem_baixa': return <TrendingDown className="h-5 w-5" />;
      case 'estoque_parado': return <Clock className="h-5 w-5" />;
      case 'comissao_pendente': return <Wallet className="h-5 w-5" />;
      case 'meta_risco': return <Target className="h-5 w-5" />;
      default: return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'margem_baixa': return 'Margem Baixa';
      case 'estoque_parado': return 'Estoque Parado';
      case 'comissao_pendente': return 'Comissão Pendente';
      case 'meta_risco': return 'Meta em Risco';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Alertas Financeiros</h2>
        <p className="text-muted-foreground">Monitoramento automático de margens, estoque e metas</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BentoCard
          title="Alertas Críticos"
          value={criticalAlerts.length.toString()}
          subtitle="Requerem ação imediata"
          colors={["#B71C1C", "#C62828", "#D32F2F"]}
          delay={0}
          icon={<AlertTriangle className="h-5 w-5 text-primary" />}
        />
        <BentoCard
          title="Alertas de Atenção"
          value={warningAlerts.length.toString()}
          subtitle="Monitorar situação"
          colors={["#E53935", "#EF5350", "#E57373"]}
          delay={0.1}
          icon={<AlertCircle className="h-5 w-5 text-primary" />}
        />
        <BentoCard
          title="Veículos Parados"
          value={stockAlerts.length.toString()}
          subtitle="Acima do tempo esperado"
          colors={["#D32F2F", "#E53935", "#EF5350"]}
          delay={0.2}
          icon={<Car className="h-5 w-5 text-muted-foreground" />}
        />
        <BentoCard
          title="Margens Baixas"
          value={marginAlerts.length.toString()}
          subtitle="Vendas com margem reduzida"
          colors={["#C62828", "#D32F2F", "#E53935"]}
          delay={0.3}
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Todos ({alerts.length})</TabsTrigger>
              <TabsTrigger value="critical">Críticos ({criticalAlerts.length})</TabsTrigger>
              <TabsTrigger value="margin">Margem ({marginAlerts.length})</TabsTrigger>
              <TabsTrigger value="stock">Estoque ({stockAlerts.length})</TabsTrigger>
              <TabsTrigger value="commission">Comissões ({commissionAlerts.length})</TabsTrigger>
              <TabsTrigger value="goals">Metas ({goalAlerts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <AlertsList alerts={alerts} getIcon={getIcon} getTypeLabel={getTypeLabel} formatCurrency={formatCurrency} />
            </TabsContent>
            <TabsContent value="critical" className="mt-4">
              <AlertsList alerts={criticalAlerts} getIcon={getIcon} getTypeLabel={getTypeLabel} formatCurrency={formatCurrency} />
            </TabsContent>
            <TabsContent value="margin" className="mt-4">
              <AlertsList alerts={marginAlerts} getIcon={getIcon} getTypeLabel={getTypeLabel} formatCurrency={formatCurrency} />
            </TabsContent>
            <TabsContent value="stock" className="mt-4">
              <AlertsList alerts={stockAlerts} getIcon={getIcon} getTypeLabel={getTypeLabel} formatCurrency={formatCurrency} />
            </TabsContent>
            <TabsContent value="commission" className="mt-4">
              <AlertsList alerts={commissionAlerts} getIcon={getIcon} getTypeLabel={getTypeLabel} formatCurrency={formatCurrency} />
            </TabsContent>
            <TabsContent value="goals" className="mt-4">
              <AlertsList alerts={goalAlerts} getIcon={getIcon} getTypeLabel={getTypeLabel} formatCurrency={formatCurrency} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function AlertsList({ 
  alerts, 
  getIcon, 
  getTypeLabel,
  formatCurrency
}: { 
  alerts: ReturnType<typeof useFinancialAlerts>;
  getIcon: (type: string) => React.ReactNode;
  getTypeLabel: (type: string) => string;
  formatCurrency: (value: number) => string;
}) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-green-500/10 p-4 mb-4">
          <AlertCircle className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold">Tudo em ordem!</h3>
        <p className="text-muted-foreground">Nenhum alerta nesta categoria</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start gap-4 p-4 rounded-lg border ${
            alert.severity === 'critical' 
              ? 'border-red-500/50 bg-red-500/5' 
              : 'border-orange-500/50 bg-orange-500/5'
          }`}
        >
          <div className={`p-2 rounded-full ${
            alert.severity === 'critical' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'
          }`}>
            {getIcon(alert.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold">{alert.title}</h4>
              <Badge variant={alert.severity === 'critical' ? 'destructive' : 'outline'}>
                {getTypeLabel(alert.type)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
            {alert.value !== undefined && (
              <p className="text-sm font-medium mt-2">
                Valor: <span className={alert.value < 0 ? 'text-red-500' : ''}>{formatCurrency(alert.value)}</span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
