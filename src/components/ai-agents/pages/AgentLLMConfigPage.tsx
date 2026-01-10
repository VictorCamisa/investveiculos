import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAIAgent, useUpdateAIAgent } from '@/hooks/useAIAgents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
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
import { Loader2, Save, Brain, Sparkles } from 'lucide-react';
import { LLM_PROVIDERS, LLM_MODELS } from '@/types/ai-agents';

const formSchema = z.object({
  llm_provider: z.string().min(1),
  llm_model: z.string().min(1),
  temperature: z.number().min(0).max(1),
  top_p: z.number().min(0).max(1),
  max_tokens: z.number().min(100).max(8192),
  system_prompt: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function AgentLLMConfigPage() {
  const { agentId } = useParams();
  const { data: agent, isLoading } = useAIAgent(agentId);
  const updateAgent = useUpdateAIAgent();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      llm_provider: 'google',
      llm_model: 'google/gemini-3-flash-preview',
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 2048,
      system_prompt: '',
    },
  });

  const watchProvider = form.watch('llm_provider');

  useEffect(() => {
    if (agent) {
      form.reset({
        llm_provider: agent.llm_provider,
        llm_model: agent.llm_model,
        temperature: agent.temperature,
        top_p: agent.top_p,
        max_tokens: agent.max_tokens,
        system_prompt: agent.system_prompt || '',
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

  const availableModels = LLM_MODELS[watchProvider as keyof typeof LLM_MODELS] || [];

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Configuração do Modelo de Linguagem</CardTitle>
              <CardDescription>
                Selecione e configure o modelo de IA que impulsiona seu agente.
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
                  name="llm_provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provedor do LLM</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset model when provider changes
                          const models = LLM_MODELS[value as keyof typeof LLM_MODELS];
                          if (models?.[0]) {
                            form.setValue('llm_model', models[0].value);
                          }
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o provedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LLM_PROVIDERS.map(provider => (
                            <SelectItem key={provider.value} value={provider.value}>
                              {provider.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="llm_model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o modelo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableModels.map(model => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Temperatura: {field.value}
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={1}
                          step={0.1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormDescription>
                        Controla a criatividade das respostas (0 = focado, 1 = criativo)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="top_p"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Top P: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={1}
                          step={0.1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormDescription>
                        Controla a diversidade das respostas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="max_tokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máximo de Tokens</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={100}
                        max={8192}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Limite de tokens para a resposta do LLM (100 - 8192)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="system_prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt do Sistema (System Prompt)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Você é um assistente de vendas de carros amigável e experiente. Seu objetivo é qualificar leads identificando suas necessidades, orçamento e timeline de compra..."
                        className="min-h-[200px] font-mono text-sm"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Define a persona, papel e instruções gerais do agente. 
                      Você pode usar variáveis como {`{{nome_usuario}}`}, {`{{data_atual}}`}, {`{{nome_empresa}}`}.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

export default AgentLLMConfigPage;
