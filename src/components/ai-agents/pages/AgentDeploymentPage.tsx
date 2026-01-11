import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  MessageSquare, 
  Code, 
  Copy, 
  Check,
  ExternalLink,
  Webhook,
  Key,
  RefreshCw
} from 'lucide-react';
import { useAIAgent } from '@/hooks/useAIAgents';
import { toast } from 'sonner';

export default function AgentDeploymentPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: agent } = useAIAgent(agentId);
  const [copied, setCopied] = useState<string | null>(null);

  const embedCode = `<!-- Widget de Chat IA -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['AIChat']=o;w[o]=w[o]||function(){
    (w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','aichat','https://seu-dominio.com/widget.js'));
  aichat('init', { agentId: '${agentId}' });
</script>`;

  const webhookExample = `{
  "event": "message",
  "session_id": "abc123",
  "message": {
    "role": "user",
    "content": "Quero saber sobre o Virtus"
  }
}`;

  const apiExample = `curl -X POST https://rugbunseyblzapwzevqh.supabase.co/functions/v1/ai-agent-chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
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
            <Badge className={agent?.status === 'active' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'}>
              {agent?.status === 'active' ? '● Ativo' : '○ Inativo'}
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
            <Switch checked={agent?.status === 'active'} />
          </div>
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
            <CardContent className="space-y-4">
              <div>
                <Label>Código de Incorporação</Label>
                <div className="relative mt-2">
                  <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
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

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Cor do Widget</Label>
                  <Input type="color" defaultValue="#6366f1" className="h-10 w-full" />
                </div>
                <div>
                  <Label>Posição</Label>
                  <select className="w-full h-10 rounded-md border bg-background px-3">
                    <option value="bottom-right">Inferior Direito</option>
                    <option value="bottom-left">Inferior Esquerdo</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Mostrar avatar do agente</span>
                <Switch defaultChecked />
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
                <Badge variant="outline">Requer Configuração</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Para ativar a integração com WhatsApp, você precisa ter uma instância configurada no módulo WhatsApp.
                </p>
              </div>

              <div>
                <Label>Selecionar Instância</Label>
                <select className="w-full h-10 rounded-md border bg-background px-3 mt-2">
                  <option value="">Selecione uma instância...</option>
                  <option value="principal">Instância Principal (11) 99999-9999</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Responder automaticamente</span>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Horário de funcionamento</span>
                <span className="text-sm text-muted-foreground">08:00 - 18:00</span>
              </div>

              <Button className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Conectar ao WhatsApp
              </Button>
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
                  <Input type="password" value="sk_live_xxxxxxxxxxxxxxxxxxxx" readOnly />
                  <Button variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Endpoint */}
              <div>
                <Label>Endpoint</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    value="https://rugbunseyblzapwzevqh.supabase.co/functions/v1/ai-agent-chat" 
                    readOnly 
                  />
                  <Button variant="outline" size="icon" onClick={() => handleCopy('https://rugbunseyblzapwzevqh.supabase.co/functions/v1/ai-agent-chat', 'endpoint')}>
                    {copied === 'endpoint' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Exemplo cURL */}
              <div>
                <Label>Exemplo de Requisição (cURL)</Label>
                <div className="relative mt-2">
                  <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
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
              <div>
                <Label className="flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  Webhook (opcional)
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Receba notificações de eventos do agente
                </p>
                <Input placeholder="https://seu-sistema.com/webhook" />
              </div>

              <div>
                <Label>Exemplo de Payload do Webhook</Label>
                <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto mt-2">
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
          <Button variant="outline" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Documentação da API
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
