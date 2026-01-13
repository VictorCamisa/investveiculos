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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { Loader2, Save, Brain, Sparkles, Volume2, Key, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { LLM_PROVIDERS, LLM_MODELS } from '@/types/ai-agents';
import { toast } from 'sonner';

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

type ApiKeySource = 'lovable_gateway' | 'custom';

export function AgentLLMConfigPage() {
  const { agentId } = useParams();
  const { data: agent, isLoading } = useAIAgent(agentId);
  const updateAgent = useUpdateAIAgent();
  
  // Estado local para configurações de voz
  const [enableTTS, setEnableTTS] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('JBFqnCBsd6RMkjVDRZzb');
  
  // Estado para API Keys
  const [apiKeySource, setApiKeySource] = useState<ApiKeySource>('lovable_gateway');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);

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
      
      // Load voice settings from agent
      setEnableTTS(agent.enable_voice || false);
      setSelectedVoice(agent.voice_id || 'JBFqnCBsd6RMkjVDRZzb');
      
      // Se tiver api_key_encrypted, é porque usa chave própria
      if (agent.api_key_encrypted) {
        setApiKeySource('custom');
        // Parse stored keys (format: {openai: "key", google: "key"})
        try {
          const keys = JSON.parse(agent.api_key_encrypted);
          if (keys.openai) setOpenaiApiKey('••••••••••••••••');
          if (keys.google) setGoogleApiKey('••••••••••••••••');
        } catch {
          // Legacy format - single key
          if (agent.llm_provider === 'openai') {
            setOpenaiApiKey('••••••••••••••••');
          } else {
            setGoogleApiKey('••••••••••••••••');
          }
        }
      }
    }
  }, [agent, form]);

  const handleSaveApiKeys = async () => {
    if (!agentId) return;
    
    setSavingKeys(true);
    try {
      if (apiKeySource === 'custom') {
        // Build keys object
        const keys: Record<string, string> = {};
        if (openaiApiKey && !openaiApiKey.includes('•')) {
          keys.openai = openaiApiKey;
        }
        if (googleApiKey && !googleApiKey.includes('•')) {
          keys.google = googleApiKey;
        }
        
        if (Object.keys(keys).length === 0) {
          toast.error('Adicione pelo menos uma API key');
          setSavingKeys(false);
          return;
        }
        
        await updateAgent.mutateAsync({ 
          id: agentId, 
          api_key_encrypted: JSON.stringify(keys)
        });
        toast.success('Chaves de API salvas com sucesso!');
        
        if (keys.openai) setOpenaiApiKey('••••••••••••••••');
        if (keys.google) setGoogleApiKey('••••••••••••••••');
      } else {
        await updateAgent.mutateAsync({ 
          id: agentId, 
          api_key_encrypted: null 
        });
        toast.success('Configurado para usar Lovable Gateway');
      }
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setSavingKeys(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (agentId) {
      // Include voice settings in the update
      const voiceId = selectedVoice.startsWith('custom:') 
        ? selectedVoice.replace('custom:', '') 
        : selectedVoice;
      
      await updateAgent.mutateAsync({ 
        id: agentId, 
        ...data,
        enable_voice: enableTTS,
        voice_id: voiceId,
      });
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
      {/* API Keys Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Key className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Configuração de API Keys</CardTitle>
              <CardDescription>
                Escolha como o agente vai se conectar aos modelos de IA
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            value={apiKeySource} 
            onValueChange={(v) => setApiKeySource(v as ApiKeySource)}
            className="space-y-3"
          >
            <div className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${apiKeySource === 'lovable_gateway' ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <RadioGroupItem value="lovable_gateway" id="lovable_gateway" className="mt-1" />
              <div className="flex-1">
                <label htmlFor="lovable_gateway" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  Lovable AI Gateway
                  <Badge variant="secondary" className="text-xs">Recomendado</Badge>
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Acesso a OpenAI GPT-5, Google Gemini e outros modelos sem precisar de API key própria. 
                  Uso incluído no plano Lovable.
                </p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-1" />
            </div>
            
            <div className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${apiKeySource === 'custom' ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <RadioGroupItem value="custom" id="custom" className="mt-1" />
              <div className="flex-1">
                <label htmlFor="custom" className="text-sm font-medium cursor-pointer">
                  Minhas próprias API Keys
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Use suas próprias chaves de API da OpenAI e/ou Google. Você controla os custos diretamente.
                </p>
              </div>
            </div>
          </RadioGroup>

          {apiKeySource === 'custom' && (
            <div className="space-y-4 pt-2">
              {/* OpenAI API Key */}
              <div className="space-y-2 p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-emerald-500/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-600">AI</span>
                  </div>
                  <label className="text-sm font-medium">OpenAI API Key</label>
                  {openaiApiKey && <Badge variant="outline" className="text-xs text-green-600">Configurada</Badge>}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showOpenaiKey ? 'text' : 'password'}
                      placeholder="sk-..."
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      className="pr-10 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    >
                      {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Obtenha sua API key em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">platform.openai.com</a>
                </p>
              </div>

              {/* Google API Key */}
              <div className="space-y-2 p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-blue-500/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">G</span>
                  </div>
                  <label className="text-sm font-medium">Google AI API Key</label>
                  {googleApiKey && <Badge variant="outline" className="text-xs text-green-600">Configurada</Badge>}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showGoogleKey ? 'text' : 'password'}
                      placeholder="AIza..."
                      value={googleApiKey}
                      onChange={(e) => setGoogleApiKey(e.target.value)}
                      className="pr-10 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowGoogleKey(!showGoogleKey)}
                    >
                      {showGoogleKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Obtenha sua API key em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">aistudio.google.com</a>
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Suas API keys são armazenadas de forma segura. Os custos de uso serão cobrados diretamente pela OpenAI/Google.
                </p>
              </div>

              <Button 
                onClick={handleSaveApiKeys} 
                disabled={savingKeys}
                className="w-full"
              >
                {savingKeys && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Salvar API Keys
              </Button>
            </div>
          )}

          {apiKeySource === 'lovable_gateway' && (
            <Button 
              onClick={handleSaveApiKeys} 
              disabled={savingKeys}
              variant="outline"
              className="w-full"
            >
              {savingKeys && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Lovable Gateway
            </Button>
          )}
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
              <RadioGroup 
                value={selectedVoice.startsWith('custom:') ? 'custom' : 'preset'} 
                onValueChange={(v) => {
                  if (v === 'preset') {
                    setSelectedVoice('JBFqnCBsd6RMkjVDRZzb');
                  } else {
                    setSelectedVoice('custom:');
                  }
                }}
                className="space-y-3"
              >
                <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${!selectedVoice.startsWith('custom:') ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <RadioGroupItem value="preset" id="preset_voice" className="mt-1" />
                  <div className="flex-1">
                    <label htmlFor="preset_voice" className="text-sm font-medium cursor-pointer">
                      Vozes pré-definidas
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Escolha entre vozes de alta qualidade do ElevenLabs
                    </p>
                  </div>
                </div>
                
                <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${selectedVoice.startsWith('custom:') ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <RadioGroupItem value="custom" id="custom_voice" className="mt-1" />
                  <div className="flex-1">
                    <label htmlFor="custom_voice" className="text-sm font-medium cursor-pointer">
                      Minha voz/agente customizado
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use o ID de uma voz clonada ou agente do ElevenLabs
                    </p>
                  </div>
                </div>
              </RadioGroup>

              {!selectedVoice.startsWith('custom:') && (
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
                </div>
              )}

              {selectedVoice.startsWith('custom:') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">ID da Voz/Agente ElevenLabs</label>
                  <Input
                    placeholder="Ex: abc123xyz..."
                    value={selectedVoice.replace('custom:', '')}
                    onChange={(e) => setSelectedVoice(`custom:${e.target.value}`)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Encontre o ID na <a href="https://elevenlabs.io/app/voice-lab" target="_blank" rel="noopener noreferrer" className="text-primary underline">Voice Lab</a> ou <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer" className="text-primary underline">Conversational AI</a> do ElevenLabs
                  </p>
                </div>
              )}

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
