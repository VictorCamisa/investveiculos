export interface LeadQualification {
  id: string;
  lead_id: string | null;
  negotiation_id: string | null;
  qualified_by: string | null;
  score: number;
  vehicle_interest: string | null;
  budget_min: number | null;
  budget_max: number | null;
  down_payment: number | null;
  max_installment: number | null;
  payment_method: string | null;
  has_trade_in: boolean;
  trade_in_vehicle: string | null;
  trade_in_value: number | null;
  purchase_timeline: string | null;
  vehicle_usage: string | null;
  notes: string | null;
  engagement_score: number;
  completeness_score: number;
  created_at: string;
  updated_at: string;
}

export interface QualificationFormData {
  vehicle_interest: string;
  budget_min: number | null;
  budget_max: number | null;
  down_payment: number | null;
  max_installment: number | null;
  payment_method: string;
  has_trade_in: boolean;
  trade_in_vehicle: string;
  purchase_timeline: string;
  vehicle_usage: string;
  notes: string;
}

export interface ScoreBreakdown {
  data: number;
  engagement: number;
  total: number;
}

export type ScoreClassification = 'hot' | 'warm' | 'cold';

export const PAYMENT_METHODS = [
  { value: 'financiamento', label: 'Financiamento' },
  { value: 'a_vista', label: 'À Vista' },
  { value: 'consorcio', label: 'Consórcio' },
  { value: 'outro', label: 'Outro' },
] as const;

export const PURCHASE_TIMELINES = [
  { value: 'imediato', label: 'Imediato', points: 20 },
  { value: 'ate_30_dias', label: 'Em até 30 dias', points: 15 },
  { value: '3_a_6_meses', label: '3 a 6 meses', points: 5 },
  { value: 'pesquisando', label: 'Apenas pesquisando', points: 0 },
] as const;

export const VEHICLE_USAGE = [
  { value: 'trabalho', label: 'Trabalho' },
  { value: 'lazer_familia', label: 'Lazer/Família' },
  { value: 'misto', label: 'Misto' },
] as const;

// Engagement keywords for detecting user interactions
export const ENGAGEMENT_KEYWORDS = {
  clickedLink: [
    'acessei', 'vi o link', 'abri', 'cliquei', 'entrei no site',
    'vi a página', 'olhei o link', 'abri o site'
  ],
  requestedContact: [
    'falar com vendedor', 'quero atendimento', 'chamar vendedor',
    'contato humano', 'posso falar com alguém', 'atendente',
    'quero falar com uma pessoa', 'passar para vendedor'
  ]
} as const;
