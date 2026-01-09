import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TriggerType } from '@/types/followUp';

interface FollowUpFlowRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  target_lead_status: string[] | null;
  target_lead_sources: string[] | null;
  target_vehicle_interests: string[] | null;
  target_negotiation_status: string[] | null;
  trigger_type: string;
  delay_days: number | null;
  delay_hours: number | null;
  specific_time: string | null;
  days_of_week: number[] | null;
  message_template: string;
  include_vehicle_info: boolean | null;
  include_salesperson_name: boolean | null;
  include_company_name: boolean | null;
  whatsapp_button_text: string | null;
  min_days_since_last_contact: number | null;
  max_contacts_per_lead: number | null;
  exclude_converted_leads: boolean | null;
  exclude_lost_leads: boolean | null;
  priority: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useFollowUpFlows() {
  return useQuery({
    queryKey: ['follow-up-flows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follow_up_flows')
        .select('*')
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return (data as unknown as FollowUpFlowRow[]) || [];
    },
  });
}

export interface CreateFollowUpFlowInput {
  name: string;
  description?: string;
  is_active?: boolean;
  target_lead_status?: string[];
  target_lead_sources?: string[];
  target_vehicle_interests?: string[];
  target_negotiation_status?: string[];
  trigger_type?: TriggerType;
  delay_days?: number;
  delay_hours?: number;
  specific_time?: string;
  days_of_week?: number[];
  message_template: string;
  include_vehicle_info?: boolean;
  include_salesperson_name?: boolean;
  include_company_name?: boolean;
  whatsapp_button_text?: string;
  min_days_since_last_contact?: number;
  max_contacts_per_lead?: number;
  exclude_converted_leads?: boolean;
  exclude_lost_leads?: boolean;
  priority?: number;
}

export function useCreateFollowUpFlow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateFollowUpFlowInput) => {
      // Convert empty string to null for time field
      const sanitizedInput = {
        ...input,
        specific_time: input.specific_time || null,
      };
      
      const { data, error } = await supabase
        .from('follow_up_flows')
        .insert(sanitizedInput as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-flows'] });
      toast.success('Fluxo de follow-up criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar fluxo: ' + error.message);
    },
  });
}

export interface UpdateFollowUpFlowInput extends Partial<CreateFollowUpFlowInput> {
  id: string;
}

export function useUpdateFollowUpFlow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateFollowUpFlowInput) => {
      // Convert empty string to null for time field
      const sanitizedInput = {
        ...input,
        specific_time: input.specific_time || null,
      };
      
      const { data, error } = await supabase
        .from('follow_up_flows')
        .update(sanitizedInput as never)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-flows'] });
      toast.success('Fluxo de follow-up atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar fluxo: ' + error.message);
    },
  });
}

export function useDeleteFollowUpFlow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('follow_up_flows')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-flows'] });
      toast.success('Fluxo de follow-up excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir fluxo: ' + error.message);
    },
  });
}

export function useToggleFollowUpFlow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('follow_up_flows')
        .update({ is_active } as never)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as { is_active: boolean };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-flows'] });
      toast.success(data?.is_active ? 'Fluxo ativado!' : 'Fluxo desativado!');
    },
    onError: (error) => {
      toast.error('Erro ao alterar status: ' + error.message);
    },
  });
}
