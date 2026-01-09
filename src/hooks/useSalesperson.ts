import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SalespersonDetail {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  role: string | null;
}

export interface SalespersonStats {
  // Sales metrics
  totalSales: number;
  completedSales: number;
  pendingSales: number;
  totalRevenue: number;
  averageTicket: number;
  
  // Leads metrics
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  
  // Negotiations metrics
  totalNegotiations: number;
  activeNegotiations: number;
  wonNegotiations: number;
  lostNegotiations: number;
  
  // Commission metrics
  totalCommissions: number;
  pendingCommissions: number;
  paidCommissions: number;
  
  // Activity metrics
  totalInteractions: number;
  callsCount: number;
  whatsappCount: number;
  emailsCount: number;
  visitsCount: number;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface RoleRow {
  role: string;
}

export function useSalespersonDetail(userId: string | undefined) {
  return useQuery({
    queryKey: ['salesperson-detail', userId],
    queryFn: async (): Promise<SalespersonDetail | null> => {
      if (!userId) return null;
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, is_active, created_at')
        .eq('id', userId)
        .single();
      
      if (profileError || !profile) throw profileError || new Error('Profile not found');
      
      const typedProfile = profile as ProfileRow;
      
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      const typedRole = roleData as RoleRow | null;
      
      return {
        id: typedProfile.id,
        full_name: typedProfile.full_name,
        email: typedProfile.email,
        avatar_url: typedProfile.avatar_url,
        is_active: typedProfile.is_active,
        created_at: typedProfile.created_at,
        role: typedRole?.role ?? null,
      };
    },
    enabled: !!userId,
  });
}

export function useSalespersonStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['salesperson-stats', userId],
    queryFn: async (): Promise<SalespersonStats | null> => {
      if (!userId) return null;
      
      const [salesRes, leadsRes, negotiationsRes, commissionsRes, interactionsRes] = await Promise.all([
        supabase.from('sales').select('id, status, sale_price').eq('salesperson_id', userId),
        supabase.from('leads').select('id, status').eq('assigned_to', userId),
        supabase.from('negotiations').select('id, status, estimated_value').eq('salesperson_id', userId),
        supabase.from('sale_commissions').select('id, final_amount, status, paid').eq('user_id', userId),
        supabase.from('lead_interactions').select('id, type').eq('user_id', userId),
      ]);
      
      const sales = salesRes.data || [];
      const leads = leadsRes.data || [];
      const negotiations = negotiationsRes.data || [];
      const commissions = commissionsRes.data || [];
      const interactions = interactionsRes.data || [];
      
      const completedSales = sales.filter(s => s.status === 'concluida');
      const totalRevenue = completedSales.reduce((sum, s) => sum + (s.sale_price || 0), 0);
      const convertedLeads = leads.filter(l => l.status === 'convertido').length;
      
      const pendingCommissions = commissions
        .filter(c => !c.paid && c.status !== 'rejected')
        .reduce((sum, c) => sum + (c.final_amount || 0), 0);
      
      const paidCommissions = commissions
        .filter(c => c.paid)
        .reduce((sum, c) => sum + (c.final_amount || 0), 0);
      
      return {
        totalSales: sales.length,
        completedSales: completedSales.length,
        pendingSales: sales.filter(s => s.status === 'pendente').length,
        totalRevenue,
        averageTicket: completedSales.length > 0 ? totalRevenue / completedSales.length : 0,
        
        totalLeads: leads.length,
        convertedLeads,
        conversionRate: leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0,
        
        totalNegotiations: negotiations.length,
        activeNegotiations: negotiations.filter(n => !['ganho', 'perdido'].includes(n.status)).length,
        wonNegotiations: negotiations.filter(n => n.status === 'ganho').length,
        lostNegotiations: negotiations.filter(n => n.status === 'perdido').length,
        
        totalCommissions: commissions.reduce((sum, c) => sum + (c.final_amount || 0), 0),
        pendingCommissions,
        paidCommissions,
        
        totalInteractions: interactions.length,
        callsCount: interactions.filter(i => ['ligacao', 'call', 'telefone'].includes(i.type?.toLowerCase() || '')).length,
        whatsappCount: interactions.filter(i => ['whatsapp', 'mensagem'].includes(i.type?.toLowerCase() || '')).length,
        emailsCount: interactions.filter(i => ['email', 'e-mail'].includes(i.type?.toLowerCase() || '')).length,
        visitsCount: interactions.filter(i => ['visita', 'presencial'].includes(i.type?.toLowerCase() || '')).length,
      };
    },
    enabled: !!userId,
  });
}

export function useSalespersonNegotiations(userId: string | undefined) {
  return useQuery({
    queryKey: ['salesperson-negotiations', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('negotiations')
        .select(`
          *,
          lead:leads(id, name, phone),
          vehicle:vehicles(id, brand, model, year_model)
        `)
        .eq('salesperson_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useSalespersonCommissions(userId: string | undefined) {
  return useQuery({
    queryKey: ['salesperson-commissions', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('sale_commissions')
        .select(`
          *,
          sale:sales(
            id, sale_date, sale_price,
            vehicle:vehicles(id, brand, model),
            customer:customers(id, name)
          ),
          commission_rule:commission_rules(id, name, commission_type)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useSalespersonSales(userId: string | undefined) {
  return useQuery({
    queryKey: ['salesperson-sales', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          vehicle:vehicles(id, brand, model, year_model, plate),
          customer:customers(id, name, phone)
        `)
        .eq('salesperson_id', userId)
        .order('sale_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useSalespersonLeads(userId: string | undefined) {
  return useQuery({
    queryKey: ['salesperson-leads', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useSalespersonActivities(userId: string | undefined) {
  return useQuery({
    queryKey: ['salesperson-activities', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('lead_interactions')
        .select(`
          *,
          lead:leads(id, name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useSalespersonMonthlySales(userId: string | undefined) {
  return useQuery({
    queryKey: ['salesperson-monthly-sales', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('sales')
        .select('id, sale_date, sale_price, status')
        .eq('salesperson_id', userId)
        .eq('status', 'concluida')
        .order('sale_date', { ascending: true });
      
      if (error) throw error;
      
      // Group by month
      const monthlyData: Record<string, { month: string; count: number; revenue: number }> = {};
      
      (data || []).forEach(sale => {
        const monthKey = sale.sale_date.substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthKey, count: 0, revenue: 0 };
        }
        monthlyData[monthKey].count++;
        monthlyData[monthKey].revenue += sale.sale_price || 0;
      });
      
      return Object.values(monthlyData).slice(-12); // Last 12 months
    },
    enabled: !!userId,
  });
}
