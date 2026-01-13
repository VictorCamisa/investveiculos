import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { connect } from "https://deno.land/x/redis@v0.32.3/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= REDIS MEMORY SYSTEM =============
interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

interface RedisMessage {
  role: string;
  content: string;
  timestamp: number;
}

async function getRedisClient(config: RedisConfig): Promise<any> {
  try {
    console.log(`[Redis] Connecting to ${config.host}:${config.port}...`);
    const client = await connect({
      hostname: config.host,
      port: config.port,
      password: config.password,
    });
    console.log('[Redis] Connected successfully');
    return client;
  } catch (error) {
    console.error('[Redis] Connection failed:', error);
    return null;
  }
}

async function getMessagesFromRedis(
  redisClient: any, 
  conversationId: string, 
  limit: number
): Promise<RedisMessage[]> {
  const key = `chat:${conversationId}:messages`;
  try {
    const messages = await redisClient.lrange(key, -limit, -1);
    return messages.map((m: string) => JSON.parse(m));
  } catch (error) {
    console.error('[Redis] Error reading messages:', error);
    return [];
  }
}

async function saveMessageToRedis(
  redisClient: any, 
  conversationId: string, 
  message: RedisMessage,
  ttlSeconds: number = 86400 // 24 horas
): Promise<void> {
  const key = `chat:${conversationId}:messages`;
  try {
    await redisClient.rpush(key, JSON.stringify(message));
    await redisClient.expire(key, ttlSeconds);
    console.log('[Redis] Message saved');
  } catch (error) {
    console.error('[Redis] Error saving message:', error);
  }
}

async function saveContextToRedis(
  redisClient: any,
  conversationId: string,
  context: any,
  ttlSeconds: number = 86400
): Promise<void> {
  const key = `chat:${conversationId}:context`;
  try {
    // Merge com contexto existente
    const existingRaw = await redisClient.get(key);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    const merged = { ...existing, ...context, updated_at: Date.now() };
    
    await redisClient.set(key, JSON.stringify(merged));
    await redisClient.expire(key, ttlSeconds);
    console.log('[Redis] Context saved:', Object.keys(context));
  } catch (error) {
    console.error('[Redis] Error saving context:', error);
  }
}

async function getContextFromRedis(
  redisClient: any,
  conversationId: string
): Promise<any> {
  const key = `chat:${conversationId}:context`;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('[Redis] Error reading context:', error);
    return {};
  }
}

// ============= QUALIFICATION EXTRACTION SYSTEM =============
interface ExtractedQualification {
  vehicle_interest: string | null;
  budget_min: number | null;
  budget_max: number | null;
  down_payment: number | null;
  max_installment: number | null;
  payment_method: 'financiamento' | 'a_vista' | 'consorcio' | 'outro' | null;
  has_trade_in: boolean;
  trade_in_vehicle: string | null;
  purchase_timeline: 'imediato' | 'ate_30_dias' | '3_a_6_meses' | 'pesquisando' | null;
  vehicle_usage: 'trabalho' | 'lazer_familia' | 'misto' | null;
}

// Remove accents for better matching
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function extractMoneyValue(text: string): number | null {
  const normalizedText = normalizeText(text);
  
  // Match patterns like: R$ 50.000, R$50000, 50 mil, 50000, 50k
  const patterns = [
    /r\$\s*([\d.,]+)/gi,
    /(\d+[\d.,]*)\s*(?:mil|k)/gi,
    /(\d{4,})/g, // Match numbers with 4+ digits
  ];
  
  for (const pattern of patterns) {
    const matches = normalizedText.matchAll(pattern);
    for (const match of matches) {
      let value = match[1].replace(/\./g, '').replace(',', '.');
      let num = parseFloat(value);
      
      // If matched "mil" or "k", multiply by 1000
      if (normalizedText.includes('mil') || normalizedText.includes('k')) {
        if (num < 1000) num *= 1000;
      }
      
      if (!isNaN(num) && num > 100) { // Ignore small numbers
        return num;
      }
    }
  }
  return null;
}

function extractQualificationData(messages: any[]): ExtractedQualification {
  // Get user messages
  const userText = messages
    .filter(m => m.role === 'user')
    .map(m => normalizeText(m.content))
    .join(' ');
  
  // Get assistant messages (for vehicle mentions)
  const assistantText = messages
    .filter(m => m.role === 'assistant')
    .map(m => normalizeText(m.content))
    .join(' ');
  
  const allText = userText + ' ' + assistantText;
  
  const qualification: ExtractedQualification = {
    vehicle_interest: null,
    budget_min: null,
    budget_max: null,
    down_payment: null,
    max_installment: null,
    payment_method: null,
    has_trade_in: false,
    trade_in_vehicle: null,
    purchase_timeline: null,
    vehicle_usage: null,
  };
  
  // ========== EXTRACT VEHICLE INTEREST ==========
  // Look for brand/model mentions in ASSISTANT messages (where vehicles are shown)
  const vehicleBrands = [
    'toyota', 'honda', 'hyundai', 'chevrolet', 'volkswagen', 'vw', 'fiat', 'ford', 
    'renault', 'jeep', 'nissan', 'peugeot', 'citroen', 'kia', 'bmw', 'mercedes', 
    'audi', 'mitsubishi', 'suzuki', 'caoa', 'chery', 'jac'
  ];
  const vehicleModels = [
    'corolla', 'civic', 'onix', 'hb20', 'polo', 'gol', 'creta', 'kicks', 'compass',
    'tracker', 'cruze', 'focus', 'fiesta', 'ka', 'argo', 'cronos', 'toro', 'renegade',
    't-cross', 'tcross', 'nivus', 'taos', 'hilux', 'ranger', 'saveiro', 'strada',
    'mobi', 'uno', 'kwid', 'sandero', 'logan', 'duster', 'captur', 'kicks', 'versa',
    'yaris', 'etios', 'fit', 'city', 'hr-v', 'hrv', 'wr-v', 'wrv', 'sentra', 'march',
    'celta', 'prisma', 'spin', 'cobalt', 'montana', 'fox', 'up', 'voyage', 'virtus',
    '208', '2008', '308', '3008', '408', 'c3', 'c4', 'aircross', 'doblò', 'doblo',
    'palio', 'siena', 'punto', 'bravo', 'linea', 'soul', 'sportage', 'cerato',
    'sorento', 'tucson', 'santa fe', 'ix35', 'clio', 'megane', 'fluence', 'symbol'
  ];
  
  // Words that should NOT be considered as vehicle interest
  const invalidVehicleWords = [
    'cadastrada', 'cadastrado', 'registrado', 'registrada', 'qualificado', 'qualificada',
    'atendimento', 'negociacao', 'contato', 'whatsapp', 'mensagem', 'conversa',
    'interesse', 'interessado', 'interessada', 'cliente', 'lead', 'vendedor'
  ];

  // Find vehicle interest from user or assistant context
  for (const model of vehicleModels) {
    const modelPattern = new RegExp(`(\\w+)?\\s*${model}\\s*(\\d{4})?`, 'i');
    const assistantMatch = assistantText.match(modelPattern);
    const userMatch = userText.match(modelPattern);
    
    if (userMatch) {
      const extracted = userMatch[0].trim().toLowerCase();
      // Skip if it's an invalid word
      if (!invalidVehicleWords.some(invalid => extracted.includes(invalid))) {
        qualification.vehicle_interest = userMatch[0].trim();
        break;
      }
    } else if (assistantMatch) {
      const extracted = assistantMatch[0].trim().toLowerCase();
      // Skip if it's an invalid word
      if (!invalidVehicleWords.some(invalid => extracted.includes(invalid))) {
        qualification.vehicle_interest = assistantMatch[0].trim();
        break;
      }
    }
  }
  
  // ========== EXTRACT BUDGET ==========
  const budgetMaxPatterns = [
    /(?:ate|maximo|no maximo|limite|teto)\s*(?:de)?\s*r?\$?\s*([\d.,]+\s*(?:mil|k)?)/i,
    /(?:nao|n[aã]o)\s*(?:quero|vou|posso)\s*(?:passar|gastar)\s*(?:de|dos)?\s*r?\$?\s*([\d.,]+\s*(?:mil|k)?)/i,
  ];
  
  for (const pattern of budgetMaxPatterns) {
    const match = userText.match(pattern);
    if (match) {
      qualification.budget_max = extractMoneyValue(match[0]);
      break;
    }
  }
  
  const budgetMinPatterns = [
    /(?:a partir|minimo|pelo menos|acima)\s*(?:de)?\s*r?\$?\s*([\d.,]+\s*(?:mil|k)?)/i,
  ];
  
  for (const pattern of budgetMinPatterns) {
    const match = userText.match(pattern);
    if (match) {
      qualification.budget_min = extractMoneyValue(match[0]);
      break;
    }
  }
  
  // ========== EXTRACT DOWN PAYMENT ==========
  const entradaPatterns = [
    /entrada\s*(?:de)?\s*r?\$?\s*([\d.,]+\s*(?:mil|k)?)/i,
    /(?:tenho|posso|consigo)\s*(?:dar)?\s*r?\$?\s*([\d.,]+\s*(?:mil|k)?)\s*(?:de)?\s*entrada/i,
    /dar\s*r?\$?\s*([\d.,]+\s*(?:mil|k)?)\s*(?:de)?\s*entrada/i,
    /r?\$?\s*([\d.,]+\s*(?:mil|k)?)\s*de\s*entrada/i,
  ];
  
  for (const pattern of entradaPatterns) {
    const match = userText.match(pattern);
    if (match) {
      qualification.down_payment = extractMoneyValue(match[0]);
      break;
    }
  }
  
  // ========== EXTRACT MAX INSTALLMENT ==========
  const parcelaPatterns = [
    /parcela\s*(?:de)?\s*(?:ate)?\s*r?\$?\s*([\d.,]+)/i,
    /(?:pagar|consigo|cabe)\s*(?:ate)?\s*r?\$?\s*([\d.,]+)\s*(?:por mes|mensal|de parcela)/i,
    /(?:mensal|por mes)\s*(?:de)?\s*r?\$?\s*([\d.,]+)/i,
    /r?\$?\s*([\d.,]+)\s*(?:por mes|mensal)/i,
  ];
  
  for (const pattern of parcelaPatterns) {
    const match = userText.match(pattern);
    if (match) {
      const value = extractMoneyValue(match[0]);
      if (value && value < 10000) { // Parcelas geralmente são menores
        qualification.max_installment = value;
        break;
      }
    }
  }
  
  // ========== EXTRACT PAYMENT METHOD ==========
  if (userText.includes('financ') || userText.includes('financiar')) {
    qualification.payment_method = 'financiamento';
  } else if (userText.includes('a vista') || userText.includes('avista') || userText.includes('dinheiro') || userText.includes('pix')) {
    qualification.payment_method = 'a_vista';
  } else if (userText.includes('consorcio')) {
    qualification.payment_method = 'consorcio';
  }
  
  // ========== DETECT TRADE-IN (IMPROVED) ==========
  const tradeInPatterns = [
    // "tenho um gol 2015 pra troca"
    /tenho\s+(?:um|uma|o|a|meu|minha)?\s*([\w\s]+?\d{4}[^\s]*)\s*(?:para|pra|na|de)?\s*troca/i,
    // "vou dar meu gol na troca"
    /(?:vou|quero|posso)\s*(?:dar|trocar|entregar)\s+(?:meu|minha|o|a)?\s*([\w\s]+?\d{4}[^\s]*)/i,
    // "gol g5 2015 com 120 mil km"
    /(?:meu|minha|tenho|um|uma)\s*((?:gol|palio|uno|celta|corsa|fiesta|ka|clio|fox|polo|civic|corolla|hb20|onix)[\w\s]*\d{4})/i,
    // Simple patterns
    /(?:dar|usar|colocar)\s*(?:na|como|de)\s*troca/i,
    /(?:veiculo|carro|moto)\s*(?:para|na|de)\s*troca/i,
    /(?:tenho|possuo)\s*(?:um|uma)?\s*(?:carro|veiculo|moto)\s*(?:para|pra|na)?\s*troca/i,
  ];
  
  for (const pattern of tradeInPatterns) {
    const match = userText.match(pattern);
    if (match) {
      qualification.has_trade_in = true;
      if (match[1] && match[1].length > 2) {
        // Clean up the vehicle name
        qualification.trade_in_vehicle = match[1]
          .replace(/\s+/g, ' ')
          .replace(/com\s*\d+\s*(?:mil|k)?\s*(?:km)?/i, '')
          .trim();
      }
      break;
    }
  }
  
  // Also detect by simple keywords if not already found
  if (!qualification.has_trade_in) {
    const tradeKeywords = ['na troca', 'pra troca', 'de troca', 'dar na troca', 'tenho carro', 'tenho veiculo'];
    if (tradeKeywords.some(kw => userText.includes(kw))) {
      qualification.has_trade_in = true;
    }
  }
  
  // ========== EXTRACT PURCHASE TIMELINE (IMPROVED) ==========
  // IMEDIATO: highest urgency
  const imediatoKeywords = [
    'urgente', 'hoje', 'amanha', 'imediato', 'essa semana', 'agora', 
    'ja', 'preciso logo', 'rapido', 'o quanto antes', 'proxima semana',
    'semana que vem', 'na semana'
  ];
  if (imediatoKeywords.some(kw => userText.includes(kw))) {
    qualification.purchase_timeline = 'imediato';
  }
  // 30 DIAS
  else if (userText.includes('esse mes') || userText.includes('30 dias') || 
           userText.includes('um mes') || userText.includes('1 mes') ||
           userText.includes('proximo mes') || userText.includes('mes que vem')) {
    qualification.purchase_timeline = 'ate_30_dias';
  }
  // 3-6 MESES
  else if (userText.includes('3 meses') || userText.includes('alguns meses') || 
           userText.includes('6 meses') || userText.includes('seis meses') ||
           userText.includes('tres meses') || userText.includes('meio ano')) {
    qualification.purchase_timeline = '3_a_6_meses';
  }
  // PESQUISANDO
  else if (userText.includes('pesquisando') || userText.includes('so olhando') || 
           userText.includes('ver preco') || userText.includes('sem pressa') ||
           userText.includes('nao tenho pressa') || userText.includes('conhecer')) {
    qualification.purchase_timeline = 'pesquisando';
  }
  
  // ========== EXTRACT VEHICLE USAGE ==========
  if (userText.includes('trabalho') || userText.includes('uber') || userText.includes('99') || 
      userText.includes('servico') || userText.includes('entregar') || userText.includes('aplicativo')) {
    qualification.vehicle_usage = 'trabalho';
  } else if (userText.includes('familia') || userText.includes('passeio') || 
             userText.includes('lazer') || userText.includes('viagem') || userText.includes('filhos')) {
    qualification.vehicle_usage = 'lazer_familia';
  } else if (userText.includes('misto') || userText.includes('trabalho e lazer') || 
             userText.includes('tudo') || userText.includes('dia a dia') || userText.includes('dia-a-dia')) {
    qualification.vehicle_usage = 'misto';
  }
  
  console.log('[extractQualificationData] Extracted:', JSON.stringify(qualification, null, 2));
  
  return qualification;
}

