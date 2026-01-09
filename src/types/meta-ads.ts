export interface MetaCampaign {
  id: string;
  meta_campaign_id: string;
  name: string;
  objective: string | null;
  status: string;
  daily_budget: number | null;
  lifetime_budget: number | null;
  start_time: string | null;
  stop_time: string | null;
  created_time: string | null;
  updated_time: string | null;
  last_sync_at: string;
  created_at: string;
  updated_at: string;
}

export interface MetaAdSet {
  id: string;
  meta_adset_id: string;
  campaign_id: string | null;
  meta_campaign_id: string;
  name: string;
  status: string;
  optimization_goal: string | null;
  billing_event: string | null;
  daily_budget: number | null;
  lifetime_budget: number | null;
  targeting: any;
  last_sync_at: string;
  created_at: string;
  updated_at: string;
}

export interface MetaAd {
  id: string;
  meta_ad_id: string;
  adset_id: string | null;
  meta_adset_id: string;
  name: string;
  status: string;
  creative_id: string | null;
  preview_url: string | null;
  last_sync_at: string;
  created_at: string;
  updated_at: string;
}

export interface MetaInsight {
  id: string;
  entity_type: 'account' | 'campaign' | 'adset' | 'ad';
  entity_id: string;
  date_start: string;
  date_stop: string;
  impressions: number;
  reach: number;
  clicks: number;
  unique_clicks: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
  actions: any;
  conversions: number;
  cost_per_result: number;
  created_at: string;
}

export interface MetaSyncLog {
  id: string;
  sync_type: string;
  status: string;
  campaigns_synced: number;
  adsets_synced: number;
  ads_synced: number;
  insights_synced: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface MetaKPIs {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalReach: number;
  avgCTR: number;
  avgCPC: number;
  avgCPM: number;
  avgFrequency: number;
  totalConversions: number;
}

export const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  DELETED: 'Excluída',
  ARCHIVED: 'Arquivada',
  PENDING_REVIEW: 'Em Revisão',
  DISAPPROVED: 'Reprovada',
  PREAPPROVED: 'Pré-aprovada',
  PENDING_BILLING_INFO: 'Aguardando Faturamento',
  CAMPAIGN_PAUSED: 'Campanha Pausada',
  ADSET_PAUSED: 'Conjunto Pausado',
  IN_PROCESS: 'Processando',
  WITH_ISSUES: 'Com Problemas',
  UNKNOWN: 'Desconhecido',
};

export const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500',
  PAUSED: 'bg-yellow-500',
  DELETED: 'bg-red-500',
  ARCHIVED: 'bg-gray-500',
  PENDING_REVIEW: 'bg-blue-500',
  DISAPPROVED: 'bg-red-600',
  PREAPPROVED: 'bg-blue-400',
  PENDING_BILLING_INFO: 'bg-orange-500',
  CAMPAIGN_PAUSED: 'bg-yellow-600',
  ADSET_PAUSED: 'bg-yellow-400',
  IN_PROCESS: 'bg-blue-300',
  WITH_ISSUES: 'bg-red-400',
  UNKNOWN: 'bg-gray-400',
};

export const objectiveLabels: Record<string, string> = {
  OUTCOME_AWARENESS: 'Reconhecimento',
  OUTCOME_ENGAGEMENT: 'Engajamento',
  OUTCOME_LEADS: 'Geração de Leads',
  OUTCOME_SALES: 'Vendas',
  OUTCOME_TRAFFIC: 'Tráfego',
  OUTCOME_APP_PROMOTION: 'Promoção de App',
  BRAND_AWARENESS: 'Reconhecimento de Marca',
  REACH: 'Alcance',
  LINK_CLICKS: 'Cliques no Link',
  POST_ENGAGEMENT: 'Engajamento de Post',
  PAGE_LIKES: 'Curtidas na Página',
  EVENT_RESPONSES: 'Respostas de Evento',
  LEAD_GENERATION: 'Geração de Leads',
  MESSAGES: 'Mensagens',
  CONVERSIONS: 'Conversões',
  CATALOG_SALES: 'Vendas do Catálogo',
  STORE_VISITS: 'Visitas à Loja',
  VIDEO_VIEWS: 'Visualizações de Vídeo',
};
