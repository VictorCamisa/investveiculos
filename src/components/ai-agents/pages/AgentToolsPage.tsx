import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  useAIAgentTools, 
  useCreateAIAgentTool, 
  useUpdateAIAgentTool, 
  useDeleteAIAgentTool,
  useAIAgentDataSources 
} from '@/hooks/useAIAgents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Zap,
  Database,
  Users,
  Car,
  Calendar,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIAgentTool } from '@/types/ai-agents';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

// Mapeamento de tabelas para capacidades automáticas
const TABLE_CAPABILITIES: Record<string, { icon: React.ElementType; name: string; capabilities: string[] }> = {
  vehicles: {
    icon: Car,
    name: 'Veículos',
    capabilities: ['Buscar veículos disponíveis', 'Ver detalhes do veículo', 'Consultar preços', 'Verificar disponibilidade']
  },
  leads: {
    icon: Users,
    name: 'Leads',
    capabilities: ['Criar novo lead', 'Atualizar informações', 'Consultar leads existentes']
  },
  customers: {
    icon: Users,
    name: 'Clientes',
    capabilities: ['Consultar histórico do cliente', 'Ver compras anteriores']
  },
  negotiations: {
    icon: Calendar,
    name: 'Negociações',
    capabilities: ['Agendar visitas', 'Ver negociações em andamento', 'Atualizar status']
  },
  sales: {
    icon: BarChart3,
    name: 'Vendas',
    capabilities: ['Resumo de vendas', 'Estatísticas do período']
  },
  profiles: {
    icon: Users,
    name: 'Usuários',
    capabilities: ['Consultar vendedores', 'Ver equipe']
  }
};

// Templates de orquestração prontos
const ORCHESTRATION_TEMPLATES = [
  {
    id: 'search_stock',
    label: 'Consultar Estoque',
    icon: Car,
    rule: 'Quando o cliente perguntar sobre veículos, carros, motos ou preços, buscar no estoque'
  },
  {
    id: 'create_lead',
    label: 'Criar Lead',
    icon: Users,
    rule: 'Quando o cliente fornecer nome ou telefone, criar um lead no CRM'
  },
  {
    id: 'schedule_visit',
    label: 'Agendar Visita',
    icon: Calendar,
    rule: 'Quando o cliente quiser visitar a loja ou fazer test-drive, agendar uma visita'
  },
  {
    id: 'send_whatsapp',
    label: 'Enviar WhatsApp',
    icon: MessageSquare,
    rule: 'Quando precisar enviar fotos ou informações, usar o WhatsApp'
  },
  {
    id: 'sales_stats',
    label: 'Ver Estatísticas',
    icon: BarChart3,
    rule: 'Quando perguntarem sobre performance ou vendas, mostrar estatísticas'
  }
];

