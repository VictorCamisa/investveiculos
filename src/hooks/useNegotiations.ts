import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Negotiation, NegotiationStatus, LossReasonType } from '@/types/negotiations';
import { toast } from 'sonner';

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
          vehicle:vehicles(id, brand, model, year_model, plate, sale_price),
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
          vehicle:vehicles(id, brand, model, year_model, plate, sale_price)
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
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
    mutationFn: async ({ id, ...input }: UpdateNegotiationInput) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
      toast.success('Negociação excluída!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });
}
