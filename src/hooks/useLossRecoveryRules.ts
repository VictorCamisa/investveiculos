import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LossReasonType } from '@/types/negotiations';

export type ActionType = 'whatsapp_message' | 'create_vehicle_alert' | 'schedule_follow_up' | 'notify_manager';

export interface LossRecoveryRule {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_loss_reasons: string[];
  action_type: ActionType;
  delay_days: number;
  delay_hours: number;
  message_template: string | null;
  include_vehicle_info: boolean;
  include_salesperson_name: boolean;
  auto_create_alert: boolean;
  alert_price_range_percent: number;
  alert_year_range: number;
  min_days_since_loss: number | null;
  max_attempts_per_lead: number;
  priority: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const actionTypeLabels: Record<ActionType, string> = {
  whatsapp_message: 'Enviar WhatsApp',
  create_vehicle_alert: 'Criar Alerta de Veículo',
  schedule_follow_up: 'Agendar Follow-up',
  notify_manager: 'Notificar Gerente',
};

export function useLossRecoveryRules() {
  return useQuery({
    queryKey: ['loss-recovery-rules'],
    queryFn: async (): Promise<LossRecoveryRule[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('loss_recovery_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      return (data || []) as LossRecoveryRule[];
    },
  });
}

interface CreateRuleInput {
  name: string;
  description?: string;
  is_active?: boolean;
  trigger_loss_reasons: string[];
  action_type: ActionType;
  delay_days?: number;
  delay_hours?: number;
  message_template?: string;
  include_vehicle_info?: boolean;
  include_salesperson_name?: boolean;
  auto_create_alert?: boolean;
  alert_price_range_percent?: number;
  alert_year_range?: number;
  min_days_since_loss?: number;
  max_attempts_per_lead?: number;
  priority?: number;
}

export function useCreateLossRecoveryRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRuleInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('loss_recovery_rules')
        .insert({
          ...input,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loss-recovery-rules'] });
      toast.success('Regra criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar regra: ${error.message}`);
    },
  });
}

interface UpdateRuleInput extends Partial<CreateRuleInput> {
  id: string;
}

export function useUpdateLossRecoveryRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateRuleInput) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('loss_recovery_rules')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loss-recovery-rules'] });
      toast.success('Regra atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

export function useDeleteLossRecoveryRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('loss_recovery_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loss-recovery-rules'] });
      toast.success('Regra removida!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });
}

export function useToggleLossRecoveryRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('loss_recovery_rules')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loss-recovery-rules'] });
      toast.success(variables.is_active ? 'Regra ativada!' : 'Regra desativada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}
