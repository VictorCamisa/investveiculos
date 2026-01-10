import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAIAgent, useUpdateAIAgent } from '@/hooks/useAIAgents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { Loader2, Save, Database, HardDrive, Clock } from 'lucide-react';
import { SHORT_TERM_MEMORY_TYPES, VECTOR_DB_PROVIDERS } from '@/types/ai-agents';

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
  const updateAgent = useUpdateAIAgent();

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

  const onSubmit = async (data: FormData) => {
    if (agentId) {
      await updateAgent.mutateAsync({ id: agentId, ...data });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
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
                    <Database className="h-5 w-5 text-white" />
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
