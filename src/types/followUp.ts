export type TriggerType = 'manual' | 'after_lead_creation' | 'after_status_change' | 'after_inactivity' | 'scheduled';

export interface FollowUpFlow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  
  // Segmentation
  target_lead_status: string[];
  target_lead_sources: string[];
  target_vehicle_interests: string[];
  target_negotiation_status: string[];
  
  // Timing
  trigger_type: TriggerType;
  delay_days: number;
  delay_hours: number;
  specific_time: string | null;
  days_of_week: number[];
  
  // Message
  message_template: string;
  include_vehicle_info: boolean;
  include_salesperson_name: boolean;
  include_company_name: boolean;
  
  // WhatsApp
  whatsapp_button_text: string;
  
  // Conditions
  min_days_since_last_contact: number | null;
  max_contacts_per_lead: number;
  exclude_converted_leads: boolean;
  exclude_lost_leads: boolean;
  
  // Priority
  priority: number;
  
  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const triggerTypeLabels: Record<TriggerType, string> = {
  manual: 'Manual',
  after_lead_creation: 'Após criar lead',
  after_status_change: 'Após mudança de status',
  after_inactivity: 'Após inatividade',
  scheduled: 'Agendado',
};

export const daysOfWeekLabels: Record<number, string> = {
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
  7: 'Domingo',
};
