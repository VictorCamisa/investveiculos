import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GoogleCampaign {
  id: string;
  google_campaign_id: string;
  name: string;
  status: string;
  advertising_channel_type: string | null;
  bidding_strategy_type: string | null;
  daily_budget: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  last_sync_at: string | null;
}

export interface GoogleAdGroup {
  id: string;
  google_ad_group_id: string;
  google_campaign_id: string;
  campaign_id: string | null;
  name: string;
  status: string;
  cpc_bid_micros: number | null;
  created_at: string;
  updated_at: string;
  last_sync_at: string | null;
}

export interface GoogleAd {
  id: string;
  google_ad_id: string;
  google_ad_group_id: string;
  ad_group_id: string | null;
  name: string;
  status: string;
  ad_type: string | null;
  final_urls: string[] | null;
  headlines: string[] | null;
  descriptions: string[] | null;
  created_at: string;
  updated_at: string;
  last_sync_at: string | null;
}

export interface GoogleInsight {
  id: string;
  entity_type: string;
  entity_id: string;
  date_start: string;
  date_stop: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  conversions_value: number;
  ctr: number | null;
  avg_cpc_micros: number | null;
  avg_cpm_micros: number | null;
  created_at: string;
}

export interface GoogleSyncLog {
  id: string;
  sync_type: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  campaigns_synced: number;
  ad_groups_synced: number;
  ads_synced: number;
  insights_synced: number;
  error_message: string | null;
  created_at: string;
}

export function useGoogleCampaigns() {
  return useQuery({
    queryKey: ['google-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_campaigns')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as GoogleCampaign[];
    },
  });
}

export function useGoogleAdGroups(campaignId?: string) {
  return useQuery({
    queryKey: ['google-ad-groups', campaignId],
    queryFn: async () => {
      let query = supabase.from('google_ad_groups').select('*');
      
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      
      const { data, error } = await query.order('name');

      if (error) throw error;
      return data as GoogleAdGroup[];
    },
  });
}

export function useGoogleAds(adGroupId?: string) {
  return useQuery({
    queryKey: ['google-ads', adGroupId],
    queryFn: async () => {
      let query = supabase.from('google_ads').select('*');
      
      if (adGroupId) {
        query = query.eq('ad_group_id', adGroupId);
      }
      
      const { data, error } = await query.order('name');

      if (error) throw error;
      return data as GoogleAd[];
    },
  });
}

export function useGoogleInsights(entityType?: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['google-insights', entityType, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase.from('google_insights').select('*');
      
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      
      if (dateFrom) {
        query = query.gte('date_start', dateFrom);
      }
      
      if (dateTo) {
        query = query.lte('date_stop', dateTo);
      }
      
      const { data, error } = await query.order('date_start', { ascending: false });

      if (error) throw error;
      return data as GoogleInsight[];
    },
  });
}

export function useGoogleSyncLogs() {
  return useQuery({
    queryKey: ['google-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as GoogleSyncLog[];
    },
  });
}

export function useGoogleAdsSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { syncType?: string; dateFrom?: string; dateTo?: string }) => {
      const { data, error } = await supabase.functions.invoke('google-ads-sync', {
        body: params || {},
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Sync failed');
      
      return data;
    },
    onSuccess: (data) => {
      toast.success('Sincronização Google Ads concluída', {
        description: `${data.stats.campaigns} campanhas, ${data.stats.adGroups} grupos, ${data.stats.ads} anúncios`,
      });
      queryClient.invalidateQueries({ queryKey: ['google-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['google-ad-groups'] });
      queryClient.invalidateQueries({ queryKey: ['google-ads'] });
      queryClient.invalidateQueries({ queryKey: ['google-insights'] });
      queryClient.invalidateQueries({ queryKey: ['google-sync-logs'] });
    },
    onError: (error) => {
      toast.error('Erro na sincronização', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    },
  });
}

export function useGoogleAdsKPIs(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['google-ads-kpis', dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('google_insights')
        .select('*')
        .eq('entity_type', 'campaign');
      
      if (dateFrom) {
        query = query.gte('date_start', dateFrom);
      }
      
      if (dateTo) {
        query = query.lte('date_stop', dateTo);
      }
      
      const { data, error } = await query;

      if (error) throw error;

      const insights = data as GoogleInsight[];
      
      // Aggregate metrics
      const totalImpressions = insights.reduce((sum, i) => sum + (i.impressions || 0), 0);
      const totalClicks = insights.reduce((sum, i) => sum + (i.clicks || 0), 0);
      const totalCostMicros = insights.reduce((sum, i) => sum + (i.cost_micros || 0), 0);
      const totalConversions = insights.reduce((sum, i) => sum + (i.conversions || 0), 0);
      const totalConversionsValue = insights.reduce((sum, i) => sum + (i.conversions_value || 0), 0);

      const totalSpend = totalCostMicros / 1000000;
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
      const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
      const costPerConversion = totalConversions > 0 ? totalSpend / totalConversions : 0;
      const roas = totalSpend > 0 ? totalConversionsValue / totalSpend : 0;

      return {
        impressions: totalImpressions,
        clicks: totalClicks,
        spend: totalSpend,
        conversions: totalConversions,
        conversionsValue: totalConversionsValue,
        ctr,
        cpc,
        cpm,
        costPerConversion,
        roas,
      };
    },
  });
}
