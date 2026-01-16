import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Trash2 } from 'lucide-react';
import type { Lead } from '@/types/crm';
import { leadStatusLabels, leadStatusColors, leadSourceLabels } from '@/types/crm';
import { useLeadInteractions } from '@/hooks/useLeadInteractions';
import { useNegotiations } from '@/hooks/useNegotiations';
import { useDeleteLead } from '@/hooks/useLeads';
import { useState, useEffect } from 'react';
import { WhatsAppChatModal } from '@/components/whatsapp/WhatsAppChatModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LeadInfoTab } from './lead-detail/LeadInfoTab';
import { LeadQualificationTab } from './lead-detail/LeadQualificationTab';
import { LeadHistoryTab } from './lead-detail/LeadHistoryTab';
import { LeadNegotiationsTab } from './lead-detail/LeadNegotiationsTab';

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartNegotiation?: (leadId: string, salespersonId?: string) => void;
}

export function LeadDetailSheet({ lead, open, onOpenChange, onStartNegotiation }: LeadDetailSheetProps) {
  const queryClient = useQueryClient();
  const { data: interactions = [] } = useLeadInteractions(lead?.id || '');
  const { data: allNegotiations = [] } = useNegotiations();
  const deleteLead = useDeleteLead();

  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [deleteLeadDialogOpen, setDeleteLeadDialogOpen] = useState(false);

  const leadNegotiations = allNegotiations.filter(n => n.lead_id === lead?.id);

  // Real-time subscription for lead qualifications
  useEffect(() => {
    if (!lead?.id || !open) return;

    console.log('[LeadDetailSheet] Setting up real-time subscription for lead:', lead.id);

    const channel = supabase
      .channel(`lead-qualifications-${lead.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'lead_qualifications'
        },
        (payload) => {
          const newRow = payload.new as { lead_id?: string; negotiation_id?: string };
          console.log('[LeadDetailSheet] New qualification received:', newRow);
          
          // Check if this qualification is for our lead
          if (newRow?.lead_id === lead.id) {
            console.log('[LeadDetailSheet] Invalidating qualification query');
            queryClient.invalidateQueries({ queryKey: ['lead-qualifications-by-lead', lead.id] });
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'lead_qualifications'
        },
        (payload) => {
          const updatedRow = payload.new as { lead_id?: string; negotiation_id?: string };
          console.log('[LeadDetailSheet] Qualification updated:', updatedRow);
          
          if (updatedRow?.lead_id === lead.id) {
            console.log('[LeadDetailSheet] Invalidating qualification query on update');
            queryClient.invalidateQueries({ queryKey: ['lead-qualifications-by-lead', lead.id] });
          }
        }
      )
      .subscribe((status) => {
        console.log('[LeadDetailSheet] Subscription status:', status);
      });

    return () => {
      console.log('[LeadDetailSheet] Cleaning up subscription for lead:', lead.id);
      supabase.removeChannel(channel);
    };
  }, [lead?.id, open, queryClient]);

  const handleDeleteLead = () => {
    if (lead) {
      deleteLead.mutate(lead.id, {
        onSuccess: () => {
          setDeleteLeadDialogOpen(false);
          onOpenChange(false);
        }
      });
    }
  };

  // Fetch qualification data for this lead
  const { data: qualifications = [] } = useQuery({
    queryKey: ['lead-qualifications-by-lead', lead?.id],
    queryFn: async () => {
      if (!lead?.id) return [];
      
      // First get qualifications by lead_id
      const { data: byLead, error: error1 } = await supabase
        .from('lead_qualifications')
        .select('*')
        .eq('lead_id', lead.id);
      
      if (error1) {
        console.error('Error fetching qualifications by lead_id:', error1);
      }
      
      // Get negotiation IDs for this lead directly from DB
      const { data: negotiations } = await supabase
        .from('negotiations')
        .select('id')
        .eq('lead_id', lead.id);
      
      const negotiationIds = (negotiations || []).map(n => n.id);
      
      // Also get qualifications by negotiation_id
      let byNegotiation: any[] = [];
      if (negotiationIds.length > 0) {
        const { data, error: error2 } = await supabase
          .from('lead_qualifications')
          .select('*')
          .in('negotiation_id', negotiationIds);
        if (error2) {
          console.error('Error fetching qualifications by negotiation_id:', error2);
        }
        byNegotiation = data || [];
      }
      
      // Merge and dedupe
      const allQualifications = [...(byLead || []), ...byNegotiation];
      const unique = allQualifications.filter((q, i, arr) => 
        arr.findIndex(x => x.id === q.id) === i
      );
      
      return unique;
    },
    enabled: !!lead?.id,
  });

  if (!lead) return null;

  const handleStartNegotiation = () => {
    onStartNegotiation?.(lead.id, lead.assigned_to || undefined);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{lead.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={leadStatusColors[lead.status]}>
                  {leadStatusLabels[lead.status]}
                </Badge>
                <Badge variant="outline">{leadSourceLabels[lead.source]}</Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteLeadDialogOpen(true)}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4 mx-6 mt-4" style={{ width: 'calc(100% - 3rem)' }}>
            <TabsTrigger value="info" className="text-xs sm:text-sm">Info</TabsTrigger>
            <TabsTrigger value="qualification" className="text-xs sm:text-sm">Qualificação</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">Histórico</TabsTrigger>
            <TabsTrigger value="negotiations" className="text-xs sm:text-sm">Negociações</TabsTrigger>
          </TabsList>

          {/* WhatsApp Modal */}
          <WhatsAppChatModal
            open={whatsappModalOpen}
            onOpenChange={setWhatsappModalOpen}
            leadId={lead.id}
            phone={lead.phone}
            leadName={lead.name}
          />

          {/* Info Tab */}
          <TabsContent value="info" className="flex-1 overflow-hidden mt-4 m-0 data-[state=active]:flex data-[state=active]:flex-col min-h-0">
            <LeadInfoTab 
              lead={lead}
              onOpenWhatsApp={() => setWhatsappModalOpen(true)}
              onStartNegotiation={handleStartNegotiation}
            />
          </TabsContent>

          {/* Qualification Tab */}
          <TabsContent value="qualification" className="flex-1 overflow-hidden mt-4 m-0 data-[state=active]:flex data-[state=active]:flex-col min-h-0">
            <LeadQualificationTab qualifications={qualifications} />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="flex-1 overflow-hidden mt-4 m-0 data-[state=active]:flex data-[state=active]:flex-col min-h-0">
            <LeadHistoryTab interactions={interactions} />
          </TabsContent>

          {/* Negotiations Tab */}
          <TabsContent value="negotiations" className="flex-1 overflow-hidden mt-4 m-0 data-[state=active]:flex data-[state=active]:flex-col min-h-0">
            <LeadNegotiationsTab 
              negotiations={leadNegotiations}
              onStartNegotiation={handleStartNegotiation}
            />
          </TabsContent>
        </Tabs>

        {/* Delete Lead Dialog */}
        <AlertDialog open={deleteLeadDialogOpen} onOpenChange={setDeleteLeadDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Lead</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o lead "{lead.name}"? 
                Esta ação não pode ser desfeita e todas as interações e negociações associadas serão afetadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteLead}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
