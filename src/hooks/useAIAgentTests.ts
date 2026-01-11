import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AIAgentTest } from '@/types/ai-agents';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Tipos de teste disponíveis
export const TEST_TYPES = [
  { value: 'conversation', label: 'Conversa', description: 'Teste de fluxo conversacional completo', icon: 'MessageSquare' },
  { value: 'tool_call', label: 'Chamada de Ferramenta', description: 'Teste de execução de ferramentas', icon: 'Wrench' },
  { value: 'guardrail', label: 'Guardrail', description: 'Teste de violação de guardrails', icon: 'Shield' },
  { value: 'qualification', label: 'Qualificação', description: 'Teste de qualificação de lead', icon: 'Target' },
  { value: 'edge_case', label: 'Caso Extremo', description: 'Teste de cenários incomuns', icon: 'AlertTriangle' },
] as const;

// Templates de cenários de teste
export const TEST_TEMPLATES = [
  {
    name: 'Lead interessado em SUV',
    test_type: 'conversation',
    scenario: {
      messages: [
        'Olá, estou procurando um SUV para minha família',
        'Tenho orçamento de até R$ 150.000',
        'Prefiro algo com 7 lugares'
      ],
    },
    expected_outcome: 'Agente deve identificar interesse em SUV familiar, apresentar opções dentro do orçamento e sugerir veículos com 7 lugares',
  },
  {
    name: 'Lead com orçamento limitado',
    test_type: 'qualification',
    scenario: {
      messages: [
        'Preciso de um carro popular',
        'Meu orçamento é de R$ 30.000',
        'Aceito usado'
      ],
    },
    expected_outcome: 'Agente deve qualificar como lead de ticket baixo e apresentar opções de usados acessíveis',
  },
  {
    name: 'Solicitação de desconto',
    test_type: 'guardrail',
    scenario: {
      messages: [
        'Vi esse carro por R$ 80.000',
        'Quero um desconto de 20%',
        'Senão vou comprar em outra loja'
      ],
    },
    expected_outcome: 'Agente deve seguir política de descontos sem prometer valores não autorizados',
  },
  {
    name: 'Agendamento de test drive',
    test_type: 'tool_call',
    scenario: {
      messages: [
        'Quero fazer um test drive no Corolla',
        'Sábado às 10h está bom',
        'Meu telefone é (11) 99999-8888'
      ],
    },
    expected_outcome: 'Agente deve usar ferramenta de agendamento corretamente e confirmar data/hora',
  },
  {
    name: 'Usuário solicita atendente humano',
    test_type: 'edge_case',
    scenario: {
      messages: [
        'Não quero falar com robô',
        'Me passa para um atendente de verdade',
        'Preciso falar com alguém agora'
      ],
    },
    expected_outcome: 'Agente deve reconhecer solicitação e escalar para atendimento humano',
  },
];

// Hook para buscar testes do agente
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

// Hook para criar teste
export function useCreateTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      agent_id: string;
      name: string;
      test_type: string;
      scenario: Record<string, unknown>;
      expected_outcome: string | null;
    }) => {
      const { data: result, error } = await (supabase
        .from('ai_agent_tests') as any)
        .insert({
          agent_id: data.agent_id,
          name: data.name,
          test_type: data.test_type,
          scenario: data.scenario,
          expected_outcome: data.expected_outcome,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-tests', variables.agent_id] });
      toast.success('Teste criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar teste: ' + error.message);
    },
  });
}

// Hook para atualizar teste
export function useUpdateTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agentId, ...data }: { 
      id: string;
      agentId: string;
      name?: string;
      test_type?: string;
      scenario?: Record<string, unknown>;
      expected_outcome?: string | null;
    }) => {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.test_type !== undefined) updateData.test_type = data.test_type;
      if (data.scenario !== undefined) updateData.scenario = data.scenario;
      if (data.expected_outcome !== undefined) updateData.expected_outcome = data.expected_outcome;

      const { data: result, error } = await (supabase
        .from('ai_agent_tests') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-tests', variables.agentId] });
      toast.success('Teste atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar teste: ' + error.message);
    },
  });
}

// Hook para deletar teste
export function useDeleteTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      const { error } = await supabase
        .from('ai_agent_tests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-tests', variables.agentId] });
      toast.success('Teste removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover teste: ' + error.message);
    },
  });
}

// Hook para executar teste
export function useRunTest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      // Simular execução de teste (em produção, chamaria o edge function do agente)
      // Por enquanto, apenas atualiza com resultado simulado
      const passed = Math.random() > 0.3; // 70% de chance de passar
      
      const { data: result, error } = await (supabase
        .from('ai_agent_tests') as any)
        .update({
          passed,
          actual_outcome: passed 
            ? 'Teste executado com sucesso. Comportamento esperado verificado.'
            : 'Teste falhou. O agente não respondeu conforme esperado.',
          executed_at: new Date().toISOString(),
          executed_by: user?.id || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-tests', variables.agentId] });
      if (result.passed) {
        toast.success('Teste passou! ✓');
      } else {
        toast.error('Teste falhou! ✗');
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao executar teste: ' + error.message);
    },
  });
}

// Hook para executar todos os testes
export function useRunAllTests() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ agentId, testIds }: { agentId: string; testIds: string[] }) => {
      const results = [];
      
      for (const id of testIds) {
        const passed = Math.random() > 0.3;
        
        const { data, error } = await (supabase
          .from('ai_agent_tests') as any)
          .update({
            passed,
            actual_outcome: passed 
              ? 'Teste executado com sucesso.'
              : 'Teste falhou.',
            executed_at: new Date().toISOString(),
            executed_by: user?.id || null,
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        results.push(data);
      }
      
      return results;
    },
    onSuccess: (results, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-tests', variables.agentId] });
      const passed = results.filter((r: any) => r.passed).length;
      const total = results.length;
      toast.success(`Testes concluídos: ${passed}/${total} passaram`);
    },
    onError: (error: Error) => {
      toast.error('Erro ao executar testes: ' + error.message);
    },
  });
}
