import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface DateRange {
  from: Date;
  to: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any;

export interface ChannelMetrics {
  channel: string;
  channelLabel: string;
  leads: number;
  qualifiedLeads: number;
  appointments: number;
  sales: number;
  revenue: number;
  investment: number;
  cpl: number;
  cpa: number;
  conversionRate: number;
  avgTicket: number;
  roas: number;
}

export interface CampaignMetrics extends ChannelMetrics {
  campaignId: string;
  campaignName: string;
  platform: string;
}

export interface CompleteLeadOriginData {
  bySource: ChannelMetrics[];
  byCampaign: CampaignMetrics[];
  totals: {
    leads: number;
    qualifiedLeads: number;
    appointments: number;
    sales: number;
    revenue: number;
    investment: number;
    paidRevenue: number;
    roas: number;
  };
}

// Sources considered as paid traffic for ROAS calculation
const PAID_SOURCES = ['facebook', 'instagram', 'google', 'site', 'meta'];

const sourceLabels: Record<string, string> = {
  facebook: 'Facebook Ads',
  instagram: 'Instagram Ads',
  google: 'Google Ads',
  olx: 'OLX',
  webmotors: 'Webmotors',
  indicacao: 'Indicação',
  site: 'Site',
  whatsapp: 'WhatsApp',
  telefone: 'Telefone',
  visita: 'Visita Loja',
  outros: 'Outros',
  direto: 'Direto (sem lead)',
};

export function useCompleteLeadOrigin(dateRange: DateRange, viewMode: 'source' | 'campaign' = 'source') {
  return useQuery({
    queryKey: ['complete-lead-origin', dateRange.from, dateRange.to, viewMode],
    queryFn: async (): Promise<CompleteLeadOriginData> => {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      // Fetch all leads with source
      const { data: leads } = await supabase
        .from('leads')
        .select('id, source, qualification_status, created_at')
        .gte('created_at', `${fromDate}T00:00:00`)
        .lte('created_at', `${toDate}T23:59:59`) as { data: AnyData[] | null };

      // Fetch negotiations (including those without leads)
      const { data: negotiations } = await supabase
        .from('negotiations')
        .select('id, lead_id, appointment_date, showed_up, status')
        .gte('created_at', `${fromDate}T00:00:00`)
        .lte('created_at', `${toDate}T23:59:59`) as { data: AnyData[] | null };

      // Fetch completed sales
      const { data: sales } = await supabase
        .from('sales')
        .select('id, lead_id, sale_price, sale_date')
        .eq('status', 'concluida')
        .gte('sale_date', fromDate)
        .lte('sale_date', toDate) as { data: AnyData[] | null };

      // Fetch lead costs (links leads to campaigns)
      const { data: leadCosts } = await supabase
        .from('lead_costs')
        .select('lead_id, campaign_id, cost_amount') as { data: AnyData[] | null };

      // Fetch marketing campaigns
      const { data: campaigns } = await supabase
        .from('marketing_campaigns')
        .select('id, name, platform, spent, budget') as { data: AnyData[] | null };

      // Fetch Meta insights for investment
      const { data: metaInsights } = await supabase
        .from('meta_insights')
        .select('spend')
        .gte('date_start', fromDate)
        .lte('date_stop', toDate)
        .eq('entity_type', 'account') as { data: AnyData[] | null };

      // Fetch Google insights
      const { data: googleInsights } = await supabase
        .from('google_insights')
        .select('cost_micros')
        .gte('date_start', fromDate)
        .lte('date_stop', toDate)
        .eq('entity_type', 'account') as { data: AnyData[] | null };

      const totalMetaSpend = metaInsights?.reduce((sum: number, i: AnyData) => sum + (i.spend || 0), 0) || 0;
      const totalGoogleSpend = googleInsights?.reduce((sum: number, i: AnyData) => sum + ((i.cost_micros || 0) / 1000000), 0) || 0;

      // Create maps for quick lookups
      const leadCostMap = new Map<string, { campaignId: string; cost: number }>();
      leadCosts?.forEach(lc => {
        if (lc.lead_id && lc.campaign_id) {
          leadCostMap.set(lc.lead_id, { campaignId: lc.campaign_id, cost: lc.cost_amount || 0 });
        }
      });

      const campaignMap = new Map<string, { name: string; platform: string; spent: number }>();
      campaigns?.forEach(c => {
        campaignMap.set(c.id, { name: c.name, platform: c.platform, spent: c.spent || 0 });
      });

      // Build source metrics
      const sourceMap = new Map<string, ChannelMetrics>();
      const campaignMetricsMap = new Map<string, CampaignMetrics>();

      // Process all leads
      leads?.forEach(lead => {
        let source = lead.source || 'outros';
        const leadCostInfo = leadCostMap.get(lead.id);
        
        // If lead has campaign association, use campaign's platform as source
        if (leadCostInfo && campaignMap.has(leadCostInfo.campaignId)) {
          const campaign = campaignMap.get(leadCostInfo.campaignId)!;
          const platform = campaign.platform.toLowerCase();
          
          if (platform.includes('facebook') || platform.includes('meta')) source = 'facebook';
          else if (platform.includes('instagram')) source = 'instagram';
          else if (platform.includes('google')) source = 'google';
        }

        // Initialize source metrics if needed
        if (!sourceMap.has(source)) {
          sourceMap.set(source, {
            channel: source,
            channelLabel: sourceLabels[source] || source,
            leads: 0,
            qualifiedLeads: 0,
            appointments: 0,
            sales: 0,
            revenue: 0,
            investment: 0,
            cpl: 0,
            cpa: 0,
            conversionRate: 0,
            avgTicket: 0,
            roas: 0,
          });
        }

        const metrics = sourceMap.get(source)!;
        metrics.leads++;

        if (lead.qualification_status === 'qualificado') {
          metrics.qualifiedLeads++;
        }

        // Check for negotiations with appointments
        const leadNegotiations = negotiations?.filter(n => n.lead_id === lead.id) || [];
        if (leadNegotiations.some(n => n.appointment_date)) {
          metrics.appointments++;
        }

        // Check for sales
        const leadSales = sales?.filter(s => s.lead_id === lead.id) || [];
        if (leadSales.length > 0) {
          metrics.sales += leadSales.length;
          metrics.revenue += leadSales.reduce((sum, s) => sum + (s.sale_price || 0), 0);
        }

        // Track by campaign if applicable
        if (leadCostInfo && campaignMap.has(leadCostInfo.campaignId)) {
          const campaignId = leadCostInfo.campaignId;
          const campaign = campaignMap.get(campaignId)!;

          if (!campaignMetricsMap.has(campaignId)) {
            campaignMetricsMap.set(campaignId, {
              campaignId,
              campaignName: campaign.name,
              platform: campaign.platform,
              channel: campaign.platform,
              channelLabel: campaign.name,
              leads: 0,
              qualifiedLeads: 0,
              appointments: 0,
              sales: 0,
              revenue: 0,
              investment: campaign.spent,
              cpl: 0,
              cpa: 0,
              conversionRate: 0,
              avgTicket: 0,
              roas: 0,
            });
          }

          const campaignMetrics = campaignMetricsMap.get(campaignId)!;
          campaignMetrics.leads++;
          if (lead.qualification_status === 'qualificado') campaignMetrics.qualifiedLeads++;
          if (leadNegotiations.some(n => n.appointment_date)) campaignMetrics.appointments++;
          if (leadSales.length > 0) {
            campaignMetrics.sales += leadSales.length;
            campaignMetrics.revenue += leadSales.reduce((sum, s) => sum + (s.sale_price || 0), 0);
          }
        }
      });

      // Handle direct negotiations (without leads)
      const directNegotiations = negotiations?.filter(n => !n.lead_id) || [];
      if (directNegotiations.length > 0) {
        const directSales = sales?.filter(s => !s.lead_id) || [];
        
        sourceMap.set('direto', {
          channel: 'direto',
          channelLabel: sourceLabels['direto'],
          leads: directNegotiations.length,
          qualifiedLeads: directNegotiations.filter(n => n.status !== 'perdida').length,
          appointments: directNegotiations.filter(n => n.appointment_date).length,
          sales: directSales.length,
          revenue: directSales.reduce((sum, s) => sum + (s.sale_price || 0), 0),
          investment: 0,
          cpl: 0,
          cpa: 0,
          conversionRate: 0,
          avgTicket: 0,
          roas: 0,
        });
      }

      // Distribute Meta investment to facebook/instagram proportionally
      const metaSources = ['facebook', 'instagram'];
      const metaLeadsCount = Array.from(sourceMap.entries())
        .filter(([src]) => metaSources.includes(src))
        .reduce((sum, [, m]) => sum + m.leads, 0);

      // Distribute Google investment
      const googleMetrics = sourceMap.get('google');
      if (googleMetrics && googleMetrics.leads > 0) {
        googleMetrics.investment = totalGoogleSpend;
      }

      // Calculate derived metrics for sources
      sourceMap.forEach((metrics, source) => {
        if (metaSources.includes(source) && metaLeadsCount > 0) {
          metrics.investment = (metrics.leads / metaLeadsCount) * totalMetaSpend;
        }

        metrics.cpl = metrics.leads > 0 ? metrics.investment / metrics.leads : 0;
        metrics.cpa = metrics.sales > 0 ? metrics.investment / metrics.sales : 0;
        metrics.conversionRate = metrics.leads > 0 ? (metrics.sales / metrics.leads) * 100 : 0;
        metrics.avgTicket = metrics.sales > 0 ? metrics.revenue / metrics.sales : 0;
        metrics.roas = metrics.investment > 0 ? metrics.revenue / metrics.investment : 0;
      });

      // Calculate derived metrics for campaigns
      campaignMetricsMap.forEach(metrics => {
        metrics.cpl = metrics.leads > 0 ? metrics.investment / metrics.leads : 0;
        metrics.cpa = metrics.sales > 0 ? metrics.investment / metrics.sales : 0;
        metrics.conversionRate = metrics.leads > 0 ? (metrics.sales / metrics.leads) * 100 : 0;
        metrics.avgTicket = metrics.sales > 0 ? metrics.revenue / metrics.sales : 0;
        metrics.roas = metrics.investment > 0 ? metrics.revenue / metrics.investment : 0;
      });

      const bySource = Array.from(sourceMap.values()).sort((a, b) => b.leads - a.leads);
      const byCampaign = Array.from(campaignMetricsMap.values()).sort((a, b) => b.leads - a.leads);

      // Calculate totals
      const totalInvestment = totalMetaSpend + totalGoogleSpend;
      
      // ROAS only from paid sources
      const paidSourceMetrics = bySource.filter(m => PAID_SOURCES.includes(m.channel));
      const paidRevenue = paidSourceMetrics.reduce((sum, m) => sum + m.revenue, 0);

      const totals = bySource.reduce(
        (acc, m) => ({
          leads: acc.leads + m.leads,
          qualifiedLeads: acc.qualifiedLeads + m.qualifiedLeads,
          appointments: acc.appointments + m.appointments,
          sales: acc.sales + m.sales,
          revenue: acc.revenue + m.revenue,
          investment: acc.investment + m.investment,
          paidRevenue: acc.paidRevenue,
          roas: acc.roas,
        }),
        { leads: 0, qualifiedLeads: 0, appointments: 0, sales: 0, revenue: 0, investment: 0, paidRevenue, roas: 0 }
      );

      // ROAS calculated only from paid traffic
      totals.roas = totalInvestment > 0 ? paidRevenue / totalInvestment : 0;

      return { bySource, byCampaign, totals };
    },
    staleTime: 60000,
  });
}
