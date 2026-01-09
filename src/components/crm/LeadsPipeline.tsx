import { LeadCard } from './LeadCard';
import type { Lead, LeadStatus } from '@/types/crm';
import { leadStatusLabels } from '@/types/crm';
import { cn } from '@/lib/utils';
import { useUpdateLead } from '@/hooks/useLeads';

interface LeadsPipelineProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

const pipelineStages: LeadStatus[] = [
  'novo',
  'contato_inicial',
  'qualificado',
  'proposta',
  'negociacao',
];

const stageColors: Record<LeadStatus, { border: string; bg: string; header: string }> = {
  novo: { border: 'border-t-blue-500', bg: 'bg-blue-500/5', header: 'bg-blue-500/10' },
  contato_inicial: { border: 'border-t-cyan-500', bg: 'bg-cyan-500/5', header: 'bg-cyan-500/10' },
  qualificado: { border: 'border-t-purple-500', bg: 'bg-purple-500/5', header: 'bg-purple-500/10' },
  proposta: { border: 'border-t-amber-500', bg: 'bg-amber-500/5', header: 'bg-amber-500/10' },
  negociacao: { border: 'border-t-orange-500', bg: 'bg-orange-500/5', header: 'bg-orange-500/10' },
  convertido: { border: 'border-t-green-500', bg: 'bg-green-500/5', header: 'bg-green-500/10' },
  perdido: { border: 'border-t-red-500', bg: 'bg-red-500/5', header: 'bg-red-500/10' },
};

export function LeadsPipeline({ leads, onLeadClick }: LeadsPipelineProps) {
  const updateLead = useUpdateLead();

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter((lead) => lead.status === status);
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      updateLead.mutate({ id: leadId, status: newStatus });
    }
  };

  return (
    <div className="h-full w-full overflow-x-auto overflow-y-hidden">
      <div className="flex gap-3 pb-4 h-full" style={{ minWidth: 'max-content' }}>
        {pipelineStages.map((status) => {
          const stageLeads = getLeadsByStatus(status);
          const styles = stageColors[status];
          
          return (
            <div
              key={status}
              className={cn(
                "flex-shrink-0 w-72 rounded-lg border-t-4 flex flex-col h-full transition-colors",
                styles.border,
                styles.bg
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              {/* Column Header */}
              <div className={cn("p-3 rounded-t-lg shrink-0", styles.header)}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{leadStatusLabels[status]}</h3>
                  <span className="text-xs font-medium bg-background/80 text-foreground px-2 py-0.5 rounded-full shadow-sm">
                    {stageLeads.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="cursor-grab active:cursor-grabbing active:opacity-70 transition-opacity"
                  >
                    <LeadCard
                      lead={lead}
                      onClick={() => onLeadClick?.(lead)}
                      compact
                    />
                  </div>
                ))}
                {stageLeads.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-24 text-muted-foreground border-2 border-dashed border-border/50 rounded-lg">
                    <span className="text-xs">Arraste leads aqui</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
