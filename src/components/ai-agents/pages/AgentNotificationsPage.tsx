import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Bell, 
  Mail, 
  MessageSquare, 
  AlertTriangle, 
  Edit, 
  Trash2,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Shield,
  BellOff,
  Settings
} from 'lucide-react';
import { 
  useAIAgentNotifications,
  useDeleteNotification,
  useToggleNotification,
  CONDITION_TYPES,
  NOTIFICATION_CHANNELS
} from '@/hooks/useAIAgentNotifications';
import { NotificationFormDialog } from '../forms/NotificationFormDialog';
import { AIAgentNotification } from '@/types/ai-agents';

export default function AgentNotificationsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: notifications, isLoading } = useAIAgentNotifications(agentId);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<AIAgentNotification | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<AIAgentNotification | null>(null);

  const deleteMutation = useDeleteNotification();
  const toggleMutation = useToggleNotification();

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

  const getConditionColor = (type: string) => {
    switch (type) {
      case 'low_lead_score': return 'text-yellow-500 bg-yellow-500/10';
      case 'high_lead_score': return 'text-green-500 bg-green-500/10';
      case 'api_error': return 'text-red-500 bg-red-500/10';
      case 'timeout': return 'text-orange-500 bg-orange-500/10';
      case 'human_request': return 'text-blue-500 bg-blue-500/10';
      case 'guardrail_violation': return 'text-purple-500 bg-purple-500/10';
      case 'conversation_escalation': return 'text-pink-500 bg-pink-500/10';
      case 'daily_summary': return 'text-gray-500 bg-gray-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
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

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'text-blue-600 bg-blue-500/10';
      case 'whatsapp': return 'text-green-600 bg-green-500/10';
      case 'slack': return 'text-purple-600 bg-purple-500/10';
      default: return 'text-gray-600 bg-gray-500/10';
    }
  };

  const renderConditionDescription = (notification: AIAgentNotification) => {
    const config = notification.condition_config as Record<string, any> || {};
    
    switch (notification.condition_type) {
      case 'low_lead_score':
        return `Lead Score < ${config.threshold || 40} após ${config.min_interactions || 3} interações`;
      case 'high_lead_score':
        return `Lead Score > ${config.threshold || 85}`;
      case 'api_error':
        return 'Qualquer erro de API ou timeout';
      case 'timeout':
        return 'Operação excedeu tempo limite';
      case 'human_request':
        const keywords = config.keywords || ['atendente', 'humano'];
        return `Palavras-chave: ${keywords.slice(0, 3).join(', ')}${keywords.length > 3 ? '...' : ''}`;
      case 'guardrail_violation':
        return 'Quando uma guardrail é acionada';
      case 'conversation_escalation':
        return 'Conversa precisa de intervenção';
      case 'daily_summary':
        return `Enviado às ${config.send_time || '18:00'}`;
      default:
        return notification.condition_type;
    }
  };

  const handleEdit = (notification: AIAgentNotification) => {
    setEditingNotification(notification);
    setDialogOpen(true);
  };

  const handleDelete = (notification: AIAgentNotification) => {
    setNotificationToDelete(notification);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (notificationToDelete && agentId) {
      deleteMutation.mutate({ id: notificationToDelete.id, agentId });
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
    }
  };

  const handleToggle = (notification: AIAgentNotification) => {
    if (agentId) {
      toggleMutation.mutate({
        id: notification.id,
        agentId,
        is_active: !notification.is_active,
      });
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingNotification(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Agrupar notificações por canal
  const groupedByChannel = notifications?.reduce((acc, n) => {
    const channel = n.channel;
    if (!acc[channel]) acc[channel] = [];
    acc[channel].push(n);
    return acc;
  }, {} as Record<string, AIAgentNotification[]>) || {};

  // Stats
  const stats = {
    total: notifications?.length || 0,
    active: notifications?.filter(n => n.is_active).length || 0,
    inactive: notifications?.filter(n => !n.is_active).length || 0,
    channels: Object.keys(groupedByChannel).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuração de Notificações</h2>
          <p className="text-muted-foreground">
            Configure alertas para intervenção humana ou anomalias
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Notificação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Bell className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-500/10">
                <BellOff className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inactive}</p>
                <p className="text-sm text-muted-foreground">Inativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Settings className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.channels}</p>
                <p className="text-sm text-muted-foreground">Canais</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {notifications?.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma notificação configurada</h3>
            <p className="text-muted-foreground mb-4">
              Configure alertas para saber quando o agente precisa de atenção
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Notificação
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Notificações por Canal */}
      {Object.entries(groupedByChannel).map(([channel, channelNotifications]) => {
        const ChannelIcon = getChannelIcon(channel);
        const channelInfo = NOTIFICATION_CHANNELS.find(c => c.value === channel);
        
        return (
          <Card key={channel}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getChannelColor(channel)}`}>
                  <ChannelIcon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{channelInfo?.label || channel}</CardTitle>
                  <CardDescription>
                    {channelNotifications.length} notificação(ões) configurada(s)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {channelNotifications.map((notification) => {
                const ConditionIcon = getConditionIcon(notification.condition_type);
                const conditionInfo = CONDITION_TYPES.find(c => c.value === notification.condition_type);
                const channelConfig = notification.channel_config as Record<string, any> || {};
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${!notification.is_active ? 'opacity-60 bg-muted/50' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getConditionColor(notification.condition_type)}`}>
                          <ConditionIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{conditionInfo?.label || notification.condition_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {renderConditionDescription(notification)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {channelConfig.priority && (
                          <Badge 
                            variant="outline" 
                            className={
                              channelConfig.priority === 'urgent' ? 'border-red-500 text-red-500' :
                              channelConfig.priority === 'high' ? 'border-orange-500 text-orange-500' :
                              ''
                            }
                          >
                            {channelConfig.priority === 'urgent' ? 'Urgente' :
                             channelConfig.priority === 'high' ? 'Alta' :
                             channelConfig.priority === 'normal' ? 'Normal' : 'Baixa'}
                          </Badge>
                        )}
                        <Switch 
                          checked={notification.is_active ?? true}
                          onCheckedChange={() => handleToggle(notification)}
                        />
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(notification)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(notification)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Dialog de Formulário */}
      {agentId && (
        <NotificationFormDialog
          agentId={agentId}
          notification={editingNotification}
          open={dialogOpen}
          onOpenChange={handleDialogClose}
        />
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Notificação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
