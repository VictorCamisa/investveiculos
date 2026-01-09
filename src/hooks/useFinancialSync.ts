import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface FinancialSyncData {
  vehicle_id?: string;
  sale_id?: string;
  type: 'receita' | 'despesa';
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  transaction_date: string;
  status?: 'pendente' | 'pago';
}

// Sincronizar compra de veículo como despesa
export async function syncVehiclePurchase(vehicle: {
  id: string;
  brand: string;
  model: string;
  purchase_price?: number;
  purchase_date?: string;
}) {
  if (!vehicle.purchase_price || vehicle.purchase_price <= 0) return;

  const transactionDate = vehicle.purchase_date || new Date().toISOString().split('T')[0];
  
  // Verifica se já existe lançamento para este veículo
  const { data: existing } = await (supabase as any)
    .from('financial_transactions')
    .select('id')
    .eq('vehicle_id', vehicle.id)
    .eq('category', 'Aquisição Veículos')
    .maybeSingle();

  if (existing) {
    // Atualiza se já existe
    await (supabase as any)
      .from('financial_transactions')
      .update({
        amount: vehicle.purchase_price,
        transaction_date: transactionDate,
        description: `Compra: ${vehicle.brand} ${vehicle.model}`,
      })
      .eq('id', existing.id);
  } else {
    // Cria novo lançamento
    await (supabase as any)
      .from('financial_transactions')
      .insert({
        vehicle_id: vehicle.id,
        type: 'despesa',
        category: 'Aquisição Veículos',
        subcategory: 'Compra de Estoque',
        description: `Compra: ${vehicle.brand} ${vehicle.model}`,
        amount: vehicle.purchase_price,
        transaction_date: transactionDate,
        status: 'pago',
        paid_at: transactionDate,
      });
  }
}

// Sincronizar custo de veículo como despesa
export async function syncVehicleCost(cost: {
  id: string;
  vehicle_id: string;
  cost_type: string;
  description: string;
  amount: number;
  cost_date?: string;
}, vehicleInfo?: { brand: string; model: string }) {
  const transactionDate = cost.cost_date || new Date().toISOString().split('T')[0];
  
  const categoryMap: Record<string, string> = {
    manutencao: 'Manutenção',
    limpeza: 'Limpeza',
    documentacao: 'Documentação',
    funilaria: 'Funilaria',
    outros: 'Outros',
  };

  const category = categoryMap[cost.cost_type] || 'Outros';
  const vehicleLabel = vehicleInfo ? ` - ${vehicleInfo.brand} ${vehicleInfo.model}` : '';

  // Verifica se já existe lançamento para este custo
  const { data: existing } = await (supabase as any)
    .from('financial_transactions')
    .select('id')
    .eq('vehicle_id', cost.vehicle_id)
    .eq('description', cost.description)
    .eq('amount', cost.amount)
    .maybeSingle();

  if (!existing) {
    await (supabase as any)
      .from('financial_transactions')
      .insert({
        vehicle_id: cost.vehicle_id,
        type: 'despesa',
        category: 'Custos Veículo',
        subcategory: category,
        description: `${cost.description}${vehicleLabel}`,
        amount: cost.amount,
        transaction_date: transactionDate,
        status: 'pago',
        paid_at: transactionDate,
      });
  }
}

