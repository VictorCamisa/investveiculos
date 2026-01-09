// =====================================================
// Types para o Módulo de Marketing Avançado
// =====================================================

export interface ChannelCost {
  id: string;
  channel: string;
  month: string;
  fixed_cost: number;
  variable_cost: number;
  total_leads: number;
  total_sales: number;
  total_revenue: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UTMLink {
  id: string;
  name: string;
  base_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string | null;
  utm_term: string | null;
  full_url: string;
  clicks: number;
  leads_generated: number;
  is_template: boolean;
  created_by: string | null;
  created_at: string;
}

export interface CampaignEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: 'campanha_inicio' | 'campanha_fim' | 'feriado' | 'promocao' | 'lembrete';
  start_date: string;
  end_date: string | null;
  campaign_id: string | null;
  meta_campaign_id: string | null;
  color: string;
  all_day: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketingAlert {
  id: string;
  alert_type: 'lead_sem_resposta' | 'orcamento_alto' | 'ctr_baixo' | 'no_show' | 'meta_atingida' | 'roas_baixo' | 'frequencia_alta';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  is_dismissed: boolean;
  related_entity_type: string | null;
  related_entity_id: string | null;
  user_id: string | null;
  created_at: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  report_type: 'weekly_performance' | 'monthly_roi' | 'campaign_analysis' | 'lost_leads';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  config: Record<string, unknown> | null;
  last_sent_at: string | null;
  next_send_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Automotive KPIs
export interface AutomotiveKPIs {
  // Existing
  investment: number;
  leads: number;
  qualifiedLeads: number;
  cpl: number;
  cplQualified: number;
  appointments: number;
  sales: number;
  revenue: number;
  roas: number;
  
  // New Automotive KPIs
  costPerAppointment: number;
  costPerSale: number; // CPA
  avgTicket: number;
  avgConversionDays: number;
  cacPayback: number;
  noShowRate: number;
  testDriveScheduled: number;
  testDriveCompleted: number;
  testDriveRate: number;
  pipelineValue: number;
}

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

export interface LeadOriginData {
  bySource: ChannelMetrics[];
  totals: {
    leads: number;
    qualifiedLeads: number;
    appointments: number;
    sales: number;
    revenue: number;
    investment: number;
  };
}

export interface ComparativeData {
  current: AutomotiveKPIs;
  previous: AutomotiveKPIs;
  variations: {
    investment: number;
    leads: number;
    cpl: number;
    appointments: number;
    sales: number;
    revenue: number;
    roas: number;
  };
}

// Navigation
export interface MarketingNavItem {
  path: string;
  label: string;
  icon: string;
  description?: string;
}

// Channel labels
export const channelLabels: Record<string, string> = {
  facebook: 'Facebook Ads',
  instagram: 'Instagram Ads',
  google_ads: 'Google Ads',
  olx: 'OLX',
  webmotors: 'Webmotors',
  icarros: 'iCarros',
  indicacao: 'Indicação',
  site: 'Site Próprio',
  whatsapp: 'WhatsApp Direto',
  loja: 'Visita na Loja',
  outros: 'Outros',
};

// Alert type labels
export const alertTypeLabels: Record<string, string> = {
  lead_sem_resposta: 'Lead sem resposta',
  orcamento_alto: 'Orçamento alto',
  ctr_baixo: 'CTR baixo',
  no_show: 'No-show detectado',
  meta_atingida: 'Meta atingida',
  roas_baixo: 'ROAS baixo',
  frequencia_alta: 'Frequência alta',
};

// Event type labels
export const eventTypeLabels: Record<string, string> = {
  campanha_inicio: 'Início de Campanha',
  campanha_fim: 'Fim de Campanha',
  feriado: 'Feriado',
  promocao: 'Promoção',
  lembrete: 'Lembrete',
};

// Event type colors
export const eventTypeColors: Record<string, string> = {
  campanha_inicio: '#22c55e',
  campanha_fim: '#ef4444',
  feriado: '#f59e0b',
  promocao: '#8b5cf6',
  lembrete: '#3b82f6',
};
