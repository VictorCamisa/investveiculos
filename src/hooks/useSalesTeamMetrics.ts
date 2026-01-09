import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SalespersonMetrics {
  user_id: string;
  full_name: string;
  total_negotiations: number;
  active_negotiations: number;
  won_negotiations: number;
  lost_negotiations: number;
  total_interactions: number;
  calls_count: number;
  whatsapp_count: number;
  emails_count: number;
  visits_count: number;
  total_leads: number;
  converted_leads: number;
  total_sales: number;
  pending_sales: number;
  total_revenue: number;
  conversion_rate: number;
  avg_negotiation_value: number;
}

export function useSalesTeamMetrics() {
  return useQuery({
    queryKey: ['sales-team-metrics'],
    queryFn: async (): Promise<SalespersonMetrics[]> => {
      const { data: profiles } = await (supabase as any)
        .from('profiles')
        .select('id, full_name');

      if (!profiles) return [];

      // Get all data we need
      const [negotiationsRes, interactionsRes, leadsRes, salesRes] = await Promise.all([
        (supabase as any).from('negotiations').select('id, salesperson_id, status, estimated_value'),
        (supabase as any).from('lead_interactions').select('id, user_id, type'),
        (supabase as any).from('leads').select('id, assigned_to, status'),
        (supabase as any).from('sales').select('id, salesperson_id, status, sale_price'),
      ]);

      const negotiations = negotiationsRes.data || [];
      const interactions = interactionsRes.data || [];
      const leads = leadsRes.data || [];
      const sales = salesRes.data || [];

      // Calculate metrics per salesperson
      const metrics: SalespersonMetrics[] = profiles.map(profile => {
        const userNegotiations = negotiations.filter(n => n.salesperson_id === profile.id);
        const userInteractions = interactions.filter(i => i.user_id === profile.id);
        const userLeads = leads.filter(l => l.assigned_to === profile.id);
        const userSales = sales.filter(s => s.salesperson_id === profile.id);

        const activeNegotiations = userNegotiations.filter(n => 
          !['ganho', 'perdido'].includes(n.status)
        ).length;
        const wonNegotiations = userNegotiations.filter(n => n.status === 'ganho').length;
        const lostNegotiations = userNegotiations.filter(n => n.status === 'perdido').length;

        const totalSalesValue = userSales
          .filter(s => s.status === 'concluida')
          .reduce((sum, s) => sum + (s.sale_price || 0), 0);

        const callsCount = userInteractions.filter(i => 
          ['ligacao', 'call', 'telefone'].includes(i.type?.toLowerCase() || '')
        ).length;
        const whatsappCount = userInteractions.filter(i => 
          ['whatsapp', 'mensagem'].includes(i.type?.toLowerCase() || '')
        ).length;
        const emailsCount = userInteractions.filter(i => 
          ['email', 'e-mail'].includes(i.type?.toLowerCase() || '')
        ).length;
        const visitsCount = userInteractions.filter(i => 
          ['visita', 'presencial'].includes(i.type?.toLowerCase() || '')
        ).length;

        const convertedLeads = userLeads.filter(l => l.status === 'convertido').length;
        const conversionRate = userLeads.length > 0 
          ? (convertedLeads / userLeads.length) * 100 
          : 0;

        const avgValue = userNegotiations.length > 0
          ? userNegotiations.reduce((sum, n) => sum + (n.estimated_value || 0), 0) / userNegotiations.length
          : 0;

        return {
          user_id: profile.id,
          full_name: profile.full_name || 'Sem nome',
          total_negotiations: userNegotiations.length,
          active_negotiations: activeNegotiations,
          won_negotiations: wonNegotiations,
          lost_negotiations: lostNegotiations,
          total_interactions: userInteractions.length,
          calls_count: callsCount,
          whatsapp_count: whatsappCount,
          emails_count: emailsCount,
          visits_count: visitsCount,
          total_leads: userLeads.length,
          converted_leads: convertedLeads,
          total_sales: userSales.length,
          pending_sales: userSales.filter(s => s.status === 'pendente').length,
          total_revenue: totalSalesValue,
          conversion_rate: conversionRate,
          avg_negotiation_value: avgValue,
        };
      });

      return metrics.filter(m => 
        m.total_leads > 0 || m.total_negotiations > 0 || m.total_sales > 0 || m.total_interactions > 0
      );
    },
  });
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(id, name, phone),
          vehicle:vehicles(id, brand, model, year_model, plate),
          salesperson:profiles!salesperson_id(id, full_name)
        `)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useTeamNegotiations() {
  return useQuery({
    queryKey: ['team-negotiations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('negotiations')
        .select(`
          *,
          lead:leads(id, name, phone, source),
          vehicle:vehicles(id, brand, model, year_model),
          salesperson:profiles!salesperson_id(id, full_name),
          customer:customers(id, name)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}
