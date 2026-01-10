export type NegotiationStatus = 'em_andamento' | 'proposta_enviada' | 'negociando' | 'ganho' | 'perdido' | 'pausado';
export type LossReasonType = 'sem_entrada' | 'sem_credito' | 'curioso' | 'caro' | 'comprou_outro' | 'desistiu' | 'sem_contato' | 'veiculo_vendido' | 'outros';

export interface Negotiation {
  id: string;
  lead_id: string;
  customer_id: string | null;
  vehicle_id: string | null;
  salesperson_id: string;
  status: NegotiationStatus;
  estimated_value: number | null;
  probability: number | null;
  expected_close_date: string | null;
  actual_close_date: string | null;
  loss_reason: string | null;
  structured_loss_reason: LossReasonType | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Appointment tracking
  appointment_date: string | null;
  appointment_time: string | null;
  showed_up: boolean | null;
  objections: string[];
  // Joined data
  lead?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    source: string;
    vehicle_interest: string | null;
  };
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    year_model: number;
    plate: string | null;
    sale_price: number | null;
  };
  salesperson?: {
    full_name: string | null;
  };
  customer?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
}

export const negotiationStatusLabels: Record<NegotiationStatus, string> = {
  em_andamento: 'Lead',
  proposta_enviada: 'Em Qualificação',
  negociando: 'Qualificado',
  ganho: 'Ganho',
  perdido: 'Perdido',
  pausado: 'Pausado',
};

export const negotiationStatusColors: Record<NegotiationStatus, string> = {
  em_andamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  proposta_enviada: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  negociando: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  ganho: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  perdido: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  pausado: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export const pipelineColumns: NegotiationStatus[] = [
  'em_andamento',
  'proposta_enviada',
  'negociando',
  'ganho',
  'perdido',
];

export const lossReasonLabels: Record<LossReasonType, string> = {
  sem_entrada: 'Sem Entrada',
  sem_credito: 'Sem Crédito',
  curioso: 'Apenas Curioso',
  caro: 'Preço Alto',
  comprou_outro: 'Comprou em Outro Lugar',
  desistiu: 'Desistiu da Compra',
  sem_contato: 'Sem Contato',
  veiculo_vendido: 'Veículo já Vendido',
  outros: 'Outros',
};

export const objectionOptions = [
  { value: 'entrada', label: 'Valor de Entrada' },
  { value: 'parcela', label: 'Valor da Parcela' },
  { value: 'preco', label: 'Preço do Veículo' },
  { value: 'km', label: 'Quilometragem' },
  { value: 'ano', label: 'Ano do Veículo' },
  { value: 'cor', label: 'Cor' },
  { value: 'modelo', label: 'Modelo/Versão' },
  { value: 'condicao', label: 'Condição do Veículo' },
  { value: 'garantia', label: 'Garantia' },
  { value: 'financiamento', label: 'Condições de Financiamento' },
  { value: 'troca', label: 'Valor da Troca' },
  { value: 'prazo', label: 'Prazo de Entrega' },
];
