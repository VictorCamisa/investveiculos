export interface MarketingCampaign {
  id: string;
  name: string;
  platform: string;
  budget: number;
  spent: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Computed
  leads_count?: number;
  conversions_count?: number;
  cpl?: number; // Cost per lead
  cpa?: number; // Cost per acquisition (conversion)
}

export interface LeadCost {
  id: string;
  lead_id: string;
  campaign_id: string | null;
  cost_amount: number;
  description: string | null;
  created_at: string;
  // Joined
  campaign?: MarketingCampaign;
}

export const platformLabels: Record<string, string> = {
  facebook: 'Facebook Ads',
  instagram: 'Instagram Ads',
  google_ads: 'Google Ads',
  olx: 'OLX',
  webmotors: 'Webmotors',
  indicacao: 'Indicação',
  outros: 'Outros',
};

export const platformColors: Record<string, string> = {
  facebook: 'bg-blue-600',
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  google_ads: 'bg-yellow-500',
  olx: 'bg-orange-500',
  webmotors: 'bg-red-600',
  indicacao: 'bg-green-500',
  outros: 'bg-gray-500',
};
