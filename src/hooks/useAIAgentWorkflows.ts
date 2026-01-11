import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AIAgentWorkflow } from '@/types/ai-agents';

// =============================================
// WORKFLOWS CRUD COMPLETO
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

export function useCreateAIAgentWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workflow: Partial<AIAgentWorkflow>) => {
      const { data, error } = await supabase
        .from('ai_agent_workflows')
        .insert({
          agent_id: workflow.agent_id!,
          name: workflow.name!,
          description: workflow.description,
          workflow_definition: workflow.workflow_definition || {},
          trigger_conditions: workflow.trigger_conditions,
          is_default: workflow.is_default || false,
          is_active: workflow.is_active ?? true,
          priority: workflow.priority || 0,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as AIAgentWorkflow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-workflows', data.agent_id] });
      toast.success('Workflow criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating workflow:', error);
      toast.error('Erro ao criar workflow');
    },
  });
}

export function useUpdateAIAgentWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AIAgentWorkflow> & { id: string }) => {
      const updatePayload = {
        name: updates.name,
        description: updates.description,
        workflow_definition: updates.workflow_definition,
        trigger_conditions: updates.trigger_conditions,
        is_default: updates.is_default,
        is_active: updates.is_active,
        priority: updates.priority,
      };
      
      const { data, error } = await supabase
        .from('ai_agent_workflows')
        // @ts-ignore - Supabase types mismatch
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AIAgentWorkflow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-workflows', data.agent_id] });
      toast.success('Workflow atualizado!');
    },
    onError: (error) => {
      console.error('Error updating workflow:', error);
      toast.error('Erro ao atualizar workflow');
    },
  });
}

export function useDeleteAIAgentWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      const { error } = await supabase
        .from('ai_agent_workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return agentId;
    },
    onSuccess: (agentId) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-workflows', agentId] });
      toast.success('Workflow excluído!');
    },
    onError: (error) => {
      console.error('Error deleting workflow:', error);
      toast.error('Erro ao excluir workflow');
    },
  });
}

export function useToggleAIAgentWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agentId, isActive }: { id: string; agentId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('ai_agent_workflows')
        // @ts-ignore - Supabase types mismatch
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { workflow: data as AIAgentWorkflow, agentId };
    },
    onSuccess: ({ workflow, agentId }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-workflows', agentId] });
      toast.success(workflow.is_active ? 'Workflow ativado!' : 'Workflow desativado!');
    },
    onError: (error) => {
      console.error('Error toggling workflow:', error);
      toast.error('Erro ao alterar status do workflow');
    },
  });
}

export function useSetDefaultWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      // Primeiro, remove o default de todos os workflows deste agente
      await supabase
        .from('ai_agent_workflows')
        // @ts-ignore - Supabase types mismatch
        .update({ is_default: false })
        .eq('agent_id', agentId);

      // Define o novo workflow como padrão
      const { data, error } = await supabase
        .from('ai_agent_workflows')
        // @ts-ignore - Supabase types mismatch
        .update({ is_default: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { workflow: data as AIAgentWorkflow, agentId };
    },
    onSuccess: ({ agentId }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-workflows', agentId] });
      toast.success('Workflow definido como padrão!');
    },
    onError: (error) => {
      console.error('Error setting default workflow:', error);
      toast.error('Erro ao definir workflow padrão');
    },
  });
}

// =============================================
// TIPOS DE WORKFLOW
// =============================================

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  action: string;
  order: number;
}

export interface WorkflowTransitionRule {
  id: string;
  condition: string;
  action: string;
  targetStep?: string;
}

export interface GoalHierarchyItem {
  id: string;
  goal: string;
  priority: 'maximum' | 'high' | 'medium' | 'low';
  order: number;
}

export interface WorkflowDefinition {
  steps: WorkflowStep[];
  transitionRules: WorkflowTransitionRule[];
  goalHierarchy: GoalHierarchyItem[];
}

// Helpers para manipular workflow_definition
export function parseWorkflowDefinition(definition: Record<string, unknown>): WorkflowDefinition {
  return {
    steps: (definition.steps as WorkflowStep[]) || [],
    transitionRules: (definition.transitionRules as WorkflowTransitionRule[]) || [],
    goalHierarchy: (definition.goalHierarchy as GoalHierarchyItem[]) || [],
  };
}

export function serializeWorkflowDefinition(definition: WorkflowDefinition): Record<string, unknown> {
  return {
    steps: definition.steps,
    transitionRules: definition.transitionRules,
    goalHierarchy: definition.goalHierarchy,
  };
}
