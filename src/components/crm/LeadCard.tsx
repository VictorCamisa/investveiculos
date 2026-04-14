import { Phone, Mail, Calendar, User, MessageCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Lead } from '@/types/crm';
import { leadStatusLabels, leadSourceLabels, leadStatusColors } from '@/types/crm';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { LeadInteractionSummary } from '@/hooks/useLeadInteractionSummary';

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  compact?: boolean;
  interactionSummary?: LeadInteractionSummary;
}

export function LeadCard({ lead, onClick, compact = false, interactionSummary }: LeadCardProps) {
  if (compact) {
    return (
      <Card 
        className={cn(
          "cursor-pointer hover:shadow-md transition-shadow bg-card",
          interactionSummary?.has_unanswered && "ring-1 ring-orange-400/60 dark:ring-orange-500/40"
        )}
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm truncate">{lead.name}</h4>
              {lead.phone && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-medium text-foreground">{lead.phone}</span>
                </div>
              )}
            </div>
            <Badge className={cn("text-xs shrink-0", leadStatusColors[lead.status])}>
              {leadStatusLabels[lead.status]}
            </Badge>
          </div>

          {lead.vehicle_interest && (
            <p className="text-xs text-muted-foreground truncate">
              {lead.vehicle_interest}
            </p>
          )}

          {/* Interaction details */}
          {interactionSummary && interactionSummary.total_messages > 0 && (
            <div className="flex flex-col gap-1 pt-1 border-t border-border/40">
              {/* Unanswered indicator */}
              {interactionSummary.has_unanswered && (
                <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium">
                  <AlertCircle className="h-3 w-3" />
                  <span>Mensagem sem resposta</span>
                </div>
              )}

              {/* Last message time */}
              {interactionSummary.last_message_at && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageCircle className="h-3 w-3" />
                  <span>
                    Última msg: {formatDistanceToNow(new Date(interactionSummary.last_message_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              )}

              {/* First contact date */}
              {interactionSummary.total_messages > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{interactionSummary.total_messages} mensagens trocadas</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {leadSourceLabels[lead.source]}
            </Badge>
            <span>
              {formatDistanceToNow(new Date(lead.updated_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{lead.name}</h3>
            <Badge variant="outline" className="mt-1">
              {leadSourceLabels[lead.source]}
            </Badge>
          </div>
          <Badge className={leadStatusColors[lead.status]}>
            {leadStatusLabels[lead.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {lead.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{lead.phone}</span>
          </div>
        )}
        
        {lead.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}

        {lead.vehicle_interest && (
          <p className="text-sm text-muted-foreground">
            <strong>Interesse:</strong> {lead.vehicle_interest}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          {lead.assigned_profile?.full_name && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{lead.assigned_profile.full_name}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(lead.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
