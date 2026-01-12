import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Negotiation, NegotiationStatus, LossReasonType } from '@/types/negotiations';
import { toast } from 'sonner';
import { notifySalespersonAboutLead } from './useRoundRobin';

// staleTime: 0 garante que invalidateQueries sempre dispara refetch
const negotiationQueryOptions = {
  staleTime: 0,
  gcTime: 1000 * 60 * 5,
  refetchOnWindowFocus: true,
};

export function useNegotiations() {
  return useQuery({
    queryKey: ['negotiations'],
    queryFn: async (): Promise<Negotiation[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('negotiations')
        .select(`
          *,
          lead:leads(id, name, phone, email, source),
          vehicle:vehicles(id, brand, model, year_model, plate, price_sale),
          customer:customers(id, name, phone, email)
        `)
        .order('updated_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      
      const negotiations = (data || []) as any[];
      
      // Buscar salesperson separadamente para evitar erro de FK
      const salespersonIds = Array.from(
        new Set(negotiations.map((n) => n.salesperson_id).filter(Boolean))
      ) as string[];
      
      if (salespersonIds.length === 0) {
        return negotiations.map((n: any) => ({
          ...n,
          objections: n.objections || [],
          salesperson: null,
        })) as Negotiation[];
      }
      
      const { data: profiles } = await (supabase as any)
        .from('profiles')
        .select('id, full_name')
        .in('id', salespersonIds);
      
      const profileMap = new Map<string, { full_name: string | null }>(
        (profiles || []).map((p: any) => [p.id, { full_name: p.full_name }])
      );
      
      return negotiations.map((n: any) => ({
        ...n,
        objections: n.objections || [],
        salesperson: n.salesperson_id ? profileMap.get(n.salesperson_id) : null,
      })) as Negotiation[];
    },
    ...negotiationQueryOptions,
  });
}

export function useNegotiation(id: string) {
  return useQuery({
    queryKey: ['negotiations', id],
    queryFn: async (): Promise<Negotiation | null> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('negotiations')
        .select(`
          *,
          lead:leads(id, name, phone, email, source),
          vehicle:vehicles(id, brand, model, year_model, plate, price_sale)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        objections: data.objections || [],
      } as Negotiation;
    },
    enabled: !!id,
  });
}

interface CreateNegotiationInput {
  lead_id: string;
  vehicle_id?: string;
  salesperson_id: string;
  status?: NegotiationStatus;
  estimated_value?: number;
  probability?: number;
  expected_close_date?: string;
  notes?: string;
  appointment_date?: string;
  appointment_time?: string;
  objections?: string[];
}

export function useCreateNegotiation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateNegotiationInput) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('negotiations')
        .insert({
          ...input,
          objections: input.objections || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['negotiations'] });
      toast.success('Negociação criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar negociação: ${error.message}`);
    },
  });
}

interface QualificationData {
  vehicle_interest?: string;
  budget_min?: number | null;
  budget_max?: number | null;
  down_payment?: number | null;
  max_installment?: number | null;
  payment_method?: string;
  has_trade_in?: boolean;
  trade_in_vehicle?: string;
  purchase_timeline?: string;
  vehicle_usage?: string;
  notes?: string;
  engagement_score: number;
  completeness_score: number;
  score: number;
}

interface UpdateNegotiationInput {
  id: string;
  vehicle_id?: string | null;
  status?: NegotiationStatus;
  estimated_value?: number | null;
  probability?: number | null;
  expected_close_date?: string | null;
  actual_close_date?: string | null;
  loss_reason?: string | null;
  structured_loss_reason?: LossReasonType | null;
  notes?: string | null;
  appointment_date?: string | null;
  appointment_time?: string | null;
  showed_up?: boolean | null;
  objections?: string[];
  qualificationData?: QualificationData;
}

export function useUpdateNegotiation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, qualificationData, ...input }: UpdateNegotiationInput & { salesperson_id?: string | null }) => {
      // If moving to "negociando" (Qualificado), check if we need to assign a salesperson
      if (input.status === 'negociando') {
        // Get current negotiation to check if it has a salesperson
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: current } = await (supabase as any)
          .from('negotiations')
          .select('salesperson_id, lead_id')
          .eq('id', id)
          .single();

        // If no salesperson assigned, run Round Robin
        if (current && !current.salesperson_id) {
          console.log('No salesperson assigned, running Round Robin...');
          
          // Get next salesperson from Round Robin
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: nextSalesperson } = await (supabase as any).rpc('get_next_round_robin_salesperson');
          
          if (nextSalesperson) {
            console.log('Round Robin assigned to:', nextSalesperson);
            
            // Add salesperson to the update
            (input as any).salesperson_id = nextSalesperson;

            // Update lead with assigned salesperson
            if (current.lead_id) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase as any)
                .from('leads')
                .update({ assigned_to: nextSalesperson })
                .eq('id', current.lead_id);

              // Create lead assignment record
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase as any).from('lead_assignments').insert({
                lead_id: current.lead_id,
                user_id: nextSalesperson,
              });

              // Increment Round Robin counters
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase as any).rpc('increment_round_robin_counters', { 
                p_salesperson_id: nextSalesperson 
              });

              // Get lead info for notification
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: lead } = await (supabase as any)
                .from('leads')
                .select('name, phone')
                .eq('id', current.lead_id)
                .single();

              // Send notification (in-app + WhatsApp) to assigned salesperson
              await notifySalespersonAboutLead(
                nextSalesperson, 
                current.lead_id, 
                lead?.name || null
              );

              toast.info('Vendedor atribuído automaticamente via Round Robin');
            }
          } else {
            console.log('No salesperson available in Round Robin');
            toast.warning('Nenhum vendedor disponível no Round Robin');
          }
        }
      }

      // Save qualification data if provided
      if (qualificationData && input.status === 'negociando') {
        // Get current negotiation to get lead_id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: negData } = await (supabase as any)
          .from('negotiations')
          .select('lead_id')
          .eq('id', id)
          .single();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('lead_qualifications').insert({
          lead_id: negData?.lead_id,
          negotiation_id: id,
          qualified_by: user?.id,
          score: qualificationData.score,
          vehicle_interest: qualificationData.vehicle_interest,
          budget_min: qualificationData.budget_min,
          budget_max: qualificationData.budget_max,
          down_payment: qualificationData.down_payment,
          max_installment: qualificationData.max_installment,
          payment_method: qualificationData.payment_method,
          has_trade_in: qualificationData.has_trade_in,
          trade_in_vehicle: qualificationData.trade_in_vehicle,
          purchase_timeline: qualificationData.purchase_timeline,
          vehicle_usage: qualificationData.vehicle_usage,
          notes: qualificationData.notes,
          engagement_score: qualificationData.engagement_score,
          completeness_score: qualificationData.completeness_score,
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('negotiations')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['negotiations'] });
      await queryClient.refetchQueries({ queryKey: ['leads'] });
      toast.success('Negociação atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

export function useDeleteNegotiation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('negotiations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['negotiations'] });
      toast.success('Negociação excluída!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });
}
