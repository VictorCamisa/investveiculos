import { useState } from 'react';
import { NegotiationCard } from './NegotiationCard';
import type { Negotiation, NegotiationStatus } from '@/types/negotiations';
import { negotiationStatusLabels, pipelineColumns } from '@/types/negotiations';
import { useUpdateNegotiation } from '@/hooks/useNegotiations';
import { Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SaleFromNegotiationModal } from '@/components/sales/SaleFromNegotiationModal';
import { StageTransitionModal, StageTransitionData } from './StageTransitionModal';
import { QualificationModal } from './QualificationModal';
import type { QualificationFormData, ScoreBreakdown } from '@/types/qualification';

interface NegotiationPipelineProps {
  negotiations: Negotiation[];
  onNegotiationClick?: (negotiation: Negotiation) => void;
  onCreateNegotiation?: () => void;
  onCreateLead?: () => void;
  showSalesperson?: boolean;
}

export function NegotiationPipeline({ 
  negotiations, 
  onNegotiationClick, 
  onCreateNegotiation,
  onCreateLead,
  showSalesperson 
}: NegotiationPipelineProps) {
  const updateNegotiation = useUpdateNegotiation();
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [pendingWonNegotiation, setPendingWonNegotiation] = useState<Negotiation | null>(null);
  
  // Stage transition modal state
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<{
    negotiation: Negotiation;
    targetStatus: NegotiationStatus;
  } | null>(null);
  
  // Qualification modal state (for 'negociando' / Qualificado stage)
  const [qualificationModalOpen, setQualificationModalOpen] = useState(false);
  const [pendingQualification, setPendingQualification] = useState<Negotiation | null>(null);

  const getNegotiationsByStatus = (status: NegotiationStatus) => {
    return negotiations.filter(n => n.status === status);
  };

  const handleDragStart = (e: React.DragEvent, negotiationId: string) => {
    e.dataTransfer.setData('negotiationId', negotiationId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Stages that require transition modal
  const stagesRequiringModal: NegotiationStatus[] = ['proposta_enviada', 'negociando', 'perdido'];

  // Stages that require qualification modal vs transition modal
  const qualificationStage: NegotiationStatus = 'negociando';
  const stagesRequiringTransitionModal: NegotiationStatus[] = ['proposta_enviada', 'perdido'];

  const handleDrop = (e: React.DragEvent, newStatus: NegotiationStatus) => {
    e.preventDefault();
    const negotiationId = e.dataTransfer.getData('negotiationId');
    if (!negotiationId) return;

    const negotiation = negotiations.find(n => n.id === negotiationId);
    if (!negotiation) return;

    // If same status, do nothing
    if (negotiation.status === newStatus) return;

    // "Ganho" opens sale modal
    if (newStatus === 'ganho') {
      setPendingWonNegotiation(negotiation);
      setSaleModalOpen(true);
      return;
    }

    // "Qualificado" opens qualification modal
    if (newStatus === qualificationStage) {
      setPendingQualification(negotiation);
      setQualificationModalOpen(true);
      return;
    }

    // Stages that require transition modal
    if (stagesRequiringTransitionModal.includes(newStatus)) {
      setPendingTransition({ negotiation, targetStatus: newStatus });
      setTransitionModalOpen(true);
      return;
    }

    // Other transitions: direct update
    updateNegotiation.mutate({ id: negotiationId, status: newStatus });
  };

  const handleQualificationConfirm = (formData: QualificationFormData, score: ScoreBreakdown) => {
    if (!pendingQualification) return;

    updateNegotiation.mutate({
      id: pendingQualification.id,
      status: 'negociando',
      qualificationData: {
        ...formData,
        engagement_score: score.engagement,
        intent_score: score.intent,
        completeness_score: score.completeness,
        score: score.total,
      },
    });

    setPendingQualification(null);
    setQualificationModalOpen(false);
  };

  const handleTransitionConfirm = (data: StageTransitionData) => {
    if (!pendingTransition) return;

    updateNegotiation.mutate({
      id: pendingTransition.negotiation.id,
      status: data.status,
      estimated_value: data.estimated_value,
      notes: data.notes || data.proposal_description,
      objections: data.objections,
      structured_loss_reason: data.structured_loss_reason,
      loss_reason: data.loss_reason,
    });

    setPendingTransition(null);
  };

  const handleSaleSuccess = () => {
    if (pendingWonNegotiation) {
      updateNegotiation.mutate({ 
        id: pendingWonNegotiation.id, 
        status: 'ganho',
        actual_close_date: new Date().toISOString().split('T')[0]
      });
    }
    setPendingWonNegotiation(null);
  };

  const handleSaleCancel = () => {
    setPendingWonNegotiation(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const totalPipelineValue = negotiations
    .filter(n => !['ganho', 'perdido'].includes(n.status))
    .reduce((sum, n) => sum + (n.estimated_value || 0), 0);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Pipeline Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Pipeline de Vendas</h2>
            <p className="text-sm text-muted-foreground">
              {negotiations.filter(n => !['ganho', 'perdido'].includes(n.status)).length} negociações ativas • {formatCurrency(totalPipelineValue)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {onCreateLead && (
            <Button onClick={onCreateLead} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          )}
          {onCreateNegotiation && (
            <Button onClick={onCreateNegotiation} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Negociação
            </Button>
          )}
        </div>
      </div>

      {/* Pipeline Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 pb-4 h-full" style={{ minWidth: 'max-content' }}>
          {pipelineColumns.map((status) => {
            const columnNegotiations = getNegotiationsByStatus(status);
            const totalValue = columnNegotiations.reduce((sum, n) => sum + (n.estimated_value || 0), 0);

            return (
              <div
                key={status}
                className="flex-shrink-0 w-72 rounded-lg border border-border bg-muted/20 flex flex-col h-full transition-colors"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                {/* Column Header */}
                <div className="p-3 rounded-t-lg shrink-0 bg-muted/40 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">
                      {negotiationStatusLabels[status]}
                    </h3>
                    <span className="text-xs font-medium bg-background text-foreground px-2 py-0.5 rounded-full">
                      {columnNegotiations.length}
                    </span>
                  </div>
                  {totalValue > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                      {formatCurrency(totalValue)}
                    </p>
                  )}
                </div>

                {/* Column Content */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                  {columnNegotiations.map((negotiation) => (
                    <div
                      key={negotiation.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, negotiation.id)}
                      className="cursor-grab active:cursor-grabbing active:opacity-70 transition-opacity"
                    >
                      <NegotiationCard
                        negotiation={negotiation}
                        onClick={() => onNegotiationClick?.(negotiation)}
                        showSalesperson={showSalesperson}
                      />
                    </div>
                  ))}
                  
                  {columnNegotiations.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
                      <span className="text-xs">Arraste negociações aqui</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal para criar venda */}
      <SaleFromNegotiationModal
        open={saleModalOpen}
        onOpenChange={setSaleModalOpen}
        negotiation={pendingWonNegotiation}
        onSuccess={handleSaleSuccess}
        onCancel={handleSaleCancel}
      />

      {/* Modal de transição de estágio */}
      <StageTransitionModal
        open={transitionModalOpen}
        onOpenChange={setTransitionModalOpen}
        negotiation={pendingTransition?.negotiation || null}
        targetStatus={pendingTransition?.targetStatus || null}
        onConfirm={handleTransitionConfirm}
      />

      {/* Modal de qualificação */}
      <QualificationModal
        open={qualificationModalOpen}
        onOpenChange={setQualificationModalOpen}
        negotiation={pendingQualification}
        onConfirm={handleQualificationConfirm}
      />
    </div>
  );
}