function calculateQualificationScore(data: ExtractedQualification): number {
  let score = 0;
  
  // Timeline - most important factor (INCREASED POINTS)
  switch (data.purchase_timeline) {
    case 'imediato': score += 30; break; // Increased from 25
    case 'ate_30_dias': score += 20; break; // Increased from 18
    case '3_a_6_meses': score += 10; break; // Increased from 8
    case 'pesquisando': score += 3; break; // Increased from 2
  }
  
  // Trade-in indicates serious buyer
  if (data.has_trade_in) {
    score += 18; // Increased from 15
    if (data.trade_in_vehicle) score += 7; // Increased from 5 - Extra if they specified the vehicle
  }
  
  // Down payment defined
  if (data.down_payment !== null) {
    score += 15; // Increased from 12
    if (data.down_payment >= 10000) score += 5; // Substantial down payment
  }
  
  // Budget defined shows research/planning
  if (data.budget_max !== null || data.budget_min !== null) {
    score += 12; // Increased from 10
  }
  
  // Payment method defined
  if (data.payment_method !== null) {
    score += 10; // Increased from 8
    if (data.payment_method === 'a_vista') score += 5; // Cash buyer more serious
  }
  
  // Vehicle interest defined
  if (data.vehicle_interest !== null) {
    score += 10; // Increased from 8
  }
  
  // Max installment defined (indicates financial planning)
  if (data.max_installment !== null) {
    score += 8; // Increased from 7
  }
  
  // Vehicle usage defined
  if (data.vehicle_usage !== null) {
    score += 5;
  }
  
  console.log(`[calculateQualificationScore] Score breakdown:
    - Timeline (${data.purchase_timeline}): ${data.purchase_timeline === 'imediato' ? 30 : data.purchase_timeline === 'ate_30_dias' ? 20 : data.purchase_timeline === '3_a_6_meses' ? 10 : data.purchase_timeline === 'pesquisando' ? 3 : 0}
    - Trade-in: ${data.has_trade_in ? 18 + (data.trade_in_vehicle ? 7 : 0) : 0}
    - Down payment: ${data.down_payment !== null ? 15 + (data.down_payment >= 10000 ? 5 : 0) : 0}
    - Budget: ${(data.budget_max !== null || data.budget_min !== null) ? 12 : 0}
    - Payment method: ${data.payment_method !== null ? 10 + (data.payment_method === 'a_vista' ? 5 : 0) : 0}
    - Vehicle interest: ${data.vehicle_interest !== null ? 10 : 0}
    - Max installment: ${data.max_installment !== null ? 8 : 0}
    - Vehicle usage: ${data.vehicle_usage !== null ? 5 : 0}
    = TOTAL: ${score}
  `);
  
  return Math.min(score, 100); // Cap at 100
}

async function getNextRoundRobinSalesperson(supabase: any): Promise<{ id: string; name: string } | null> {
  try {
    // Call the database function to get next salesperson
    const { data: nextUserId, error: rpcError } = await supabase.rpc('get_next_round_robin_salesperson');
    
    if (rpcError || !nextUserId) {
      console.log('[RoundRobin] No available salesperson from RPC:', rpcError?.message);
      return null;
    }
    
    // Get salesperson info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', nextUserId)
      .single();
    
    if (profileError || !profile) {
      console.log('[RoundRobin] Could not find profile for user:', nextUserId);
      return null;
    }
    
    return { id: profile.id, name: profile.full_name || 'Vendedor' };
  } catch (error) {
    console.error('[RoundRobin] Error:', error);
    return null;
  }
}

async function incrementRoundRobinCounters(supabase: any, salespersonId: string): Promise<void> {
  try {
    await supabase.rpc('increment_round_robin_counters', { p_salesperson_id: salespersonId });
    console.log('[RoundRobin] Counters incremented for:', salespersonId);
  } catch (error) {
    console.error('[RoundRobin] Error incrementing counters:', error);
  }
}

// ============= SCHEMA VALIDATION SYSTEM =============
// Cache de schemas das tabelas para evitar queries repetidas
let tableSchemas: Record<string, Set<string>> = {};
let schemaLoadedAt: number = 0;
const SCHEMA_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function loadTableSchemas(supabase: any, tables: string[]): Promise<Record<string, Set<string>>> {
  const now = Date.now();
  
  // Retorna cache se ainda válido
  if (Object.keys(tableSchemas).length > 0 && (now - schemaLoadedAt) < SCHEMA_CACHE_TTL) {
    console.log('[Schema] Using cached schemas');
    return tableSchemas;
  }
  
  console.log('[Schema] Loading schemas for tables:', tables);
  const schemas: Record<string, Set<string>> = {};
  
  for (const table of tables) {
    try {
      // Usar a função SQL criada para obter colunas
      const { data, error } = await supabase.rpc('get_table_columns', { p_table_name: table });
      
      if (!error && data && data.length > 0) {
        schemas[table] = new Set(data.map((col: any) => col.column_name));
        console.log(`[Schema] ${table}: ${data.length} columns loaded`);
      } else {
        console.warn(`[Schema] Could not load schema for ${table}:`, error?.message || 'no data');
        schemas[table] = new Set();
      }
    } catch (e) {
      console.error(`[Schema] Error loading schema for ${table}:`, e);
      schemas[table] = new Set();
    }
  }
  
  tableSchemas = schemas;
  schemaLoadedAt = now;
  return schemas;
}

function validateColumns(table: string, requestedColumns: string[]): { valid: string[], invalid: string[] } {
  const tableColumns = tableSchemas[table];
  
  if (!tableColumns || tableColumns.size === 0) {
    // Se não temos schema, assume que todas são válidas (fallback)
    console.warn(`[Schema] No schema for ${table}, assuming all columns valid`);
    return { valid: requestedColumns, invalid: [] };
  }
  
  const valid: string[] = [];
  const invalid: string[] = [];
  
  for (const col of requestedColumns) {
    if (tableColumns.has(col)) {
      valid.push(col);
    } else {
      invalid.push(col);
    }
  }
  
  if (invalid.length > 0) {
    console.warn(`[Schema] Invalid columns for ${table}: ${invalid.join(', ')}`);
    console.log(`[Schema] Valid columns for ${table}: ${Array.from(tableColumns).join(', ')}`);
  }
  
  return { valid, invalid };
}

function getSafeSelectColumns(table: string, desiredColumns: string[]): string {
  const { valid, invalid } = validateColumns(table, desiredColumns);
  
  if (invalid.length > 0) {
    console.warn(`[Schema Warning] Removed invalid columns for ${table}: ${invalid.join(', ')}`);
  }
  
  return valid.length > 0 ? valid.join(', ') : '*';
}

function hasColumn(table: string, column: string): boolean {
  const tableColumns = tableSchemas[table];
  return tableColumns ? tableColumns.has(column) : true; // fallback to true if no schema
}

