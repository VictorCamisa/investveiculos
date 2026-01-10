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
  decision_maker: boolean;
  notes: string | null;
  engagement_score: number;
  intent_score: number;
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
  trade_in_value: number | null;
  purchase_timeline: string;
  decision_maker: boolean;
  notes: string;
}

export interface ScoreBreakdown {
  engagement: number;
  intent: number;
  completeness: number;
  total: number;
}

export type ScoreClassification = 'hot' | 'warm' | 'cold';

export const PAYMENT_METHODS = [
  { value: 'a_vista', label: 'À Vista' },
  { value: 'financiamento', label: 'Financiamento' },
  { value: 'consorcio', label: 'Consórcio' },
  { value: 'troca', label: 'Troca + Diferença' },
] as const;

export const PURCHASE_TIMELINES = [
  { value: 'imediato', label: 'Imediato (esta semana)' },
  { value: '15_dias', label: 'Próximos 15 dias' },
  { value: '30_dias', label: 'Próximos 30 dias' },
  { value: '60_dias', label: '60 dias ou mais' },
] as const;

// Intent keywords with their scores
export const INTENT_KEYWORDS = {
  high: [
    'quero comprar', 'vou comprar', 'fechar negócio', 'fechar negocio',
    'posso ir ver', 'agendar visita', 'posso visitar', 'vou aí',
    'preciso logo', 'urgente', 'hoje', 'amanhã', 'amanha'
  ],
  medium: [
    'tenho entrada', 'valor de entrada', 'quanto de entrada',
    'financiamento', 'parcela', 'consigo financiar',
    'trocar meu carro', 'tenho um pra trocar', 'aceita troca'
  ],
  low: [
    'interessado', 'interesse', 'gostei', 'bonito',
    'quanto custa', 'qual valor', 'preço', 'preco'
  ]
} as const;
