import { useState } from 'react';
import { useActivityLogs } from '@/hooks/useUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Loader2, FileText, Pencil, Trash2, Eye, Download, LogIn, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ACTION_ICONS: Record<string, React.ElementType> = {
  login: LogIn,
  create: FileText,
  update: Pencil,
  delete: Trash2,
  view: Eye,
  export: Download,
};

const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  create: 'Criou',
  update: 'Editou',
  delete: 'Excluiu',
  view: 'Visualizou',
  export: 'Exportou',
};

const ENTITY_LABELS: Record<string, string> = {
  lead: 'Lead',
  vehicle: 'Veículo',
  sale: 'Venda',
  customer: 'Cliente',
  user: 'Usuário',
  campaign: 'Campanha',
  negotiation: 'Negociação',
  commission: 'Comissão',
  system: 'Sistema',
};

export function ActivityLogsPage() {
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const { data: logs, isLoading } = useActivityLogs({
    entityType: entityFilter !== 'all' ? entityFilter : undefined,
    limit: 200,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Atividades
        </CardTitle>
        <CardDescription>
          Acompanhe todas as ações realizadas no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[600px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((log) => {
                const Icon = ACTION_ICONS[log.action] || FileText;
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="p-2 rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {log.user_profile?.full_name || 'Usuário desconhecido'}
                        </p>
                        <span className="text-muted-foreground text-sm">
                          {ACTION_LABELS[log.action] || log.action}{' '}
                          {ENTITY_LABELS[log.entity_type] || log.entity_type}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-sm text-muted-foreground truncate">
                          {JSON.stringify(log.details)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(log.created_at), "dd 'de' MMMM 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma atividade registrada</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
