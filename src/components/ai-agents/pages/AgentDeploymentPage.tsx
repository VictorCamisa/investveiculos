import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Globe, 
  MessageSquare, 
  Code, 
  Copy, 
  Check,
  ExternalLink,
  Webhook,
  Key,
  RefreshCw,
  Save,
  Loader2,
  Unplug,
  Clock,
  Palette,
  Layout
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAIAgentDeploymentConfig,
  useUpdateDeploymentConfig,
  useToggleAgentStatus,
  useGenerateApiKey,
  useAIAgentApiKey,
  useConnectWhatsAppInstance,
  useDisconnectWhatsApp,
  type DeploymentConfig,
} from '@/hooks/useAIAgentDeployment';
import { useWhatsAppInstances } from '@/hooks/useWhatsApp';

export default function AgentDeploymentPage() {
  const { agentId } = useParams<{ agentId: string }>();
  
  // Data fetching
  const { data: deploymentData, isLoading } = useAIAgentDeploymentConfig(agentId);
  const { data: apiKey, isLoading: isLoadingApiKey } = useAIAgentApiKey(agentId);
  const { data: whatsappInstances } = useWhatsAppInstances();
  
  // Mutations
  const updateConfig = useUpdateDeploymentConfig();
  const toggleStatus = useToggleAgentStatus();
  const generateApiKey = useGenerateApiKey();
  const connectWhatsApp = useConnectWhatsAppInstance();
  const disconnectWhatsApp = useDisconnectWhatsApp();

  // Local state for form
  const [copied, setCopied] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState<DeploymentConfig>({
    widget_color: '#6366f1',
    widget_position: 'bottom-right',
    widget_show_avatar: true,
    widget_title: 'Chat com IA',
    widget_welcome_message: 'Olá! Como posso ajudar?',
  });
  const [webhookUrl, setWebhookUrl] = useState('');
  
  // WhatsApp form state
  const [selectedInstance, setSelectedInstance] = useState('');
  const [whatsappAutoRespond, setWhatsappAutoRespond] = useState(true);
  const [businessHoursStart, setBusinessHoursStart] = useState('08:00');
  const [businessHoursEnd, setBusinessHoursEnd] = useState('18:00');

  // Sync local state with fetched data
  useEffect(() => {
    if (deploymentData) {
      const config = deploymentData.config || {};
      setWidgetConfig({
        widget_color: config.widget_color || '#6366f1',
        widget_position: config.widget_position || 'bottom-right',
        widget_show_avatar: config.widget_show_avatar ?? true,
        widget_title: config.widget_title || 'Chat com IA',
        widget_welcome_message: config.widget_welcome_message || 'Olá! Como posso ajudar?',
      });
      setWebhookUrl(deploymentData.webhookUrl || '');
      
      // WhatsApp settings
      setSelectedInstance(config.whatsapp_instance_id || '');
      setWhatsappAutoRespond(config.whatsapp_auto_respond ?? true);
      setBusinessHoursStart(config.whatsapp_business_hours_start || '08:00');
      setBusinessHoursEnd(config.whatsapp_business_hours_end || '18:00');
    }
  }, [deploymentData]);

  const endpoint = `https://rugbunseyblzapwzevqh.supabase.co/functions/v1/ai-agent-chat`;

  const embedCode = `<!-- Widget de Chat IA -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['AIChat']=o;w[o]=w[o]||function(){
    (w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','aichat','https://seu-dominio.com/widget.js'));
  aichat('init', { 
    agentId: '${agentId}',
    color: '${widgetConfig.widget_color}',
    position: '${widgetConfig.widget_position}',
    showAvatar: ${widgetConfig.widget_show_avatar},
    title: '${widgetConfig.widget_title}',
    welcomeMessage: '${widgetConfig.widget_welcome_message}'
  });
</script>`;

  const webhookExample = `{
  "event": "message",
  "agent_id": "${agentId}",
  "session_id": "abc123",
  "message": {
    "role": "assistant",
    "content": "Resposta do agente..."
  },
  "lead_id": "uuid-do-lead",
  "metadata": {
    "channel": "whatsapp",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}`;

  const apiExample = `curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}" \\
  -d '{
    "agent_id": "${agentId}",
    "session_id": "unique-session-id",
    "message": "Olá, quero saber sobre carros"
  }'`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copiado para a área de transferência!');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleStatusToggle = () => {
    if (!agentId) return;
    const newStatus = deploymentData?.status === 'active' ? 'inactive' : 'active';
    toggleStatus.mutate({ agentId, status: newStatus });
  };

  const handleSaveWidgetConfig = () => {
    if (!agentId) return;
    updateConfig.mutate({
      agentId,
      config: { ...deploymentData?.config, ...widgetConfig },
    });
  };

  const handleSaveWebhook = () => {
    if (!agentId) return;
    updateConfig.mutate({ agentId, webhookUrl });
  };

  const handleGenerateApiKey = () => {
    if (!agentId) return;
    generateApiKey.mutate(agentId);
  };

  const handleConnectWhatsApp = () => {
    if (!agentId || !selectedInstance) {
      toast.error('Selecione uma instância WhatsApp');
      return;
    }
    connectWhatsApp.mutate({
      agentId,
      instanceId: selectedInstance,
      autoRespond: whatsappAutoRespond,
      businessHoursStart,
      businessHoursEnd,
    });
  };

  const handleDisconnectWhatsApp = () => {
    if (!agentId) return;
    disconnectWhatsApp.mutate(agentId);
  };

  const isWhatsAppConnected = !!deploymentData?.config?.whatsapp_instance_id;
  const connectedInstance = whatsappInstances?.find(
    i => i.id === deploymentData?.config?.whatsapp_instance_id
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Implantação e Integração</h2>
        <p className="text-muted-foreground">
          Coloque o agente em funcionamento e integre em diferentes canais
        </p>
      </div>

      {/* Status de Implantação */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Status do Agente</CardTitle>
              <CardDescription>
                Configure o status de implantação
              </CardDescription>
            </div>
            <Badge className={deploymentData?.status === 'active' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'}>
              {deploymentData?.status === 'active' ? '● Ativo' : '○ Inativo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Agente em Produção</p>
              <p className="text-sm text-muted-foreground">
                Ative para começar a receber interações
              </p>
            </div>
            <Switch 
              checked={deploymentData?.status === 'active'} 
              onCheckedChange={handleStatusToggle}
              disabled={toggleStatus.isPending}
            />
          </div>

          {/* Deployment Channels Summary */}
          {deploymentData?.deploymentChannels && deploymentData.deploymentChannels.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Canais ativos:</span>
              {deploymentData.deploymentChannels.map(channel => (
                <Badge key={channel} variant="secondary" className="capitalize">
                  {channel === 'whatsapp' && <MessageSquare className="h-3 w-3 mr-1" />}
                  {channel === 'widget' && <Globe className="h-3 w-3 mr-1" />}
                  {channel === 'api' && <Code className="h-3 w-3 mr-1" />}
                  {channel}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Canais de Implantação */}
      <Tabs defaultValue="widget" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="widget" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Widget Web
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            API
          </TabsTrigger>
        </TabsList>

        {/* Widget Web */}
        <TabsContent value="widget">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Widget para Website
                  </CardTitle>
                  <CardDescription>
                    Adicione o chat de IA ao seu site com um simples código
                  </CardDescription>
                </div>
                <Badge className="bg-green-500/20 text-green-700">Disponível</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Widget Configuration */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Cor do Widget
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={widgetConfig.widget_color}
                      onChange={(e) => setWidgetConfig({ ...widgetConfig, widget_color: e.target.value })}
                      className="h-10 w-20 p-1 cursor-pointer" 
                    />
                    <Input 
                      value={widgetConfig.widget_color}
                      onChange={(e) => setWidgetConfig({ ...widgetConfig, widget_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    Posição
                  </Label>
                  <Select 
                    value={widgetConfig.widget_position} 
                    onValueChange={(v) => setWidgetConfig({ ...widgetConfig, widget_position: v as 'bottom-right' | 'bottom-left' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Inferior Direito</SelectItem>
                      <SelectItem value="bottom-left">Inferior Esquerdo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Título do Widget</Label>
                  <Input 
                    value={widgetConfig.widget_title}
                    onChange={(e) => setWidgetConfig({ ...widgetConfig, widget_title: e.target.value })}
                    placeholder="Chat com IA"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mensagem de Boas-Vindas</Label>
                  <Input 
                    value={widgetConfig.widget_welcome_message}
                    onChange={(e) => setWidgetConfig({ ...widgetConfig, widget_welcome_message: e.target.value })}
                    placeholder="Olá! Como posso ajudar?"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Mostrar avatar do agente</span>
                <Switch 
                  checked={widgetConfig.widget_show_avatar} 
                  onCheckedChange={(checked) => setWidgetConfig({ ...widgetConfig, widget_show_avatar: checked })}
                />
              </div>

              <Button onClick={handleSaveWidgetConfig} disabled={updateConfig.isPending}>
                {updateConfig.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Configurações
              </Button>

              {/* Embed Code */}
              <div className="pt-4 border-t">
                <Label>Código de Incorporação</Label>
                <div className="relative mt-2">
                  <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto max-h-64">
                    <code>{embedCode}</code>
                  </pre>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(embedCode, 'embed')}
                  >
                    {copied === 'embed' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    Integração WhatsApp
                  </CardTitle>
                  <CardDescription>
                    Conecte o agente ao WhatsApp via Evolution API
                  </CardDescription>
                </div>
                {isWhatsAppConnected ? (
                  <Badge className="bg-green-500/20 text-green-700">Conectado</Badge>
                ) : (
                  <Badge variant="outline">Não Configurado</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isWhatsAppConnected ? (
                <>
                  {/* Connected State */}
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-400">
                            {connectedInstance?.name || 'Instância WhatsApp'}
                          </p>
                          <p className="text-sm text-green-600/80">
                            {connectedInstance?.phone_number || 'Conectado'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleDisconnectWhatsApp}
                        disabled={disconnectWhatsApp.isPending}
                      >
                        {disconnectWhatsApp.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Unplug className="h-4 w-4 mr-2" />
                        )}
                        Desconectar
                      </Button>
                    </div>
                  </div>

                  {/* Current Settings */}
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm">Responder automaticamente</span>
                      <Badge variant={whatsappAutoRespond ? 'default' : 'secondary'}>
                        {whatsappAutoRespond ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Horário de funcionamento
                      </span>
                      <span className="text-sm font-medium">
                        {businessHoursStart} - {businessHoursEnd}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Not Connected State */}
                  {(!whatsappInstances || whatsappInstances.length === 0) ? (
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        Nenhuma instância WhatsApp encontrada. Configure uma instância no módulo WhatsApp primeiro.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label>Selecionar Instância</Label>
                        <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Selecione uma instância..." />
                          </SelectTrigger>
                          <SelectContent>
                            {whatsappInstances.map(instance => (
                              <SelectItem key={instance.id} value={instance.id}>
                                <div className="flex items-center gap-2">
                                  <span 
                                    className={`h-2 w-2 rounded-full ${
                                      instance.status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
                                    }`} 
                                  />
                                  {instance.name} {instance.phone_number && `(${instance.phone_number})`}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm">Responder automaticamente</span>
                        <Switch 
                          checked={whatsappAutoRespond} 
                          onCheckedChange={setWhatsappAutoRespond}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Início do expediente
                          </Label>
                          <Input 
                            type="time"
                            value={businessHoursStart}
                            onChange={(e) => setBusinessHoursStart(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Fim do expediente
                          </Label>
                          <Input 
                            type="time"
                            value={businessHoursEnd}
                            onChange={(e) => setBusinessHoursEnd(e.target.value)}
                          />
                        </div>
                      </div>

                      <Button 
                        className="w-full"
                        onClick={handleConnectWhatsApp}
                        disabled={connectWhatsApp.isPending || !selectedInstance}
                      >
                        {connectWhatsApp.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <MessageSquare className="h-4 w-4 mr-2" />
                        )}
                        Conectar ao WhatsApp
                      </Button>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    API REST
                  </CardTitle>
                  <CardDescription>
                    Integre o agente em qualquer sistema via API
                  </CardDescription>
                </div>
                <Badge className="bg-green-500/20 text-green-700">Disponível</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key */}
              <div>
                <Label className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Chave de API
                </Label>
                <div className="flex gap-2 mt-2">
                  {isLoadingApiKey ? (
                    <Skeleton className="h-10 flex-1" />
                  ) : (
                    <Input 
                      type={showApiKey ? 'text' : 'password'} 
                      value={apiKey || 'Nenhuma chave gerada'} 
                      readOnly 
                      className="font-mono"
                    />
                  )}
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                    title={showApiKey ? 'Ocultar' : 'Mostrar'}
                  >
                    {showApiKey ? '👁️' : '👁️‍🗨️'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => apiKey && handleCopy(apiKey, 'apikey')}
                    disabled={!apiKey}
                  >
                    {copied === 'apikey' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleGenerateApiKey}
                    disabled={generateApiKey.isPending}
                    title="Gerar nova chave"
                  >
                    {generateApiKey.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ⚠️ Mantenha sua chave de API em segurança. Não compartilhe publicamente.
                </p>
              </div>

              {/* Endpoint */}
              <div>
                <Label>Endpoint</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={endpoint} readOnly className="font-mono text-sm" />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleCopy(endpoint, 'endpoint')}
                  >
                    {copied === 'endpoint' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Exemplo cURL */}
              <div>
                <Label>Exemplo de Requisição (cURL)</Label>
                <div className="relative mt-2">
                  <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto max-h-48">
                    <code>{apiExample}</code>
                  </pre>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(apiExample, 'curl')}
                  >
                    {copied === 'curl' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Webhook */}
              <div className="pt-4 border-t">
                <Label className="flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  Webhook (opcional)
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Receba notificações de eventos do agente em tempo real
                </p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://seu-sistema.com/webhook" 
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <Button 
                    variant="outline"
                    onClick={handleSaveWebhook}
                    disabled={updateConfig.isPending}
                  >
                    {updateConfig.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label>Exemplo de Payload do Webhook</Label>
                <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto mt-2 max-h-48">
                  <code>{webhookExample}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Documentação */}
      <Card>
        <CardHeader>
          <CardTitle>Documentação</CardTitle>
          <CardDescription>
            Acesse a documentação completa da API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" asChild>
            <a href="/documentation" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Documentação da API
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
