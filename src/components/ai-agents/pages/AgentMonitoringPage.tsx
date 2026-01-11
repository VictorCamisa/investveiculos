import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Target, 
  Wrench,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpRight
} from 'lucide-react';
import { useAIAgentMetrics, useAIAgentConversations } from '@/hooks/useAIAgents';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AgentMonitoringPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: metrics, isLoading: metricsLoading } = useAIAgentMetrics(agentId, 7);
  const { data: conversations, isLoading: conversationsLoading } = useAIAgentConversations(agentId, 20);

  // Mock data for demonstration
  const summaryMetrics = {
    leadsQualified: 127,
    leadsChange: 12,
    conversionRate: 34.5,
    conversionChange: 5.2,
    avgResponseTime: '2m 34s',
    responseTimeChange: -15,
    avgScore: 72,
    scoreChange: 8,
  };

  const toolUsage = [
    { name: 'buscar_veiculo', count: 45 },
    { name: 'criar_lead', count: 32 },
    { name: 'agendar_visita', count: 18 },
    { name: 'consultar_crm', count: 8 },
  ];

  const recentConversations = [
    { id: '1', name: 'João Silva', score: 78, turns: 4, status: 'qualified', time: '14:32' },
    { id: '2', name: 'Maria Santos', score: 45, turns: 2, status: 'active', time: '14:28' },
    { id: '3', name: 'Carlos Lima', score: 85, turns: 6, status: 'escalated', time: '14:15' },
    { id: '4', name: 'Ana Costa', score: 92, turns: 5, status: 'qualified', time: '14:02' },
    { id: '5', name: 'Pedro Alves', score: 35, turns: 3, status: 'lost', time: '13:45' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'qualified':
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Qualificado</Badge>;
      case 'active':
        return <Badge variant="secondary"><MessageSquare className="h-3 w-3 mr-1" />Em andamento</Badge>;
      case 'escalated':
        return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"><ArrowUpRight className="h-3 w-3 mr-1" />Escalado</Badge>;
      case 'lost':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Perdido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Monitoramento e Observabilidade</h2>
        <p className="text-muted-foreground">
          Acompanhe a performance e comportamento do agente em tempo real
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Qualificados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.leadsQualified}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+{summaryMetrics.leadsChange}%</span> vs semana anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+{summaryMetrics.conversionChange}%</span> vs semana anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.avgResponseTime}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-green-500" />
              <span className="text-green-500">{summaryMetrics.responseTimeChange}%</span> mais rápido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.avgScore}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+{summaryMetrics.scoreChange}</span> pontos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Performance (7 dias)</CardTitle>
            <CardDescription>Leads qualificados por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Gráfico de performance</p>
            </div>
          </CardContent>
        </Card>

        {/* Tool Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Uso de Ferramentas
            </CardTitle>
            <CardDescription>Chamadas de ferramentas hoje</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {toolUsage.map((tool) => (
                <div key={tool.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">{tool.name}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${(tool.count / 45) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{tool.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Logs de Conversas Recentes
              </CardTitle>
              <CardDescription>Últimas interações do agente</CardDescription>
            </div>
            <Button variant="outline" size="sm">Ver Todos</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentConversations.map((conv) => (
              <div 
                key={conv.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{conv.time}</span>
                  <span className="font-medium">{conv.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Score: </span>
                    <span className={conv.score >= 70 ? 'text-green-500 font-medium' : conv.score >= 50 ? 'text-yellow-500 font-medium' : 'text-red-500 font-medium'}>
                      {conv.score}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">{conv.turns} turnos</span>
                  {getStatusBadge(conv.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Métricas de Erro
          </CardTitle>
          <CardDescription>Erros e problemas detectados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-green-500">0</div>
              <p className="text-sm text-muted-foreground">Erros de API</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-yellow-500">2</div>
              <p className="text-sm text-muted-foreground">Timeouts</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-green-500">0</div>
              <p className="text-sm text-muted-foreground">Guardrails ativados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
