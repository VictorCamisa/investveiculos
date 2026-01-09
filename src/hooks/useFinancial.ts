import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSaleProfitReports, useSales } from './useSales';
import { useSaleCommissions } from './useCommissionsComplete';
import { useAllVehicleDRE } from './useVehicles';
import { useNegotiations } from './useNegotiations';
import { useLeads } from './useLeads';
import { useMemo } from 'react';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, format, differenceInDays, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tables } from '@/integrations/supabase/types';

export interface DREData {
  period: string;
  receitaBruta: number;
  custoAquisicao: number;
  custosVeiculo: number;
  custosVenda: number;
  comissoes: number;
  cac: number;
  lucroBruto: number;
  lucroLiquido: number;
  margemBruta: number;
  margemLiquida: number;
  qtdVendas: number;
}

export interface CashFlowItem {
  id: string;
  date: string;
  description: string;
  type: 'entrada' | 'saida';
  category: string;
  value: number;
  status: 'realizado' | 'previsto';
}

export interface ProfitabilityData {
  id: string;
  name: string;
  type: 'veiculo' | 'vendedor' | 'origem' | 'categoria';
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  count: number;
}

export interface FinancialAlert {
  id: string;
  type: 'margem_baixa' | 'estoque_parado' | 'comissao_pendente' | 'meta_risco';
  severity: 'warning' | 'critical';
  title: string;
  description: string;
  value?: number;
  entityId?: string;
  entityType?: string;
  createdAt: Date;
}

export function useFinancialDashboard() {
  const { data: profitReports, isLoading: loadingReports } = useSaleProfitReports();
  const { data: sales, isLoading: loadingSales } = useSales();
  const { data: commissions, isLoading: loadingCommissions } = useSaleCommissions();
  const { data: vehicleDRE, isLoading: loadingVehicles } = useAllVehicleDRE();
  const { data: negotiations, isLoading: loadingNegotiations } = useNegotiations();

  const isLoading = loadingReports || loadingSales || loadingCommissions || loadingVehicles || loadingNegotiations;

  const kpis = useMemo(() => {
    if (!profitReports) return null;

    const completedSales = profitReports.filter(r => r.status === 'concluida');
    const pendingSales = profitReports.filter(r => r.status === 'pendente');
    
    const totalRevenue = completedSales.reduce((sum, r) => sum + (r.sale_price || 0), 0);
    const totalGrossProfit = completedSales.reduce((sum, r) => sum + (r.gross_profit || 0), 0);
    const totalNetProfit = completedSales.reduce((sum, r) => sum + (r.net_profit || 0), 0);
    const avgMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
    
    const pendingCommissions = commissions?.filter(c => !c.paid).reduce((sum, c) => sum + c.final_amount, 0) || 0;
    const approvedCommissions = commissions?.filter(c => (c as any).status === 'approved' && !c.paid).reduce((sum, c) => sum + c.final_amount, 0) || 0;
    
    const vehiclesInStock = vehicleDRE?.filter(v => v.status === 'disponivel') || [];
    const totalStockValue = vehiclesInStock.reduce((sum, v) => sum + (v.total_investment || 0), 0);
    const avgDaysInStock = vehiclesInStock.length > 0 
      ? vehiclesInStock.reduce((sum, v) => sum + (v.days_in_stock || 0), 0) / vehiclesInStock.length 
      : 0;

    // Pipeline projection
    const activeNegotiations = negotiations?.filter(n => 
      n.status === 'em_andamento' || n.status === 'proposta_enviada' || n.status === 'negociando'
    ) || [];
    const pipelineValue = activeNegotiations.reduce((sum, n) => sum + (n.estimated_value || 0), 0);
    const weightedPipeline = activeNegotiations.reduce((sum, n) => 
      sum + ((n.estimated_value || 0) * (n.probability || 50) / 100), 0
    );

    // Current month metrics
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const thisMonthSales = completedSales.filter(s => {
      const saleDate = new Date(s.sale_date);
      return isWithinInterval(saleDate, { start: monthStart, end: monthEnd });
    });
    
    const thisMonthRevenue = thisMonthSales.reduce((sum, s) => sum + (s.sale_price || 0), 0);
    const thisMonthProfit = thisMonthSales.reduce((sum, s) => sum + (s.net_profit || 0), 0);

    return {
      totalRevenue,
      totalGrossProfit,
      totalNetProfit,
      avgMargin,
      pendingCommissions,
      approvedCommissions,
      totalStockValue,
      avgDaysInStock,
      vehiclesInStock: vehiclesInStock.length,
      completedSalesCount: completedSales.length,
      pendingSalesCount: pendingSales.length,
      pipelineValue,
      weightedPipeline,
      thisMonthRevenue,
      thisMonthProfit,
      thisMonthSalesCount: thisMonthSales.length,
    };
  }, [profitReports, commissions, vehicleDRE, negotiations]);

  return { kpis, isLoading, profitReports, commissions, vehicleDRE, negotiations };
}

