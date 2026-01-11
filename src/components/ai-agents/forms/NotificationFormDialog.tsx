import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, MessageSquare, Zap, Clock, AlertTriangle, TrendingUp, TrendingDown, Users, Shield } from 'lucide-react';
import { AIAgentNotification } from '@/types/ai-agents';
import { 
  CONDITION_TYPES, 
  NOTIFICATION_CHANNELS, 
  NOTIFICATION_TEMPLATES,
  useCreateNotification, 
  useUpdateNotification 
} from '@/hooks/useAIAgentNotifications';

interface NotificationFormDialogProps {
  agentId: string;
  notification?: AIAgentNotification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getConditionIcon = (type: string) => {
  switch (type) {
    case 'low_lead_score': return TrendingDown;
    case 'high_lead_score': return TrendingUp;
    case 'api_error': return AlertTriangle;
    case 'timeout': return Clock;
    case 'human_request': return Users;
    case 'guardrail_violation': return Shield;
    case 'conversation_escalation': return Zap;
    case 'daily_summary': return Bell;
    default: return Bell;
  }
};

const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'email': return Mail;
    case 'whatsapp': return MessageSquare;
    case 'slack': return Zap;
    default: return Bell;
  }
};

export function NotificationFormDialog({ agentId, notification, open, onOpenChange }: NotificationFormDialogProps) {
  const [tab, setTab] = useState<'templates' | 'custom'>('templates');
  const [conditionType, setConditionType] = useState('low_lead_score');
  const [channel, setChannel] = useState('email');
  const [isActive, setIsActive] = useState(true);
  
  // Configurações do canal
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [slackWebhook, setSlackWebhook] = useState('');
  const [priority, setPriority] = useState('normal');
  
  // Configurações da condição
  const [threshold, setThreshold] = useState('40');
  const [minInteractions, setMinInteractions] = useState('3');
  const [sendTime, setSendTime] = useState('18:00');
  const [keywords, setKeywords] = useState('atendente, humano, pessoa');
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeConversations, setIncludeConversations] = useState(true);

  const createMutation = useCreateNotification();
  const updateMutation = useUpdateNotification();

  const isEditing = !!notification;

  useEffect(() => {
    if (notification) {
      setTab('custom');
      setConditionType(notification.condition_type);
      setChannel(notification.channel);
      setIsActive(notification.is_active ?? true);
      
      // Carregar config do canal
      const channelConfig = notification.channel_config as Record<string, any> || {};
      setEmail(channelConfig.email || '');
      setPhone(channelConfig.phone || '');
      setSlackWebhook(channelConfig.webhook || '');
      setPriority(channelConfig.priority || 'normal');
      
      // Carregar config da condição
      const conditionConfig = notification.condition_config as Record<string, any> || {};
      setThreshold(String(conditionConfig.threshold || 40));
      setMinInteractions(String(conditionConfig.min_interactions || 3));
      setSendTime(conditionConfig.send_time || '18:00');
      setKeywords((conditionConfig.keywords || []).join(', '));
      setIncludeMetrics(conditionConfig.include_metrics ?? true);
      setIncludeConversations(conditionConfig.include_conversations ?? true);
    } else {
      resetForm();
    }
  }, [notification, open]);

  const resetForm = () => {
    setTab('templates');
    setConditionType('low_lead_score');
    setChannel('email');
    setIsActive(true);
    setEmail('');
    setPhone('');
    setSlackWebhook('');
    setPriority('normal');
    setThreshold('40');
    setMinInteractions('3');
    setSendTime('18:00');
    setKeywords('atendente, humano, pessoa');
    setIncludeMetrics(true);
    setIncludeConversations(true);
  };

  const handleTemplateSelect = (template: typeof NOTIFICATION_TEMPLATES[0]) => {
    setConditionType(template.condition_type);
    setChannel(template.channel);
    
    const config = template.condition_config as Record<string, any>;
    if (config.threshold) setThreshold(String(config.threshold));
    if (config.min_interactions) setMinInteractions(String(config.min_interactions));
    if (config.keywords) setKeywords(config.keywords.join(', '));
    if (config.send_time) setSendTime(config.send_time);
    if (config.include_metrics !== undefined) setIncludeMetrics(config.include_metrics);
    if (config.include_conversations !== undefined) setIncludeConversations(config.include_conversations);
    
    const channelConfig = template.channel_config as Record<string, any>;
    if (channelConfig.priority) setPriority(channelConfig.priority);
    
    setTab('custom');
  };

  const buildConditionConfig = () => {
    switch (conditionType) {
      case 'low_lead_score':
        return { threshold: Number(threshold), min_interactions: Number(minInteractions), operator: '<' };
      case 'high_lead_score':
        return { threshold: Number(threshold), operator: '>' };
      case 'api_error':
      case 'timeout':
        return { include_timeout: true };
      case 'human_request':
        return { keywords: keywords.split(',').map(k => k.trim()) };
      case 'guardrail_violation':
      case 'conversation_escalation':
        return { auto_escalate: true };
      case 'daily_summary':
        return { send_time: sendTime, include_metrics: includeMetrics, include_conversations: includeConversations };
      default:
        return {};
    }
  };

  const buildChannelConfig = () => {
    const config: Record<string, any> = { priority };
    
    switch (channel) {
      case 'email':
        if (email) config.email = email;
        break;
      case 'whatsapp':
        if (phone) config.phone = phone;
        break;
      case 'slack':
        if (slackWebhook) config.webhook = slackWebhook;
        break;
    }
    
    if (conditionType === 'daily_summary') {
      config.send_time = sendTime;
    }
    
    return config;
  };

  const handleSubmit = () => {
    const data = {
      agent_id: agentId,
      condition_type: conditionType,
      channel,
      is_active: isActive,
      condition_config: buildConditionConfig(),
      channel_config: buildChannelConfig(),
    };

    if (isEditing && notification) {
      updateMutation.mutate({ id: notification.id, agentId, ...data }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const conditionInfo = CONDITION_TYPES.find(c => c.value === conditionType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Notificação' : 'Nova Notificação'}</DialogTitle>
          <DialogDescription>
            Configure alertas para eventos importantes do agente
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="custom">Personalizado</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-3">
              {NOTIFICATION_TEMPLATES.map((template) => {
                const Icon = getConditionIcon(template.condition_type);
                const ChannelIcon = getChannelIcon(template.channel);
                const info = CONDITION_TYPES.find(c => c.value === template.condition_type);
                
                return (
                  <Card
                    key={template.name}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-${info?.color || 'gray'}-500/10`}>
                            <Icon className={`h-5 w-5 text-${info?.color || 'gray'}-500`} />
                          </div>
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-sm text-muted-foreground">{info?.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <ChannelIcon className="h-3 w-3" />
                          {NOTIFICATION_CHANNELS.find(c => c.value === template.channel)?.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            {/* Tipo de Condição */}
            <div className="space-y-2">
              <Label>Tipo de Alerta</Label>
              <Select value={conditionType} onValueChange={setConditionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_TYPES.map((type) => {
                    const Icon = getConditionIcon(type.value);
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {conditionInfo && (
                <p className="text-sm text-muted-foreground">{conditionInfo.description}</p>
              )}
            </div>

            {/* Configurações específicas da condição */}
            {(conditionType === 'low_lead_score' || conditionType === 'high_lead_score') && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Threshold do Score</Label>
                  <Input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    min={0}
                    max={100}
                  />
                </div>
                {conditionType === 'low_lead_score' && (
                  <div className="space-y-2">
                    <Label>Mínimo de Interações</Label>
                    <Input
                      type="number"
                      value={minInteractions}
                      onChange={(e) => setMinInteractions(e.target.value)}
                      min={1}
                    />
                  </div>
                )}
              </div>
            )}

            {conditionType === 'human_request' && (
              <div className="space-y-2">
                <Label>Palavras-chave (separadas por vírgula)</Label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="atendente, humano, pessoa"
                />
              </div>
            )}

            {conditionType === 'daily_summary' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Horário de Envio</Label>
                  <Select value={sendTime} onValueChange={setSendTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="08:00">08:00</SelectItem>
                      <SelectItem value="12:00">12:00</SelectItem>
                      <SelectItem value="18:00">18:00</SelectItem>
                      <SelectItem value="20:00">20:00</SelectItem>
                      <SelectItem value="22:00">22:00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Incluir Métricas</Label>
                  <Switch checked={includeMetrics} onCheckedChange={setIncludeMetrics} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Incluir Conversas</Label>
                  <Switch checked={includeConversations} onCheckedChange={setIncludeConversations} />
                </div>
              </div>
            )}

            {/* Canal de Notificação */}
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_CHANNELS.map((ch) => {
                    const Icon = getChannelIcon(ch.value);
                    return (
                      <SelectItem key={ch.value} value={ch.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {ch.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Configurações específicas do canal */}
            {channel === 'email' && (
              <div className="space-y-2">
                <Label>E-mail (opcional, usa o padrão se vazio)</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gestor@loja.com.br"
                />
              </div>
            )}

            {channel === 'whatsapp' && (
              <div className="space-y-2">
                <Label>WhatsApp (opcional)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            )}

            {channel === 'slack' && (
              <div className="space-y-2">
                <Label>Webhook do Slack</Label>
                <Input
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>
            )}

            {/* Prioridade */}
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Ativar Notificação</Label>
                <p className="text-sm text-muted-foreground">A notificação começará a funcionar imediatamente</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Notificação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
