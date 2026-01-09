import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, CheckCircle2, Phone, Clock } from 'lucide-react';
import { usePendingFollowUps, useCompleteFollowUp } from '@/hooks/useLeadInteractions';
import { format, isToday, isPast, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FollowUpAlertsProps {
  onLeadClick?: (leadId: string) => void;
}

export function FollowUpAlerts({ onLeadClick }: FollowUpAlertsProps) {
  const { data: followUps = [], isLoading } = usePendingFollowUps();
  const completeFollowUp = useCompleteFollowUp();

  const getUrgencyBadge = (date: string) => {
    const followUpDate = new Date(date);
    if (isPast(followUpDate) && !isToday(followUpDate)) {
      return <Badge variant="destructive" className="text-xs">Atrasado</Badge>;
    }
    if (isToday(followUpDate)) {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Hoje</Badge>;
    }
    if (isTomorrow(followUpDate)) {
      return <Badge variant="outline" className="text-xs">Amanhã</Badge>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Follow-ups Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (followUps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Follow-ups Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
            <p className="text-sm">Nenhum follow-up pendente</p>
            <p className="text-xs">Você está em dia!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Follow-ups Pendentes
          </CardTitle>
          <Badge variant="secondary">{followUps.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-1 p-4 pt-0">
            {followUps.map((followUp: {
              id: string;
              description: string;
              follow_up_date: string;
              lead?: { id: string; name: string; phone: string };
            }) => (
              <div 
                key={followUp.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => followUp.lead && onLeadClick?.(followUp.lead.id)}
                      className="font-medium text-sm hover:text-primary truncate"
                    >
                      {followUp.lead?.name || 'Lead não encontrado'}
                    </button>
                    {followUp.follow_up_date && getUrgencyBadge(followUp.follow_up_date)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {followUp.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {followUp.lead?.phone && (
                      <a 
                        href={`tel:${followUp.lead.phone}`}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                      >
                        <Phone className="h-3 w-3" />
                        {followUp.lead.phone}
                      </a>
                    )}
                    {followUp.follow_up_date && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(followUp.follow_up_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={() => completeFollowUp.mutate(followUp.id)}
                  title="Marcar como concluído"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
