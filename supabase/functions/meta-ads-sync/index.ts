import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const META_API_VERSION = 'v21.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

interface MetaCampaign {
  id: string;
  name: string;
  objective?: string;
  status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
  created_time?: string;
  updated_time?: string;
}

interface MetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  optimization_goal?: string;
  billing_event?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  targeting?: any;
}

interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  status: string;
  creative?: { id: string };
}

interface MetaInsight {
  impressions?: string;
  reach?: string;
  clicks?: string;
  unique_clicks?: string;
  spend?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  frequency?: string;
  actions?: any[];
  date_start: string;
  date_stop: string;
}

interface TestCredentials {
  accessToken: string;
  adAccountId: string;
}

async function fetchFromMeta(endpoint: string, accessToken: string, params: Record<string, string> = {}) {
  const url = new URL(`${META_BASE_URL}/${endpoint}`);
  url.searchParams.set('access_token', accessToken);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  console.log(`Fetching from Meta: ${endpoint}`);
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const error = await response.text();
    console.error(`Meta API Error: ${error}`);
    throw new Error(`Meta API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

async function testConnection(accessToken: string, adAccountId: string) {
  // Test the connection by fetching account info
  console.log('Testing Meta connection...');
  console.log(`Ad Account ID: ${adAccountId}`);
  
  const data = await fetchFromMeta(adAccountId, accessToken, {
    fields: 'id,name,account_status'
  });
  
  console.log('Connection test successful:', data);
  return data;
}

async function syncCampaigns(supabase: any, adAccountId: string, accessToken: string) {
  console.log('Syncing campaigns...');
  
  const data = await fetchFromMeta(`${adAccountId}/campaigns`, accessToken, {
    fields: 'id,name,objective,status,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time',
    limit: '500'
  });

  const campaigns: MetaCampaign[] = data.data || [];
  console.log(`Found ${campaigns.length} campaigns`);

  for (const campaign of campaigns) {
    const { error } = await supabase
      .from('meta_campaigns')
      .upsert({
        meta_campaign_id: campaign.id,
        name: campaign.name,
        objective: campaign.objective,
        status: campaign.status,
        daily_budget: campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : null,
        lifetime_budget: campaign.lifetime_budget ? parseFloat(campaign.lifetime_budget) / 100 : null,
        start_time: campaign.start_time,
        stop_time: campaign.stop_time,
        created_time: campaign.created_time,
        updated_time: campaign.updated_time,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'meta_campaign_id' });

    if (error) {
      console.error(`Error upserting campaign ${campaign.id}:`, error);
    }
  }

  return campaigns.length;
}

async function syncAdSets(supabase: any, adAccountId: string, accessToken: string) {
  console.log('Syncing ad sets...');
  
  const data = await fetchFromMeta(`${adAccountId}/adsets`, accessToken, {
    fields: 'id,name,campaign_id,status,optimization_goal,billing_event,daily_budget,lifetime_budget,targeting',
    limit: '500'
  });

  const adsets: MetaAdSet[] = data.data || [];
  console.log(`Found ${adsets.length} ad sets`);

  // Get campaign mapping
  const { data: campaignData } = await supabase
    .from('meta_campaigns')
    .select('id, meta_campaign_id');
  
  const campaignMap = new Map(
    (campaignData || []).map((c: any) => [c.meta_campaign_id, c.id])
  );

  for (const adset of adsets) {
    const { error } = await supabase
      .from('meta_adsets')
      .upsert({
        meta_adset_id: adset.id,
        campaign_id: campaignMap.get(adset.campaign_id) || null,
        meta_campaign_id: adset.campaign_id,
        name: adset.name,
        status: adset.status,
        optimization_goal: adset.optimization_goal,
        billing_event: adset.billing_event,
        daily_budget: adset.daily_budget ? parseFloat(adset.daily_budget) / 100 : null,
        lifetime_budget: adset.lifetime_budget ? parseFloat(adset.lifetime_budget) / 100 : null,
        targeting: adset.targeting,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'meta_adset_id' });

    if (error) {
      console.error(`Error upserting adset ${adset.id}:`, error);
    }
  }

  return adsets.length;
}

async function syncAds(supabase: any, adAccountId: string, accessToken: string) {
  console.log('Syncing ads...');
  
  const data = await fetchFromMeta(`${adAccountId}/ads`, accessToken, {
    fields: 'id,name,adset_id,status,creative',
    limit: '500'
  });

  const ads: MetaAd[] = data.data || [];
  console.log(`Found ${ads.length} ads`);

  // Get adset mapping
  const { data: adsetData } = await supabase
    .from('meta_adsets')
    .select('id, meta_adset_id');
  
  const adsetMap = new Map(
    (adsetData || []).map((a: any) => [a.meta_adset_id, a.id])
  );

  for (const ad of ads) {
    const { error } = await supabase
      .from('meta_ads')
      .upsert({
        meta_ad_id: ad.id,
        adset_id: adsetMap.get(ad.adset_id) || null,
        meta_adset_id: ad.adset_id,
        name: ad.name,
        status: ad.status,
        creative_id: ad.creative?.id,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'meta_ad_id' });

    if (error) {
      console.error(`Error upserting ad ${ad.id}:`, error);
    }
  }

  return ads.length;
}

async function syncInsights(supabase: any, adAccountId: string, accessToken: string) {
  console.log('Syncing insights...');
  
  // Get last 30 days of account-level insights by day
  const data = await fetchFromMeta(`${adAccountId}/insights`, accessToken, {
    fields: 'impressions,reach,clicks,unique_clicks,spend,ctr,cpc,cpm,frequency,actions',
    time_range: JSON.stringify({ since: getDateDaysAgo(30), until: getDateDaysAgo(0) }),
    time_increment: '1',
    level: 'account'
  });

  const insights: MetaInsight[] = data.data || [];
  console.log(`Found ${insights.length} daily insights`);

  let insightsCount = 0;

  for (const insight of insights) {
    const conversions = insight.actions?.find((a: any) => a.action_type === 'lead')?.value || 
                       insight.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0;

    const { error } = await supabase
      .from('meta_insights')
      .upsert({
        entity_type: 'account',
        entity_id: adAccountId,
        date_start: insight.date_start,
        date_stop: insight.date_stop,
        impressions: parseInt(insight.impressions || '0'),
        reach: parseInt(insight.reach || '0'),
        clicks: parseInt(insight.clicks || '0'),
        unique_clicks: parseInt(insight.unique_clicks || '0'),
        spend: parseFloat(insight.spend || '0'),
        ctr: parseFloat(insight.ctr || '0'),
        cpc: parseFloat(insight.cpc || '0'),
        cpm: parseFloat(insight.cpm || '0'),
        frequency: parseFloat(insight.frequency || '0'),
        actions: insight.actions,
        conversions: parseInt(String(conversions))
      }, { onConflict: 'entity_type,entity_id,date_start' });

    if (error) {
      console.error(`Error upserting insight:`, error);
    } else {
      insightsCount++;
    }
  }

  // Also sync campaign-level insights for the last 30 days
  const campaignInsightsData = await fetchFromMeta(`${adAccountId}/insights`, accessToken, {
    fields: 'campaign_id,campaign_name,impressions,reach,clicks,unique_clicks,spend,ctr,cpc,cpm,frequency,actions',
    time_range: JSON.stringify({ since: getDateDaysAgo(30), until: getDateDaysAgo(0) }),
    level: 'campaign'
  });

  const campaignInsights = campaignInsightsData.data || [];
  console.log(`Found ${campaignInsights.length} campaign insights`);

  for (const insight of campaignInsights) {
    const conversions = insight.actions?.find((a: any) => a.action_type === 'lead')?.value || 
                       insight.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0;

    const { error } = await supabase
      .from('meta_insights')
      .upsert({
        entity_type: 'campaign',
        entity_id: insight.campaign_id,
        date_start: insight.date_start,
        date_stop: insight.date_stop,
        impressions: parseInt(insight.impressions || '0'),
        reach: parseInt(insight.reach || '0'),
        clicks: parseInt(insight.clicks || '0'),
        unique_clicks: parseInt(insight.unique_clicks || '0'),
        spend: parseFloat(insight.spend || '0'),
        ctr: parseFloat(insight.ctr || '0'),
        cpc: parseFloat(insight.cpc || '0'),
        cpm: parseFloat(insight.cpm || '0'),
        frequency: parseFloat(insight.frequency || '0'),
        actions: insight.actions,
        conversions: parseInt(String(conversions))
      }, { onConflict: 'entity_type,entity_id,date_start' });

    if (error) {
      console.error(`Error upserting campaign insight:`, error);
    } else {
      insightsCount++;
    }
  }

  return insightsCount;
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration.');
    }

    // Parse request body
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      // No body provided, use env vars
    }

    const syncType = body.syncType || 'full';
    const testCredentials: TestCredentials | undefined = body.testCredentials;

    // Use test credentials if provided, otherwise use env vars
    let accessToken: string;
    let adAccountId: string;

    if (testCredentials) {
      accessToken = testCredentials.accessToken;
      adAccountId = testCredentials.adAccountId;
      console.log('Using provided test credentials');
    } else {
      const META_ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN');
      const META_AD_ACCOUNT_ID = Deno.env.get('META_AD_ACCOUNT_ID');

      if (!META_ACCESS_TOKEN || !META_AD_ACCOUNT_ID) {
        throw new Error('Missing Meta Ads configuration. Please set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID secrets or provide testCredentials.');
      }

      accessToken = META_ACCESS_TOKEN;
      adAccountId = META_AD_ACCOUNT_ID;
      console.log('Using environment credentials');
    }

    // Ensure adAccountId has act_ prefix
    if (!adAccountId.startsWith('act_')) {
      adAccountId = `act_${adAccountId}`;
    }

    console.log(`Starting Meta Ads ${syncType}...`);
    console.log(`Ad Account ID: ${adAccountId}`);

    // Create Supabase client with service role for bypassing RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // If it's just a test, verify connection and return
    if (syncType === 'test') {
      const accountInfo = await testConnection(accessToken, adAccountId);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Connection test successful',
          data: {
            account_id: accountInfo.id,
            account_name: accountInfo.name,
            account_status: accountInfo.account_status
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabase
      .from('meta_sync_logs')
      .insert({
        sync_type: syncType,
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (syncLogError) {
      console.error('Error creating sync log:', syncLogError);
    }

    const syncLogId = syncLog?.id;

    try {
      // Sync all data
      const campaignsCount = await syncCampaigns(supabase, adAccountId, accessToken);
      const adsetsCount = await syncAdSets(supabase, adAccountId, accessToken);
      const adsCount = await syncAds(supabase, adAccountId, accessToken);
      const insightsCount = await syncInsights(supabase, adAccountId, accessToken);

      // Update sync log with success
      if (syncLogId) {
        await supabase
          .from('meta_sync_logs')
          .update({
            status: 'completed',
            campaigns_synced: campaignsCount,
            adsets_synced: adsetsCount,
            ads_synced: adsCount,
            insights_synced: insightsCount,
            completed_at: new Date().toISOString()
          })
          .eq('id', syncLogId);
      }

      console.log('Meta Ads sync completed successfully!');
      console.log(`Synced: ${campaignsCount} campaigns, ${adsetsCount} ad sets, ${adsCount} ads, ${insightsCount} insights`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Meta Ads sync completed successfully',
          data: {
            campaigns_synced: campaignsCount,
            adsets_synced: adsetsCount,
            ads_synced: adsCount,
            insights_synced: insightsCount
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (syncError: any) {
      console.error('Sync error:', syncError);

      // Update sync log with error
      if (syncLogId) {
        await supabase
          .from('meta_sync_logs')
          .update({
            status: 'failed',
            error_message: syncError.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', syncLogId);
      }

      throw syncError;
    }
  } catch (error: any) {
    console.error('Error in meta-ads-sync:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
