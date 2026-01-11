import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Bell, Mail, MessageSquare, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { useAIAgentNotifications } from '@/hooks/useAIAgents';
import { NOTIFICATION_CHANNELS } from '@/types/ai-agents';

export default function AgentNotificationsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: notifications, isLoading } = useAIAgentNotifications(agentId);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return Mail;
      case 'whatsapp': return MessageSquare;
      default: return Bell;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuração de Notificações</h2>
          <p className="text-muted-foreground">
            Configure alertas para intervenção humana ou anomalias
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Notificação
        </Button>
      </div>

      {/* Canais de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle>Canais de Notificação</CardTitle>
          <CardDescription>
            Configure os canais por onde você receberá alertas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">E-mail</p>
                <p className="text-sm text-muted-foreground">gestor@loja.com.br</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-green-500/20 text-green-700">Configurado</Badge>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">WhatsApp</p>
                <p className="text-sm text-muted-foreground">(11) 99999-9999</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-green-500/20 text-green-700">Configurado</Badge>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-dashed">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Slack</p>
                <p className="text-sm text-muted-foreground">Não configurado</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Configurar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Regras de Alerta */}
      <Card>
        <CardHeader>
          <CardTitle>Regras de Alerta</CardTitle>
          <CardDescription>
            Defina quando você deve ser notificado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alerta 1 */}
          <div className="p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Lead Score Baixo</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked />
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm text-muted-foreground">Condição</Label>
                <p className="text-sm">Lead Score {'<'} 40 após 3 interações</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Canais</Label>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline"><Mail className="h-3 w-3 mr-1" />E-mail</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Alerta 2 */}
          <div className="p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="font-medium">Erro na Chamada de API</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked />
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm text-muted-foreground">Condição</Label>
                <p className="text-sm">Qualquer erro de API ou timeout</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Canais</Label>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline"><Mail className="h-3 w-3 mr-1" />E-mail</Badge>
                  <Badge variant="outline"><MessageSquare className="h-3 w-3 mr-1" />WhatsApp</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Alerta 3 */}
          <div className="p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Solicitação de Humano</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked />
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm text-muted-foreground">Condição</Label>
                <p className="text-sm">Usuário pede para falar com atendente</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Canais</Label>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline"><MessageSquare className="h-3 w-3 mr-1" />WhatsApp</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Alerta 4 */}
          <div className="p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-green-500" />
                <span className="font-medium">Lead Quente Identificado</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked />
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm text-muted-foreground">Condição</Label>
                <p className="text-sm">Lead Score {'>'} 85</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Canais</Label>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline"><MessageSquare className="h-3 w-3 mr-1" />WhatsApp</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Diário */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Resumo Diário</CardTitle>
              <CardDescription>
                Receba um resumo diário das atividades do agente
              </CardDescription>
            </div>
            <Switch defaultChecked />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Horário de Envio</Label>
              <Select defaultValue="18:00">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="08:00">08:00</SelectItem>
                  <SelectItem value="12:00">12:00</SelectItem>
                  <SelectItem value="18:00">18:00</SelectItem>
                  <SelectItem value="20:00">20:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Canal</Label>
              <Select defaultValue="email">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
