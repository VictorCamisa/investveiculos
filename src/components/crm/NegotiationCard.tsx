import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Car, Phone, Calendar, TrendingUp, User, UserCircle, Trash2 } from 'lucide-react';
import type { Negotiation } from '@/types/negotiations';
import { negotiationStatusLabels } from '@/types/negotiations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LeadScoreBadge } from './LeadScoreIndicator';
import { useLeadQualificationByNegotiation } from '@/hooks/useLeadQualification';
import { useDeleteNegotiation } from '@/hooks/useNegotiations';
import { useState } from 'react';

interface NegotiationCardProps {
  negotiation: Negotiation;
  onClick?: () => void;
  showSalesperson?: boolean;
  showDeleteButton?: boolean;
}

export function NegotiationCard({ negotiation, onClick, showSalesperson, showDeleteButton }: NegotiationCardProps) {
  const { data: qualification } = useLeadQualificationByNegotiation(negotiation.id);
  const deleteNegotiation = useDeleteNegotiation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteNegotiation.mutate(negotiation.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow border-border/50 bg-card"
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm truncate text-foreground">
                {negotiation.lead?.name || 'Lead não encontrado'}
              </h4>
              {negotiation.lead?.phone && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{negotiation.lead.phone}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {qualification && (
                <LeadScoreBadge score={qualification.score} />
              )}
              <Badge variant="outline" className="text-xs shrink-0">
                {negotiationStatusLabels[negotiation.status]}
              </Badge>
              {showDeleteButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {negotiation.customer && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
              <UserCircle className="h-3 w-3" />
              <span className="truncate">Cliente: {negotiation.customer.name}</span>
            </div>
          )}

          {negotiation.vehicle && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
              <Car className="h-3 w-3" />
              <span className="truncate">
                {negotiation.vehicle.brand} {negotiation.vehicle.model} {negotiation.vehicle.year_model}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            {negotiation.estimated_value ? (
              <span className="font-semibold text-foreground">
                {formatCurrency(negotiation.estimated_value)}
              </span>
            ) : (
              <span className="text-muted-foreground">Valor não definido</span>
            )}
            
            {negotiation.probability !== null && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>{negotiation.probability}%</span>
              </div>
            )}
          </div>

          {negotiation.expected_close_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Previsão: {format(new Date(negotiation.expected_close_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
          )}

          {/* Show salesperson or "Sem vendedor" badge */}
          {showSalesperson && (
            <div className="flex items-center gap-1 text-xs pt-1 border-t border-border/50">
              <User className="h-3 w-3" />
              {negotiation.salesperson?.full_name ? (
                <span className="text-muted-foreground">{negotiation.salesperson.full_name}</span>
              ) : (
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-600">
                  Sem vendedor
                </Badge>
              )}
            </div>
          )}

          {/* Always show "Sem vendedor" badge when no salesperson, even if showSalesperson is false */}
          {!showSalesperson && !negotiation.salesperson_id && (
            <div className="flex items-center gap-1 text-xs pt-1 border-t border-border/50">
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-600">
                Sem vendedor
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Negociação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta negociação de "{negotiation.lead?.name}"? 
              Esta ação não pode ser desfeita.
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
    </>
  );
}
