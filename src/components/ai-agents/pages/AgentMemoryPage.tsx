import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAIAgent, useUpdateAIAgent, useAIAgentDataSources, useCreateAIAgentDataSource } from '@/hooks/useAIAgents';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Loader2, 
  Save, 
  Database, 
  HardDrive, 
  Clock, 
  Plus, 
  Table2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Plug, 
  AlertCircle,
  Trash2,
  Zap,
  Info
} from 'lucide-react';
import { SHORT_TERM_MEMORY_TYPES, VECTOR_DB_PROVIDERS } from '@/types/ai-agents';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface SupabaseTable {
  name: string;
  description: string;
  rowCount?: number;
}

const formSchema = z.object({
  short_term_memory_type: z.string(),
  redis_host: z.string().optional(),
  redis_port: z.number().optional(),
  context_window_size: z.number().min(1).max(50),
  long_term_memory_enabled: z.boolean(),
  vector_db_provider: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export function AgentMemoryPage() {
  const { agentId } = useParams();
  const queryClient = useQueryClient();
  const { data: agent, isLoading } = useAIAgent(agentId);
  const { data: dataSources = [], isLoading: loadingDataSources } = useAIAgentDataSources(agentId);
  const updateAgent = useUpdateAIAgent();
  const createDataSource = useCreateAIAgentDataSource();
  
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [supabaseTables, setSupabaseTables] = useState<SupabaseTable[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [deleteDataSourceId, setDeleteDataSourceId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      short_term_memory_type: 'local',
      redis_host: '',
      redis_port: 6379,
      context_window_size: 10,
      long_term_memory_enabled: false,
      vector_db_provider: 'supabase',
    },
  });

  const watchShortTermType = form.watch('short_term_memory_type');
  const watchLongTermEnabled = form.watch('long_term_memory_enabled');

  useEffect(() => {
    if (agent) {
      form.reset({
        short_term_memory_type: agent.short_term_memory_type || 'local',
        redis_host: agent.redis_host || '',
        redis_port: agent.redis_port || 6379,
        context_window_size: agent.context_window_size || 10,
        long_term_memory_enabled: agent.long_term_memory_enabled || false,
        vector_db_provider: agent.vector_db_provider || 'supabase',
      });
    }
  }, [agent, form]);

  // Carregar tabelas já conectadas e marcar como conectado se houver
  useEffect(() => {
    if (dataSources.length > 0) {
      const connectedTables = dataSources
        .filter(ds => ds.source_type === 'supabase')
        .map(ds => ds.table_name || '');
      setSelectedTables(connectedTables);
      setIsConnected(true);
    }
  }, [dataSources]);

  // Função para buscar tabelas do Supabase
  const fetchSupabaseTables = async () => {
    setIsLoadingTables(true);
    setConnectionError(null);
    
    try {
      const knownTables = [
        'vehicles', 'leads', 'customers', 'negotiations', 'sales', 
        'vehicle_costs', 'profiles', 'financial_transactions', 
        'financial_categories', 'marketing_campaigns', 'notifications',
        'lead_interactions', 'lead_qualifications', 'follow_up_flows',
        'commission_rules', 'sale_commissions', 'salesperson_goals',
        'whatsapp_messages', 'whatsapp_contacts', 'whatsapp_instances'
      ];
      
      const tables: SupabaseTable[] = [];
      
      for (const tableName of knownTables) {
        try {
          const { count, error } = await supabase
            .from(tableName as any)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            tables.push({
              name: tableName,
              description: getTableDescription(tableName),
              rowCount: count || 0,
            });
          }
        } catch (e) {
          // Tabela não acessível, ignorar
        }
      }
      
      if (tables.length > 0) {
        setSupabaseTables(tables);
        setIsConnected(true);
        toast.success(`${tables.length} tabelas encontradas no Supabase!`);
      } else {
        setConnectionError('Nenhuma tabela encontrada ou sem permissão de acesso.');
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      setConnectionError('Erro ao conectar ao Supabase. Verifique suas credenciais.');
    } finally {
      setIsLoadingTables(false);
    }
  };

  const getTableDescription = (tableName: string): string => {
    const descriptions: Record<string, string> = {
      vehicles: 'Estoque de veículos',
      leads: 'Leads e oportunidades',
      customers: 'Base de clientes',
      negotiations: 'Pipeline de vendas',
      sales: 'Vendas realizadas',
      vehicle_costs: 'Custos por veículo',
      profiles: 'Usuários do sistema',
      financial_transactions: 'Transações financeiras',
      financial_categories: 'Categorias financeiras',
      marketing_campaigns: 'Campanhas de marketing',
      notifications: 'Notificações do sistema',
      lead_interactions: 'Interações com leads',
      lead_qualifications: 'Qualificações de leads',
      follow_up_flows: 'Fluxos de follow-up',
      commission_rules: 'Regras de comissão',
      sale_commissions: 'Comissões de vendas',
      salesperson_goals: 'Metas de vendedores',
      whatsapp_messages: 'Mensagens do WhatsApp',
      whatsapp_contacts: 'Contatos do WhatsApp',
      whatsapp_instances: 'Instâncias WhatsApp',
    };
    return descriptions[tableName] || 'Tabela do sistema';
  };

  const onSubmit = async (data: FormData) => {
    if (agentId) {
      await updateAgent.mutateAsync({ id: agentId, ...data });
    }
  };

  const handleToggleTable = (tableName: string) => {
    // Não permitir desmarcar tabelas já conectadas pelo checkbox (usar botão de remover)
    const isAlreadyConnected = dataSources.some(ds => ds.table_name === tableName);
    if (isAlreadyConnected) {
      toast.info('Use o botão de remover para desconectar esta tabela.');
      return;
    }
    
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const handleConnectTables = async () => {
    if (!agentId) return;
    
    const existingTables = dataSources
      .filter(ds => ds.source_type === 'supabase')
      .map(ds => ds.table_name);
    
    const newTables = selectedTables.filter(t => !existingTables.includes(t));
    
    if (newTables.length === 0) {
      toast.info('Nenhuma nova tabela para conectar.');
      return;
    }
    
    for (const tableName of newTables) {
      const tableInfo = supabaseTables.find(t => t.name === tableName);
      await createDataSource.mutateAsync({
        agent_id: agentId,
        name: tableInfo?.description || tableName,
        source_type: 'supabase',
        table_name: tableName,
        is_active: true,
        sync_status: 'synced',
      });
    }
    
    toast.success(`${newTables.length} tabela(s) conectada(s) com sucesso!`);
  };

  const handleDeleteDataSource = async () => {
    if (!deleteDataSourceId) return;
    
    setIsDeleting(true);
    try {
      const { error } = await (supabase
        .from('ai_agent_data_sources') as any)
        .delete()
        .eq('id', deleteDataSourceId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['ai-agent-data-sources', agentId] });
      toast.success('Fonte de dados removida!');
      
      // Atualizar seleção local
      const removedDs = dataSources.find(ds => ds.id === deleteDataSourceId);
      if (removedDs?.table_name) {
        setSelectedTables(prev => prev.filter(t => t !== removedDs.table_name));
      }
    } catch (error) {
      console.error('Error deleting data source:', error);
      toast.error('Erro ao remover fonte de dados');
    } finally {
      setIsDeleting(false);
      setDeleteDataSourceId(null);
    }
  };

  const handleSyncDataSource = async (dataSourceId: string) => {
    setIsSyncing(dataSourceId);
    try {
      // Atualizar last_sync_at e sync_status
      const { error } = await (supabase
        .from('ai_agent_data_sources') as any)
        .update({ 
          last_sync_at: new Date().toISOString(),
          sync_status: 'synced',
        })
        .eq('id', dataSourceId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['ai-agent-data-sources', agentId] });
      toast.success('Sincronização concluída!');
    } catch (error) {
      console.error('Error syncing data source:', error);
      toast.error('Erro ao sincronizar');
    } finally {
      setIsSyncing(null);
    }
  };

  const handleToggleDataSourceActive = async (dataSourceId: string, isActive: boolean) => {
    try {
      const { error } = await (supabase
        .from('ai_agent_data_sources') as any)
        .update({ is_active: isActive })
        .eq('id', dataSourceId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['ai-agent-data-sources', agentId] });
      toast.success(isActive ? 'Fonte de dados ativada!' : 'Fonte de dados desativada!');
    } catch (error) {
      console.error('Error toggling data source:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const getTableStatus = (tableName: string) => {
    return dataSources.some(ds => ds.table_name === tableName && ds.is_active);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const connectedDataSources = dataSources.filter(ds => ds.source_type === 'supabase');
  const pendingTables = selectedTables.filter(t => !dataSources.some(ds => ds.table_name === t));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Supabase Connection / Data Sources */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              isConnected 
                ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
                : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}>
              <Database className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                Fontes de Dados
                {isConnected ? (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20 ml-2">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Não conectado
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isConnected 
                  ? `${connectedDataSources.length} tabela(s) conectada(s) ao agente`
                  : 'Conecte tabelas do Supabase para o agente consultar'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Connected Data Sources */}
          {connectedDataSources.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Tabelas Conectadas
              </h4>
              <div className="space-y-2">
                {connectedDataSources.map((ds) => (
                  <div
                    key={ds.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Table2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{ds.table_name}</p>
                        <p className="text-xs text-muted-foreground">{ds.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={ds.is_active ? 'default' : 'secondary'} className="text-xs">
                        {ds.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Switch
                        checked={ds.is_active ?? true}
                        onCheckedChange={(checked) => handleToggleDataSourceActive(ds.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleSyncDataSource(ds.id)}
                        disabled={isSyncing === ds.id}
                      >
                        {isSyncing === ds.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteDataSourceId(ds.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add More Tables */}
          {!isConnected || supabaseTables.length === 0 ? (
            <div className="space-y-4">
              {connectionError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                  <XCircle className="h-4 w-4 shrink-0" />
                  {connectionError}
                </div>
              )}
              
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Plug className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Conecte ao Supabase</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  O agente usará as tabelas do banco de dados para responder perguntas sobre veículos, leads, vendas e mais.
                </p>
                <Button 
                  onClick={fetchSupabaseTables} 
                  disabled={isLoadingTables}
                  size="lg"
                >
                  {isLoadingTables ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="mr-2 h-4 w-4" />
                  )}
                  Conectar ao Supabase
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Tabelas
                </h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchSupabaseTables}
                  disabled={isLoadingTables}
                >
                  {isLoadingTables ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Atualizar Lista
                </Button>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2">
                {supabaseTables
                  .filter(table => !dataSources.some(ds => ds.table_name === table.name))
                  .map((table) => {
                    const isSelected = selectedTables.includes(table.name);
                    
                    return (
                      <div
                        key={table.name}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleToggleTable(table.name)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleTable(table.name)}
                        />
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                          <Table2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{table.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {table.description}
                            {table.rowCount !== undefined && (
                              <span className="ml-1">• {table.rowCount} registros</span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              {pendingTables.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {pendingTables.length} tabela(s) selecionada(s) para adicionar
                  </p>
                  <Button 
                    onClick={handleConnectTables}
                    disabled={createDataSource.isPending}
                  >
                    {createDataSource.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Plus className="mr-2 h-4 w-4" />
                    Conectar Tabelas
                  </Button>
                </div>
              )}
              
              {supabaseTables.filter(t => !dataSources.some(ds => ds.table_name === t.name)).length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <Info className="h-5 w-5 mx-auto mb-2" />
                  Todas as tabelas disponíveis já estão conectadas
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Short Term Memory */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Memória de Curto Prazo</CardTitle>
              <CardDescription>
                Armazena o contexto da conversa atual para respostas coerentes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="short_term_memory_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Armazenamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SHORT_TERM_MEMORY_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Onde a memória da conversa será armazenada
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="context_window_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Janela de Contexto</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1}
                          max={50}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                        />
                      </FormControl>
                      <FormDescription>
                        Número de turnos de conversa a serem lembrados
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchShortTermType === 'redis' && (
                <div className="grid gap-6 md:grid-cols-2 p-4 bg-muted/50 rounded-lg">
                  <FormField
                    control={form.control}
                    name="redis_host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Redis Host</FormLabel>
                        <FormControl>
                          <Input placeholder="redis.example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="redis_port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Redis Port</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 6379)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Long Term Memory */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <HardDrive className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Memória de Longo Prazo (RAG)</h3>
                    <p className="text-sm text-muted-foreground">
                      Base de conhecimento para recuperação de informações
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="long_term_memory_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mb-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Ativar Memória de Longo Prazo</FormLabel>
                        <FormDescription>
                          Permite ao agente consultar uma base de conhecimento para respostas mais precisas
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {watchLongTermEnabled && (
                  <FormField
                    control={form.control}
                    name="vector_db_provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banco de Dados Vetorial</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o provedor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {VECTOR_DB_PROVIDERS.map(provider => (
                              <SelectItem key={provider.value} value={provider.value}>
                                {provider.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Onde os embeddings serão armazenados para busca semântica
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={updateAgent.isPending}>
                  {updateAgent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDataSourceId} onOpenChange={() => setDeleteDataSourceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Fonte de Dados</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta fonte de dados? O agente não poderá mais consultar esta tabela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDataSource}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AgentMemoryPage;
