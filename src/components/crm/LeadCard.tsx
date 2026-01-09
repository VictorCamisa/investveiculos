import { Phone, Mail, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Lead } from '@/types/crm';
import { leadStatusLabels, leadSourceLabels, leadStatusColors } from '@/types/crm';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  compact?: boolean;
}

export function LeadCard({ lead, onClick, compact = false }: LeadCardProps) {
  if (compact) {
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow bg-card"
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm truncate">{lead.name}</h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{lead.phone}</span>
              </div>
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{lead.phone}</span>
        </div>
        
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