export function useDREData(months: number = 6) {
  const { data: profitReports, isLoading } = useSaleProfitReports();

  const dreData = useMemo(() => {
    if (!profitReports) return [];

    const data: DREData[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(now, i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthSales = profitReports.filter(s => {
        if (s.status !== 'concluida') return false;
        const saleDate = new Date(s.sale_date);
        return isWithinInterval(saleDate, { start, end });
      });

      const receitaBruta = monthSales.reduce((sum, s) => sum + (s.sale_price || 0), 0);
      const custoAquisicao = monthSales.reduce((sum, s) => sum + (s.vehicle_purchase_price || 0), 0);
      const custosVeiculo = monthSales.reduce((sum, s) => sum + (s.vehicle_total_costs || 0), 0);
      const custosVenda = monthSales.reduce((sum, s) => sum + (s.total_sale_costs || 0), 0);
      const comissoes = monthSales.reduce((sum, s) => sum + (s.total_commissions || 0), 0);
      const cac = monthSales.reduce((sum, s) => sum + (s.lead_cac || 0), 0);
      const lucroBruto = monthSales.reduce((sum, s) => sum + (s.gross_profit || 0), 0);
      const lucroLiquido = monthSales.reduce((sum, s) => sum + (s.net_profit || 0), 0);

      data.push({
        period: format(date, 'MMM/yy', { locale: ptBR }),
        receitaBruta,
        custoAquisicao,
        custosVeiculo,
        custosVenda,
        comissoes,
        cac,
        lucroBruto,
        lucroLiquido,
        margemBruta: receitaBruta > 0 ? (lucroBruto / receitaBruta) * 100 : 0,
        margemLiquida: receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0,
        qtdVendas: monthSales.length,
      });
    }

    return data;
  }, [profitReports, months]);

  // Consolidated totals
  const totals = useMemo(() => {
    return dreData.reduce((acc, d) => ({
      receitaBruta: acc.receitaBruta + d.receitaBruta,
      custoAquisicao: acc.custoAquisicao + d.custoAquisicao,
      custosVeiculo: acc.custosVeiculo + d.custosVeiculo,
      custosVenda: acc.custosVenda + d.custosVenda,
      comissoes: acc.comissoes + d.comissoes,
      cac: acc.cac + d.cac,
      lucroBruto: acc.lucroBruto + d.lucroBruto,
      lucroLiquido: acc.lucroLiquido + d.lucroLiquido,
      qtdVendas: acc.qtdVendas + d.qtdVendas,
    }), {
      receitaBruta: 0,
      custoAquisicao: 0,
      custosVeiculo: 0,
      custosVenda: 0,
      comissoes: 0,
      cac: 0,
      lucroBruto: 0,
      lucroLiquido: 0,
      qtdVendas: 0,
    });
  }, [dreData]);

  return { dreData, totals, isLoading };
}

export function useCashFlow() {
  const { data: profitReports } = useSaleProfitReports();
  const { data: commissions } = useSaleCommissions();
  const { data: vehicleDRE } = useAllVehicleDRE();

  const cashFlowData = useMemo(() => {
    const items: CashFlowItem[] = [];

    // Realized sales (entries)
    profitReports?.filter(r => r.status === 'concluida').forEach(sale => {
      items.push({
        id: `sale-${sale.id}`,
        date: sale.sale_date,
        description: `Venda: ${sale.brand} ${sale.model}`,
        type: 'entrada',
        category: 'Vendas',
        value: sale.sale_price || 0,
        status: 'realizado',
      });
    });

    // Paid commissions (exits)
    commissions?.filter(c => c.paid && c.paid_at).forEach(comm => {
      items.push({
        id: `comm-paid-${comm.id}`,
        date: comm.paid_at!,
        description: `Comissão paga`,
        type: 'saida',
        category: 'Comissões',
        value: comm.final_amount,
        status: 'realizado',
      });
    });

    // Pending commissions (projected exits)
    commissions?.filter(c => !c.paid && c.status === 'approved').forEach(comm => {
      items.push({
        id: `comm-pending-${comm.id}`,
        date: comm.payment_due_date || format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
        description: `Comissão a pagar`,
        type: 'saida',
        category: 'Comissões',
        value: comm.final_amount,
        status: 'previsto',
      });
    });

    // Vehicle purchases (exits) - from available vehicles
    vehicleDRE?.filter(v => v.purchase_date && v.purchase_price).forEach(vehicle => {
      items.push({
        id: `vehicle-${vehicle.id}`,
        date: vehicle.purchase_date!,
        description: `Compra: ${vehicle.brand} ${vehicle.model}`,
        type: 'saida',
        category: 'Aquisição Veículos',
        value: vehicle.purchase_price || 0,
        status: 'realizado',
      });
    });

    // Sort by date
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return items;
  }, [profitReports, commissions, vehicleDRE]);

  // Calculate running balance
  const balanceData = useMemo(() => {
    const sorted = [...cashFlowData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let balance = 0;
    return sorted.map(item => {
      balance += item.type === 'entrada' ? item.value : -item.value;
      return { ...item, balance };
    });
  }, [cashFlowData]);

  // Summary
  const summary = useMemo(() => {
    const realized = cashFlowData.filter(i => i.status === 'realizado');
    const projected = cashFlowData.filter(i => i.status === 'previsto');

    return {
      totalEntradas: realized.filter(i => i.type === 'entrada').reduce((sum, i) => sum + i.value, 0),
      totalSaidas: realized.filter(i => i.type === 'saida').reduce((sum, i) => sum + i.value, 0),
      saldoRealizado: realized.reduce((sum, i) => sum + (i.type === 'entrada' ? i.value : -i.value), 0),
      projecaoEntradas: projected.filter(i => i.type === 'entrada').reduce((sum, i) => sum + i.value, 0),
      projecaoSaidas: projected.filter(i => i.type === 'saida').reduce((sum, i) => sum + i.value, 0),
    };
  }, [cashFlowData]);

  return { cashFlowData, balanceData, summary };
}

export function useProfitabilityAnalysis() {
  const { data: profitReports } = useSaleProfitReports();
  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data as Tables<'profiles'>[];
    },
  });
  const { data: leads } = useLeads();

  const analysis = useMemo(() => {
    if (!profitReports) return { byVehicle: [], bySalesperson: [], bySource: [], byCategory: [] };

    const completedSales = profitReports.filter(r => r.status === 'concluida');

    // By Salesperson
    const salespersonMap = new Map<string, ProfitabilityData>();
    completedSales.forEach(sale => {
      if (!sale.salesperson_id) return;
      const profile = profiles?.find(p => p.id === sale.salesperson_id);
      const existing = salespersonMap.get(sale.salesperson_id) || {
        id: sale.salesperson_id,
        name: profile?.full_name || 'Desconhecido',
        type: 'vendedor' as const,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
        count: 0,
      };
      existing.revenue += sale.sale_price || 0;
      existing.cost += sale.vehicle_total_investment || 0;
      existing.profit += sale.net_profit || 0;
      existing.count += 1;
      existing.margin = existing.revenue > 0 ? (existing.profit / existing.revenue) * 100 : 0;
      salespersonMap.set(sale.salesperson_id, existing);
    });

    // By Lead Source
    const sourceMap = new Map<string, ProfitabilityData>();
    completedSales.forEach(sale => {
      const lead = leads?.find(l => l.id === sale.lead_id);
      const source = lead?.source || 'direto';
      const existing = sourceMap.get(source) || {
        id: source,
        name: source.charAt(0).toUpperCase() + source.slice(1).replace('_', ' '),
        type: 'origem' as const,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
        count: 0,
      };
      existing.revenue += sale.sale_price || 0;
      existing.cost += sale.vehicle_total_investment || 0;
      existing.profit += sale.net_profit || 0;
      existing.count += 1;
      existing.margin = existing.revenue > 0 ? (existing.profit / existing.revenue) * 100 : 0;
      sourceMap.set(source, existing);
    });

    // By Vehicle Brand (Category)
    const brandMap = new Map<string, ProfitabilityData>();
    completedSales.forEach(sale => {
      const brand = sale.brand || 'Outros';
      const existing = brandMap.get(brand) || {
        id: brand,
        name: brand,
        type: 'categoria' as const,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
        count: 0,
      };
      existing.revenue += sale.sale_price || 0;
      existing.cost += sale.vehicle_total_investment || 0;
      existing.profit += sale.net_profit || 0;
      existing.count += 1;
      existing.margin = existing.revenue > 0 ? (existing.profit / existing.revenue) * 100 : 0;
      brandMap.set(brand, existing);
    });

    return {
      byVehicle: completedSales.map(s => ({
        id: s.id || '',
        name: `${s.brand} ${s.model} - ${s.plate || 'S/P'}`,
        type: 'veiculo' as const,
        revenue: s.sale_price || 0,
        cost: s.vehicle_total_investment || 0,
        profit: s.net_profit || 0,
        margin: s.sale_price ? ((s.net_profit || 0) / s.sale_price) * 100 : 0,
        count: 1,
      })).sort((a, b) => b.profit - a.profit),
      bySalesperson: Array.from(salespersonMap.values()).sort((a, b) => b.profit - a.profit),
      bySource: Array.from(sourceMap.values()).sort((a, b) => b.profit - a.profit),
      byCategory: Array.from(brandMap.values()).sort((a, b) => b.profit - a.profit),
    };
  }, [profitReports, profiles, leads]);

  return analysis;
}

