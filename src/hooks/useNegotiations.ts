import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Negotiation, NegotiationStatus, LossReasonType } from '@/types/negotiations';
import { toast } from 'sonner';

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
}

export function useUpdateNegotiation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateNegotiationInput & { salesperson_id?: string | null }) => {
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

              // Send notification to assigned salesperson
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase as any).from('notifications').insert({
                user_id: nextSalesperson,
                type: 'new_lead',
                title: 'Lead Qualificado Atribuído',
                message: `Um lead qualificado foi atribuído a você: ${lead?.name || 'Sem nome'} (${lead?.phone || 'Sem telefone'})`,
                link: '/crm',
              });

              toast.info('Vendedor atribuído automaticamente via Round Robin');
            }
          } else {
            console.log('No salesperson available in Round Robin');
            toast.warning('Nenhum vendedor disponível no Round Robin');
          }
        }
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