// Tool definitions for function calling
const agentTools = [
  {
    type: "function",
    function: {
      name: "search_vehicles",
      description: "Busca veículos disponíveis no estoque da loja. Use quando o cliente perguntar sobre carros, motos ou veículos disponíveis.",
      parameters: {
        type: "object",
        properties: {
          brand: { type: "string", description: "Marca do veículo (ex: Toyota, Honda, Volkswagen)" },
          model: { type: "string", description: "Modelo do veículo (ex: Corolla, Civic, Golf)" },
          year_min: { type: "number", description: "Ano mínimo do veículo" },
          year_max: { type: "number", description: "Ano máximo do veículo" },
          price_min: { type: "number", description: "Preço mínimo em reais" },
          price_max: { type: "number", description: "Preço máximo em reais" },
          fuel_type: { type: "string", description: "Tipo de combustível (flex, gasolina, diesel, elétrico, híbrido)" },
          limit: { type: "number", description: "Número máximo de resultados (padrão: 5)" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_or_update_lead",
      description: "Cria ou atualiza um lead/cliente potencial no CRM. Use quando coletar informações do cliente.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome completo do cliente" },
          phone: { type: "string", description: "Telefone do cliente com DDD" },
          email: { type: "string", description: "Email do cliente" },
          vehicle_interest: { type: "string", description: "Veículo de interesse do cliente" },
          notes: { type: "string", description: "Observações adicionais sobre o cliente" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "schedule_visit",
      description: "Agenda uma visita ou test-drive na loja. Use quando o cliente quiser agendar.",
      parameters: {
        type: "object",
        properties: {
          lead_id: { type: "string", description: "ID do lead (se já existir)" },
          date: { type: "string", description: "Data da visita no formato YYYY-MM-DD" },
          time: { type: "string", description: "Horário da visita no formato HH:MM" },
          vehicle_id: { type: "string", description: "ID do veículo para test-drive (opcional)" },
          notes: { type: "string", description: "Observações sobre o agendamento" }
        },
        required: ["date", "time"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_whatsapp_message",
      description: "Envia uma mensagem WhatsApp para um número. Use para enviar informações, fotos de veículos, etc.",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string", description: "Número de telefone com DDD (apenas números)" },
          message: { type: "string", description: "Mensagem a ser enviada" },
          instance_name: { type: "string", description: "Nome da instância WhatsApp (opcional)" }
        },
        required: ["phone", "message"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_vehicle_details",
      description: "Obtém detalhes completos de um veículo específico pelo ID, incluindo TODAS as fotos reais cadastradas.",
      parameters: {
        type: "object",
        properties: {
          vehicle_id: { type: "string", description: "ID do veículo" }
        },
        required: ["vehicle_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_vehicle_photos",
      description: "OBRIGATÓRIO: Use esta função quando o cliente pedir fotos de um veículo. Esta função busca as fotos REAIS do banco de dados e envia diretamente no WhatsApp. NUNCA invente URLs de fotos - sempre use esta função.",
      parameters: {
        type: "object",
        properties: {
          vehicle_id: { type: "string", description: "ID do veículo (UUID) para buscar as fotos" },
          max_photos: { type: "number", description: "Número máximo de fotos a enviar (padrão: 3, máximo: 5)" }
        },
        required: ["vehicle_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_database",
      description: "Consulta dados do sistema. Use para buscar leads, clientes, vendas, negociações ou qualquer informação do banco de dados.",
      parameters: {
        type: "object",
        properties: {
          table: { 
            type: "string", 
            description: "Nome da tabela a consultar (vehicles, leads, customers, negotiations, sales, profiles)" 
          },
          filters: { 
            type: "object", 
            description: "Filtros a aplicar na consulta (ex: { 'status': 'disponivel', 'brand': 'Toyota' })" 
          },
          select: { 
            type: "string", 
            description: "Campos a retornar separados por vírgula (ex: 'id,name,phone'). Se vazio, retorna todos." 
          },
          limit: { 
            type: "number", 
            description: "Número máximo de resultados (padrão: 10)" 
          },
          order_by: { 
            type: "string", 
            description: "Campo para ordenação (ex: 'created_at' ou '-price' para decrescente)" 
          }
        },
        required: ["table"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_sales_summary",
      description: "Obtém resumo de vendas com totais, médias e estatísticas. Use quando perguntarem sobre performance de vendas.",
      parameters: {
        type: "object",
        properties: {
          period: { 
            type: "string", 
            description: "Período: 'today', 'week', 'month', 'year'" 
          },
          salesperson_id: { 
            type: "string", 
            description: "ID do vendedor para filtrar (opcional)" 
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_inventory_stats",
      description: "Obtém estatísticas do estoque: total de veículos, valor médio, mais antigos, etc.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  }
];

// Helper function to get LLM endpoint and headers based on configuration
function getLLMConfig(agent: any, lovableApiKey: string): { endpoint: string; headers: Record<string, string>; transformModel: (model: string) => string } {
  // If agent has custom API keys, use direct provider endpoint
  if (agent.api_key_encrypted) {
    let keys: Record<string, string> = {};
    
    // Try to parse as JSON (new format: {openai: "key", google: "key"})
    try {
      keys = JSON.parse(agent.api_key_encrypted);
    } catch {
      // Legacy format - single key stored directly
      if (agent.llm_provider === 'openai') {
        keys.openai = agent.api_key_encrypted;
      } else if (agent.llm_provider === 'google') {
        keys.google = agent.api_key_encrypted;
      }
    }
    
    // Get the appropriate API key for the selected provider
    if (agent.llm_provider === 'openai' && keys.openai) {
      return {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${keys.openai}`,
          'Content-Type': 'application/json',
        },
        // Transform model name from gateway format to OpenAI format
        transformModel: (model: string) => model.replace('openai/', '')
      };
    }
    
    if (agent.llm_provider === 'google' && keys.google) {
      // Google uses a different API format
      return {
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        headers: {
          'Authorization': `Bearer ${keys.google}`,
          'Content-Type': 'application/json',
        },
        // Transform model name for Google
        transformModel: (model: string) => {
          const modelName = model.replace('google/', '');
          // Map to Google's model names
          const googleModels: Record<string, string> = {
            'gemini-3-flash-preview': 'gemini-2.0-flash',
            'gemini-3-pro-preview': 'gemini-2.0-pro-exp',
            'gemini-2.5-flash': 'gemini-1.5-flash',
            'gemini-2.5-pro': 'gemini-1.5-pro',
          };
          return googleModels[modelName] || modelName;
        }
      };
    }
    
    if (agent.llm_provider === 'anthropic' && keys.anthropic) {
      return {
        endpoint: 'https://api.anthropic.com/v1/messages',
        headers: {
          'x-api-key': keys.anthropic,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        transformModel: (model: string) => model.replace('anthropic/', '')
      };
    }
    
    // If provider selected but no key for it, log warning and fallback
    console.log(`No API key found for provider ${agent.llm_provider}, falling back to Lovable Gateway`);
  }
  
  // Default: use Lovable AI Gateway
  return {
    endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    transformModel: (model: string) => model
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Redis client - declarado fora do try para poder fechar no finally
  let redisClient: any = null;

  try {
    const supabaseUrl = Deno.env.get('MY_SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('MY_SUPABASE_SERVICE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY') ?? '';
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ============= CARREGAMENTO AUTOMÁTICO DE SCHEMAS =============
    // Carregar schemas das tabelas principais para validação dinâmica
    const coreTables = ['vehicles', 'leads', 'negotiations', 'customers', 'sales', 'profiles'];
    await loadTableSchemas(supabase, coreTables);
    console.log('[Schema] Core tables loaded:', Object.keys(tableSchemas).join(', '));

    const { 
      agent_id, 
      message, 
      conversation_id, 
      lead_id,
      phone,
      channel = 'api',
      enable_tts = false,
      voice_id = 'JBFqnCBsd6RMkjVDRZzb' // George - voz masculina profissional
    } = await req.json();

    console.log('AI Agent Chat request:', { agent_id, message, conversation_id, lead_id, channel });

    // 1. Load agent configuration
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agent_id)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      return new Response(JSON.stringify({ error: 'Agent not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get LLM configuration based on agent settings
    const llmConfig = getLLMConfig(agent, lovableApiKey);
    console.log('Using LLM endpoint:', llmConfig.endpoint, 'Provider:', agent.llm_provider);

    // 1.1 Load connected data sources
    const { data: dataSources } = await supabase
      .from('ai_agent_data_sources')
      .select('*')
      .eq('agent_id', agent_id)
      .eq('is_active', true);
    
    const connectedTables = (dataSources || [])
      .filter((ds: any) => ds.source_type === 'supabase')
      .map((ds: any) => ds.table_name);
    
    console.log('Connected Supabase tables:', connectedTables);

    // 1.2 Load orchestration rules (tools configured as rules)
    const { data: orchestrationTools } = await supabase
      .from('ai_agent_tools')
      .select('orchestration_rules, description')
      .eq('agent_id', agent_id)
      .eq('is_active', true);
    
    const orchestrationRules = (orchestrationTools || [])
      .filter((t: any) => t.orchestration_rules)
      .map((t: any) => t.orchestration_rules);
    
    console.log('Orchestration rules:', orchestrationRules);

    // 2. Get or create conversation
    let currentConversationId = conversation_id;
    if (!currentConversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from('ai_agent_conversations')
        .insert({
          agent_id,
          session_id: crypto.randomUUID(),
          lead_id: lead_id || null,
          channel,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        throw new Error('Failed to create conversation');
      }
      currentConversationId = newConversation.id;
    }

    // ============= 3. LOAD CONVERSATION HISTORY - REDIS OU SUPABASE =============
    const contextWindowSize = agent.context_window_size || 20;
    let history: any[] = [];
    let conversationContext: any = {};
    
    // Verificar se Redis está configurado
    const useRedis = agent.short_term_memory_type === 'redis' && agent.redis_host;
    
    if (useRedis) {
      console.log(`[Memory] Redis configured: ${agent.redis_host}:${agent.redis_port || 6379}`);
      
      // Sempre buscar senha do Redis nos secrets (independente de redis_password_encrypted)
      const redisPassword = Deno.env.get('REDIS_PASSWORD') || undefined;
      console.log(`[Redis] Password configured: ${redisPassword ? 'yes' : 'no'}`);
      
      redisClient = await getRedisClient({
        host: agent.redis_host,
        port: agent.redis_port || 6379,
        password: redisPassword,
      });
      
      if (redisClient) {
        // Carregar mensagens do Redis
        const redisHistory = await getMessagesFromRedis(
          redisClient, 
          currentConversationId, 
          contextWindowSize
        );
        
        // Converter formato Redis para formato esperado
        history = redisHistory.map(m => ({ role: m.role, content: m.content }));
        
        // Carregar contexto do Redis
        conversationContext = await getContextFromRedis(
          redisClient, 
          currentConversationId
        );
        
        console.log(`[Redis] Loaded ${history.length} messages from Redis`);
        console.log(`[Redis] Context:`, conversationContext);
      } else {
        console.warn('[Memory] Redis connection failed, falling back to Supabase');
      }
    }
    
    // Fallback para Supabase se Redis não está configurado ou falhou
    if (!useRedis || !redisClient) {
      console.log('[Memory] Using Supabase for short-term memory');
      
      const { data: supabaseHistory } = await supabase
        .from('ai_agent_messages')
        .select('role, content')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true })
        .limit(contextWindowSize);
      
      history = supabaseHistory || [];
      
      // Carregar contexto do Supabase (metadata da conversa)
      const { data: conversationData } = await supabase
        .from('ai_agent_conversations')
        .select('metadata')
        .eq('id', currentConversationId)
        .single();
      
      conversationContext = conversationData?.metadata || {};
    }
    
    console.log(`[Memory] Total messages loaded: ${history.length} (window: ${contextWindowSize})`);
    console.log('[Memory] Conversation context:', conversationContext);

    // ============= 4. SAVE USER MESSAGE =============
    const userMessage: RedisMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    
    // Sempre salvar no Supabase (source of truth)
    await supabase.from('ai_agent_messages').insert({
      conversation_id: currentConversationId,
      role: 'user',
      content: message,
    });
    
    // Também salvar no Redis para recuperação rápida
    if (redisClient) {
      await saveMessageToRedis(redisClient, currentConversationId, userMessage);
    }

    // 5. Build messages array for LLM
    const baseSystemPrompt = agent.system_prompt || buildDefaultSystemPrompt(agent);
    const systemPrompt = buildEnhancedSystemPrompt(baseSystemPrompt, orchestrationRules, connectedTables, conversationContext);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    // 6. Call LLM (via Lovable Gateway or direct provider)
    const modelToUse = llmConfig.transformModel(agent.llm_model || 'google/gemini-3-flash-preview');
    console.log('Calling LLM with model:', modelToUse);
    
    const llmResponse = await fetch(llmConfig.endpoint, {
      method: 'POST',
      headers: llmConfig.headers,
      body: JSON.stringify({
        model: modelToUse,
        messages,
        tools: agentTools,
        tool_choice: 'auto',
        temperature: agent.temperature || 0.7,
        max_tokens: agent.max_tokens || 1024,
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error('LLM error:', llmResponse.status, errorText);
      
      if (llmResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (llmResponse.status === 401) {
        return new Response(JSON.stringify({ error: 'Invalid API key. Please check your API key configuration.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`LLM error: ${llmResponse.status} - ${errorText}`);
    }

    const llmData = await llmResponse.json();
    console.log('LLM response:', JSON.stringify(llmData, null, 2));

    let assistantContent = '';
    let toolCalls: any[] = [];
    let toolResults: any[] = [];

    const choice = llmData.choices?.[0];
    
    // 7. Handle tool calls if present
    if (choice?.message?.tool_calls) {
      toolCalls = choice.message.tool_calls;
      console.log('Tool calls:', toolCalls);

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || '{}');
        
        console.log(`Executing tool: ${functionName}`, args);
        
        const result = await executeToolFunction(supabase, functionName, args, {
          lead_id,
          phone,
          supabaseUrl,
          serviceRoleKey,
          connectedTables,
          conversationId: currentConversationId,
          redisClient // Passar o cliente Redis para salvar contexto
        });
        
        toolResults.push({
          tool_call_id: toolCall.id,
          function_name: functionName,
          result
        });
      }

      // 8. Call LLM again with tool results
      const toolMessages = [
        ...messages,
        { role: 'assistant', content: null, tool_calls: toolCalls },
        ...toolResults.map(tr => ({
          role: 'tool',
          tool_call_id: tr.tool_call_id,
          content: JSON.stringify(tr.result)
        }))
      ];

      const finalResponse = await fetch(llmConfig.endpoint, {
        method: 'POST',
        headers: llmConfig.headers,
        body: JSON.stringify({
          model: modelToUse,
          messages: toolMessages,
          temperature: agent.temperature || 0.7,
          max_tokens: agent.max_tokens || 1024,
        }),
      });

      if (finalResponse.ok) {
        const finalData = await finalResponse.json();
        assistantContent = finalData.choices?.[0]?.message?.content || '';
      }
    } else {
      assistantContent = choice?.message?.content || 'Desculpe, não consegui processar sua mensagem.';
    }

    // ============= 9. SAVE ASSISTANT MESSAGE =============
    const assistantMessage: RedisMessage = {
      role: 'assistant',
      content: assistantContent,
      timestamp: Date.now(),
    };
    
    // Sempre salvar no Supabase
    await supabase.from('ai_agent_messages').insert({
      conversation_id: currentConversationId,
      role: 'assistant',
      content: assistantContent,
      tool_calls: toolCalls.length > 0 ? toolCalls : null,
      tool_results: toolResults.length > 0 ? toolResults : null,
      tokens_used: llmData.usage?.total_tokens || null,
    });
    
    // Salvar no Redis também
    if (redisClient) {
      await saveMessageToRedis(redisClient, currentConversationId, assistantMessage);
    }

    // ============= AUTO-QUALIFY WITH AI QUALIFICATION EXTRACTION =============
    let qualificationResult: { 
      salespersonName?: string; 
      qualified?: boolean; 
      vehicleInterest?: string | null;
      tradeInVehicle?: string | null;
      hasTradeIn?: boolean;
      leadName?: string;
      noSalesperson?: boolean;
    } = {};
    
    if (lead_id) {
      try {
        // Count total messages in this conversation
        const { count: messageCount, error: countError } = await supabase
          .from('ai_agent_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', currentConversationId);

        console.log(`[Auto-Qualify] Message count for conversation ${currentConversationId}: ${messageCount}`);

        // If 4 or more messages, start qualification process
        if (!countError && messageCount && messageCount >= 4) {
          // Find the negotiation for this lead
          const { data: negotiation, error: negError } = await supabase
            .from('negotiations')
            .select('id, status')
            .eq('lead_id', lead_id)
            .in('status', ['em_andamento', 'proposta_enviada']) // Lead or Em Qualificação
            .maybeSingle();

          if (negotiation && !negError) {
            // Get all messages from conversation for qualification extraction
            const { data: allMessages } = await supabase
              .from('ai_agent_messages')
              .select('role, content')
              .eq('conversation_id', currentConversationId)
              .order('created_at', { ascending: true });

            // Extract qualification data from conversation
            const qualificationData = extractQualificationData(allMessages || []);
            const qualificationScore = calculateQualificationScore(qualificationData);
            
            console.log(`[Auto-Qualify] Extracted qualification data:`, qualificationData);
            console.log(`[Auto-Qualify] Qualification score: ${qualificationScore}`);

            // PHASE 1: Move to "Em Qualificação" if still in "Lead" (em_andamento)
            if (negotiation.status === 'em_andamento') {
              const { error: updateError } = await supabase
                .from('negotiations')
                .update({ 
                  status: 'proposta_enviada',
                  notes: 'Status atualizado automaticamente para "Em Qualificação" após 4+ mensagens de conversa com IA.',
                  updated_at: new Date().toISOString()
                })
                .eq('id', negotiation.id);

              if (!updateError) {
                console.log(`[Auto-Qualify] Negotiation ${negotiation.id} moved to "proposta_enviada" (Em Qualificação) status`);
              }
            }

            // PHASE 2: If score >= 45, fully qualify with Round Robin (threshold lowered from 50)
            const QUALIFICATION_THRESHOLD = 45;
            
            if (qualificationScore >= QUALIFICATION_THRESHOLD) {
              console.log(`[Auto-Qualify] Score ${qualificationScore} >= ${QUALIFICATION_THRESHOLD}, triggering full qualification`);
              
              // Get lead info
              const { data: leadInfo } = await supabase
                .from('leads')
                .select('name, phone, vehicle_interest')
                .eq('id', lead_id)
                .single();
              
              // Get next salesperson via Round Robin
              const salesperson = await getNextRoundRobinSalesperson(supabase);
              
              if (salesperson) {
                console.log(`[Auto-Qualify] Round Robin selected salesperson: ${salesperson.name} (${salesperson.id})`);
                
                // Increment round robin counters
                await incrementRoundRobinCounters(supabase, salesperson.id);
                
                // Assign lead to salesperson
                await supabase
                  .from('leads')
                  .update({ assigned_to: salesperson.id, updated_at: new Date().toISOString() })
                  .eq('id', lead_id);
                
                // Create lead assignment record
                await supabase.from('lead_assignments').insert({
                  lead_id: lead_id,
                  user_id: salesperson.id,
                  assigned_at: new Date().toISOString()
                });
                
                // Save qualification data to lead_qualifications table
                await supabase.from('lead_qualifications').insert({
                  lead_id: lead_id,
                  negotiation_id: negotiation.id,
                  qualified_by: null, // Qualified by AI
                  score: qualificationScore,
                  vehicle_interest: qualificationData.vehicle_interest || leadInfo?.vehicle_interest,
                  budget_min: qualificationData.budget_min,
                  budget_max: qualificationData.budget_max,
                  down_payment: qualificationData.down_payment,
                  max_installment: qualificationData.max_installment,
                  payment_method: qualificationData.payment_method,
                  has_trade_in: qualificationData.has_trade_in,
                  trade_in_vehicle: qualificationData.trade_in_vehicle,
                  purchase_timeline: qualificationData.purchase_timeline,
                  vehicle_usage: qualificationData.vehicle_usage,
                  engagement_score: Math.min(messageCount * 5, 50), // 5 points per message, max 50
                  completeness_score: qualificationScore,
                  notes: 'Qualificação preenchida automaticamente via IA',
                });
                
                // Update negotiation to "Qualificado" (negociando)
                await supabase
                  .from('negotiations')
                  .update({ 
                    status: 'negociando',
                    salesperson_id: salesperson.id,
                    notes: `Qualificado automaticamente pela IA (Score: ${qualificationScore}). Vendedor atribuído: ${salesperson.name}`,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', negotiation.id);
                
                console.log(`[Auto-Qualify] Negotiation ${negotiation.id} moved to "negociando" (Qualificado) status`);
                
                // Create notification for the assigned salesperson
                await supabase.from('notifications').insert({
                  user_id: salesperson.id,
                  type: 'new_qualified_lead',
                  title: '🎯 Novo Lead Qualificado!',
                  message: `${leadInfo?.name || 'Lead'} (${leadInfo?.phone || 'sem telefone'}) foi qualificado pela IA. Score: ${qualificationScore} pontos.`,
                  link: '/crm',
                });
                
                // Send WhatsApp to the assigned salesperson
                const { data: salespersonProfile } = await supabase
                  .from('profiles')
                  .select('phone, full_name')
                  .eq('id', salesperson.id)
                  .single();
                
                if (salespersonProfile?.phone) {
                  const paymentMethodLabel = qualificationData.payment_method === 'financiamento' ? 'Financiamento' 
                    : qualificationData.payment_method === 'a_vista' ? 'À Vista' 
                    : qualificationData.payment_method === 'consorcio' ? 'Consórcio'
                    : qualificationData.payment_method || 'Não informado';
                  
                  const whatsappMessage = `🎯 *Novo Lead Qualificado!*

Olá ${salespersonProfile.full_name?.split(' ')[0] || 'Vendedor'}!

Você recebeu um novo lead qualificado pela IA:

👤 *Nome:* ${leadInfo?.name || 'Cliente'}
📱 *Telefone:* ${leadInfo?.phone || 'não informado'}
🚗 *Interesse:* ${qualificationData.vehicle_interest || leadInfo?.vehicle_interest || 'veículo'}
⭐ *Score:* ${qualificationScore} pontos
${qualificationData.has_trade_in ? '🔄 *Possui carro para troca:* ' + (qualificationData.trade_in_vehicle || 'Sim') : ''}
💰 *Pagamento:* ${paymentMethodLabel}
${qualificationData.down_payment ? '💵 *Entrada:* R$ ' + qualificationData.down_payment.toLocaleString('pt-BR') : ''}

📲 Acesse o CRM para continuar o atendimento!`;

                  try {
                    await sendWhatsAppMessage(
                      { 
                        phone: salespersonProfile.phone, 
                        message: whatsappMessage,
                        instance_name: 'default' 
                      },
                      supabaseUrl,
                      serviceRoleKey
                    );
                    console.log(`[Auto-Qualify] WhatsApp sent to salesperson: ${salesperson.name} (${salespersonProfile.phone})`);
                  } catch (whatsappError) {
                    console.error(`[Auto-Qualify] Failed to send WhatsApp to salesperson:`, whatsappError);
                  }
                } else {
                  console.log(`[Auto-Qualify] Salesperson ${salesperson.name} has no phone number registered`);
                }
                
                // Also notify managers
                const { data: managers } = await supabase
                  .from('user_roles')
                  .select('user_id')
                  .eq('role', 'gerente');
                
                if (managers && managers.length > 0) {
                  for (const manager of managers) {
                    await supabase.from('notifications').insert({
                      user_id: manager.user_id,
                      type: 'lead_qualified',
                      title: '🎯 Lead Qualificado pela IA',
                      message: `${leadInfo?.name || 'Lead'} foi qualificado (Score: ${qualificationScore}) e atribuído a ${salesperson.name}`,
                      link: '/crm',
                    });
                  }
                }
                
                // Store result to modify AI response with context
                qualificationResult = {
                  salespersonName: salesperson.name,
                  qualified: true,
                  vehicleInterest: qualificationData.vehicle_interest || leadInfo?.vehicle_interest,
                  tradeInVehicle: qualificationData.trade_in_vehicle,
                  hasTradeIn: qualificationData.has_trade_in,
                  leadName: leadInfo?.name?.split(' ')[0] || 'você', // First name only
                };
                
              } else {
                console.log('[Auto-Qualify] No salesperson available in Round Robin');
                
                // Still save qualification but without salesperson assignment
                await supabase.from('lead_qualifications').insert({
                  lead_id: lead_id,
                  negotiation_id: negotiation.id,
                  qualified_by: null,
                  score: qualificationScore,
                  vehicle_interest: qualificationData.vehicle_interest || leadInfo?.vehicle_interest,
                  budget_min: qualificationData.budget_min,
                  budget_max: qualificationData.budget_max,
                  down_payment: qualificationData.down_payment,
                  max_installment: qualificationData.max_installment,
                  payment_method: qualificationData.payment_method,
                  has_trade_in: qualificationData.has_trade_in,
                  trade_in_vehicle: qualificationData.trade_in_vehicle,
                  purchase_timeline: qualificationData.purchase_timeline,
                  vehicle_usage: qualificationData.vehicle_usage,
                  engagement_score: Math.min(messageCount * 5, 50),
                  completeness_score: qualificationScore,
                  notes: 'Qualificação via IA - Aguardando atribuição manual de vendedor',
                });
                
                // Move to Em Qualificação at least
                await supabase
                  .from('negotiations')
                  .update({ 
                    status: 'proposta_enviada',
                    notes: `Qualificado pela IA (Score: ${qualificationScore}) - Aguardando atribuição de vendedor`,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', negotiation.id);
                
                // Set fallback result (no salesperson available)
                qualificationResult = {
                  qualified: true,
                  noSalesperson: true,
                  leadName: leadInfo?.name?.split(' ')[0] || 'você',
                };
              }
            } else {
              console.log(`[Auto-Qualify] Score ${qualificationScore} < ${QUALIFICATION_THRESHOLD}, not qualifying yet`);
            }
          } else {
            console.log('[Auto-Qualify] No eligible negotiation found for lead:', lead_id);
          }
        }
      } catch (qualifyError) {
        console.error('[Auto-Qualify] Error in auto-qualification:', qualifyError);
      }
    }

    // Append humanized handover message if qualification happened
    if (qualificationResult.qualified) {
      let handoverMessage = '';
      
      if (qualificationResult.salespersonName) {
        // Validate if vehicleInterest is a real vehicle (not a random word)
        const invalidVehicleWords = ['cadastrada', 'cadastrado', 'registrado', 'qualificado', 'atendimento', 'negociacao', 'contato'];
        const isValidVehicle = qualificationResult.vehicleInterest && 
          qualificationResult.vehicleInterest.length > 2 &&
          !invalidVehicleWords.some(invalid => 
            qualificationResult.vehicleInterest?.toLowerCase().includes(invalid)
          );

        // Build personalized context
        let context = '';
        if (isValidVehicle && qualificationResult.hasTradeIn && qualificationResult.tradeInVehicle) {
          context = `, que vai ajudar você com a avaliação do seu ${qualificationResult.tradeInVehicle} e encontrar as melhores condições para o ${qualificationResult.vehicleInterest}`;
        } else if (qualificationResult.hasTradeIn && qualificationResult.tradeInVehicle) {
          context = `, que vai fazer a avaliação do seu ${qualificationResult.tradeInVehicle} e te apresentar as melhores opções`;
        } else if (isValidVehicle) {
          context = `, que vai te ajudar a fechar negócio no ${qualificationResult.vehicleInterest}`;
        } else {
          context = `, que vai te ajudar a encontrar o veículo ideal`;
        }
        
        handoverMessage = `\n\n✅ Perfeito, ${qualificationResult.leadName}! Com as informações que você passou, vou te conectar agora com o **${qualificationResult.salespersonName}**, nosso especialista${context}. Ele entrará em contato em breve pelo WhatsApp! 🚗`;
      } else if (qualificationResult.noSalesperson) {
        handoverMessage = `\n\n✅ Perfeito, ${qualificationResult.leadName}! Suas informações foram registradas e um de nossos especialistas entrará em contato em breve para dar continuidade ao seu atendimento! 🚗`;
      }
      
      if (handoverMessage) {
        // REPLACE (not concatenate) to avoid duplicate farewell messages
        assistantContent = handoverMessage.trim();
        
        // Update the saved message with handover
        await supabase
          .from('ai_agent_messages')
          .update({ content: assistantContent })
          .eq('conversation_id', currentConversationId)
          .eq('role', 'assistant')
          .order('created_at', { ascending: false })
          .limit(1);
      }
    }

    // 10. Generate TTS if enabled
    let audioBase64: string | null = null;
    if (enable_tts && elevenLabsApiKey && assistantContent) {
      try {
        // Preparar texto para TTS - formatação de pronúncia correta
        const textForTTS = prepareTextForTTS(assistantContent);
        
        console.log('Generating TTS with ElevenLabs...');
        const ttsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}?output_format=mp3_44100_128`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': elevenLabsApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: textForTTS,
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.6,        // Aumentado para mais consistência
                similarity_boost: 0.75,
                style: 0.3,            // Adiciona naturalidade
                speed: 0.95,           // Levemente mais lento para clareza
              },
            }),
          }
        );

        if (ttsResponse.ok) {
          const audioBuffer = await ttsResponse.arrayBuffer();
          // Use Deno's encoding for base64
          const uint8Array = new Uint8Array(audioBuffer);
          let binary = '';
          const chunkSize = 0x8000;
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
            binary += String.fromCharCode.apply(null, [...chunk]);
          }
          audioBase64 = btoa(binary);
          console.log('TTS generated successfully');
        } else {
          console.error('TTS error:', await ttsResponse.text());
        }
      } catch (ttsError) {
        console.error('TTS generation failed:', ttsError);
      }
    }

    // 11. Update metrics
    await updateAgentMetrics(supabase, agent_id, llmData.usage?.total_tokens || 0);

    return new Response(JSON.stringify({
      conversation_id: currentConversationId,
      message: assistantContent,
      response: assistantContent, // Alias for webhook compatibility
      audio: audioBase64,
      tool_calls: toolCalls,
      tool_results: toolResults,
      memory_type: redisClient ? 'redis' : 'supabase', // Indicar qual tipo de memória está sendo usado
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Agent Chat error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } finally {
    // ============= FECHAR CONEXÃO REDIS =============
    if (redisClient) {
      try {
        await redisClient.close();
        console.log('[Redis] Connection closed');
      } catch (e) {
        console.error('[Redis] Error closing connection:', e);
      }
    }
  }
});

// ============= FUNÇÃO DE PREPARAÇÃO DE TEXTO PARA TTS =============
function prepareTextForTTS(text: string): string {
  let prepared = text;
  
  // Remover URLs completamente (não devem ser falados)
  prepared = prepared.replace(/https?:\/\/[^\s]+/g, '');
  
  // Remover emojis (não podem ser pronunciados)
  prepared = prepared.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '');
  
  // ============= PRONÚNCIA DE MARCAS ESTRANGEIRAS =============
  // Marcas com pronúncia fonética correta para português brasileiro
  const pronunciaMarcas: { [key: string]: string } = {
    'Porsche': 'Pórsche',
    'Peugeot': 'Pejô',
    'Citroën': 'Citroên',
    'Citroen': 'Citroên',
    'Renault': 'Renô',
    'Chevrolet': 'Chevrolé',
    'Hyundai': 'Rúndai',
    'Audi': 'Áudi',
    'BMW': 'Bê éme dáblio',
    'Mercedes': 'Mersêdes',
    'Mercedes-Benz': 'Mersêdes Bénz',
    'Volkswagen': 'Fólquisváguen',
    'Jaguar': 'Djéguiar',
    'Land Rover': 'Lând Rôuver',
    'Range Rover': 'Reinge Rôuver',
    'Jeep': 'Djípe',
    'Dodge': 'Dódji',
    'Chrysler': 'Cráisler',
    'Lamborghini': 'Lamborghíni',
    'Ferrari': 'Ferrári',
    'Maserati': 'Mazeráti',
    'Bentley': 'Bêntli',
    'Rolls-Royce': 'Rôuls Róis',
    'McLaren': 'Mequiláren',
    'Lexus': 'Léquissus',
    'Subaru': 'Subáru',
    'Suzuki': 'Suzúqui',
    'Mitsubishi': 'Mitsubíshi',
    'Nissan': 'Níssãn',
    'Infiniti': 'Infiníti',
    'Acura': 'Akiúra',
    'Cadillac': 'Cadilác',
    'Buick': 'Biúque',
    'GMC': 'Gê éme cê',
    'RAM': 'Rãm',
    'Tesla': 'Tésla',
    'Volvo': 'Vólvo',
    'Saab': 'Sáab',
    'Alfa Romeo': 'Álfa Romêo',
    'Mini': 'Míni',
    'Smart': 'Esmárt',
    'Seat': 'Siát',
    'Skoda': 'Escôda',
    'Chery': 'Txéri',
    'JAC': 'Jác',
    'BYD': 'Bê i dê',
    'GWM': 'Gê dáblio éme',
    'Caoa Chery': 'Caôa Txéri',
  };
  
  // Aplicar pronúncia de marcas (case-insensitive)
  for (const [marca, pronuncia] of Object.entries(pronunciaMarcas)) {
    const regex = new RegExp(`\\b${marca}\\b`, 'gi');
    prepared = prepared.replace(regex, pronuncia);
  }
  
  // ============= MODELOS NUMÉRICOS DE CARROS =============
  // Modelos famosos que precisam de pronúncia específica
  const modelosNumericos: { [key: string]: string } = {
    '911': 'novecentos e onze',
    '718': 'setecentos e dezoito',
    '928': 'novecentos e vinte e oito',
    '944': 'novecentos e quarenta e quatro',
    '959': 'novecentos e cinquenta e nove',
    '208': 'duzentos e oito',
    '308': 'trezentos e oito',
    '408': 'quatrocentos e oito',
    '508': 'quinhentos e oito',
    '2008': 'dois mil e oito',
    '3008': 'três mil e oito',
    '5008': 'cinco mil e oito',
    '206': 'duzentos e seis',
    '207': 'duzentos e sete',
    '307': 'trezentos e sete',
    'C3': 'cê três',
    'C4': 'cê quatro',
    'C5': 'cê cinco',
    'C6': 'cê seis',
    'A1': 'á um',
    'A3': 'á três',
    'A4': 'á quatro',
    'A5': 'á cinco',
    'A6': 'á seis',
    'A7': 'á sete',
    'A8': 'á oito',
    'Q3': 'quê três',
    'Q5': 'quê cinco',
    'Q7': 'quê sete',
    'Q8': 'quê oito',
    'X1': 'xis um',
    'X2': 'xis dois',
    'X3': 'xis três',
    'X4': 'xis quatro',
    'X5': 'xis cinco',
    'X6': 'xis seis',
    'X7': 'xis sete',
    'M3': 'éme três',
    'M4': 'éme quatro',
    'M5': 'éme cinco',
    'M8': 'éme oito',
    'Z4': 'zê quatro',
    'i3': 'i três',
    'i4': 'i quatro',
    'i7': 'i sete',
    'i8': 'i oito',
    'GLC': 'gê éle cê',
    'GLE': 'gê éle ê',
    'GLS': 'gê éle ésse',
    'CLA': 'cê éle á',
    'CLS': 'cê éle ésse',
    'AMG': 'á éme gê',
    'RS3': 'érre ésse três',
    'RS4': 'érre ésse quatro',
    'RS5': 'érre ésse cinco',
    'RS6': 'érre ésse seis',
    'RS7': 'érre ésse sete',
    'S3': 'ésse três',
    'S4': 'ésse quatro',
    'S5': 'ésse cinco',
    'TT': 'tê tê',
    'R8': 'érre oito',
    'GT': 'gê tê',
    'GT3': 'gê tê três',
    'GT4': 'gê tê quatro',
    'GTS': 'gê tê ésse',
    'GTI': 'gê tê í',
    'TSI': 'tê ésse í',
    'TDI': 'tê dê í',
    'FSI': 'éfe ésse í',
    'TFSI': 'tê éfe ésse í',
    'T-Cross': 'tê cross',
    'T-Roc': 'tê roc',
    'ID.3': 'i dê três',
    'ID.4': 'i dê quatro',
    'e-tron': 'i tron',
    'e-Golf': 'i golf',
    'HR-V': 'agá érre vê',
    'CR-V': 'cê érre vê',
    'WR-V': 'dáblio érre vê',
    'ZR-V': 'zê érre vê',
    'BR-V': 'bê érre vê',
    'RAV4': 'ráv quatro',
    'CH-R': 'cê agá érre',
    'CX-3': 'cê xis três',
    'CX-30': 'cê xis trinta',
    'CX-5': 'cê xis cinco',
    'CX-50': 'cê xis cinquenta',
    'CX-9': 'cê xis nove',
    'MX-5': 'éme xis cinco',
    'MX-30': 'éme xis trinta',
    'RX-7': 'érre xis sete',
    'RX-8': 'érre xis oito',
    'BRZ': 'bê érre zê',
    'WRX': 'dáblio érre xis',
    'STI': 'ésse tê í',
    'XV': 'xis vê',
    'NX': 'éne xis',
    'RX': 'érre xis',
    'UX': 'ú xis',
    'LX': 'éle xis',
    'ES': 'ê ésse',
    'IS': 'i ésse',
    'LS': 'éle ésse',
    'LC': 'éle cê',
    'RC': 'érre cê',
    'CT': 'cê tê',
    'F-150': 'éfe cento e cinquenta',
    'F-250': 'éfe duzentos e cinquenta',
    'F-350': 'éfe trezentos e cinquenta',
    'S10': 'ésse dez',
    'D-Max': 'dê max',
    'L200': 'éle duzentos',
    'Hilux': 'Ráilux',
    'SW4': 'ésse dáblio quatro',
  };
  
  // Aplicar pronúncia de modelos (case-sensitive para alguns, insensitive para outros)
  for (const [modelo, pronuncia] of Object.entries(modelosNumericos)) {
    const regex = new RegExp(`\\b${modelo}\\b`, 'g');
    prepared = prepared.replace(regex, pronuncia);
  }
  
  // ============= MOTORIZAÇÃO - formatar X.Y como "X ponto Y" =============
  // Ex: "2.0" → "dois ponto zero", "3.6" → "três ponto seis"
  const numerosPorExtenso = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  prepared = prepared.replace(/\b(\d)[.,](\d)\b/g, (match, inteiro, decimal) => {
    const inteiroNum = parseInt(inteiro);
    const decimalNum = parseInt(decimal);
    if (inteiroNum >= 0 && inteiroNum <= 9 && decimalNum >= 0 && decimalNum <= 9) {
      return `${numerosPorExtenso[inteiroNum]} ponto ${numerosPorExtenso[decimalNum]}`;
    }
    return match;
  });
  
  // ============= PORTAS - concordância feminina =============
  // Ex: "2 portas" → "duas portas", "4 portas" → "quatro portas"
  const numerosFemininos: { [key: string]: string } = {
    '1': 'uma porta',
    '2': 'duas portas',
    '3': 'três portas',
    '4': 'quatro portas',
    '5': 'cinco portas'
  };
  
  // Formato normal: "2 portas" ou "2portas"
  prepared = prepared.replace(/\b(\d+)\s*porta[s]?\b/gi, (match, num) => {
    return numerosFemininos[num] || `${num} portas`;
  });
  
  // Formato invertido: "portas: 2" ou "porta: 2" ou "Portas 2"
  prepared = prepared.replace(/\bporta[s]?[:\s]+(\d+)\b/gi, (match, num) => {
    return numerosFemininos[num] || `${num} portas`;
  });
  
  // ============= QUILOMETRAGEM - evitar redundância =============
  // Remover "km:" ou "KM:" como label (deixar só o número)
  prepared = prepared.replace(/\bkm[:\s]*(\d)/gi, '$1');
  
  // Remover "quilometragem:" como label
  prepared = prepared.replace(/\bquilometragem[:\s]*/gi, '');
  
  // Garantir acentuação correta para quilometragem
  prepared = prepared.replace(/quilometros/gi, 'quilômetros');
  
  // Converter "X km" para "X quilômetros" (só se não tiver quilômetros depois)
  prepared = prepared.replace(/(\d+(?:[.,]\d+)?)\s*km(?!\s*quilômetros)\b/gi, '$1 quilômetros');
  
  // Evitar duplicação "quilômetros quilômetros"
  prepared = prepared.replace(/quilômetros\s+quilômetros/gi, 'quilômetros');
  
  // Formatar valores monetários para leitura natural
  prepared = prepared.replace(/R\$\s*([\d.]+(?:,\d{2})?)/g, (match, value) => {
    const cleanValue = value.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleanValue);
    
    if (isNaN(num)) return match;
    
    if (num >= 1000000) {
      const millions = num / 1000000;
      const formatted = millions === Math.floor(millions) ? Math.floor(millions) : millions.toFixed(1).replace('.', ',');
      return `${formatted} ${millions === 1 ? 'milhão' : 'milhões'} de reais`;
    } else if (num >= 1000) {
      const thousands = Math.floor(num / 1000);
      const remainder = num % 1000;
      if (remainder === 0) {
        return `${thousands} mil reais`;
      } else {
        return `${thousands} mil e ${Math.floor(remainder)} reais`;
      }
    }
    return `${Math.floor(num)} reais`;
  });
  
  // Formatar números grandes (sem R$) para leitura natural
  prepared = prepared.replace(/\b(\d{1,3}(?:\.\d{3})+)\b/g, (match) => {
    const num = parseInt(match.replace(/\./g, ''));
    if (num >= 1000000) {
      const millions = num / 1000000;
      return `${millions} ${millions === 1 ? 'milhão' : 'milhões'}`;
    } else if (num >= 1000) {
      return `${Math.floor(num / 1000)} mil`;
    }
    return match;
  });
  
  // Garantir pausas em vírgulas e pontos
  prepared = prepared.replace(/\.\.\./g, '... '); // Elipse vira pausa
  prepared = prepared.replace(/([.!?])\s*/g, '$1 '); // Garantir espaço após pontuação
  prepared = prepared.replace(/,\s*/g, ', '); // Garantir espaço após vírgula
  
  // Remover asteriscos de markdown (negrito)
  prepared = prepared.replace(/\*\*/g, '');
  prepared = prepared.replace(/\*/g, '');
  
  // Limpar espaços duplicados
  prepared = prepared.replace(/\s+/g, ' ').trim();
  
  console.log('[TTS] Text prepared for speech:', prepared.substring(0, 200) + '...');
  
  return prepared;
}

function buildDefaultSystemPrompt(agent: any): string {
  const objective = agent.objective || 'ajudar clientes a encontrar o veículo ideal';
  const name = agent.name || 'Assistente';
  
  return `Você é ${name}, um assistente de vendas de veículos altamente especializado.

Seu objetivo principal é: ${objective}

═══════════════════════════════════════════════════════════════
⚠️ REGRAS CRÍTICAS - LEIA PRIMEIRO!
═══════════════════════════════════════════════════════════════
1. NUNCA diga "vou repassar para um consultor/vendedor" até ter coletado as informações abaixo
2. NUNCA prometa que alguém entrará em contato sem antes coletar as informações
3. Continue a conversa normalmente, ajudando o cliente e coletando informações
4. O sistema irá automaticamente transferir para um vendedor quando tiver dados suficientes
5. Seu trabalho é ser útil, tirar dúvidas e COLETAR informações naturalmente

═══════════════════════════════════════════════════════════════
💬 REGRAS DE RESPOSTA CONVERSACIONAL (MUITO IMPORTANTE!)
═══════════════════════════════════════════════════════════════
Quando listar veículos, seja CONCISO e PROGRESSIVO:

🔹 PRIMEIRA RESPOSTA - Só o básico:
- Informe APENAS: marca, modelo e ano
- Exemplo: "Tenho um Peugeot 208 2014 e um Peugeot 208 2015. Qual você quer conhecer melhor?"
- NÃO despeje quilometragem, cor, opcionais na primeira resposta!

🔹 SE O CLIENTE PEDIR MAIS DETALHES:
Ao dar mais informações sobre um veículo, SEMPRE inclua TODOS estes campos disponíveis:
- COR do veículo (ex: "é na cor Prata", "na cor Branca")
- QUILOMETRAGEM (ex: "tem 17 mil quilômetros rodados")
- COMBUSTÍVEL (ex: "é flex", "a gasolina", "diesel")
- CÂMBIO (automático/manual) se disponível
- VERSÃO/MOTOR se disponível (ex: "versão 3.0 V6", "motor 1.6")
- PORTAS (ex: "duas portas" ou "quatro portas")

Exemplo de resposta completa quando o cliente pede detalhes:
"O Porsche 911 2021 é na cor Prata, tem 17 mil quilômetros rodados, motor 3.0 V6 a gasolina, câmbio automático, duas portas. Quer saber o valor?"

⚠️ IMPORTANTE: Quando o cliente pedir mais informações, NÃO OMITA a cor! A cor é uma das primeiras coisas que o cliente quer saber.

🔹 SE O CLIENTE PERGUNTAR O PREÇO:
- Aí sim informe o valor

NUNCA despeje todas as informações de uma vez! 
Deixe a conversa fluir naturalmente como um vendedor faria.
Seja breve e objetivo nas respostas.

═══════════════════════════════════════════════════════════════
📸 REGRAS CRÍTICAS SOBRE FOTOS DE VEÍCULOS
═══════════════════════════════════════════════════════════════
1. NUNCA invente URLs de fotos! URLs como "storage.supabase.co" são FALSAS
2. NUNCA escreva URLs de imagens diretamente na mensagem
3. NUNCA descreva ou mencione links na sua resposta
4. Quando o cliente pedir foto de um veículo, SEMPRE use a função send_vehicle_photos
5. A função send_vehicle_photos envia as fotos REAIS diretamente no WhatsApp
6. Quando enviar fotos, APENAS diga algo como: "Estou enviando as fotos do [modelo] para você!"
7. Se a função retornar que não há fotos, informe ao cliente com naturalidade
8. Você pode enviar fotos de veículos que foram mostrados anteriormente (use o ID do contexto)

EXEMPLOS DE RESPOSTAS CORRETAS AO ENVIAR FOTOS:
✅ "Estou enviando as fotos do Peugeot 208 para você!"
✅ "Enviando as imagens agora!"
✅ "Olha só as fotos desse modelo!"

EXEMPLOS ERRADOS (NUNCA FAÇA):
❌ "Aqui está a foto: https://storage.supabase.co/..."
❌ "Estou enviando do link storage.supabase..."
❌ "A imagem está disponível em..."

INSTRUÇÕES GERAIS:
1. Seja sempre cordial, profissional e empático
2. Responda SEMPRE em português brasileiro
3. Use as ferramentas disponíveis para buscar veículos, criar leads e agendar visitas
4. Quando o cliente mostrar interesse em um veículo, colete informações de contato
5. Sugira test-drive quando apropriado
6. Forneça informações precisas sobre preços e condições
7. Seja proativo em oferecer alternativas quando não houver exatamente o que o cliente procura

═══════════════════════════════════════════════════════════════
🎯 COLETA DE INFORMAÇÕES PARA QUALIFICAÇÃO (MUITO IMPORTANTE!)
═══════════════════════════════════════════════════════════════
Durante a conversa, colete NATURALMENTE as seguintes informações do cliente:

1. **PRAZO DE COMPRA** (Prioridade ALTA - pergunte cedo!)
   - Pergunte "Para quando você está pensando em fechar negócio?" ou "Tem urgência?"
   - Exemplos de respostas: "essa semana", "próxima semana", "esse mês", "3 meses", "só pesquisando"

2. **TROCA** (Prioridade ALTA)
   - Pergunte "Você tem veículo para dar na troca?" 
   - Se sim: "Qual modelo e ano do seu veículo atual?"
   - Exemplo: "Tenho um Gol G5 2015"

3. **FORMA DE PAGAMENTO** (Prioridade ALTA)
   - Pergunte "Vai ser à vista ou pretende financiar?"
   - Se financiar: "Tem ideia do valor de entrada?" e "Qual parcela caberia no seu bolso?"

4. **ORÇAMENTO** (Prioridade MÉDIA)
   - Pergunte "Qual faixa de preço você está buscando?" ou "Tem um limite de valor?"
   - Busque descobrir valor máximo

5. **USO DO VEÍCULO** (Prioridade BAIXA)
   - Pergunte "O carro vai ser para trabalho, família ou uso misto?"

DICAS DE COLETA:
- NÃO faça todas as perguntas de uma vez! Intercale com informações sobre veículos
- Após mostrar um veículo, aproveite para perguntar sobre prazo ou forma de pagamento
- Seja natural: "Esse [modelo] está R$ X. Você pensaria em financiar ou prefere à vista?"

INFORMAÇÕES DA LOJA:
- Trabalhamos com veículos seminovos de qualidade
- Oferecemos financiamento facilitado com as melhores taxas
- Aceitamos veículos na troca com avaliação justa
- Horário de funcionamento: Segunda a Sexta 8h-18h, Sábado 8h-12h

Mantenha suas respostas concisas mas informativas. Sempre que possível, faça perguntas para entender melhor as necessidades do cliente.`;
}

function buildEnhancedSystemPrompt(basePrompt: string, orchestrationRules: string[], connectedTables: string[], conversationContext?: any): string {
  let enhancedPrompt = basePrompt;
  
  // CRÍTICO: Adicionar regras de memória de IDs de veículos
  enhancedPrompt += `

═══════════════════════════════════════════════════════════════
🧠 REGRAS DE MEMÓRIA E CONTEXTO (CRÍTICO - SIGA SEMPRE)
═══════════════════════════════════════════════════════════════
• SEMPRE guarde os IDs (UUIDs) dos veículos que você mostrar ao cliente
• Quando o cliente disser "esse carro", "esse veículo", "esse", "ele", "mais info", use o ID do ÚLTIMO veículo mencionado
• Os IDs são UUIDs no formato: 4a14f429-49d0-4c92-9a15-5de70cfe5d96
• NUNCA invente IDs como "peugeot-208-2014" - isso NÃO funciona
• Se não souber o ID exato, use search_vehicles para buscar novamente
• Ao usar get_vehicle_details, SEMPRE passe o UUID completo do veículo

EXEMPLO CORRETO:
Cliente: "qual o mais barato?"
Você: Busca veículo → ID: abc-123-456-789 → "O mais barato é o Peugeot 208..."
Cliente: "mais info sobre ele"
Você: Usa get_vehicle_details com vehicle_id: "abc-123-456-789" (o UUID que você recebeu)

EXEMPLO ERRADO (NÃO FAÇA):
Cliente: "mais info sobre esse carro"
Você: Usa get_vehicle_details com vehicle_id: "peugeot-208" ← ERRADO! Use o UUID!`;

  // Adicionar contexto da conversa atual (último veículo, etc.)
  if (conversationContext && Object.keys(conversationContext).length > 0) {
    enhancedPrompt += `

═══════════════════════════════════════════════════════════════
📋 CONTEXTO DA CONVERSA ATUAL
═══════════════════════════════════════════════════════════════`;
    if (conversationContext.last_vehicle_id) {
      enhancedPrompt += `
• Último veículo mencionado: ${conversationContext.last_vehicle_name || 'N/A'}
• ID do último veículo (use este para get_vehicle_details): ${conversationContext.last_vehicle_id}`;
    }
    if (conversationContext.vehicles_shown) {
      enhancedPrompt += `
• Veículos mostrados na conversa: ${JSON.stringify(conversationContext.vehicles_shown)}`;
    }
  }
  
  // Add connected tables info
  if (connectedTables.length > 0) {
    enhancedPrompt += `

TABELAS DISPONÍVEIS PARA CONSULTA:
Você tem acesso às seguintes tabelas do banco de dados: ${connectedTables.join(', ')}.
Use a ferramenta query_database para consultar dados dessas tabelas quando necessário.`;
  }
  
  // Add orchestration rules
  if (orchestrationRules.length > 0) {
    enhancedPrompt += `

REGRAS DE ORQUESTRAÇÃO:
Siga estas regras para decidir quando usar as ferramentas disponíveis:
${orchestrationRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}`;
  }
  
  return enhancedPrompt;
}

async function executeToolFunction(
  supabase: any, 
  functionName: string, 
  args: any,
  context: { 
    lead_id?: string; 
    phone?: string; 
    supabaseUrl: string; 
    serviceRoleKey: string; 
    connectedTables?: string[]; 
    conversationId?: string;
    redisClient?: any; // Cliente Redis para salvar contexto
  }
): Promise<any> {
  console.log(`Executing ${functionName} with args:`, args);

  let result: any;
  
  switch (functionName) {
    case 'search_vehicles':
      result = await searchVehicles(supabase, args);
      // Salvar contexto dos veículos encontrados
      if (result.vehicles && result.vehicles.length > 0 && context.conversationId) {
        const firstVehicle = result.vehicles[0];
        const newContext = {
          last_vehicle_id: firstVehicle.id,
          last_vehicle_name: firstVehicle.nome,
          vehicles_shown: result.vehicles.map((v: any) => ({ id: v.id, nome: v.nome, preco: v.preco }))
        };
        
        // Salvar no Redis se disponível
        if (context.redisClient) {
          await saveContextToRedis(context.redisClient, context.conversationId, newContext);
        }
        
        // Sempre salvar no Supabase também
        await updateConversationContext(supabase, context.conversationId, newContext);
      }
      return result;
    
    case 'create_or_update_lead':
      return await createOrUpdateLead(supabase, args, context.phone);
    
    case 'schedule_visit':
      return await scheduleVisit(supabase, args, context.lead_id);
    
    case 'send_whatsapp_message':
      return await sendWhatsAppMessage(args, context.supabaseUrl, context.serviceRoleKey);
    
    case 'get_vehicle_details':
      result = await getVehicleDetails(supabase, args.vehicle_id);
      // Salvar contexto do veículo consultado
      if (result && !result.error && context.conversationId) {
        const newContext = {
          last_vehicle_id: result.id,
          last_vehicle_name: result.nome
        };
        
        // Salvar no Redis se disponível
        if (context.redisClient) {
          await saveContextToRedis(context.redisClient, context.conversationId, newContext);
        }
        
        // Sempre salvar no Supabase também
        await updateConversationContext(supabase, context.conversationId, newContext);
      }
      return result;
    
    case 'send_vehicle_photos':
      return await sendVehiclePhotos(supabase, args.vehicle_id, args.max_photos, context.phone, context.supabaseUrl, context.serviceRoleKey);
    
    case 'query_database':
      return await queryDatabase(supabase, args, context.connectedTables || []);
    
    case 'get_sales_summary':
      return await getSalesSummary(supabase, args);
    
    case 'get_inventory_stats':
      return await getInventoryStats(supabase);
    
    default:
      return { error: `Unknown function: ${functionName}` };
  }
}

// Função para atualizar contexto da conversa no Supabase
async function updateConversationContext(supabase: any, conversationId: string, newContext: any): Promise<void> {
  try {
    // Buscar metadata atual
    const { data: current } = await supabase
      .from('ai_agent_conversations')
      .select('metadata')
      .eq('id', conversationId)
      .single();
    
    const existingMetadata = current?.metadata || {};
    
    // Merge com novo contexto
    const updatedMetadata = {
      ...existingMetadata,
      ...newContext,
      updated_at: new Date().toISOString()
    };
    
    // Salvar
    await supabase
      .from('ai_agent_conversations')
      .update({ metadata: updatedMetadata })
      .eq('id', conversationId);
    
    console.log('[Context] Updated conversation context:', conversationId, newContext);
  } catch (error) {
    console.error('[Context] Error updating conversation context:', error);
  }
}

async function searchVehicles(supabase: any, args: any): Promise<any> {
  // Colunas que queremos buscar - usando nomes corretos do schema
  const desiredColumns = [
    'id', 'brand', 'model', 'year_model', 'year_manufacture', 
    'price_sale', 'mileage', 'fuel_type', 'color', 'images', 'status'
  ];
  
  const selectCols = getSafeSelectColumns('vehicles', desiredColumns);
  console.log('[searchVehicles] Using columns:', selectCols, 'Args:', args);
  
  let query = supabase
    .from('vehicles')
    .select(selectCols)
    .eq('status', 'disponivel');

  // Aplicar filtros
  if (args.brand) {
    query = query.ilike('brand', `%${args.brand}%`);
  }
  if (args.model) {
    query = query.ilike('model', `%${args.model}%`);
  }
  if (args.year_min) {
    query = query.gte('year_model', args.year_min);
  }
  if (args.year_max) {
    query = query.lte('year_model', args.year_max);
  }
  if (args.price_min) {
    query = query.gte('price_sale', args.price_min);
  }
  if (args.price_max) {
    query = query.lte('price_sale', args.price_max);
  }
  if (args.fuel_type) {
    query = query.ilike('fuel_type', `%${args.fuel_type}%`);
  }

  // ORDENAÇÃO DINÂMICA - corrigido para suportar order_by
  if (args.order_by) {
    const orderField = args.order_by.startsWith('-') ? args.order_by.slice(1) : args.order_by;
    const ascending = !args.order_by.startsWith('-');
    
    // Mapear nomes de campos para nomes reais do schema
    const fieldMap: Record<string, string> = {
      'price': 'price_sale',
      'preco': 'price_sale',
      'year': 'year_model',
      'ano': 'year_model',
      'km': 'mileage',
      'mileage': 'mileage'
    };
    
    const realField = fieldMap[orderField] || orderField;
    console.log(`[searchVehicles] Ordering by ${realField} (${ascending ? 'ASC' : 'DESC'})`);
    query = query.order(realField, { ascending });
  } else {
    // Default: ordenar por preço crescente para encontrar mais baratos primeiro
    query = query.order('price_sale', { ascending: true });
  }

  query = query.limit(args.limit || 5);

  const { data, error } = await query;

  if (error) {
    console.error('[searchVehicles] Error:', error);
    return { error: `Erro ao buscar veículos: ${error.message}` };
  }

  if (!data || data.length === 0) {
    return { 
      message: 'Nenhum veículo encontrado com os critérios especificados.',
      vehicles: [] 
    };
  }

  console.log(`[searchVehicles] Found ${data.length} vehicles, first: ${data[0]?.brand} ${data[0]?.model} - R$ ${data[0]?.price_sale}`);

  return {
    vehicles: data.map((v: any, index: number) => ({
      numero: index + 1,
      id: v.id,
      nome: `${v.brand} ${v.model} ${v.year_model || ''}`.trim(),
      // NÃO incluir km, cor, combustível, preço na listagem inicial!
    })),
    // INSTRUÇÃO OBRIGATÓRIA PARA A IA
    instrucao: `REGRA OBRIGATÓRIA: Ao apresentar esses veículos, diga APENAS marca, modelo e ano de cada um.
Exemplo correto: "Tenho ${data.length} Land Rover(s) disponível(is): ${data.map((v: any) => `${v.model} ${v.year_model}`).join(', ')}. Qual te interessa?"

❌ NÃO MENCIONE cor, km, preço ou outras especificações agora!
✅ Quando o cliente escolher um veículo, use get_vehicle_details com o 'id' (UUID) para obter e informar os detalhes completos.`
  };
}

async function createOrUpdateLead(supabase: any, args: any, contextPhone?: string): Promise<any> {
  const phone = args.phone || contextPhone;
  
  // Check if lead exists
  let existingLead = null;
  if (phone) {
    const { data } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', phone)
      .single();
    existingLead = data;
  }

  if (existingLead) {
    // Update existing lead
    const { error } = await supabase
      .from('leads')
      .update({
        name: args.name || undefined,
        email: args.email || undefined,
        vehicle_interest: args.vehicle_interest || undefined,
        notes: args.notes || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingLead.id);

    if (error) {
      console.error('Update lead error:', error);
      return { error: 'Failed to update lead' };
    }

    return { 
      success: true, 
      message: 'Dados do cliente atualizados com sucesso.',
      lead_id: existingLead.id 
    };
  } else {
    // Create new lead
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: args.name,
        phone: phone,
        email: args.email,
        vehicle_interest: args.vehicle_interest,
        notes: args.notes,
        source: 'ai_agent',
        status: 'novo'
      })
      .select()
      .single();

    if (error) {
      console.error('Create lead error:', error);
      return { error: 'Failed to create lead' };
    }

    return { 
      success: true, 
      message: 'Novo cliente cadastrado com sucesso.',
      lead_id: data.id 
    };
  }
}

async function scheduleVisit(supabase: any, args: any, contextLeadId?: string): Promise<any> {
  const leadId = args.lead_id || contextLeadId;
  
  if (!leadId) {
    return { 
      error: 'Lead ID não fornecido. Por favor, colete as informações do cliente primeiro.' 
    };
  }

  // Create negotiation with appointment
  const { data, error } = await supabase
    .from('negotiations')
    .insert({
      lead_id: leadId,
      vehicle_id: args.vehicle_id || null,
      status: 'em_andamento',
      appointment_date: args.date,
      appointment_time: args.time,
      notes: args.notes || 'Agendamento feito via AI Agent',
      test_drive_scheduled: !!args.vehicle_id
    })
    .select()
    .single();

  if (error) {
    console.error('Schedule visit error:', error);
    return { error: 'Failed to schedule visit' };
  }

  // Create interaction record
  await supabase.from('lead_interactions').insert({
    lead_id: leadId,
    type: 'visit',
    description: `Visita agendada para ${args.date} às ${args.time}. ${args.notes || ''}`
  });

  return { 
    success: true, 
    message: `Visita agendada com sucesso para ${args.date} às ${args.time}.`,
    negotiation_id: data.id 
  };
}

async function sendWhatsAppMessage(
  args: any, 
  supabaseUrl: string, 
  serviceRoleKey: string
): Promise<any> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: args.phone,
        message: args.message,
        instance_name: args.instance_name
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WhatsApp send error:', errorText);
      return { error: 'Failed to send WhatsApp message' };
    }

    return { 
      success: true, 
      message: 'Mensagem WhatsApp enviada com sucesso.' 
    };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return { error: 'Failed to send WhatsApp message' };
  }
}

async function getVehicleDetails(supabase: any, vehicleId: string): Promise<any> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .single();

  if (error || !data) {
    console.error('[getVehicleDetails] Error:', error);
    return { error: 'Veículo não encontrado' };
  }

  // Log das colunas disponíveis para debug
  console.log('[getVehicleDetails] Available columns:', Object.keys(data));

  // Usar nomes corretos do schema
  const yearDisplay = data.year_manufacture && data.year_model 
    ? `${data.year_manufacture}/${data.year_model}` 
    : (data.year_model || data.year_manufacture || '');

  return {
    id: data.id,
    nome: `${data.brand} ${data.model} ${yearDisplay}`.trim(),
    preco: `R$ ${(data.price_sale || 0).toLocaleString('pt-BR')}`,
    km: `${(data.mileage || 0).toLocaleString('pt-BR')} km`,
    combustivel: data.fuel_type,
    cor: data.color,
    transmissao: data.transmission,
    portas: data.doors,
    placa_final: data.plate?.slice(-1),
    fotos: data.images || [], // CORRIGIDO: images em vez de photos
    descricao: data.description,
    observacoes: data.notes,
    // Campos adicionais disponíveis no schema
    versao: data.version,
    renavam: data.renavam,
    chassis: data.chassis,
    tipo_carroceria: data.body_type,
    data_compra: data.purchase_date,
    preco_compra: data.purchase_price ? `R$ ${data.purchase_price.toLocaleString('pt-BR')}` : null,
    status: data.status
  };
}

// Send vehicle photos via WhatsApp
async function sendVehiclePhotos(
  supabase: any, 
  vehicleId: string, 
  maxPhotos: number = 3,
  phone: string | undefined,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<any> {
  if (!phone) {
    return { error: 'Telefone não disponível para enviar fotos' };
  }
  
  // Get vehicle with images
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select('id, brand, model, year_model, images')
    .eq('id', vehicleId)
    .single();
  
  if (error || !vehicle) {
    console.error('[sendVehiclePhotos] Vehicle not found:', error);
    return { error: 'Veículo não encontrado' };
  }
  
  const images = vehicle.images || [];
  
  if (images.length === 0) {
    console.log('[sendVehiclePhotos] No images for vehicle:', vehicleId);
    return { 
      success: false, 
      message: 'Este veículo ainda não tem fotos cadastradas. Posso buscar mais informações ou mostrar outros veículos similares.',
      vehicleName: `${vehicle.brand} ${vehicle.model} ${vehicle.year_model || ''}`
    };
  }
  
  // Limit number of photos
  const photosToSend = images.slice(0, Math.min(maxPhotos || 3, 5));
  
  console.log(`[sendVehiclePhotos] Sending ${photosToSend.length} photos for vehicle ${vehicleId}`);
  
  try {
    // Get instance for this conversation
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('instance_name')
      .eq('status', 'connected')
      .limit(1)
      .single();
    
    if (!instance) {
      return { error: 'Nenhuma instância WhatsApp disponível' };
    }
    
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    
    if (!evolutionApiUrl || !evolutionApiKey) {
      return { error: 'Configuração do WhatsApp não disponível' };
    }
    
    // Format phone
    const formattedPhone = phone.replace(/\D/g, '');
    const remoteJid = formattedPhone.includes('@') ? formattedPhone : `${formattedPhone}@s.whatsapp.net`;
    
    let sentCount = 0;
    const vehicleName = `${vehicle.brand} ${vehicle.model} ${vehicle.year_model || ''}`.trim();
    
    // Send each photo
    for (let i = 0; i < photosToSend.length; i++) {
      const imageUrl = photosToSend[i];
      
      // Add delay between photos to avoid rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      const caption = i === 0 
        ? `📸 Fotos do ${vehicleName} (${i + 1}/${photosToSend.length})`
        : `${i + 1}/${photosToSend.length}`;
      
      console.log(`[sendVehiclePhotos] Sending photo ${i + 1}: ${imageUrl.substring(0, 50)}...`);
      
      const response = await fetch(`${evolutionApiUrl}/message/sendMedia/${instance.instance_name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          number: remoteJid,
          mediatype: 'image',
          media: imageUrl,
          caption: caption,
        }),
      });
      
      if (response.ok) {
        sentCount++;
        console.log(`[sendVehiclePhotos] Photo ${i + 1} sent successfully`);
      } else {
        const errorText = await response.text();
        console.error(`[sendVehiclePhotos] Failed to send photo ${i + 1}:`, errorText);
      }
    }
    
    return { 
      success: true, 
      message: `Enviei ${sentCount} foto${sentCount > 1 ? 's' : ''} do ${vehicleName}. Gostou? Posso te passar mais detalhes!`,
      photosSent: sentCount,
      totalPhotos: images.length,
      vehicleName: vehicleName
    };
    
  } catch (error) {
    console.error('[sendVehiclePhotos] Error:', error);
    return { error: 'Erro ao enviar fotos' };
  }
}

async function updateAgentMetrics(supabase: any, agentId: string, tokensUsed: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  // Try to update existing metrics for today
  const { data: existing } = await supabase
    .from('ai_agent_metrics')
    .select('id, conversations_count')
    .eq('agent_id', agentId)
    .eq('date', today)
    .single();

  if (existing) {
    await supabase
      .from('ai_agent_metrics')
      .update({
        conversations_count: (existing.conversations_count || 0) + 1,
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('ai_agent_metrics').insert({
      agent_id: agentId,
      date: today,
      conversations_count: 1,
    });
  }
}

// Query database - generic function for connected tables
async function queryDatabase(supabase: any, args: any, connectedTables: string[]): Promise<any> {
  const { table, filters = {}, select, limit = 10, order_by } = args;
  
  // Security: only allow querying connected tables
  if (!connectedTables.includes(table)) {
    return { 
      error: `Tabela '${table}' não está conectada ao agente.`,
      available_tables: connectedTables 
    };
  }
  
  let query = supabase
    .from(table)
    .select(select || '*')
    .limit(limit);
  
  // Apply filters
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === 'string' && value.includes('%')) {
      query = query.ilike(key, value);
    } else {
      query = query.eq(key, value);
    }
  }
  
  // Apply ordering
  if (order_by) {
    const isDesc = order_by.startsWith('-');
    const field = isDesc ? order_by.slice(1) : order_by;
    query = query.order(field, { ascending: !isDesc });
  } else {
    query = query.order('created_at', { ascending: false });
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Query database error:', error);
    return { error: 'Erro ao consultar banco de dados' };
  }
  
  return {
    table,
    count: data?.length || 0,
    data: data || []
  };
}

// Sales summary
async function getSalesSummary(supabase: any, args: any): Promise<any> {
  const { period = 'month', salesperson_id } = args;
  
  let startDate = new Date();
  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }
  
  let query = supabase
    .from('sales')
    .select('id, sale_price, profit, sale_date, seller_id')
    .gte('sale_date', startDate.toISOString().split('T')[0]);
  
  if (salesperson_id) {
    query = query.eq('seller_id', salesperson_id);
  }
  
  const { data: sales, error } = await query;
  
  if (error) {
    console.error('Sales summary error:', error);
    return { error: 'Erro ao obter resumo de vendas' };
  }
  
  const totalSales = sales?.length || 0;
  const totalValue = sales?.reduce((sum: number, s: any) => sum + (s.sale_price || 0), 0) || 0;
  const totalProfit = sales?.reduce((sum: number, s: any) => sum + (s.profit || 0), 0) || 0;
  const avgTicket = totalSales > 0 ? totalValue / totalSales : 0;
  
  return {
    periodo: period,
    total_vendas: totalSales,
    valor_total: `R$ ${totalValue.toLocaleString('pt-BR')}`,
    lucro_total: `R$ ${totalProfit.toLocaleString('pt-BR')}`,
    ticket_medio: `R$ ${avgTicket.toLocaleString('pt-BR')}`,
    margem_media: totalValue > 0 ? `${((totalProfit / totalValue) * 100).toFixed(1)}%` : '0%'
  };
}

// Inventory stats
async function getInventoryStats(supabase: any): Promise<any> {
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('id, price, status, created_at, brand, model, year')
    .eq('status', 'available');
  
  if (error) {
    console.error('Inventory stats error:', error);
    return { error: 'Erro ao obter estatísticas do estoque' };
  }
  
  const total = vehicles?.length || 0;
  const totalValue = vehicles?.reduce((sum: number, v: any) => sum + (v.price || 0), 0) || 0;
  const avgPrice = total > 0 ? totalValue / total : 0;
  
  // Group by brand
  const byBrand: Record<string, number> = {};
  vehicles?.forEach((v: any) => {
    byBrand[v.brand] = (byBrand[v.brand] || 0) + 1;
  });
  
  // Find oldest vehicles (in stock for longest)
  const sorted = [...(vehicles || [])].sort((a: any, b: any) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const oldest = sorted.slice(0, 5).map((v: any) => ({
    nome: `${v.brand} ${v.model} ${v.year}`,
    dias_em_estoque: Math.floor((Date.now() - new Date(v.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    preco: `R$ ${(v.price || 0).toLocaleString('pt-BR')}`
  }));
  
  return {
    total_veiculos: total,
    valor_total_estoque: `R$ ${totalValue.toLocaleString('pt-BR')}`,
    preco_medio: `R$ ${avgPrice.toLocaleString('pt-BR')}`,
    por_marca: byBrand,
    mais_antigos: oldest
  };
}
