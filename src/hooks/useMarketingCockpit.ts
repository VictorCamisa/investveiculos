import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfMonth, format } from 'date-fns';

interface DateRange {
  from: Date;
  to: Date;
}

export interface CockpitKPIs {
  investment: number;
  leads: number;
  qualifiedLeads: number;
  cpl: number;
  cplQualified: number;
  appointments: number;
  appointmentCost: number;
  showRate: number;
  sales: number;
  revenue: number;
  roas: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
}

export interface FunnelStage {
  name: string;
  value: number;
  rate: number;
  previousValue?: number;
}

export interface LeadOpsMetrics {
  avgFirstResponseMinutes: number;
  contactRate: number;
  appointmentRate: number;
  showRate: number;
  conversionRate: number;
  leadsWithoutResponse: number;
}

export interface AutoInsight {
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
}

export function useCockpitKPIs(dateRange: DateRange) {
  return useQuery({
    queryKey: ['cockpit-kpis', dateRange.from, dateRange.to],
    queryFn: async (): Promise<CockpitKPIs> => {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      // Fetch Meta Insights for the period
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: insights } = await (supabase as any)
        .from('meta_insights')
        .select('*')
        .gte('date_start', fromDate)
        .lte('date_stop', toDate)
        .eq('entity_type', 'account');

      // Fetch leads for the period
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: leads } = await (supabase as any)
        .from('leads')
        .select('id, qualification_status, first_response_at, created_at, source')
        .gte('created_at', `${fromDate}T00:00:00`)
        .lte('created_at', `${toDate}T23:59:59`);

      // Fetch negotiations for the period
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: negotiations } = await (supabase as any)
        .from('negotiations')
        .select('id, appointment_date, showed_up, status, estimated_value')
        .gte('created_at', `${fromDate}T00:00:00`)
        .lte('created_at', `${toDate}T23:59:59`);

      // Fetch sales for the period
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sales } = await (supabase as any)
        .from('sales')
        .select('id, sale_price, status')
        .eq('status', 'concluida')
        .gte('sale_date', fromDate)
        .lte('sale_date', toDate);

      // Calculate metrics
      const totalSpend = insights?.reduce((sum: number, i: any) => sum + (i.spend || 0), 0) || 0;
      const totalImpressions = insights?.reduce((sum: number, i: any) => sum + (i.impressions || 0), 0) || 0;
      const totalReach = insights?.reduce((sum: number, i: any) => sum + (i.reach || 0), 0) || 0;
      const totalClicks = insights?.reduce((sum: number, i: any) => sum + (i.clicks || 0), 0) || 0;

      const leadsCount = leads?.length || 0;
      const qualifiedLeads = leads?.filter((l: any) => l.qualification_status === 'qualificado').length || 0;
      
      const negotiationsWithAppointment = negotiations?.filter((n: any) => n.appointment_date) || [];
      const appointmentsCount = negotiationsWithAppointment.length;
      const showedUp = negotiationsWithAppointment.filter((n: any) => n.showed_up === true).length;
      
      const completedSales = sales || [];
      const totalRevenue = completedSales.reduce((sum: number, s: any) => sum + (s.sale_price || 0), 0);

      return {
        investment: totalSpend,
        leads: leadsCount,
        qualifiedLeads,
        cpl: leadsCount > 0 ? totalSpend / leadsCount : 0,
        cplQualified: qualifiedLeads > 0 ? totalSpend / qualifiedLeads : 0,
        appointments: appointmentsCount,
        appointmentCost: appointmentsCount > 0 ? totalSpend / appointmentsCount : 0,
        showRate: appointmentsCount > 0 ? (showedUp / appointmentsCount) * 100 : 0,
        sales: completedSales.length,
        revenue: totalRevenue,
        roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
        impressions: totalImpressions,
        reach: totalReach,
        clicks: totalClicks,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
        cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
        frequency: totalReach > 0 ? totalImpressions / totalReach : 0,
      };
    },
    staleTime: 60000,
  });
}

