import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Contract {
  id: string;
  contract_number: string;
  contract_type: 'venda' | 'compra';
  status: 'draft' | 'pending' | 'signed' | 'cancelled';
  customer_id?: string;
  customer_name: string;
  customer_nationality?: string;
  customer_profession?: string;
  customer_marital_status?: string;
  customer_rg?: string;
  customer_cpf?: string;
  customer_birth_date?: string;
  customer_address?: string;
  customer_city?: string;
  customer_state?: string;
  customer_zip?: string;
  customer_phone?: string;
  customer_email?: string;
  vehicle_id?: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: string;
  vehicle_plate?: string;
  vehicle_color?: string;
  vehicle_renavam?: string;
  vehicle_odometer?: number;
  vehicle_value: number;
  trade_in_brand?: string;
  trade_in_model?: string;
  trade_in_year?: string;
  trade_in_plate?: string;
  trade_in_color?: string;
  trade_in_renavam?: string;
  trade_in_value?: number;
  down_payment?: number;
  installments_count?: number;
  installment_value?: number;
  installment_due_day?: number;
  notes?: string;
  signed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractFormData {
  contract_type: 'venda' | 'compra';
  customer_id?: string;
  customer_name: string;
  customer_nationality?: string;
  customer_profession?: string;
  customer_marital_status?: string;
  customer_rg?: string;
  customer_cpf?: string;
  customer_birth_date?: string;
  customer_address?: string;
  customer_city?: string;
  customer_state?: string;
  customer_zip?: string;
  customer_phone?: string;
  customer_email?: string;
  vehicle_id?: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: string;
  vehicle_plate?: string;
  vehicle_color?: string;
  vehicle_renavam?: string;
  vehicle_odometer?: number;
  vehicle_value: number;
  trade_in_brand?: string;
  trade_in_model?: string;
  trade_in_year?: string;
  trade_in_plate?: string;
  trade_in_color?: string;
  trade_in_renavam?: string;
  trade_in_value?: number;
  down_payment?: number;
  installments_count?: number;
  installment_value?: number;
  installment_due_day?: number;
  negotiation_details?: string;
  notes?: string;
}

export function useContracts() {
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading, error } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Contract[];
    },
  });

  const createContract = useMutation({
    mutationFn: async (data: ContractFormData & { updateRelated?: boolean }) => {
      const { updateRelated, negotiation_details, ...contractData } = data;
      
      if (updateRelated && contractData.customer_id) {
        await (supabase as any)
          .from('customers')
          .update({
            name: contractData.customer_name,
            cpf_cnpj: contractData.customer_cpf || null,
            phone: contractData.customer_phone || null,
            email: contractData.customer_email || null,
            address: contractData.customer_address || null,
            city: contractData.customer_city || null,
            state: contractData.customer_state || null,
          })
          .eq('id', contractData.customer_id);
      }

      const { data: result, error } = await (supabase as any)
        .from('contracts')
        .insert({
          ...contractData,
          contract_number: '',
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar contrato'),
  });

  const updateContract = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Contract> & { id: string }) => {
      const { data: result, error } = await (supabase as any)
        .from('contracts')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar contrato'),
  });

  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato excluído!');
    },
    onError: () => toast.error('Erro ao excluir contrato'),
  });

  const stats = {
    total: contracts.length,
    signed: contracts.filter(c => c.status === 'signed').length,
    pending: contracts.filter(c => c.status === 'pending').length,
    draft: contracts.filter(c => c.status === 'draft').length,
  };

  return { contracts, isLoading, error, stats, createContract, updateContract, deleteContract };
}
