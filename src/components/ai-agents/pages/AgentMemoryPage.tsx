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
import { Loader2, Save, Database, HardDrive, Clock, Plus, Table2, CheckCircle2, XCircle, RefreshCw, Plug, AlertCircle } from 'lucide-react';
import { SHORT_TERM_MEMORY_TYPES, VECTOR_DB_PROVIDERS } from '@/types/ai-agents';
import { toast } from 'sonner';

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
  const { data: agent, isLoading } = useAIAgent(agentId);
  const { data: dataSources = [], isLoading: loadingDataSources } = useAIAgentDataSources(agentId);
  const updateAgent = useUpdateAIAgent();
  const createDataSource = useCreateAIAgentDataSource();
  
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [supabaseTables, setSupabaseTables] = useState<SupabaseTable[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

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
        short_term_memory_type: agent.short_term_memory_type,
        redis_host: agent.redis_host || '',
        redis_port: agent.redis_port || 6379,
        context_window_size: agent.context_window_size,
        long_term_memory_enabled: agent.long_term_memory_enabled,
        vector_db_provider: agent.vector_db_provider,
      });
    }
  }, [agent, form]);

  // Carregar tabelas já conectadas
  useEffect(() => {
    if (dataSources.length > 0) {
      const connectedTables = dataSources
        .filter(ds => ds.source_type === 'supabase')
        .map(ds => ds.table_name || '');
      setSelectedTables(connectedTables);
    }
  }, [dataSources]);

  // Função para buscar tabelas do Supabase
  const fetchSupabaseTables = async () => {
    setIsLoadingTables(true);
    setConnectionError(null);
    
    try {
      // Buscar tabelas do schema public usando uma query direta
      // Usamos as tabelas que sabemos que existem no sistema
      const knownTables = [
        'vehicles', 'leads', 'customers', 'negotiations', 'sales', 
        'vehicle_costs', 'profiles', 'financial_transactions', 
        'financial_categories', 'marketing_campaigns', 'notifications',
        'lead_interactions', 'lead_qualifications', 'follow_up_flows',
        'commission_rules', 'sale_commissions', 'salesperson_goals'
      ];
      
      const tables: SupabaseTable[] = [];
      
      for (const tableName of knownTables) {
        try {
          // Tenta fazer uma query count para verificar se a tabela existe
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
    };
    return descriptions[tableName] || 'Tabela do sistema';
  };

  const onSubmit = async (data: FormData) => {
    if (agentId) {
      await updateAgent.mutateAsync({ id: agentId, ...data });
    }
  };

  const handleToggleTable = (tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const handleConnectTables = async () => {
    if (!agentId) return;
    
    // Tabelas já conectadas
    const existingTables = dataSources
      .filter(ds => ds.source_type === 'supabase')
      .map(ds => ds.table_name);
    
    // Novas tabelas para conectar
    const newTables = selectedTables.filter(t => !existingTables.includes(t));
    
    for (const tableName of newTables) {
      const tableInfo = supabaseTables.find(t => t.name === tableName);
      await createDataSource.mutateAsync({
        agent_id: agentId,
        name: tableInfo?.name || tableName,
        source_type: 'supabase',
        table_name: tableName,
        is_active: true,
        sync_status: 'synced',
      });
    }
    
    if (newTables.length > 0) {
      toast.success(`${newTables.length} tabela(s) conectada(s) com sucesso!`);
    }
  };

  const getTableStatus = (tableName: string) => {
    return dataSources.some(ds => ds.table_name === tableName && ds.is_active);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const connectedTablesCount = dataSources.filter(ds => ds.source_type === 'supabase').length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Supabase Connection Status */}
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
                Conexão Supabase
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
                {connectedTablesCount > 0 && (
                  <Badge variant="outline" className="ml-1">
                    {connectedTablesCount} tabela(s) ativa(s)
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isConnected 
                  ? 'Conectado ao Supabase. Selecione as tabelas que o agente pode acessar.'
                  : 'Clique em "Conectar ao Supabase" para buscar as tabelas disponíveis.'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
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
                  O agente usará as tabelas do seu banco de dados Supabase para responder perguntas sobre veículos, leads, vendas e mais.
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
                <p className="text-sm text-muted-foreground">
                  {supabaseTables.length} tabela(s) disponível(is)
                </p>
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
                  Atualizar
                </Button>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2">
                {supabaseTables.map((table) => {
                  const isTableConnected = getTableStatus(table.name);
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
                      {isTableConnected ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : isSelected ? (
                        <Badge variant="outline" className="text-xs shrink-0">Pendente</Badge>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {selectedTables.length} tabela(s) selecionada(s)
                </p>
                <Button 
                  onClick={handleConnectTables}
                  disabled={createDataSource.isPending || selectedTables.length === 0}
                >
                  {createDataSource.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Plus className="mr-2 h-4 w-4" />
                  Conectar Tabelas
                </Button>
              </div>
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
                Armazena o contexto da conversa atual para respostas coerentes.
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
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

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
    </div>
  );
}

export default AgentMemoryPage;
