import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CRMAgentState {
  agentId: string | null;
  isEnabled: boolean;
  agentName: string | null;
  instanceName: string | null;
}

export function useCRMAgent() {
  const queryClient = useQueryClient();

  // Find the AI agent connected to the lead source WhatsApp instance
  const { data: agentState, isLoading } = useQuery({
    queryKey: ['crm-agent-state'],
    queryFn: async (): Promise<CRMAgentState> => {
      // First find the lead source instance
      const { data: leadSourceInstance, error: instanceError } = await (supabase
        .from('whatsapp_instances') as any)
        .select('id, instance_name')
        .eq('is_lead_source', true)
        .maybeSingle();

      if (instanceError) {
        console.error('Error fetching lead source instance:', instanceError);
        throw instanceError;
      }

      if (!leadSourceInstance) {
        return {
          agentId: null,
          isEnabled: false,
          agentName: null,
          instanceName: null,
        };
      }

      // Find agent connected to this instance
      const { data: agent, error: agentError } = await (supabase
        .from('ai_agents') as any)
        .select('id, name, status, whatsapp_auto_reply')
        .eq('whatsapp_instance_id', leadSourceInstance.id)
        .maybeSingle();

      if (agentError) {
        console.error('Error fetching agent:', agentError);
        throw agentError;
      }

      return {
        agentId: agent?.id ?? null,
        isEnabled: agent?.status === 'active' && agent?.whatsapp_auto_reply === true,
        agentName: agent?.name ?? null,
        instanceName: leadSourceInstance.instance_name ?? null,
      };
    },
  });

  const toggleAgent = useMutation({
    mutationFn: async (enable: boolean) => {
      if (!agentState?.agentId) {
        throw new Error('Nenhum agente configurado para a instância principal');
      }

      const { error } = await (supabase
        .from('ai_agents') as any)
        .update({
          status: enable ? 'active' : 'inactive',
          whatsapp_auto_reply: enable,
        })
        .eq('id', agentState.agentId);

      if (error) throw error;
      return enable;
    },
    onSuccess: (enabled) => {
      queryClient.invalidateQueries({ queryKey: ['crm-agent-state'] });
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      toast.success(enabled ? 'Agente ativado!' : 'Agente desativado!');
    },
    onError: (error: Error) => {
      console.error('Error toggling agent:', error);
      toast.error(error.message || 'Erro ao alterar status do agente');
    },
  });

  return {
    agentState: agentState || { agentId: null, isEnabled: false, agentName: null, instanceName: null },
    isLoading,
    toggleAgent: toggleAgent.mutate,
    isToggling: toggleAgent.isPending,
  };
}
