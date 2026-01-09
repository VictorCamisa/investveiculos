import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { Sale, SaleProfitReport, PaymentMethod, SaleStatus } from '@/types/sales';

// Shared query options - reduced caching for better real-time updates
const salesQueryOptions = {
  staleTime: 1000 * 30, // 30 seconds
  gcTime: 1000 * 60 * 5, // 5 minutes
  refetchOnWindowFocus: true,
  refetchOnMount: true,
};

export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async (): Promise<Sale[]> => {
      const { data, error } = await (supabase as any)
        .from('sales')
        .select(`
          *,
          customer:customers(id, name, phone),
          vehicle:vehicles(id, brand, model, year_model, plate)
        `)
        .order('sale_date', { ascending: false });

      if (error) throw error;

      const sales = (data || []) as Sale[];

      // Enriquecer com dados do vendedor sem depender de FK (evita erro PGRST200)
      const salespersonIds = Array.from(
        new Set(sales.map((s) => s.salesperson_id).filter(Boolean))
      );

      if (salespersonIds.length === 0) return sales;

      const { data: profilesData } = await (supabase as any)
        .from('profiles')
        .select('id, full_name')
        .in('id', salespersonIds);

      const profileMap = new Map<string, { id: string; full_name: string | null }>();
      (profilesData || []).forEach((p: any) => profileMap.set(p.id, p));

      return sales.map((s) => ({
        ...s,
        salesperson: profileMap.get(s.salesperson_id) || null,
      }));
    },
    ...salesQueryOptions,
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: async (): Promise<Sale | null> => {
      const { data, error } = await (supabase as any)
        .from('sales')
        .select(`
          *,
          customer:customers(id, name, phone),
          vehicle:vehicles(id, brand, model, year_model, plate)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      const sale = data as Sale | null;
      if (!sale?.salesperson_id) return sale;

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('id, full_name')
        .eq('id', sale.salesperson_id)
        .maybeSingle();

      return {
        ...sale,
        salesperson: profile || null,
      } as Sale;
    },
    enabled: !!id,
    ...salesQueryOptions,
  });
}

export function useSaleProfitReports() {
  return useQuery({
    queryKey: ['sale-profit-reports'],
    queryFn: async (): Promise<SaleProfitReport[]> => {
      const { data, error } = await (supabase as any)
        .from('sale_profit_report')
        .select('*')
        .order('sale_date', { ascending: false });

      if (error) throw error;
      return (data || []) as SaleProfitReport[];
    },
    ...salesQueryOptions,
  });
}

interface CreateSaleInput {
  customer_id: string;
  vehicle_id: string;
  lead_id?: string | null;
  salesperson_id?: string; // Vendedor responsável (da negociação)
  sale_date?: string;
  sale_price: number;
  payment_method: PaymentMethod;
  payment_details?: string;
  documentation_cost?: number;
  transfer_cost?: number;
  other_sale_costs?: number;
  status?: SaleStatus;
  notes?: string;
}

export function useCreateSale() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      // Se salesperson_id for passado, usa ele; senão usa o usuário logado (fallback)
      const { salesperson_id, ...rest } = input;
      const { data, error } = await (supabase as any)
        .from('sales')
        .insert({
          ...rest,
          salesperson_id: salesperson_id || user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale-profit-reports'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Venda registrada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao registrar venda', description: error.message, variant: 'destructive' });
    },
  });
}

interface UpdateSaleInput {
  id: string;
  customer_id?: string;
  vehicle_id?: string;
  lead_id?: string | null;
  sale_date?: string;
  sale_price?: number;
  payment_method?: PaymentMethod;
  payment_details?: string;
  documentation_cost?: number;
  transfer_cost?: number;
  other_sale_costs?: number;
  status?: SaleStatus;
  notes?: string;
}

export function useUpdateSale() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateSaleInput) => {
      const { data, error } = await (supabase as any)
        .from('sales')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale-profit-reports'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({ title: 'Venda atualizada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar venda', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteSale() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale-profit-reports'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({ title: 'Venda excluída com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir venda', description: error.message, variant: 'destructive' });
    },
  });
}
