import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
  AlertCircle, Plus, Car, Calendar, Trash2, 
  ArrowRight, DollarSign, TrendingUp, Clock,
  CheckCircle2, XCircle, User, Eye, ChevronRight,
  Target, Handshake, FileCheck, Ban
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { negotiationStatusLabels, negotiationStatusColors, pipelineColumns } from '@/types/negotiations';
import type { Negotiation } from '@/types/negotiations';
import { useDeleteNegotiation } from '@/hooks/useNegotiations';

interface LeadNegotiationsTabProps {
  negotiations: Negotiation[];
  onStartNegotiation: () => void;
  onViewNegotiation?: (negotiation: Negotiation) => void;
}

const statusIcons: Record<string, React.ReactNode> = {
  novo: <AlertCircle className="h-4 w-4" />,
  em_andamento: <Clock className="h-4 w-4" />,
  proposta_enviada: <FileCheck className="h-4 w-4" />,
  negociando: <Handshake className="h-4 w-4" />,
  fechado: <CheckCircle2 className="h-4 w-4" />,
  perdido: <XCircle className="h-4 w-4" />,
};

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
}

function NegotiationCard({ 
  negotiation, 
  onDelete,
  onView 
}: { 
  negotiation: any;
  onDelete: () => void;
  onView?: () => void;
}) {
  const isWon = negotiation.status === 'ganho';
  const isLost = negotiation.status === 'perdido';
  const isActive = !isWon && !isLost;
  
  // Calculate progress based on pipeline position
  const currentIndex = pipelineColumns.indexOf(negotiation.status);
  const totalSteps = pipelineColumns.length - 1; // Exclude 'perdido' from count
  const progress = isLost ? 0 : isWon ? 100 : ((currentIndex + 1) / totalSteps) * 100;

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${
      isWon ? 'border-green-500/50 bg-green-500/5' :
      isLost ? 'border-red-500/50 bg-red-500/5' : ''
    }`}>
      {/* Status Bar */}
      <div className={`h-1 ${
        isWon ? 'bg-green-500' :
        isLost ? 'bg-red-500' :
        'bg-primary'
      }`} style={{ width: isActive ? `${progress}%` : '100%' }} />
      
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
              isWon ? 'bg-green-500/20 text-green-600' :
              isLost ? 'bg-red-500/20 text-red-600' :
              'bg-primary/20 text-primary'
            }`}>
              {statusIcons[negotiation.status] || <Target className="h-4 w-4" />}
            </div>
            <div>
              <Badge className={negotiationStatusColors[negotiation.status]}>
                {negotiationStatusLabels[negotiation.status]}
              </Badge>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(negotiation.created_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {onView && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onView}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Vehicle Info */}
        {negotiation.vehicle && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 mb-3">
            <Car className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
                {negotiation.vehicle.brand} {negotiation.vehicle.model}
              </p>
              <p className="text-xs text-muted-foreground">
                {negotiation.vehicle.year_model}
              </p>
            </div>
            {negotiation.vehicle.sale_price && (
              <Badge variant="secondary" className="shrink-0">
                {formatCurrency(negotiation.vehicle.sale_price)}
              </Badge>
            )}
          </div>
        )}

        {/* Values Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {negotiation.estimated_value && (
            <div className="p-2 rounded-lg bg-muted/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Estimado</p>
              <p className="text-sm font-semibold">{formatCurrency(negotiation.estimated_value)}</p>
            </div>
          )}
          {(negotiation as any).value_offered && (
            <div className="p-2 rounded-lg bg-muted/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ofertado</p>
              <p className="text-sm font-semibold">{formatCurrency((negotiation as any).value_offered)}</p>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="flex flex-wrap gap-2 text-xs">
          {negotiation.salesperson?.full_name && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{negotiation.salesperson.full_name}</span>
            </div>
          )}
          {negotiation.probability && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>{negotiation.probability}% chance</span>
            </div>
          )}
          {negotiation.expected_close_date && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(negotiation.expected_close_date), 'dd/MM/yyyy')}</span>
            </div>
          )}
        </div>

        {/* Loss Reason */}
        {isLost && negotiation.loss_reason && (
          <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs font-medium text-red-600 mb-1">Motivo da perda:</p>
            <p className="text-xs text-red-600/80">{negotiation.loss_reason}</p>
          </div>
        )}

        {/* Objections */}
        {negotiation.objections && negotiation.objections.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-1">Objeções:</p>
            <div className="flex flex-wrap gap-1">
              {negotiation.objections.map((obj, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {obj}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Progress Steps (for active negotiations) */}
        {isActive && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="flex items-center gap-1">
              {pipelineColumns.filter(s => s !== 'perdido').map((step, i) => {
                const stepIndex = pipelineColumns.indexOf(step);
                const isCompleted = stepIndex <= currentIndex;
                const isCurrent = step === negotiation.status;
                
                return (
                  <div key={step} className="flex-1 flex items-center">
                    <div className={`h-2 w-full rounded-full ${
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    } ${isCurrent ? 'ring-2 ring-primary ring-offset-1' : ''}`} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LeadNegotiationsTab({ 
  negotiations, 
  onStartNegotiation,
  onViewNegotiation 
}: LeadNegotiationsTabProps) {
  const deleteNegotiation = useDeleteNegotiation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [negotiationToDelete, setNegotiationToDelete] = useState<string | null>(null);

  const handleDelete = () => {
    if (negotiationToDelete) {
      deleteNegotiation.mutate(negotiationToDelete, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setNegotiationToDelete(null);
        }
      });
    }
  };

  // Stats
  const activeNegotiations = negotiations.filter(n => !['ganho', 'perdido'].includes(n.status as string));
  const wonNegotiations = negotiations.filter(n => n.status === 'ganho');
  const lostNegotiations = negotiations.filter(n => n.status === 'perdido');
  const totalValue = wonNegotiations.reduce((sum, n) => sum + (n.estimated_value || 0), 0);

  if (negotiations.length === 0) {
    return (
      <ScrollArea className="flex-1 min-h-0 px-6 pb-6">
        <div className="h-full flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Handshake className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Nenhuma negociação iniciada</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-4">
            Inicie uma negociação para acompanhar propostas, visitas e fechamentos com este lead.
          </p>
          <Button onClick={onStartNegotiation}>
            <Plus className="h-4 w-4 mr-2" />
            Iniciar Primeira Negociação
          </Button>
        </div>
      </ScrollArea>
    );
  }

  // Sort: active first, then by date
  const sortedNegotiations = [...negotiations].sort((a, b) => {
    const aActive = !['ganho', 'perdido'].includes(a.status as string);
    const bActive = !['ganho', 'perdido'].includes(b.status as string);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <>
      <ScrollArea className="flex-1 min-h-0 px-6 pb-6">
        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold">{negotiations.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Total</p>
              </CardContent>
            </Card>
            <Card className="border-primary/50">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-primary">{activeNegotiations.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Ativas</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/50">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-green-500">{wonNegotiations.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Ganhas</p>
              </CardContent>
            </Card>
            <Card className="border-red-500/50">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-red-500">{lostNegotiations.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Perdidas</p>
              </CardContent>
            </Card>
          </div>

          {/* Total Value */}
          {totalValue > 0 && (
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor Total Fechado</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(totalValue)}</p>
                  </div>
                </div>
                <Badge className="bg-green-500">
                  {wonNegotiations.length} venda{wonNegotiations.length !== 1 ? 's' : ''}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* New Negotiation Button */}
          <Button 
            onClick={onStartNegotiation} 
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Negociação
          </Button>

          {/* Negotiations List */}
          <div className="space-y-3">
            {sortedNegotiations.map((negotiation) => (
              <NegotiationCard
                key={negotiation.id}
                negotiation={negotiation}
                onDelete={() => {
                  setNegotiationToDelete(negotiation.id);
                  setDeleteDialogOpen(true);
                }}
                onView={onViewNegotiation ? () => onViewNegotiation(negotiation) : undefined}
              />
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Negociação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta negociação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
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
