import { useEffect, useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { Loader2, Save, Brain, Sparkles, Volume2, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { LLM_PROVIDERS, LLM_MODELS } from '@/types/ai-agents';

// Vozes disponíveis do ElevenLabs
const ELEVENLABS_VOICES = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'Masculina, profissional' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Feminina, amigável' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', description: 'Feminina, suave' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Masculina, jovem' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', description: 'Masculina, casual' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', description: 'Feminina, expressiva' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', description: 'Feminina, narrativa' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: 'Masculina, calma' },
];

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
  
  // Estado local para configurações de voz (não salvas no DB ainda)
  const [enableTTS, setEnableTTS] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('JBFqnCBsd6RMkjVDRZzb');

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
      {/* API Keys Status */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Key className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Chaves de API Configuradas</CardTitle>
              <CardDescription>
                As APIs são gerenciadas via secrets do Supabase
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Lovable AI Gateway</p>
                <p className="text-xs text-muted-foreground">OpenAI, Google, Anthropic</p>
              </div>
              <Badge variant="secondary" className="ml-auto">Ativo</Badge>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">ElevenLabs TTS</p>
                <p className="text-xs text-muted-foreground">Texto para Voz</p>
              </div>
              <Badge variant="secondary" className="ml-auto">Ativo</Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            💡 O Lovable AI Gateway fornece acesso a múltiplos LLMs sem necessidade de API keys individuais.
          </p>
        </CardContent>
      </Card>

      {/* Voice Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Volume2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Configuração de Voz (ElevenLabs)</CardTitle>
              <CardDescription>
                Habilite respostas por áudio usando síntese de voz avançada.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <p className="font-medium">Habilitar Text-to-Speech</p>
              <p className="text-sm text-muted-foreground">
                O agente responderá com áudio além do texto
              </p>
            </div>
            <Switch
              checked={enableTTS}
              onCheckedChange={setEnableTTS}
            />
          </div>

          {enableTTS && (
            <div className="space-y-4 p-4 rounded-lg bg-muted/50">
              <div className="space-y-2">
                <label className="text-sm font-medium">Voz do Agente</label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a voz" />
                  </SelectTrigger>
                  <SelectContent>
                    {ELEVENLABS_VOICES.map(voice => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex items-center gap-2">
                          <span>{voice.name}</span>
                          <span className="text-xs text-muted-foreground">({voice.description})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Vozes multilíngues de alta qualidade via ElevenLabs
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <p className="text-xs text-muted-foreground">
                  A geração de áudio consome créditos do ElevenLabs. Use com moderação.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* LLM Configuration */}
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
