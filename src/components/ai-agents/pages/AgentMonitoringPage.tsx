import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  ArrowUpRight,
  RefreshCw,
  Activity,
  Zap,
  BarChart3,
  Eye
} from 'lucide-react';
import { useAIAgentMetrics, useAIAgentConversations } from '@/hooks/useAIAgents';
import { useAIAgentGuardrails } from '@/hooks/useAIAgentGuardrails';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { 
  LineChart, 
  Line, 
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
} from 'recharts';
import { AIAgentConversation, AIAgentMetrics } from '@/types/ai-agents';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function AgentMonitoringPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [periodDays, setPeriodDays] = useState(7);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<AIAgentConversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useAIAgentMetrics(agentId, periodDays);
  const { data: conversations, isLoading: conversationsLoading, refetch: refetchConversations } = useAIAgentConversations(agentId, 50);
  const { data: guardrails } = useAIAgentGuardrails(agentId);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return {
        leadsQualified: 0,
        leadsChange: 0,
        conversionRate: 0,
        conversionChange: 0,
        avgResponseTime: 0,
        responseTimeChange: 0,
        avgScore: 0,
        scoreChange: 0,
        totalConversations: 0,
        totalErrors: 0,
      };
    }

    const total = metrics.reduce((acc, m) => ({
      leadsQualified: acc.leadsQualified + (m.leads_qualified || 0),
      conversationsCount: acc.conversationsCount + (m.conversations_count || 0),
      avgResponseTime: acc.avgResponseTime + (m.avg_response_time_ms || 0),
      avgScore: acc.avgScore + (m.avg_lead_score || 0),
      conversionRate: acc.conversionRate + (m.conversion_rate || 0),
      errors: acc.errors + (m.errors_count || 0),
    }), { leadsQualified: 0, conversationsCount: 0, avgResponseTime: 0, avgScore: 0, conversionRate: 0, errors: 0 });

    const count = metrics.length;
    const halfIdx = Math.floor(count / 2);
    
    // Calculate period comparison
    const firstHalf = metrics.slice(0, halfIdx);
    const secondHalf = metrics.slice(halfIdx);
    
    const firstHalfLeads = firstHalf.reduce((a, m) => a + (m.leads_qualified || 0), 0);
    const secondHalfLeads = secondHalf.reduce((a, m) => a + (m.leads_qualified || 0), 0);
    const leadsChange = firstHalfLeads > 0 ? ((secondHalfLeads - firstHalfLeads) / firstHalfLeads) * 100 : 0;

    return {
      leadsQualified: total.leadsQualified,
      leadsChange: Math.round(leadsChange),
      conversionRate: count > 0 ? (total.conversionRate / count) : 0,
      conversionChange: 0,
      avgResponseTime: count > 0 ? Math.round(total.avgResponseTime / count) : 0,
      responseTimeChange: 0,
      avgScore: count > 0 ? Math.round(total.avgScore / count) : 0,
      scoreChange: 0,
      totalConversations: total.conversationsCount,
      totalErrors: total.errors,
    };
  }, [metrics]);

  // Tool usage from metrics
  const toolUsage = useMemo(() => {
    if (!metrics || metrics.length === 0) return [];
    
    const toolCounts: Record<string, number> = {};
    metrics.forEach(m => {
      const calls = m.tool_calls_count as Record<string, number> | null;
      if (calls) {
        Object.entries(calls).forEach(([tool, count]) => {
          toolCounts[tool] = (toolCounts[tool] || 0) + count;
        });
      }
    });

    return Object.entries(toolCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [metrics]);

  // Chart data
  const chartData = useMemo(() => {
    if (!metrics || metrics.length === 0) return [];
    
    return metrics.map(m => ({
      date: format(new Date(m.date), 'dd/MM', { locale: ptBR }),
      leads: m.leads_qualified || 0,
      conversas: m.conversations_count || 0,
      score: m.avg_lead_score || 0,
      tempo: Math.round((m.avg_response_time_ms || 0) / 1000),
    }));
  }, [metrics]);

  // Conversation status distribution
  const conversationStats = useMemo(() => {
    if (!conversations || conversations.length === 0) return [];
    
    const statusCounts: Record<string, number> = {};
    conversations.forEach(c => {
      const status = c.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const colors: Record<string, string> = {
      'active': '#3b82f6',
      'completed': '#22c55e',
      'escalated': '#f59e0b',
      'abandoned': '#ef4444',
      'unknown': '#9ca3af',
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      color: colors[status] || '#9ca3af',
    }));
  }, [conversations]);

  // Error types from metrics
  const errorBreakdown = useMemo(() => {
    if (!metrics || metrics.length === 0) return { api: 0, timeout: 0, guardrail: 0 };
    
    let api = 0, timeout = 0, guardrail = 0;
    
    metrics.forEach(m => {
      const errors = m.error_types as Record<string, number> | null;
      if (errors) {
        api += errors.api_error || 0;
        timeout += errors.timeout || 0;
        guardrail += errors.guardrail_violation || 0;
      }
    });

    return { api, timeout, guardrail };
  }, [metrics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchMetrics(), refetchConversations()]);
    setIsRefreshing(false);
  };

  const loadConversationMessages = async (conversation: AIAgentConversation) => {
    setSelectedConversation(conversation);
    
    const { data, error } = await supabase
      .from('ai_agent_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setConversationMessages(data);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Completo</Badge>;
      case 'active':
        return <Badge variant="secondary"><MessageSquare className="h-3 w-3 mr-1" />Em andamento</Badge>;
      case 'escalated':
        return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"><ArrowUpRight className="h-3 w-3 mr-1" />Escalado</Badge>;
      case 'abandoned':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Abandonado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  const isLoading = metricsLoading || conversationsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitoramento e Observabilidade</h2>
          <p className="text-muted-foreground">
            Acompanhe a performance e comportamento do agente em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(periodDays)} onValueChange={(v) => setPeriodDays(Number(v))}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimos 14 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
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
            {summaryMetrics.leadsChange !== 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {summaryMetrics.leadsChange > 0 ? (
                  <><TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{summaryMetrics.leadsChange}%</span></>
                ) : (
                  <><TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">{summaryMetrics.leadsChange}%</span></>
                )}
                vs período anterior
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              De {summaryMetrics.totalConversations} conversas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatResponseTime(summaryMetrics.avgResponseTime)}</div>
            <p className="text-xs text-muted-foreground">Por mensagem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio de Lead</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.avgScore}</div>
            <p className="text-xs text-muted-foreground">Pontuação de qualificação</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance ao Longo do Tempo
            </CardTitle>
            <CardDescription>Leads qualificados e conversas por dia</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
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
                  <Line 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                    name="Leads"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="conversas" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--muted-foreground))' }}
                    name="Conversas"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center bg-muted/30 rounded-lg">
                <div className="text-center">
                  <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Sem dados no período selecionado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tool Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Uso de Ferramentas
            </CardTitle>
            <CardDescription>Chamadas de ferramentas no período</CardDescription>
          </CardHeader>
          <CardContent>
            {toolUsage.length > 0 ? (
              <div className="space-y-4">
                {toolUsage.map((tool, idx) => {
                  const maxCount = toolUsage[0]?.count || 1;
                  return (
                    <div key={tool.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground w-4">{idx + 1}</span>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{tool.name}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all" 
                            style={{ width: `${(tool.count / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-10 text-right">{tool.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
                <div className="text-center">
                  <Wrench className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhuma ferramenta utilizada</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversations and Status Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversations Log */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversas Recentes
                </CardTitle>
                <CardDescription>Últimas {conversations?.length || 0} interações</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {conversations && conversations.length > 0 ? (
                <div className="space-y-2">
                  {conversations.map((conv) => {
                    const metadata = conv.metadata as Record<string, any> | null;
                    const leadName = metadata?.lead_name || 'Lead desconhecido';
                    const leadScore = metadata?.lead_score;
                    
                    return (
                      <div 
                        key={conv.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => loadConversationMessages(conv)}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.started_at!), { addSuffix: true, locale: ptBR })}
                          </span>
                          <span className="font-medium">{leadName}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          {leadScore !== undefined && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Score: </span>
                              <span className={leadScore >= 70 ? 'text-green-500 font-medium' : leadScore >= 50 ? 'text-yellow-500 font-medium' : 'text-red-500 font-medium'}>
                                {leadScore}
                              </span>
                            </div>
                          )}
                          <Badge variant="outline">{conv.channel}</Badge>
                          {getStatusBadge(conv.status || 'unknown')}
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Nenhuma conversa registrada</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Status</CardTitle>
            <CardDescription>Status das conversas</CardDescription>
          </CardHeader>
          <CardContent>
            {conversationStats.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={conversationStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {conversationStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {conversationStats.map((stat) => (
                    <div key={stat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: stat.color }}
                        />
                        <span className="capitalize">{stat.name}</span>
                      </div>
                      <span className="font-medium">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Sem dados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Métricas de Erro
          </CardTitle>
          <CardDescription>Erros e problemas detectados no período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className={`text-2xl font-bold ${summaryMetrics.totalErrors === 0 ? 'text-green-500' : 'text-red-500'}`}>
                {summaryMetrics.totalErrors}
              </div>
              <p className="text-sm text-muted-foreground">Total de Erros</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className={`text-2xl font-bold ${errorBreakdown.api === 0 ? 'text-green-500' : 'text-red-500'}`}>
                {errorBreakdown.api}
              </div>
              <p className="text-sm text-muted-foreground">Erros de API</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className={`text-2xl font-bold ${errorBreakdown.timeout === 0 ? 'text-green-500' : 'text-yellow-500'}`}>
                {errorBreakdown.timeout}
              </div>
              <p className="text-sm text-muted-foreground">Timeouts</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className={`text-2xl font-bold ${errorBreakdown.guardrail === 0 ? 'text-green-500' : 'text-yellow-500'}`}>
                {errorBreakdown.guardrail}
              </div>
              <p className="text-sm text-muted-foreground">Guardrails Ativados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation Detail Dialog */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Detalhes da Conversa</DialogTitle>
            <DialogDescription>
              {selectedConversation && (
                <>
                  Iniciada em {format(new Date(selectedConversation.started_at!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {' · '}Canal: {selectedConversation.channel}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {conversationMessages.map((msg, idx) => (
                <div 
                  key={msg.id || idx}
                  className={`p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-primary/10 ml-8' 
                      : msg.role === 'assistant'
                      ? 'bg-muted mr-8'
                      : 'bg-yellow-500/10 text-center text-sm'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {msg.role === 'user' ? 'Usuário' : msg.role === 'assistant' ? 'Agente' : msg.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.created_at), 'HH:mm:ss')}
                    </span>
                    {msg.tokens_used && (
                      <span className="text-xs text-muted-foreground">
                        ({msg.tokens_used} tokens)
                      </span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.tool_calls && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                      <span className="font-medium">Tool calls:</span>
                      <pre className="overflow-x-auto">{JSON.stringify(msg.tool_calls, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
              {conversationMessages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma mensagem encontrada
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
