import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, AlertTriangle, CheckCircle, Info, X, 
  Eye, Trash2, RefreshCw, Filter 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { alertTypeLabels, type MarketingAlert } from '@/types/marketing-module';

const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertTriangle,
};

const severityColors = {
  info: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  warning: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  critical: 'text-red-600 bg-red-50 dark:bg-red-900/20',
};

export function MarketingAlertsCenter() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const queryClient = useQueryClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type AnyData = any;

  // Fetch alerts
  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['marketing-alerts', filter],
    queryFn: async () => {
      let query = (supabase as AnyData)
        .from('marketing_alerts')
        .select('*')
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      } else if (filter === 'critical') {
        query = query.eq('severity', 'critical');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MarketingAlert[];
    },
  });

  // Mark as read mutation
  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as AnyData)
        .from('marketing_alerts')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-alerts'] });
    },
  });

  // Dismiss mutation
  const dismissAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as AnyData)
        .from('marketing_alerts')
        .update({ is_dismissed: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-alerts'] });
      toast.success('Alerta removido');
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as AnyData)
        .from('marketing_alerts')
        .update({ is_read: true })
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-alerts'] });
      toast.success('Todos marcados como lidos');
    },
  });

  const unreadCount = alerts?.filter(a => !a.is_read).length || 0;
  const criticalCount = alerts?.filter(a => a.severity === 'critical').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Central de Alertas</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} não lidos` : 'Nenhum alerta pendente'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={() => markAllAsRead.mutate()}>
              <Eye className="h-4 w-4 mr-2" />
              Marcar tudo como lido
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card 
          className={cn('cursor-pointer', filter === 'all' && 'ring-2 ring-primary')}
          onClick={() => setFilter('all')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{alerts?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card 
          className={cn('cursor-pointer', filter === 'unread' && 'ring-2 ring-primary')}
          onClick={() => setFilter('unread')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{unreadCount}</p>
            <p className="text-xs text-muted-foreground">Não lidos</p>
          </CardContent>
        </Card>
        <Card 
          className={cn('cursor-pointer', filter === 'critical' && 'ring-2 ring-primary')}
          onClick={() => setFilter('critical')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
            <p className="text-xs text-muted-foreground">Críticos</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : alerts && alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const Icon = severityIcons[alert.severity];
                
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'p-4 rounded-lg border flex items-start gap-3 transition-colors',
                      severityColors[alert.severity],
                      !alert.is_read && 'ring-1 ring-primary/20'
                    )}
                    onClick={() => !alert.is_read && markAsRead.mutate(alert.id)}
                  >
                    <Icon className={cn(
                      'h-5 w-5 mt-0.5 flex-shrink-0',
                      alert.severity === 'critical' && 'text-red-600',
                      alert.severity === 'warning' && 'text-yellow-600',
                      alert.severity === 'info' && 'text-blue-600'
                    )} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm opacity-80">{alert.message}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissAlert.mutate(alert.id);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {alertTypeLabels[alert.alert_type] || alert.alert_type}
                        </Badge>
                        <span className="text-xs opacity-60">
                          {formatDistanceToNow(new Date(alert.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                        {!alert.is_read && (
                          <Badge variant="default" className="text-xs">Novo</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-success mb-3" />
              <p className="text-muted-foreground">Nenhum alerta no momento</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
