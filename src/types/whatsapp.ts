export type WhatsAppInstanceStatus = 
  | 'connected' 
  | 'disconnected' 
  | 'connecting' 
  | 'qr_code';

export type WhatsAppMessageDirection = 'incoming' | 'outgoing';

export type WhatsAppMessageType = 
  | 'text' 
  | 'image' 
  | 'audio' 
  | 'video' 
  | 'document' 
  | 'sticker';

export type WhatsAppMessageStatus = 
  | 'pending' 
  | 'sent' 
  | 'delivered' 
  | 'read' 
  | 'failed';

export type WhatsAppTemplateCategory = 
  | 'greeting' 
  | 'follow_up' 
  | 'promotion' 
  | 'info' 
  | 'custom';

export interface WhatsAppInstance {
  id: string;
  name: string;
  instance_name: string;
  api_url: string;
  api_key: string;
  phone_number?: string;
  status: WhatsAppInstanceStatus;
  qr_code?: string;
  qr_code_expires_at?: string;
  is_default: boolean;
  is_shared: boolean;
  signature_template?: string;
  webhook_url?: string;
  created_by?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppContact {
  id: string;
  phone: string;
  name?: string;
  profile_pic_url?: string;
  lead_id?: string;
  customer_id?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  lead?: {
    id: string;
    name: string;
  };
  customer?: {
    id: string;
    name: string;
  };
}

export interface WhatsAppMessage {
  id: string;
  instance_id?: string;
  contact_id?: string;
  remote_jid: string;
  message_id?: string;
  direction: WhatsAppMessageDirection;
  message_type: WhatsAppMessageType;
  content?: string;
  media_url?: string;
  media_mime_type?: string;
  quoted_message_id?: string;
  status: WhatsAppMessageStatus;
  sent_by?: string;
  lead_id?: string;
  customer_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: WhatsAppTemplateCategory;
  content: string;
  variables?: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const instanceStatusLabels: Record<WhatsAppInstanceStatus, string> = {
  connected: 'Conectado',
  disconnected: 'Desconectado',
  connecting: 'Conectando...',
  qr_code: 'Aguardando QR Code',
};

export const instanceStatusColors: Record<WhatsAppInstanceStatus, string> = {
  connected: 'bg-green-500',
  disconnected: 'bg-red-500',
  connecting: 'bg-yellow-500',
  qr_code: 'bg-blue-500',
};

export const messageStatusLabels: Record<WhatsAppMessageStatus, string> = {
  pending: 'Enviando',
  sent: 'Enviado',
  delivered: 'Entregue',
  read: 'Lido',
  failed: 'Falhou',
};

export const templateCategoryLabels: Record<WhatsAppTemplateCategory, string> = {
  greeting: 'Saudação',
  follow_up: 'Follow-up',
  promotion: 'Promoção',
  info: 'Informação',
  custom: 'Personalizado',
};
