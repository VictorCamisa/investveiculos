import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAIAgent, useCreateAIAgent, useUpdateAIAgent } from '@/hooks/useAIAgents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Loader2, Save } from 'lucide-react';
import { AGENT_OBJECTIVES, AGENT_STATUS } from '@/types/ai-agents';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  objective: z.string().min(1, 'Objetivo é obrigatório'),
  status: z.enum(['active', 'inactive', 'training']),
});

type FormData = z.infer<typeof formSchema>;

export function AgentBasicsPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const isNew = !agentId || agentId === 'novo';
  
  const { data: agent, isLoading } = useAIAgent(isNew ? undefined : agentId);
  const createAgent = useCreateAIAgent();
  const updateAgent = useUpdateAIAgent();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      objective: 'qualify_leads',
      status: 'inactive',
    },
  });

  useEffect(() => {
    if (agent) {
      form.reset({
        name: agent.name,
        description: agent.description || '',
        objective: agent.objective,
        status: agent.status,
      });
    }
  }, [agent, form]);

  const onSubmit = async (data: FormData) => {
    if (isNew) {
      const result = await createAgent.mutateAsync(data);
      navigate(`/ai-agents/${result.id}/llm`);
    } else {
      await updateAgent.mutateAsync({ id: agentId!, ...data });
    }
  };

  const isPending = createAgent.isPending || updateAgent.isPending;

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>
            Configure o nome, descrição e objetivo principal do seu agente de IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Agente</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Qualificador Automotivo IA" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Um nome descritivo para identificar seu agente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva as capacidades e funções do agente..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Uma breve descrição do propósito e capacidades do agente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="objective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objetivo Principal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o objetivo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AGENT_OBJECTIVES.map(objective => (
                          <SelectItem key={objective.value} value={objective.value}>
                            {objective.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      O objetivo principal que o agente deve alcançar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AGENT_STATUS.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <span 
                                className={`h-2 w-2 rounded-full bg-${status.color}-500`}
                                style={{ 
                                  backgroundColor: status.color === 'green' ? '#22c55e' : 
                                                   status.color === 'yellow' ? '#eab308' : '#6b7280' 
                                }}
                              />
                              {status.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Defina se o agente está ativo e processando conversas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/ai-agents')}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {isNew ? 'Criar e Continuar' : 'Salvar'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default AgentBasicsPage;
