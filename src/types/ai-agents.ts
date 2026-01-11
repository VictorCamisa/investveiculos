// =============================================
// CENTRO DE COMANDO DE IA - TIPOS E CONSTANTES
// =============================================

// Provedores de LLM
export const LLM_PROVIDERS = [
  { value: 'google', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic Claude' },
] as const;

// Modelos disponíveis por provedor
export const LLM_MODELS = {
  google: [
    { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro' },
    { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (Recomendado)' },
    { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
  ],
  openai: [
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  anthropic: [
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
  ],
} as const;

// Objetivos do agente
export const AGENT_OBJECTIVES = [
  { value: 'qualify_leads', label: 'Qualificar Leads' },
  { value: 'schedule_test_drive', label: 'Agendar Test Drives' },
  { value: 'answer_faq', label: 'Responder FAQs' },
  { value: 'customer_support', label: 'Suporte ao Cliente' },
  { value: 'custom', label: 'Personalizado' },
] as const;

// Status do agente
export const AGENT_STATUS = [
  { value: 'active', label: 'Ativo', color: 'green' },
  { value: 'inactive', label: 'Inativo', color: 'gray' },
  { value: 'training', label: 'Em Treinamento', color: 'yellow' },
] as const;

// Tipos de memória de curto prazo
export const SHORT_TERM_MEMORY_TYPES = [
  { value: 'local', label: 'Memória Local' },
  { value: 'redis', label: 'Redis Cache' },
] as const;

// Provedores de banco vetorial
export const VECTOR_DB_PROVIDERS = [
  { value: 'supabase', label: 'Supabase PGVector' },
  { value: 'pinecone', label: 'Pinecone' },
  { value: 'weaviate', label: 'Weaviate' },
] as const;

// Tipos de fonte de dados
export const DATA_SOURCE_TYPES = [
  { value: 'upload', label: 'Upload de Documentos' },
  { value: 'crm', label: 'Conexão com CRM' },
  { value: 'inventory', label: 'Conexão com Estoque' },
  { value: 'faq', label: 'FAQs/Manuais' },
  { value: 'custom_api', label: 'API Customizada' },
] as const;

// Métodos de autenticação para ferramentas
export const AUTH_METHODS = [
  { value: 'none', label: 'Nenhum' },
  { value: 'api_key_header', label: 'Chave API (Header)' },
  { value: 'api_key_query', label: 'Chave API (Query Param)' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
] as const;

// Tipos de guardrails
export const GUARDRAIL_TYPES = [
  { value: 'content_filter', label: 'Filtro de Conteúdo' },
  { value: 'business_rule', label: 'Regra de Negócio' },
  { value: 'action_limit', label: 'Limite de Ação' },
  { value: 'moderation', label: 'Moderação de Saída' },
] as const;

// Ações em violação de guardrail
export const VIOLATION_ACTIONS = [
  { value: 'block', label: 'Bloquear Resposta' },
  { value: 'warn', label: 'Avisar e Continuar' },
  { value: 'escalate', label: 'Escalar para Humano' },
] as const;

// Canais de notificação
export const NOTIFICATION_CHANNELS = [
  { value: 'email', label: 'E-mail' },
  { value: 'slack', label: 'Slack' },
  { value: 'whatsapp', label: 'WhatsApp' },
] as const;

// Canais de implantação
export const DEPLOYMENT_CHANNELS = [
  { value: 'widget', label: 'Widget Web' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'api', label: 'API' },
] as const;

// Formatos de saída
export const OUTPUT_FORMATS = [
  { value: 'text', label: 'Texto Simples' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
] as const;

// Modelos de embedding
export const EMBEDDING_MODELS = [
  { value: 'text-embedding-ada-002', label: 'OpenAI Ada 002' },
  { value: 'text-embedding-3-small', label: 'OpenAI Embedding 3 Small' },
  { value: 'text-embedding-3-large', label: 'OpenAI Embedding 3 Large' },
  { value: 'gemini-embedding-001', label: 'Gemini Embedding 001' },
] as const;

// Tipos de condição de notificação
export const NOTIFICATION_CONDITIONS = [
  { value: 'low_score', label: 'Lead Score baixo após X interações' },
  { value: 'api_error', label: 'Erro na chamada de API' },
  { value: 'human_request', label: 'Usuário solicitou falar com humano' },
  { value: 'conversation_timeout', label: 'Conversa sem resposta' },
  { value: 'custom', label: 'Condição personalizada' },
] as const;

// =============================================
// INTERFACES
// =============================================

export interface AIAgent {
  id: string;
  name: string;
  description: string | null;
  objective: string;
  status: 'active' | 'inactive' | 'training';
  
  // LLM Config
  llm_provider: string;
  llm_model: string;
  api_key_encrypted: string | null;
  temperature: number;
  top_p: number;
  max_tokens: number;
  system_prompt: string | null;
  
  // Memory Config
  short_term_memory_type: string;
  redis_host: string | null;
  redis_port: number | null;
  redis_password_encrypted: string | null;
  context_window_size: number;
  
  long_term_memory_enabled: boolean;
  vector_db_provider: string;
  vector_db_config: Record<string, unknown>;
  
  // Output Config
  output_format: string;
  
  // Voice Config (TTS/STT)
  enable_voice: boolean;
  voice_id: string | null;
  
  // Deployment
  deployment_channels: string[];
  embed_code: string | null;
  webhook_url: string | null;
  
  created_at: string;
  updated_at: string;
  created_by: string | null;
  
  // Relations
  tools?: AIAgentTool[];
  data_sources?: AIAgentDataSource[];
  workflows?: AIAgentWorkflow[];
  guardrails?: AIAgentGuardrail[];
}

export interface AIAgentTool {
  id: string;
  agent_id: string;
  name: string;
  description: string;
  endpoint_url: string | null;
  function_schema: Record<string, unknown>;
  auth_method: string;
  auth_credentials_encrypted: string | null;
  input_mapping: Record<string, unknown> | null;
  output_mapping: Record<string, unknown> | null;
  orchestration_rules: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
}

export interface AIAgentDataSource {
  id: string;
  agent_id: string;
  name: string;
  source_type: string;
  connection_config: Record<string, unknown>;
  table_name: string | null;
  embeddings_enabled: boolean;
  text_column: string | null;
  embedding_column: string | null;
  embedding_model: string | null;
  last_sync_at: string | null;
  sync_status: string;
  is_active: boolean;
  created_at: string;
}

export interface AIAgentWorkflow {
  id: string;
  agent_id: string;
  name: string;
  description: string | null;
  workflow_definition: Record<string, unknown>;
  trigger_conditions: Record<string, unknown> | null;
  is_default: boolean;
  is_active: boolean;
  priority: number;
  created_at: string;
}

export interface AIAgentGuardrail {
  id: string;
  agent_id: string;
  type: string;
  name: string;
  description: string | null;
  config: Record<string, unknown>;
  action_on_violation: string;
  is_active: boolean;
  created_at: string;
}

export interface AIAgentConversation {
  id: string;
  agent_id: string;
  session_id: string;
  lead_id: string | null;
  channel: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  metadata: Record<string, unknown>;
}

export interface AIAgentMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  thinking: string | null;
  tool_calls: Record<string, unknown> | null;
  tool_results: Record<string, unknown> | null;
  tokens_used: number | null;
  created_at: string;
}

export interface AIAgentMetrics {
  id: string;
  agent_id: string;
  date: string;
  conversations_count: number;
  leads_qualified: number;
  conversion_rate: number | null;
  avg_response_time_ms: number | null;
  avg_lead_score: number | null;
  tool_calls_count: Record<string, number>;
  errors_count: number;
  error_types: Record<string, number>;
  created_at: string;
}

export interface AIAgentNotification {
  id: string;
  agent_id: string;
  channel: string;
  channel_config: Record<string, unknown>;
  condition_type: string;
  condition_config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface AIAgentTest {
  id: string;
  agent_id: string;
  name: string;
  test_type: string;
  scenario: Record<string, unknown>;
  expected_outcome: string | null;
  actual_outcome: string | null;
  passed: boolean | null;
  executed_at: string | null;
  executed_by: string | null;
  created_at: string;
}

// =============================================
// FORM TYPES
// =============================================

export type AIAgentFormData = Omit<AIAgent, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'tools' | 'data_sources' | 'workflows' | 'guardrails'>;

export type AIAgentToolFormData = Omit<AIAgentTool, 'id' | 'created_at'>;

export type AIAgentDataSourceFormData = Omit<AIAgentDataSource, 'id' | 'created_at' | 'last_sync_at' | 'sync_status'>;

export type AIAgentWorkflowFormData = Omit<AIAgentWorkflow, 'id' | 'created_at'>;

export type AIAgentGuardrailFormData = Omit<AIAgentGuardrail, 'id' | 'created_at'>;

export type AIAgentNotificationFormData = Omit<AIAgentNotification, 'id' | 'created_at'>;

export type AIAgentTestFormData = Omit<AIAgentTest, 'id' | 'created_at' | 'executed_at' | 'executed_by' | 'actual_outcome' | 'passed'>;