export function AgentToolsPage() {
  const { agentId } = useParams();
  const { data: tools, isLoading: isLoadingTools } = useAIAgentTools(agentId);
  const { data: dataSources, isLoading: isLoadingDataSources } = useAIAgentDataSources(agentId);
  const createTool = useCreateAIAgentTool();
  const updateTool = useUpdateAIAgentTool();
  const deleteTool = useDeleteAIAgentTool();
  
  const [newRule, setNewRule] = useState('');
  const [isAddingRule, setIsAddingRule] = useState(false);

  // Tabelas conectadas via Memória
  const connectedTables = (dataSources || [])
    .filter(ds => ds.source_type === 'supabase' && ds.is_active)
    .map(ds => ds.table_name || ds.name);

  const handleToggleActive = (tool: AIAgentTool) => {
    updateTool.mutate({ id: tool.id, is_active: !tool.is_active });
  };

  const handleDelete = (tool: AIAgentTool) => {
    if (agentId) {
      deleteTool.mutate({ id: tool.id, agentId });
    }
  };

  const handleAddTemplate = (template: typeof ORCHESTRATION_TEMPLATES[0]) => {
    setNewRule(template.rule);
    setIsAddingRule(true);
  };

  const handleSaveRule = async () => {
    if (!newRule.trim() || !agentId) return;

    try {
      // Criar uma "ferramenta" simplificada que é apenas uma regra de orquestração
      await createTool.mutateAsync({
        agent_id: agentId,
        name: `regra_${Date.now()}`,
        description: newRule,
        orchestration_rules: newRule,
        function_schema: { type: 'orchestration_rule' },
        auth_method: 'none',
        is_active: true
      });

      setNewRule('');
      setIsAddingRule(false);
      toast.success('Regra de orquestração adicionada!');
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Erro ao criar regra');
    }
  };

  const isLoading = isLoadingTools || isLoadingDataSources;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Capacidades do Agente</h2>
        <p className="text-sm text-muted-foreground">
          Configure o que seu agente pode fazer baseado nas tabelas conectadas e regras de orquestração.
        </p>
      </div>

      {/* Capacidades Automáticas */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">Capacidades Automáticas</CardTitle>
          </div>
          <CardDescription>
            Baseado nas tabelas conectadas na aba Memória, seu agente pode automaticamente:
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectedTables.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Nenhuma tabela conectada</p>
                <p className="text-xs text-muted-foreground">
                  Conecte tabelas do Supabase na aba "Memória" para habilitar capacidades automáticas.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {connectedTables.map(tableName => {
                const tableInfo = TABLE_CAPABILITIES[tableName];
                if (!tableInfo) return null;

                const Icon = tableInfo.icon;
                return (
                  <div 
                    key={tableName} 
                    className="flex gap-3 p-3 bg-muted/30 rounded-lg border"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{tableInfo.name}</p>
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                          Conectado
                        </Badge>
                      </div>
                      <ul className="mt-1 text-xs text-muted-foreground">
                        {tableInfo.capabilities.map((cap, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <span className="text-primary">•</span> {cap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regras de Orquestração */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-base">Regras de Orquestração</CardTitle>
            </div>
            <Button 
              size="sm" 
              onClick={() => setIsAddingRule(true)}
              disabled={isAddingRule}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </div>
          <CardDescription>
            Defina em linguagem natural quando e como o agente deve usar suas capacidades.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Templates de acesso rápido */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Templates rápidos:</p>
            <div className="flex flex-wrap gap-2">
              {ORCHESTRATION_TEMPLATES.map(template => {
                const Icon = template.icon;
                return (
                  <Button 
                    key={template.id}
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAddTemplate(template)}
                    disabled={isAddingRule}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {template.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Formulário para nova regra */}
          {isAddingRule && (
            <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
              <Textarea
                placeholder="Ex: Quando o cliente perguntar sobre preços, buscar veículos disponíveis no estoque"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setNewRule('');
                    setIsAddingRule(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSaveRule}
                  disabled={!newRule.trim() || createTool.isPending}
                >
                  {createTool.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar Regra
                </Button>
              </div>
            </div>
          )}

          {/* Lista de regras existentes */}
          {tools && tools.length > 0 ? (
            <div className="space-y-2">
              {tools.map(tool => (
                <div 
                  key={tool.id} 
                  className={cn(
                    "flex items-start justify-between gap-3 p-3 rounded-lg border",
                    !tool.is_active && "opacity-50 bg-muted/30"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm italic text-muted-foreground">
                      "{tool.orchestration_rules || tool.description}"
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={tool.is_active}
                      onCheckedChange={() => handleToggleActive(tool)}
                      disabled={updateTool.isPending}
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir regra?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A regra será permanentemente excluída.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(tool)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : !isAddingRule && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Wrench className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Nenhuma regra configurada</p>
              <p className="text-xs text-muted-foreground max-w-md mt-1">
                Adicione regras para definir quando o agente deve consultar o estoque, criar leads, agendar visitas, etc.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dica */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <Database className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-500">Dica</p>
          <p className="text-xs text-muted-foreground">
            As capacidades automáticas são baseadas nas tabelas conectadas na aba "Memória". 
            As regras de orquestração ajudam o agente a entender quando usar cada capacidade.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AgentToolsPage;
