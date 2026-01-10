import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Customer } from '@/types/crm';
import { toast } from 'sonner';

// staleTime: 0 garante refetch imediato após mutations
const customerQueryOptions = {
  staleTime: 0,
  gcTime: 1000 * 60 * 5,
  refetchOnWindowFocus: true,
};

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async (): Promise<Customer[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Customer[];
    },
    ...customerQueryOptions,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: async (): Promise<Customer | null> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Customer | null;
    },
    enabled: !!id,
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; [key: string]: unknown }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('customers')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['customers'] });
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar cliente: ${error.message}`);
    },
  });
}

interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  lead_id?: string;
  cpf_cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCustomerInput) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('customers')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['customers'] });
      toast.success('Cliente criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar cliente: ${error.message}`);
    },
  });
}

// Get customer with all related data
export function useCustomerDetails(id: string) {
  return useQuery({
    queryKey: ['customers', id, 'details'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: customer, error: customerError } = await (supabase as any)
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (customerError) throw customerError;
      if (!customer) return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: negotiations } = await (supabase as any)
        .from('negotiations')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sales } = await (supabase as any)
        .from('sales')
        .select('*, vehicle:vehicles(id, brand, model, year_model, plate)')
        .eq('customer_id', id)
        .order('sale_date', { ascending: false });

      let interactions: unknown[] = [];
      if (customer.lead_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: intData } = await (supabase as any)
          .from('lead_interactions')
          .select('*')
          .eq('lead_id', customer.lead_id)
          .order('created_at', { ascending: false });
        interactions = intData || [];
      }

      return {
        ...customer,
        negotiations: negotiations || [],
        sales: sales || [],
        interactions,
      };
    },
    enabled: !!id,
  });
}
