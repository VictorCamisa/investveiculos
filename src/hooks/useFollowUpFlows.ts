import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TriggerType } from '@/types/followUp';

/**
 * The DB table follow_up_flows only has: id, name, steps (jsonb), created_at.
 * We serialize all config fields into the `steps` JSONB column and
 * deserialize them back on read so the rest of the app works unchanged.
 */

export interface FollowUpFlowConfig {
  description?: string | null;
  is_active?: boolean;
  target_lead_status?: string[];
  target_lead_sources?: string[];
  target_vehicle_interests?: string[];
  target_negotiation_status?: string[];
  trigger_type?: TriggerType | string;
  delay_days?: number;
  delay_hours?: number;
  specific_time?: string | null;
  days_of_week?: number[];
  message_template?: string;
  include_vehicle_info?: boolean;
  include_salesperson_name?: boolean;
  include_company_name?: boolean;
  whatsapp_button_text?: string;
  min_days_since_last_contact?: number | null;
  max_contacts_per_lead?: number;
  exclude_converted_leads?: boolean;
  exclude_lost_leads?: boolean;
  priority?: number;
}

export interface FollowUpFlowView extends FollowUpFlowConfig {
  id: string;
  name: string;
  created_at: string;
}

interface DbRow {
  id: string;
  name: string;
  steps: Record<string, unknown> | null;
  created_at: string | null;
}

function dbRowToView(row: DbRow): FollowUpFlowView {
  const s = (row.steps || {}) as FollowUpFlowConfig;
  return {
    id: row.id,
    name: row.name,
    created_at: row.created_at || new Date().toISOString(),
    description: s.description ?? null,
    is_active: s.is_active ?? true,
    target_lead_status: s.target_lead_status ?? [],
    target_lead_sources: s.target_lead_sources ?? [],
    target_vehicle_interests: s.target_vehicle_interests ?? [],
    target_negotiation_status: s.target_negotiation_status ?? [],
    trigger_type: s.trigger_type ?? 'manual',
    delay_days: s.delay_days ?? 0,
    delay_hours: s.delay_hours ?? 0,
    specific_time: s.specific_time ?? null,
    days_of_week: s.days_of_week ?? [1, 2, 3, 4, 5],
    message_template: s.message_template ?? '',
    include_vehicle_info: s.include_vehicle_info ?? false,
    include_salesperson_name: s.include_salesperson_name ?? true,
    include_company_name: s.include_company_name ?? true,
    whatsapp_button_text: s.whatsapp_button_text ?? 'Enviar WhatsApp',
    min_days_since_last_contact: s.min_days_since_last_contact ?? null,
    max_contacts_per_lead: s.max_contacts_per_lead ?? 5,
    exclude_converted_leads: s.exclude_converted_leads ?? true,
    exclude_lost_leads: s.exclude_lost_leads ?? true,
    priority: s.priority ?? 0,
  };
}

export function useFollowUpFlows() {
  return useQuery({
    queryKey: ['follow-up-flows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follow_up_flows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return ((data || []) as unknown as DbRow[]).map(dbRowToView);
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
  trigger_type?: TriggerType | string;
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

function inputToDbPayload(input: CreateFollowUpFlowInput) {
  const { name, ...config } = input;
  return {
    name,
    steps: {
      ...config,
      specific_time: config.specific_time || null,
    },
  };
}

export function useCreateFollowUpFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFollowUpFlowInput) => {
      const payload = inputToDbPayload(input);
      const { data, error } = await supabase
        .from('follow_up_flows')
        .insert(payload as never)
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
      const { name, ...config } = input;
      const payload: Record<string, unknown> = {
        steps: {
          ...config,
          specific_time: config.specific_time || null,
        },
      };
      if (name) payload.name = name;

      const { data, error } = await supabase
        .from('follow_up_flows')
        .update(payload as never)
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
      // Need to read current steps first to preserve config
      const { data: current, error: readError } = await supabase
        .from('follow_up_flows')
        .select('steps')
        .eq('id', id)
        .single();

      if (readError) throw readError;

      const currentSteps = ((current?.steps ?? {}) as Record<string, unknown>);
      const newSteps = { ...currentSteps, is_active };

      const { data, error } = await supabase
        .from('follow_up_flows')
        .update({ steps: newSteps } as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { is_active };
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
