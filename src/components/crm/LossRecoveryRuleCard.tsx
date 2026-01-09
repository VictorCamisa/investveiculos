import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
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
import { 
  MoreVertical, 
  Pencil, 
  Trash2, 
  MessageCircle, 
  Bell, 
  Calendar, 
  UserCheck,
  Clock,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import { LossRecoveryRule, ActionType, actionTypeLabels } from '@/hooks/useLossRecoveryRules';
import { lossReasonLabels, LossReasonType } from '@/types/negotiations';

interface LossRecoveryRuleCardProps {
  rule: LossRecoveryRule;
  onEdit: (rule: LossRecoveryRule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, is_active: boolean) => void;
}

const actionIcons: Record<ActionType, React.ReactNode> = {
  whatsapp_message: <MessageCircle className="h-4 w-4" />,
  create_vehicle_alert: <Bell className="h-4 w-4" />,
  schedule_follow_up: <Calendar className="h-4 w-4" />,
  notify_manager: <UserCheck className="h-4 w-4" />,
};

export function LossRecoveryRuleCard({ rule, onEdit, onDelete, onToggle }: LossRecoveryRuleCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getTimingDescription = () => {
    if (rule.delay_days === 0 && rule.delay_hours === 0) {
      return 'Imediatamente';
    }
    const parts = [];
    if (rule.delay_days > 0) parts.push(`${rule.delay_days} dia${rule.delay_days > 1 ? 's' : ''}`);
    if (rule.delay_hours > 0) parts.push(`${rule.delay_hours} hora${rule.delay_hours > 1 ? 's' : ''}`);
    return `Após ${parts.join(' e ')}`;
  };

  const getTriggerSummary = () => {
    if (rule.trigger_loss_reasons.length === 0) return 'Nenhum motivo selecionado';
    if (rule.trigger_loss_reasons.length === Object.keys(lossReasonLabels).length) return 'Todos os motivos';
    
    const labels = rule.trigger_loss_reasons
      .slice(0, 2)
      .map(r => lossReasonLabels[r as LossReasonType] || r);
    
    if (rule.trigger_loss_reasons.length > 2) {
      return `${labels.join(', ')} +${rule.trigger_loss_reasons.length - 2}`;
    }
    return labels.join(', ');
  };

  return (
    <>
      <Card className={`transition-all ${rule.is_active ? '' : 'opacity-60'}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold truncate">{rule.name}</span>
                <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                  {rule.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              {/* Description */}
              {rule.description && (
                <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
              )}

              {/* Details */}
              <div className="space-y-2 text-sm">
                {/* Action */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-primary">
                    {actionIcons[rule.action_type]}
                  </div>
                  <span className="font-medium">{actionTypeLabels[rule.action_type]}</span>
                </div>

                {/* Timing */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{getTimingDescription()}</span>
                </div>

                {/* Triggers */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="h-3.5 w-3.5" />
                  <span>{getTriggerSummary()}</span>
                </div>
              </div>

              {/* Tags for trigger reasons */}
              <div className="flex flex-wrap gap-1 mt-3">
                {rule.trigger_loss_reasons.slice(0, 4).map(reason => (
                  <Badge key={reason} variant="outline" className="text-xs">
                    {lossReasonLabels[reason as LossReasonType] || reason}
                  </Badge>
                ))}
                {rule.trigger_loss_reasons.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{rule.trigger_loss_reasons.length - 4}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-end gap-2">
              <Switch
                checked={rule.is_active}
                onCheckedChange={(checked) => onToggle(rule.id, checked)}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(rule)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
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
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir regra?</AlertDialogTitle>
            <AlertDialogDescription>
              A regra "{rule.name}" será excluída permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(rule.id);
                setShowDeleteDialog(false);
              }}
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
