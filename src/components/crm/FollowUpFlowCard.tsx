import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { triggerTypeLabels, daysOfWeekLabels } from '@/types/followUp';
import { leadStatusLabels, leadSourceLabels } from '@/types/crm';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Clock, 
  Filter, 
  MessageSquare,
  Calendar,
  Users,
} from 'lucide-react';
import { useState } from 'react';

interface FollowUpFlow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  target_lead_status: string[] | null;
  target_lead_sources: string[] | null;
  trigger_type: string;
  delay_days: number | null;
  delay_hours: number | null;
  days_of_week: number[] | null;
  message_template: string;
  max_contacts_per_lead: number | null;
  priority: number;
  created_at: string;
}

interface FollowUpFlowCardProps {
  flow: FollowUpFlow;
  onEdit: (flow: FollowUpFlow) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, is_active: boolean) => void;
}

export function FollowUpFlowCard({
  flow,
  onEdit,
  onDelete,
  onToggle,
}: FollowUpFlowCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getTimingDescription = () => {
    const parts: string[] = [];
    const triggerLabel = triggerTypeLabels[flow.trigger_type as keyof typeof triggerTypeLabels] || flow.trigger_type;
    parts.push(triggerLabel);

    if (flow.delay_days || flow.delay_hours) {
      const delays: string[] = [];
      if (flow.delay_days) delays.push(`${flow.delay_days}d`);
      if (flow.delay_hours) delays.push(`${flow.delay_hours}h`);
      parts.push(`após ${delays.join(' ')}`);
    }

    if (flow.trigger_type === 'scheduled' && flow.days_of_week?.length) {
      const days = flow.days_of_week
        .sort()
        .map((d) => daysOfWeekLabels[d]?.substring(0, 3))
        .join(', ');
      parts.push(`(${days})`);
    }

    return parts.join(' ');
  };

  const getSegmentationSummary = () => {
    const segments: string[] = [];

    if (flow.target_lead_status?.length) {
      const statuses = flow.target_lead_status
        .slice(0, 2)
        .map((s) => leadStatusLabels[s as keyof typeof leadStatusLabels] || s)
        .join(', ');
      segments.push(statuses + (flow.target_lead_status.length > 2 ? '...' : ''));
    }

    if (flow.target_lead_sources?.length) {
      const sources = flow.target_lead_sources
        .slice(0, 2)
        .map((s) => leadSourceLabels[s as keyof typeof leadSourceLabels] || s)
        .join(', ');
      segments.push(sources + (flow.target_lead_sources.length > 2 ? '...' : ''));
    }

    return segments.length ? segments.join(' • ') : 'Todos os leads';
  };

  return (
    <>
      <Card className={`transition-all ${!flow.is_active ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{flow.name}</h3>
                <Badge variant={flow.is_active ? 'default' : 'secondary'}>
                  {flow.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
                {flow.priority > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Prioridade {flow.priority}
                  </Badge>
                )}
              </div>
              {flow.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {flow.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={flow.is_active}
                onCheckedChange={(checked) => onToggle(flow.id, checked)}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(flow)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{getTimingDescription()}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="truncate">{getSegmentationSummary()}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Máx. {flow.max_contacts_per_lead || 5} contatos/lead</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{new Date(flow.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground line-clamp-2">
                {flow.message_template}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fluxo de follow-up?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O fluxo "{flow.name}" será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(flow.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