export function useFunnelData(dateRange: DateRange) {
  return useQuery({
    queryKey: ['funnel-data', dateRange.from, dateRange.to],
    queryFn: async (): Promise<FunnelStage[]> => {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: insights } = await (supabase as any)
        .from('meta_insights')
        .select('impressions, reach, clicks')
        .gte('date_start', fromDate)
        .lte('date_stop', toDate);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: leads } = await (supabase as any)
        .from('leads')
        .select('id, qualification_status')
        .gte('created_at', `${fromDate}T00:00:00`)
        .lte('created_at', `${toDate}T23:59:59`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: negotiations } = await (supabase as any)
        .from('negotiations')
        .select('id, appointment_date, showed_up, status')
        .gte('created_at', `${fromDate}T00:00:00`)
        .lte('created_at', `${toDate}T23:59:59`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sales } = await (supabase as any)
        .from('sales')
        .select('id')
        .eq('status', 'concluida')
        .gte('sale_date', fromDate)
        .lte('sale_date', toDate);

      const impressions = insights?.reduce((sum: number, i: any) => sum + (i.impressions || 0), 0) || 0;
      const clicks = insights?.reduce((sum: number, i: any) => sum + (i.clicks || 0), 0) || 0;
      const leadsCount = leads?.length || 0;
      const qualified = leads?.filter((l: any) => l.qualification_status === 'qualificado').length || 0;
      const appointments = negotiations?.filter((n: any) => n.appointment_date).length || 0;
      const salesCount = sales?.length || 0;

      return [
        { name: 'Impressões', value: impressions, rate: 100 },
        { name: 'Cliques', value: clicks, rate: impressions > 0 ? (clicks / impressions) * 100 : 0 },
        { name: 'Leads', value: leadsCount, rate: clicks > 0 ? (leadsCount / clicks) * 100 : 0 },
        { name: 'Qualificados', value: qualified, rate: leadsCount > 0 ? (qualified / leadsCount) * 100 : 0 },
        { name: 'Agendamentos', value: appointments, rate: qualified > 0 ? (appointments / qualified) * 100 : 0 },
        { name: 'Vendas', value: salesCount, rate: appointments > 0 ? (salesCount / appointments) * 100 : 0 },
      ];
    },
    staleTime: 60000,
  });
}

export function useLeadOpsMetrics(dateRange: DateRange) {
  return useQuery({
    queryKey: ['lead-ops', dateRange.from, dateRange.to],
    queryFn: async (): Promise<LeadOpsMetrics> => {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: leads } = await (supabase as any)
        .from('leads')
        .select('id, first_response_at, created_at, status')
        .gte('created_at', `${fromDate}T00:00:00`)
        .lte('created_at', `${toDate}T23:59:59`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: negotiations } = await (supabase as any)
        .from('negotiations')
        .select('id, appointment_date, showed_up, status')
        .gte('created_at', `${fromDate}T00:00:00`)
        .lte('created_at', `${toDate}T23:59:59`);

      const leadsWithResponse = leads?.filter((l: any) => l.first_response_at) || [];
      const leadsWithoutResponse = leads?.filter((l: any) => !l.first_response_at).length || 0;
      
      // Calculate average response time in minutes
      const responseTimes = leadsWithResponse.map((l: any) => {
        const created = new Date(l.created_at).getTime();
        const responded = new Date(l.first_response_at).getTime();
        return (responded - created) / (1000 * 60); // minutes
      });
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length 
        : 0;

      const totalLeads = leads?.length || 0;
      const contacted = leadsWithResponse.length;
      const negotiationsWithAppointment = negotiations?.filter((n: any) => n.appointment_date) || [];
      const showedUp = negotiationsWithAppointment.filter((n: any) => n.showed_up === true).length;
      const converted = leads?.filter((l: any) => l.status === 'convertido').length || 0;

      return {
        avgFirstResponseMinutes: avgResponseTime,
        contactRate: totalLeads > 0 ? (contacted / totalLeads) * 100 : 0,
        appointmentRate: contacted > 0 ? (negotiationsWithAppointment.length / contacted) * 100 : 0,
        showRate: negotiationsWithAppointment.length > 0 ? (showedUp / negotiationsWithAppointment.length) * 100 : 0,
        conversionRate: totalLeads > 0 ? (converted / totalLeads) * 100 : 0,
        leadsWithoutResponse,
      };
    },
    staleTime: 60000,
  });
}