export function useFinancialAlerts() {
  const { data: vehicleDRE } = useAllVehicleDRE();
  const { data: profitReports } = useSaleProfitReports();
  const { data: commissions } = useSaleCommissions();
  const { data: goals } = useQuery({
    queryKey: ['salesperson-goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('salesperson_goals').select('*');
      if (error) throw error;
      return data as Tables<'salesperson_goals'>[];
    },
  });

  const alerts = useMemo(() => {
    const items: FinancialAlert[] = [];
    const now = new Date();

    // Low margin vehicles in stock
    vehicleDRE?.filter(v => v.status === 'disponivel').forEach(vehicle => {
      const daysInStock = vehicle.days_in_stock || 0;
      const expectedDays = vehicle.expected_sale_days || 60;

      // Alert for vehicles over expected days
      if (daysInStock > expectedDays) {
        items.push({
          id: `stock-${vehicle.id}`,
          type: 'estoque_parado',
          severity: daysInStock > expectedDays * 1.5 ? 'critical' : 'warning',
          title: `${vehicle.brand} ${vehicle.model} - Estoque Parado`,
          description: `${daysInStock} dias em estoque (esperado: ${expectedDays} dias)`,
          value: vehicle.total_investment || 0,
          entityId: vehicle.id || '',
          entityType: 'vehicle',
          createdAt: now,
        });
      }

      // Alert for vehicles with high holding cost
      if (vehicle.holding_cost && vehicle.holding_cost > (vehicle.expected_margin_percent || 10) * (vehicle.purchase_price || 0) / 100) {
        items.push({
          id: `holding-${vehicle.id}`,
          type: 'margem_baixa',
          severity: 'warning',
          title: `${vehicle.brand} ${vehicle.model} - Custo de Estoque Alto`,
          description: `Custo de estoque está consumindo a margem esperada`,
          value: vehicle.holding_cost,
          entityId: vehicle.id || '',
          entityType: 'vehicle',
          createdAt: now,
        });
      }
    });

    // Low profit sales
    profitReports?.filter(r => r.status === 'concluida').forEach(sale => {
      const margin = sale.sale_price ? ((sale.net_profit || 0) / sale.sale_price) * 100 : 0;
      if (margin < 5 && margin >= 0) {
        items.push({
          id: `margin-${sale.id}`,
          type: 'margem_baixa',
          severity: 'warning',
          title: `${sale.brand} ${sale.model} - Margem Baixa`,
          description: `Venda concluída com margem de apenas ${margin.toFixed(1)}%`,
          value: sale.net_profit || 0,
          entityId: sale.id || '',
          entityType: 'sale',
          createdAt: new Date(sale.sale_date),
        });
      } else if (margin < 0) {
        items.push({
          id: `loss-${sale.id}`,
          type: 'margem_baixa',
          severity: 'critical',
          title: `${sale.brand} ${sale.model} - Prejuízo!`,
          description: `Venda com prejuízo de ${Math.abs(margin).toFixed(1)}%`,
          value: sale.net_profit || 0,
          entityId: sale.id || '',
          entityType: 'sale',
          createdAt: new Date(sale.sale_date),
        });
      }
    });

    // Pending commissions overdue
    commissions?.filter(c => c.status === 'approved' && !c.paid).forEach(comm => {
      if (comm.payment_due_date && new Date(comm.payment_due_date) < now) {
        items.push({
          id: `comm-overdue-${comm.id}`,
          type: 'comissao_pendente',
          severity: 'critical',
          title: 'Comissão Atrasada',
          description: `Comissão aprovada vencida desde ${format(new Date(comm.payment_due_date), 'dd/MM/yyyy')}`,
          value: comm.final_amount,
          entityId: comm.id,
          entityType: 'commission',
          createdAt: now,
        });
      }
    });

    // Goals at risk
    const currentMonth = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const daysInMonth = differenceInDays(monthEnd, currentMonth);
    const daysPassed = differenceInDays(now, currentMonth);
    const expectedProgress = daysPassed / daysInMonth;

    goals?.filter(g => {
      const start = new Date(g.period_start);
      const end = new Date(g.period_end);
      return isWithinInterval(now, { start, end });
    }).forEach(goal => {
      const salesProgress = goal.target_sales > 0 ? goal.current_sales / goal.target_sales : 0;
      if (salesProgress < expectedProgress * 0.7) {
        items.push({
          id: `goal-${goal.id}`,
          type: 'meta_risco',
          severity: salesProgress < expectedProgress * 0.5 ? 'critical' : 'warning',
          title: 'Meta em Risco',
          description: `Progresso de ${(salesProgress * 100).toFixed(0)}% vs esperado ${(expectedProgress * 100).toFixed(0)}%`,
          value: goal.target_sales - goal.current_sales,
          entityId: goal.user_id,
          entityType: 'goal',
          createdAt: now,
        });
      }
    });

    return items.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [vehicleDRE, profitReports, commissions, goals]);

  return alerts;
}