// Sincronizar venda como receita
export async function syncSaleRevenue(sale: {
  id: string;
  sale_price: number;
  sale_date: string;
  status: string;
  vehicle_id: string;
}, vehicleInfo?: { brand: string; model: string }) {
  if (sale.status !== 'concluida') return;

  const vehicleLabel = vehicleInfo ? `${vehicleInfo.brand} ${vehicleInfo.model}` : 'Veículo';

  // Verifica se já existe lançamento para esta venda
  const { data: existing } = await (supabase as any)
    .from('financial_transactions')
    .select('id')
    .eq('sale_id', sale.id)
    .eq('type', 'receita')
    .maybeSingle();

  if (existing) {
    await (supabase as any)
      .from('financial_transactions')
      .update({
        amount: sale.sale_price,
        transaction_date: sale.sale_date,
        status: 'pago',
        paid_at: sale.sale_date,
      })
      .eq('id', existing.id);
  } else {
    await (supabase as any)
      .from('financial_transactions')
      .insert({
        sale_id: sale.id,
        vehicle_id: sale.vehicle_id,
        type: 'receita',
        category: 'Vendas',
        subcategory: 'Venda de Veículos',
        description: `Venda: ${vehicleLabel}`,
        amount: sale.sale_price,
        transaction_date: sale.sale_date,
        status: 'pago',
        paid_at: sale.sale_date,
      });
  }

  // Sincronizar custos de venda se houver
  const { data: saleDetails } = await (supabase as any)
    .from('sales')
    .select('documentation_cost, transfer_cost, other_sale_costs')
    .eq('id', sale.id)
    .maybeSingle();

  if (saleDetails) {
    const saleCosts = [
      { amount: saleDetails.documentation_cost, desc: 'Documentação' },
      { amount: saleDetails.transfer_cost, desc: 'Transferência' },
      { amount: saleDetails.other_sale_costs, desc: 'Outros custos' },
    ].filter(c => c.amount && c.amount > 0);

    for (const cost of saleCosts) {
      const { data: existingCost } = await (supabase as any)
        .from('financial_transactions')
        .select('id')
        .eq('sale_id', sale.id)
        .eq('description', `${cost.desc} - ${vehicleLabel}`)
        .maybeSingle();

      if (!existingCost) {
        await (supabase as any)
          .from('financial_transactions')
          .insert({
            sale_id: sale.id,
            vehicle_id: sale.vehicle_id,
            type: 'despesa',
            category: 'Custos de Venda',
            subcategory: cost.desc,
            description: `${cost.desc} - ${vehicleLabel}`,
            amount: cost.amount,
            transaction_date: sale.sale_date,
            status: 'pago',
            paid_at: sale.sale_date,
          });
      }
    }
  }
}

// Sincronizar comissão paga como despesa
export async function syncCommissionPayment(commission: {
  id: string;
  sale_id: string;
  user_id: string;
  final_amount: number;
  paid: boolean;
  paid_at?: string;
}, salespersonName?: string) {
  if (!commission.paid || !commission.paid_at) return;

  const label = salespersonName ? ` - ${salespersonName}` : '';

  // Verifica se já existe lançamento para esta comissão
  const { data: existing } = await (supabase as any)
    .from('financial_transactions')
    .select('id')
    .eq('sale_id', commission.sale_id)
    .eq('category', 'Comissões')
    .ilike('description', `%${commission.user_id}%`)
    .maybeSingle();

  if (!existing) {
    await (supabase as any)
      .from('financial_transactions')
      .insert({
        sale_id: commission.sale_id,
        type: 'despesa',
        category: 'Comissões',
        subcategory: 'Comissão de Venda',
        description: `Comissão${label} (${commission.user_id})`,
        amount: commission.final_amount,
        transaction_date: commission.paid_at,
        status: 'pago',
        paid_at: commission.paid_at,
      });
  }
}

// Hook para processar sincronização em lote (histórico)
export function useFinancialSync() {
  const queryClient = useQueryClient();

  const syncAllData = async () => {
    try {
      // 1. Sincronizar veículos (compras)
      const { data: vehicles } = await (supabase as any)
        .from('vehicles')
        .select('id, brand, model, purchase_price, purchase_date')
        .gt('purchase_price', 0);

      for (const vehicle of vehicles || []) {
        await syncVehiclePurchase(vehicle);
      }

      // 2. Sincronizar custos de veículos
      const { data: vehicleCosts } = await (supabase as any)
        .from('vehicle_costs')
        .select('id, vehicle_id, cost_type, description, amount, cost_date, vehicle:vehicles(brand, model)');

      for (const cost of vehicleCosts || []) {
        await syncVehicleCost(cost, cost.vehicle);
      }

      // 3. Sincronizar vendas concluídas
      const { data: sales } = await (supabase as any)
        .from('sales')
        .select('id, sale_price, sale_date, status, vehicle_id, vehicle:vehicles(brand, model)')
        .eq('status', 'concluida');

      for (const sale of sales || []) {
        await syncSaleRevenue(sale, sale.vehicle);
      }

      // 4. Sincronizar comissões pagas
      const { data: commissions } = await (supabase as any)
        .from('sale_commissions')
        .select('id, sale_id, user_id, final_amount, paid, paid_at, user:profiles(full_name)')
        .eq('paid', true);

      for (const comm of commissions || []) {
        await syncCommissionPayment(comm, comm.user?.full_name);
      }

      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast.success('Sincronização financeira concluída!');
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro ao sincronizar dados financeiros');
    }
  };

  return { syncAllData };
}