export function useAutoInsights(kpis: CockpitKPIs | undefined, leadOps: LeadOpsMetrics | undefined) {
  return useQuery({
    queryKey: ['auto-insights', kpis, leadOps],
    queryFn: async (): Promise<AutoInsight[]> => {
      if (!kpis || !leadOps) return [];
      
      const insights: AutoInsight[] = [];

      // CPL Analysis
      if (kpis.cpl > 100) {
        insights.push({
          type: 'warning',
          title: 'CPL Alto',
          message: `Seu custo por lead está em R$ ${kpis.cpl.toFixed(2)}. Considere revisar a segmentação ou criativos.`,
        });
      }

      // Frequency saturation
      if (kpis.frequency > 3) {
        insights.push({
          type: 'warning',
          title: 'Saturação de Frequência',
          message: `Frequência média de ${kpis.frequency.toFixed(1)}. O público pode estar saturado. Considere expandir ou renovar.`,
        });
      }

      // CTR Analysis
      if (kpis.ctr < 1) {
        insights.push({
          type: 'warning',
          title: 'CTR Baixo',
          message: `CTR de ${kpis.ctr.toFixed(2)}% está abaixo do ideal. Teste novos criativos ou headlines.`,
        });
      } else if (kpis.ctr > 3) {
        insights.push({
          type: 'success',
          title: 'Excelente CTR',
          message: `CTR de ${kpis.ctr.toFixed(2)}% está acima da média! Os criativos estão performando bem.`,
        });
      }

      // Lead response time
      if (leadOps.avgFirstResponseMinutes > 30) {
        insights.push({
          type: 'warning',
          title: 'Tempo de Resposta Alto',
          message: `Leads estão esperando ${Math.round(leadOps.avgFirstResponseMinutes)} minutos em média. Leads quentes esfriam rápido!`,
        });
      }

      // Leads without response
      if (leadOps.leadsWithoutResponse > 0) {
        insights.push({
          type: 'warning',
          title: 'Leads Sem Atendimento',
          message: `${leadOps.leadsWithoutResponse} leads ainda não foram atendidos. Priorize o contato!`,
        });
      }

      // Show rate
      if (kpis.showRate < 50 && kpis.appointments > 0) {
        insights.push({
          type: 'warning',
          title: 'Taxa de Comparecimento Baixa',
          message: `Apenas ${kpis.showRate.toFixed(0)}% dos agendamentos comparecem. Considere confirmar no dia anterior.`,
        });
      }

      // ROAS
      if (kpis.roas > 3) {
        insights.push({
          type: 'success',
          title: 'ROAS Excelente',
          message: `ROAS de ${kpis.roas.toFixed(1)}x! O investimento está gerando bom retorno.`,
        });
      } else if (kpis.roas > 0 && kpis.roas < 1) {
        insights.push({
          type: 'warning',
          title: 'ROAS Negativo',
          message: `ROAS de ${kpis.roas.toFixed(2)}x. Revise a estratégia para melhorar o retorno.`,
        });
      }

      return insights;
    },
    enabled: !!kpis && !!leadOps,
  });
}

export function useDatePresets() {
  const today = new Date();
  
  return {
    today: { from: today, to: today },
    last7Days: { from: subDays(today, 7), to: today },
    last30Days: { from: subDays(today, 30), to: today },
    mtd: { from: startOfMonth(today), to: today },
  };
}
