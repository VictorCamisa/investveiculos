import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AIAgentGuardrail, AIAgentGuardrailFormData } from '@/types/ai-agents';
import { toast } from 'sonner';

// =============================================
// GUARDRAILS CRUD COMPLETO
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
        .order('type', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AIAgentGuardrail[];
    },
    enabled: !!agentId,
  });
}

export function useCreateGuardrail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AIAgentGuardrailFormData) => {
      const insertData = {
        agent_id: data.agent_id,
        type: data.type,
        name: data.name,
        description: data.description,
        config: data.config,
        action_on_violation: data.action_on_violation,
        is_active: data.is_active,
      };
      
      // @ts-ignore - Supabase types issue
      const { data: result, error } = await supabase
        .from('ai_agent_guardrails')
        // @ts-ignore
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return result as AIAgentGuardrail;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-guardrails', data.agent_id] });
      toast.success('Guardrail criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar guardrail:', error);
      toast.error('Erro ao criar guardrail');
    },
  });
}

export function useUpdateGuardrail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agent_id, ...data }: Partial<AIAgentGuardrail> & { id: string; agent_id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (data.type !== undefined) updateData.type = data.type;
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.config !== undefined) updateData.config = data.config;
      if (data.action_on_violation !== undefined) updateData.action_on_violation = data.action_on_violation;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      
      // @ts-ignore - Supabase types issue
      const { data: result, error } = await supabase
        .from('ai_agent_guardrails')
        // @ts-ignore
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...(result as AIAgentGuardrail), agent_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-guardrails', data.agent_id] });
      toast.success('Guardrail atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar guardrail:', error);
      toast.error('Erro ao atualizar guardrail');
    },
  });
}

export function useDeleteGuardrail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      const { error } = await supabase
        .from('ai_agent_guardrails')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, agentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-guardrails', data.agentId] });
      toast.success('Guardrail excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir guardrail:', error);
      toast.error('Erro ao excluir guardrail');
    },
  });
}

export function useToggleGuardrail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agentId, isActive }: { id: string; agentId: string; isActive: boolean }) => {
      // @ts-ignore - Supabase types issue
      const { data: result, error } = await supabase
        .from('ai_agent_guardrails')
        // @ts-ignore
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...(result as AIAgentGuardrail), agentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-guardrails', data.agentId] });
      toast.success(data.is_active ? 'Guardrail ativado!' : 'Guardrail desativado!');
    },
    onError: (error) => {
      console.error('Erro ao alternar guardrail:', error);
      toast.error('Erro ao alternar guardrail');
    },
  });
}

// =============================================
// TEMPLATES DE GUARDRAILS PREDEFINIDOS
// =============================================

export interface GuardrailTemplate {
  type: string;
  name: string;
  description: string;
  action_on_violation: string;
  config: Record<string, unknown>;
}

export const GUARDRAIL_TEMPLATES: GuardrailTemplate[] = [
  // Filtros de Conteúdo
  {
    type: 'content_filter',
    name: 'Palavras Proibidas',
    description: 'Lista de termos que o agente não pode usar nas respostas',
    action_on_violation: 'block',
    config: {
      blocked_words: [],
      match_type: 'contains', // exact, contains, regex
      case_sensitive: false,
    },
  },
  {
    type: 'content_filter',
    name: 'Tópicos Sensíveis',
    description: 'Tópicos que devem ser evitados ou redirecionados',
    action_on_violation: 'warn',
    config: {
      sensitive_topics: ['política', 'religião', 'polêmicas'],
      redirect_message: 'Desculpe, não posso comentar sobre esse assunto. Posso ajudar com informações sobre nossos veículos?',
    },
  },
  {
    type: 'content_filter',
    name: 'Informações Confidenciais',
    description: 'Bloquear exposição de dados sensíveis',
    action_on_violation: 'block',
    config: {
      patterns: ['cpf', 'cnpj', 'senha', 'cartão'],
      protect_pii: true,
    },
  },
  
  // Regras de Negócio
  {
    type: 'business_rule',
    name: 'Política de Descontos',
    description: 'Nunca prometer descontos sem autorização',
    action_on_violation: 'escalate',
    config: {
      rule: 'no_discount_promise',
      escalation_message: 'Vou transferir você para um vendedor que pode discutir condições especiais.',
    },
  },
  {
    type: 'business_rule',
    name: 'Verificar Disponibilidade',
    description: 'Sempre consultar estoque antes de confirmar disponibilidade',
    action_on_violation: 'block',
    config: {
      rule: 'check_inventory_first',
      require_tool_call: 'consultar_estoque',
    },
  },
  {
    type: 'business_rule',
    name: 'Financiamento - Aviso Legal',
    description: 'Sempre informar que valores são estimativas',
    action_on_violation: 'warn',
    config: {
      rule: 'financing_disclaimer',
      disclaimer: 'Valores de parcela são estimativas sujeitas a análise de crédito.',
    },
  },
  {
    type: 'business_rule',
    name: 'Horário de Atendimento',
    description: 'Informar horário de funcionamento fora do expediente',
    action_on_violation: 'warn',
    config: {
      rule: 'business_hours',
      business_hours: { start: '08:00', end: '18:00' },
      out_of_hours_message: 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.',
    },
  },
  
  // Limites de Ação
  {
    type: 'action_limit',
    name: 'Chamadas de API por Conversa',
    description: 'Limitar número de ferramentas usadas por sessão',
    action_on_violation: 'escalate',
    config: {
      limit_type: 'api_calls',
      max_value: 10,
      per: 'conversation',
    },
  },
  {
    type: 'action_limit',
    name: 'Tempo de Resposta Máximo',
    description: 'Timeout para geração de resposta',
    action_on_violation: 'warn',
    config: {
      limit_type: 'response_time',
      max_value: 30,
      unit: 'seconds',
    },
  },
  {
    type: 'action_limit',
    name: 'Turnos sem Progresso',
    description: 'Escalar após muitas trocas sem avanço',
    action_on_violation: 'escalate',
    config: {
      limit_type: 'stale_turns',
      max_value: 5,
      escalation_message: 'Percebo que ainda temos dúvidas. Deixe-me conectar você com um especialista.',
    },
  },
  {
    type: 'action_limit',
    name: 'Tokens por Resposta',
    description: 'Limitar tamanho das respostas',
    action_on_violation: 'warn',
    config: {
      limit_type: 'response_tokens',
      max_value: 500,
    },
  },
  
  // Moderação
  {
    type: 'moderation',
    name: 'Conteúdo Ofensivo',
    description: 'Bloquear respostas com conteúdo ofensivo',
    action_on_violation: 'block',
    config: {
      moderation_type: 'offensive',
      use_api: true,
      threshold: 0.8,
    },
  },
  {
    type: 'moderation',
    name: 'Linguagem Inadequada',
    description: 'Filtrar linguagem inapropriada',
    action_on_violation: 'block',
    config: {
      moderation_type: 'profanity',
      use_api: true,
      threshold: 0.7,
    },
  },
  {
    type: 'moderation',
    name: 'Informações Pessoais Expostas',
    description: 'Detectar e proteger dados pessoais nas respostas',
    action_on_violation: 'escalate',
    config: {
      moderation_type: 'pii_exposure',
      detect_patterns: ['email', 'phone', 'cpf', 'address'],
    },
  },
];
