import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import type { 
  AIAgent, 
  AIAgentTool, 
  AIAgentDataSource, 
  AIAgentWorkflow,
  AIAgentGuardrail,
  AIAgentMetrics,
  AIAgentConversation,
  AIAgentNotification,
  AIAgentTest
} from '@/types/ai-agents';

type AIAgentUpdate = Database['public']['Tables']['ai_agents']['Update'];
type AIAgentToolUpdate = Database['public']['Tables']['ai_agent_tools']['Update'];

// =============================================
// AGENTS CRUD
// =============================================

export function useAIAgents() {
  return useQuery({
    queryKey: ['ai-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AIAgent[];
    },
  });
}

export function useAIAgent(id: string | undefined) {
  return useQuery({
    queryKey: ['ai-agent', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as AIAgent;
    },
    enabled: !!id,
  });
}

export function useCreateAIAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agent: Partial<AIAgent>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('ai_agents')
        .insert({
          name: agent.name!,
          description: agent.description,
          objective: agent.objective,
          status: agent.status,
          llm_provider: agent.llm_provider,
          llm_model: agent.llm_model,
          temperature: agent.temperature,
          top_p: agent.top_p,
          max_tokens: agent.max_tokens,
          system_prompt: agent.system_prompt,
          short_term_memory_type: agent.short_term_memory_type,
          context_window_size: agent.context_window_size,
          long_term_memory_enabled: agent.long_term_memory_enabled,
          vector_db_provider: agent.vector_db_provider,
          output_format: agent.output_format,
          created_by: user?.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as AIAgent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      toast.success('Agente criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating agent:', error);
      toast.error('Erro ao criar agente');
    },
  });
}

export function useUpdateAIAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AIAgent> & { id: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { tools, guardrails, workflows, ...rest } = updates;
      
      // Build clean update object with proper typing
      const updatePayload = Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v !== undefined)
      ) as AIAgentUpdate;

      const { data, error } = await supabase
        .from('ai_agents')
        // @ts-expect-error - Supabase types issue with update payload
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AIAgent;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      queryClient.invalidateQueries({ queryKey: ['ai-agent', data.id] });
      toast.success('Agente atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating agent:', error);
      toast.error('Erro ao atualizar agente');
    },
  });
}

export function useDeleteAIAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      toast.success('Agente excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting agent:', error);
      toast.error('Erro ao excluir agente');
    },
  });
}

// =============================================
// TOOLS CRUD
// =============================================

export function useAIAgentTools(agentId: string | undefined) {
  return useQuery({
    queryKey: ['ai-agent-tools', agentId],
    queryFn: async () => {
      if (!agentId) return [];
      
      const { data, error } = await supabase
        .from('ai_agent_tools')
        .select('*')
        .eq('agent_id', agentId)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data as AIAgentTool[];
    },
    enabled: !!agentId,
  });
}

export function useCreateAIAgentTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tool: Partial<AIAgentTool>) => {
      const { data, error } = await supabase
        .from('ai_agent_tools')
        .insert(tool as any)
        .select()
        .single();

      if (error) throw error;
      return data as AIAgentTool;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-tools', data.agent_id] });
      toast.success('Ferramenta criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating tool:', error);
      toast.error('Erro ao criar ferramenta');
    },
  });
}

export function useUpdateAIAgentTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AIAgentTool> & { id: string }) => {
      const { data, error } = await supabase
        .from('ai_agent_tools')
        // @ts-expect-error - Supabase types issue with update payload
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AIAgentTool;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-tools', data.agent_id] });
      toast.success('Ferramenta atualizada!');
    },
    onError: (error) => {
      console.error('Error updating tool:', error);
      toast.error('Erro ao atualizar ferramenta');
    },
  });
}

export function useDeleteAIAgentTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      const { error } = await supabase
        .from('ai_agent_tools')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return agentId;
    },
    onSuccess: (agentId) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-tools', agentId] });
      toast.success('Ferramenta excluída!');
    },
    onError: (error) => {
      console.error('Error deleting tool:', error);
      toast.error('Erro ao excluir ferramenta');
    },
  });
}

// =============================================
// DATA SOURCES CRUD
// =============================================

export function useAIAgentDataSources(agentId: string | undefined) {
  return useQuery({
    queryKey: ['ai-agent-data-sources', agentId],
    queryFn: async () => {
      if (!agentId) return [];
      
      const { data, error } = await supabase
        .from('ai_agent_data_sources')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AIAgentDataSource[];
    },
    enabled: !!agentId,
  });
}

export function useCreateAIAgentDataSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dataSource: Partial<AIAgentDataSource>) => {
      const { data, error } = await supabase
        .from('ai_agent_data_sources')
        .insert(dataSource as any)
        .select()
        .single();

      if (error) throw error;
      return data as AIAgentDataSource;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-data-sources', data.agent_id] });
      toast.success('Fonte de dados criada!');
    },
    onError: (error) => {
      console.error('Error creating data source:', error);
      toast.error('Erro ao criar fonte de dados');
    },
  });
}

// =============================================
// WORKFLOWS CRUD
// =============================================

export function useAIAgentWorkflows(agentId: string | undefined) {
  return useQuery({
    queryKey: ['ai-agent-workflows', agentId],
    queryFn: async () => {
      if (!agentId) return [];
      
      const { data, error } = await supabase
        .from('ai_agent_workflows')
        .select('*')
        .eq('agent_id', agentId)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data as AIAgentWorkflow[];
    },
    enabled: !!agentId,
  });
}

// =============================================
// GUARDRAILS CRUD
// =============================================

export function useAIAgentGuardrails(agentId: string | undefined) {
  return useQuery({
    queryKey: ['ai-agent-guardrails', agentId],
    queryFn: async () => {
      if (!agentId) return [];
      
      const { data, error } = await supabase
        .from('ai_agent_guardrails')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AIAgentGuardrail[];
    },
    enabled: !!agentId,
  });
}

// =============================================
// METRICS
// =============================================

export function useAIAgentMetrics(agentId: string | undefined, days: number = 7) {
  return useQuery({
    queryKey: ['ai-agent-metrics', agentId, days],
    queryFn: async () => {
      if (!agentId) return [];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('ai_agent_metrics')
        .select('*')
        .eq('agent_id', agentId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      return data as AIAgentMetrics[];
    },
    enabled: !!agentId,
  });
}

// =============================================
// CONVERSATIONS
// =============================================

export function useAIAgentConversations(agentId: string | undefined, limit: number = 50) {
  return useQuery({
    queryKey: ['ai-agent-conversations', agentId, limit],
    queryFn: async () => {
      if (!agentId) return [];
      
      const { data, error } = await supabase
        .from('ai_agent_conversations')
        .select('*')
        .eq('agent_id', agentId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AIAgentConversation[];
    },
    enabled: !!agentId,
  });
}

// =============================================
// NOTIFICATIONS
// =============================================

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

// =============================================
// TESTS
// =============================================

export function useAIAgentTests(agentId: string | undefined) {
  return useQuery({
    queryKey: ['ai-agent-tests', agentId],
    queryFn: async () => {
      if (!agentId) return [];
      
      const { data, error } = await supabase
        .from('ai_agent_tests')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AIAgentTest[];
    },
    enabled: !!agentId,
  });
}
