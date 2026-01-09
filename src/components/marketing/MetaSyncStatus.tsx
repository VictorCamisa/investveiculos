import { RefreshCw, CheckCircle, XCircle, Clock, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MetaSyncLog } from '@/types/meta-ads';

interface MetaSyncStatusProps {
  syncLogs: MetaSyncLog[];
  isLoading: boolean;
  isSyncing: boolean;
  onSync: () => void;
}

export default function MetaSyncStatus({ syncLogs, isLoading, isSyncing, onSync }: MetaSyncStatusProps) {
  const lastSync = syncLogs[0];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'failed':
        return 'Falhou';
      case 'in_progress':
        return 'Em andamento';
      default:
        return 'Pendente';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Concluída</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Em andamento</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Status da Conexão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Status da Conexão
          </CardTitle>
          <Button
            onClick={onSync}
            disabled={isSyncing}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {lastSync ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(lastSync.status)}
                <span className="text-sm">Última sincronização</span>
              </div>
              {getStatusBadge(lastSync.status)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Campanhas</p>
                <p className="font-medium">{lastSync.campaigns_synced}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Conjuntos</p>
                <p className="font-medium">{lastSync.adsets_synced}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Anúncios</p>
                <p className="font-medium">{lastSync.ads_synced}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Métricas</p>
                <p className="font-medium">{lastSync.insights_synced}</p>
              </div>
            </div>

            {lastSync.completed_at && (
              <p className="text-xs text-muted-foreground">
                Concluída {formatDistanceToNow(parseISO(lastSync.completed_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </p>
            )}

            {lastSync.error_message && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{lastSync.error_message}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>Nenhuma sincronização realizada ainda.</p>
            <p className="text-sm">Clique em "Sincronizar" para começar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
