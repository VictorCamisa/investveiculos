import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FinancialTransaction {
  id: string;
  type: 'receita' | 'despesa';
  category: string;
  subcategory?: string | null;
  description: string;
  amount: number;
  transaction_date: string;
  due_date?: string | null;
  paid_at?: string | null;
  status: 'pendente' | 'pago' | 'cancelado';
  payment_method?: string | null;
  recurrence?: 'unica' | 'mensal' | 'semanal' | 'anual' | null;
  recurrence_end_date?: string | null;
  notes?: string | null;
  vehicle_id?: string | null;
  sale_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialCategory {
  id: string;
  name: string;
  type: 'receita' | 'despesa' | 'ambos';
  parent_id?: string | null;
  icon?: string | null;
  color?: string | null;
  is_system: boolean;
  created_at: string;
}

export interface CreateTransactionInput {
  type: 'receita' | 'despesa';
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  transaction_date: string;
  due_date?: string;
  status?: 'pendente' | 'pago' | 'cancelado';
  payment_method?: string;
  recurrence?: 'unica' | 'mensal' | 'semanal' | 'anual';
  recurrence_end_date?: string;
  notes?: string;
  vehicle_id?: string;
  sale_id?: string;
}

// Helper type to bypass strict Supabase typing
type AnyRecord = Record<string, unknown>;

export function useFinancialTransactions(filters?: {
  type?: 'receita' | 'despesa';
  status?: 'pendente' | 'pago' | 'cancelado';
  startDate?: string;
  endDate?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ['financial-transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('financial_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.startDate) {
        query = query.gte('transaction_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('transaction_date', filters.endDate);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as FinancialTransaction[];
    },
  });
}

export function useFinancialCategories(type?: 'receita' | 'despesa') {
  return useQuery({
    queryKey: ['financial-categories', type],
    queryFn: async () => {
      let query = supabase
        .from('financial_categories')
        .select('*')
        .order('name');

      if (type) {
        query = query.or(`type.eq.${type},type.eq.ambos`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as FinancialCategory[];
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const { data: user } = await supabase.auth.getUser();
      
      const insertData: AnyRecord = {
        type: input.type,
        category: input.category,
        subcategory: input.subcategory,
        description: input.description,
        amount: input.amount,
        transaction_date: input.transaction_date,
        due_date: input.due_date,
        status: input.status || 'pendente',
        payment_method: input.payment_method,
        recurrence: input.recurrence || 'unica',
        recurrence_end_date: input.recurrence_end_date,
        notes: input.notes,
        vehicle_id: input.vehicle_id,
        sale_id: input.sale_id,
        created_by: user.user?.id,
      };
      
      const { data, error } = await (supabase
        .from('financial_transactions') as unknown as { insert: (data: AnyRecord) => { select: () => { single: () => Promise<{ data: unknown; error: Error | null }> } } })
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as FinancialTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast.success('Lançamento criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar lançamento: ' + error.message);
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateTransactionInput> & { id: string }) => {
      const updateData: AnyRecord = { ...input };
      
      const { data, error } = await (supabase
        .from('financial_transactions') as unknown as { update: (data: AnyRecord) => { eq: (col: string, val: string) => { select: () => { single: () => Promise<{ data: unknown; error: Error | null }> } } } })
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as FinancialTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast.success('Lançamento atualizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast.success('Lançamento excluído!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir: ' + error.message);
    },
  });
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const updateData: AnyRecord = {
        status: 'pago',
        paid_at: new Date().toISOString(),
      };
      
      const { data, error } = await (supabase
        .from('financial_transactions') as unknown as { update: (data: AnyRecord) => { eq: (col: string, val: string) => { select: () => { single: () => Promise<{ data: unknown; error: Error | null }> } } } })
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as FinancialTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast.success('Marcado como pago!');
    },
    onError: (error: Error) => {
      toast.error('Erro: ' + error.message);
    },
  });
}

export function useFinancialSummary() {
  const { data: transactions } = useFinancialTransactions();

  const summary = {
    totalReceitas: 0,
    totalDespesas: 0,
    saldo: 0,
    receitasPagas: 0,
    despesasPagas: 0,
    receitasPendentes: 0,
    despesasPendentes: 0,
  };

  transactions?.forEach((t) => {
    const amount = Number(t.amount);
    
    if (t.type === 'receita') {
      summary.totalReceitas += amount;
      if (t.status === 'pago') {
        summary.receitasPagas += amount;
      } else if (t.status === 'pendente') {
        summary.receitasPendentes += amount;
      }
    } else {
      summary.totalDespesas += amount;
      if (t.status === 'pago') {
        summary.despesasPagas += amount;
      } else if (t.status === 'pendente') {
        summary.despesasPendentes += amount;
      }
    }
  });

  summary.saldo = summary.totalReceitas - summary.totalDespesas;

  return summary;
}
