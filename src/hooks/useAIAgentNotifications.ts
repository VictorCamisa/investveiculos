import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AIAgentNotification } from '@/types/ai-agents';
import { toast } from 'sonner';

// Tipos de condição disponíveis
export const CONDITION_TYPES = [
  { value: 'low_lead_score', label: 'Lead Score Baixo', description: 'Quando o score do lead está abaixo de um limite', color: 'yellow' },
  { value: 'high_lead_score', label: 'Lead Score Alto', description: 'Quando o score do lead está acima de um limite', color: 'green' },
  { value: 'api_error', label: 'Erro de API', description: 'Quando ocorre erro em chamada de API', color: 'red' },
  { value: 'timeout', label: 'Timeout', description: 'Quando uma operação excede o tempo limite', color: 'orange' },
  { value: 'human_request', label: 'Solicitação de Humano', description: 'Quando o usuário pede para falar com atendente', color: 'blue' },
  { value: 'guardrail_violation', label: 'Violação de Guardrail', description: 'Quando uma guardrail é acionada', color: 'purple' },
  { value: 'conversation_escalation', label: 'Escalação de Conversa', description: 'Quando a conversa precisa de intervenção', color: 'pink' },
  { value: 'daily_summary', label: 'Resumo Diário', description: 'Resumo diário das atividades', color: 'gray' },
] as const;

// Canais de notificação
export const NOTIFICATION_CHANNELS = [
  { value: 'email', label: 'E-mail', icon: 'Mail' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'MessageSquare' },
  { value: 'slack', label: 'Slack', icon: 'Slack' },
  { value: 'push', label: 'Push Notification', icon: 'Bell' },
] as const;

// Templates de notificações pré-configuradas
export const NOTIFICATION_TEMPLATES = [
  {
    name: 'Lead Quente',
    condition_type: 'high_lead_score',
    channel: 'whatsapp',
    channel_config: { priority: 'high' },
    condition_config: { threshold: 85, operator: '>' },
  },
  {
    name: 'Lead Frio',
    condition_type: 'low_lead_score',
    channel: 'email',
    channel_config: { priority: 'normal' },
    condition_config: { threshold: 40, min_interactions: 3, operator: '<' },
  },
  {
    name: 'Erro Crítico',
    condition_type: 'api_error',
    channel: 'email',
    channel_config: { priority: 'urgent' },
    condition_config: { include_timeout: true },
  },
  {
    name: 'Escalação Humana',
    condition_type: 'human_request',
    channel: 'whatsapp',
    channel_config: { priority: 'high' },
    condition_config: { keywords: ['atendente', 'humano', 'pessoa'] },
  },
  {
    name: 'Resumo Diário',
    condition_type: 'daily_summary',
    channel: 'email',
    channel_config: { send_time: '18:00' },
    condition_config: { include_metrics: true, include_conversations: true },
  },
];

// Hook para buscar notificações do agente
export function useAIAgentNotifications(agentId: string | undefined) {
  return useQuery({
    queryKey: ['ai-agent-notifications', agentId],
    queryFn: async () => {
      if (!agentId) return [];
      
      const { data, error } = await supabase
        .from('ai_agent_notifications')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AIAgentNotification[];
    },
    enabled: !!agentId,
  });
}

// Hook para criar notificação
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<AIAgentNotification, 'id' | 'created_at'>) => {
      const { data: result, error } = await (supabase
        .from('ai_agent_notifications') as any)
        .insert({
          agent_id: data.agent_id,
          channel: data.channel,
          condition_type: data.condition_type,
          is_active: data.is_active,
          channel_config: data.channel_config,
          condition_config: data.condition_config,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-notifications', variables.agent_id] });
      toast.success('Notificação criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar notificação: ' + error.message);
    },
  });
}

// Hook para atualizar notificação
export function useUpdateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agentId, ...data }: Partial<AIAgentNotification> & { id: string; agentId: string }) => {
      const updateData: Record<string, unknown> = {};
      if (data.channel !== undefined) updateData.channel = data.channel;
      if (data.condition_type !== undefined) updateData.condition_type = data.condition_type;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      if (data.channel_config !== undefined) updateData.channel_config = data.channel_config;
      if (data.condition_config !== undefined) updateData.condition_config = data.condition_config;

      const { data: result, error } = await (supabase
        .from('ai_agent_notifications') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-notifications', variables.agentId] });
      toast.success('Notificação atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar notificação: ' + error.message);
    },
  });
}

// Hook para deletar notificação
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      const { error } = await supabase
        .from('ai_agent_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-notifications', variables.agentId] });
      toast.success('Notificação removida com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover notificação: ' + error.message);
    },
  });
}

// Hook para ativar/desativar notificação
export function useToggleNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agentId, is_active }: { id: string; agentId: string; is_active: boolean }) => {
      const { error } = await (supabase
        .from('ai_agent_notifications') as any)
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-notifications', variables.agentId] });
      toast.success(variables.is_active ? 'Notificação ativada!' : 'Notificação desativada!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao alterar status: ' + error.message);
    },
  });
}
