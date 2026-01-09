import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Ads API configuration
const GOOGLE_ADS_API_VERSION = 'v19';

interface GoogleAdsConfig {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  customerId: string;
}

async function getAccessToken(config: GoogleAdsConfig): Promise<string> {
  console.log('Getting Google OAuth access token...');
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OAuth token error:', error);
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  console.log('Access token obtained successfully');
  return data.access_token;
}

async function makeGoogleAdsRequest(
  config: GoogleAdsConfig,
  accessToken: string,
  query: string
): Promise<any[]> {
  const customerId = config.customerId.replace(/-/g, '');
  // Use 'search' instead of 'searchStream' for better compatibility with test tokens
  const url = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:search`;

  console.log('Making Google Ads API request:', { customerId, queryLength: query.length, url });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': config.developerToken,
      'Content-Type': 'application/json',
      'login-customer-id': customerId, // Required for some account structures
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Google Ads API error:', response.status, error);
    throw new Error(`Google Ads API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('Google Ads API response received:', JSON.stringify(data).slice(0, 500));
  
  // 'search' returns { results: [...], fieldMask: '...' }
  return data.results || [];
}

async function syncCampaigns(
  supabase: any,
  config: GoogleAdsConfig,
  accessToken: string
): Promise<number> {
  console.log('Syncing campaigns...');
  
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign.bidding_strategy_type,
      campaign_budget.amount_micros,
      campaign.start_date,
      campaign.end_date
    FROM campaign
    WHERE campaign.status != 'REMOVED'
  `;

  const results = await makeGoogleAdsRequest(config, accessToken, query);
  console.log(`Found ${results.length} campaigns`);

  let synced = 0;
  for (const result of results) {
    const campaign = result.campaign;
    const budget = result.campaignBudget;

    const { error } = await supabase
      .from('google_campaigns')
      .upsert({
        google_campaign_id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        advertising_channel_type: campaign.advertisingChannelType,
        bidding_strategy_type: campaign.biddingStrategyType,
        daily_budget: budget?.amountMicros ? Number(budget.amountMicros) / 1000000 : null,
        start_date: campaign.startDate,
        end_date: campaign.endDate,
        last_sync_at: new Date().toISOString(),
      }, {
        onConflict: 'google_campaign_id',
      });

    if (error) {
      console.error('Error upserting campaign:', error);
    } else {
      synced++;
    }
  }

  console.log(`Synced ${synced} campaigns`);
  return synced;
}

async function syncAdGroups(
  supabase: any,
  config: GoogleAdsConfig,
  accessToken: string
): Promise<number> {
  console.log('Syncing ad groups...');

  const query = `
    SELECT
      ad_group.id,
      ad_group.name,
      ad_group.status,
      ad_group.campaign,
      ad_group.cpc_bid_micros
    FROM ad_group
    WHERE ad_group.status != 'REMOVED'
  `;

  const results = await makeGoogleAdsRequest(config, accessToken, query);
  console.log(`Found ${results.length} ad groups`);

  // Get campaign mappings
  const { data: campaigns } = await supabase
    .from('google_campaigns')
    .select('id, google_campaign_id');
  
  const campaignMap = new Map(campaigns?.map((c: any) => [c.google_campaign_id, c.id]) || []);

  let synced = 0;
  for (const result of results) {
    const adGroup = result.adGroup;
    const campaignId = adGroup.campaign?.split('/').pop();

    const { error } = await supabase
      .from('google_ad_groups')
      .upsert({
        google_ad_group_id: adGroup.id,
        google_campaign_id: campaignId,
        campaign_id: campaignMap.get(campaignId) || null,
        name: adGroup.name,
        status: adGroup.status,
        cpc_bid_micros: adGroup.cpcBidMicros,
        last_sync_at: new Date().toISOString(),
      }, {
        onConflict: 'google_ad_group_id',
      });

    if (error) {
      console.error('Error upserting ad group:', error);
    } else {
      synced++;
    }
  }

  console.log(`Synced ${synced} ad groups`);
  return synced;
}

async function syncAds(
  supabase: any,
  config: GoogleAdsConfig,
  accessToken: string
): Promise<number> {
  console.log('Syncing ads...');

  const query = `
    SELECT
      ad_group_ad.ad.id,
      ad_group_ad.ad.name,
      ad_group_ad.status,
      ad_group_ad.ad_group,
      ad_group_ad.ad.type,
      ad_group_ad.ad.final_urls,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions
    FROM ad_group_ad
    WHERE ad_group_ad.status != 'REMOVED'
  `;

  const results = await makeGoogleAdsRequest(config, accessToken, query);
  console.log(`Found ${results.length} ads`);

  // Get ad group mappings
  const { data: adGroups } = await supabase
    .from('google_ad_groups')
    .select('id, google_ad_group_id');
  
  const adGroupMap = new Map(adGroups?.map((a: any) => [a.google_ad_group_id, a.id]) || []);

  let synced = 0;
  for (const result of results) {
    const adGroupAd = result.adGroupAd;
    const ad = adGroupAd.ad;
    const adGroupId = adGroupAd.adGroup?.split('/').pop();

    const headlines = ad.responsiveSearchAd?.headlines?.map((h: any) => h.text) || [];
    const descriptions = ad.responsiveSearchAd?.descriptions?.map((d: any) => d.text) || [];

    const { error } = await supabase
      .from('google_ads')
      .upsert({
        google_ad_id: ad.id,
        google_ad_group_id: adGroupId,
        ad_group_id: adGroupMap.get(adGroupId) || null,
        name: ad.name || `Ad ${ad.id}`,
        status: adGroupAd.status,
        ad_type: ad.type,
        final_urls: ad.finalUrls || [],
        headlines,
        descriptions,
        last_sync_at: new Date().toISOString(),
      }, {
        onConflict: 'google_ad_id',
      });

    if (error) {
      console.error('Error upserting ad:', error);
    } else {
      synced++;
    }
  }

  console.log(`Synced ${synced} ads`);
  return synced;
}

async function syncInsights(
  supabase: any,
  config: GoogleAdsConfig,
  accessToken: string,
  dateFrom: string,
  dateTo: string
): Promise<number> {
  console.log(`Syncing insights from ${dateFrom} to ${dateTo}...`);

  const query = `
    SELECT
      campaign.id,
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.ctr,
      metrics.average_cpc,
      metrics.average_cpm
    FROM campaign
    WHERE segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
      AND campaign.status != 'REMOVED'
  `;

  const results = await makeGoogleAdsRequest(config, accessToken, query);
  console.log(`Found ${results.length} insight rows`);

  let synced = 0;
  for (const result of results) {
    const campaign = result.campaign;
    const metrics = result.metrics;
    const segments = result.segments;

    const { error } = await supabase
      .from('google_insights')
      .upsert({
        entity_type: 'campaign',
        entity_id: campaign.id,
        date_start: segments.date,
        date_stop: segments.date,
        impressions: metrics.impressions || 0,
        clicks: metrics.clicks || 0,
        cost_micros: metrics.costMicros || 0,
        conversions: metrics.conversions || 0,
        conversions_value: metrics.conversionsValue || 0,
        ctr: metrics.ctr || 0,
        avg_cpc_micros: metrics.averageCpc || 0,
        avg_cpm_micros: metrics.averageCpm || 0,
      }, {
        onConflict: 'entity_type,entity_id,date_start,date_stop',
      });

    if (error) {
      console.error('Error upserting insight:', error);
    } else {
      synced++;
    }
  }

  console.log(`Synced ${synced} insights`);
  return synced;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const normalizeSecret = (value: string | undefined) =>
      (value ?? '')
        .trim()
        // Remove accidental wrapping quotes that often get pasted into secret fields
        .replace(/^"(.*)"$/, '$1')
        .replace(/^'(.*)'$/, '$1');

    const config: GoogleAdsConfig = {
      developerToken: normalizeSecret(Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN')),
      clientId: normalizeSecret(Deno.env.get('GOOGLE_ADS_CLIENT_ID')),
      clientSecret: normalizeSecret(Deno.env.get('GOOGLE_ADS_CLIENT_SECRET')),
      refreshToken: normalizeSecret(Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN')),
      customerId: normalizeSecret(Deno.env.get('GOOGLE_ADS_CUSTOMER_ID')),
    };

    // Safe diagnostics (don’t log secrets)
    console.log('Google Ads config diagnostics:', {
      customerIdLength: config.customerId.length,
      clientIdLength: config.clientId.length,
      clientIdLooksLikeGoogle: config.clientId.includes('.apps.googleusercontent.com'),
      clientSecretLength: config.clientSecret.length,
      refreshTokenLength: config.refreshToken.length,
      developerTokenLength: config.developerToken.length,
    });

    // Validate config
    const missingKeys = Object.entries(config)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingKeys.length > 0) {
      throw new Error(`Missing Google Ads configuration: ${missingKeys.join(', ')}`);
    }

    const { syncType = 'full', dateFrom, dateTo } = await req.json().catch(() => ({}));

    // Create sync log
    const { data: syncLog, error: logError } = await supabase
      .from('google_sync_logs')
      .insert({
        sync_type: syncType,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating sync log:', logError);
    }

    const syncLogId = syncLog?.id;

    try {
      // Get access token
      const accessToken = await getAccessToken(config);

      let campaignsSynced = 0;
      let adGroupsSynced = 0;
      let adsSynced = 0;
      let insightsSynced = 0;

      if (syncType === 'full' || syncType === 'campaigns') {
        campaignsSynced = await syncCampaigns(supabase, config, accessToken);
      }

      if (syncType === 'full' || syncType === 'ad_groups') {
        adGroupsSynced = await syncAdGroups(supabase, config, accessToken);
      }

      if (syncType === 'full' || syncType === 'ads') {
        adsSynced = await syncAds(supabase, config, accessToken);
      }

      if (syncType === 'full' || syncType === 'insights') {
        // Default to last 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const fromDate = dateFrom || thirtyDaysAgo.toISOString().split('T')[0];
        const toDate = dateTo || today.toISOString().split('T')[0];
        
        insightsSynced = await syncInsights(supabase, config, accessToken, fromDate, toDate);
      }

      // Update sync log with success
      if (syncLogId) {
        await supabase
          .from('google_sync_logs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            campaigns_synced: campaignsSynced,
            ad_groups_synced: adGroupsSynced,
            ads_synced: adsSynced,
            insights_synced: insightsSynced,
          })
          .eq('id', syncLogId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Google Ads sync completed successfully',
          stats: {
            campaigns: campaignsSynced,
            adGroups: adGroupsSynced,
            ads: adsSynced,
            insights: insightsSynced,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      // Update sync log with error
      if (syncLogId) {
        await supabase
          .from('google_sync_logs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', syncLogId);
      }
      throw error;
    }

  } catch (error) {
    console.error('Google Ads sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
