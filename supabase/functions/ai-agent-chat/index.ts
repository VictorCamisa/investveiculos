import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      description: "Obtém detalhes completos de um veículo específico pelo ID.",
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

  try {
    const supabaseUrl = Deno.env.get('MY_SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('MY_SUPABASE_SERVICE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY') ?? '';
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

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

    // 3. Load conversation history
    const { data: history } = await supabase
      .from('ai_agent_messages')
      .select('role, content')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true })
      .limit(20); // Keep last 20 messages for context

    // 4. Save user message
    await supabase.from('ai_agent_messages').insert({
      conversation_id: currentConversationId,
      role: 'user',
      content: message,
    });

    // 5. Build messages array for LLM
    const systemPrompt = agent.system_prompt || buildDefaultSystemPrompt(agent);
    
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
          connectedTables
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

    // 9. Save assistant message
    await supabase.from('ai_agent_messages').insert({
      conversation_id: currentConversationId,
      role: 'assistant',
      content: assistantContent,
      tool_calls: toolCalls.length > 0 ? toolCalls : null,
      tool_results: toolResults.length > 0 ? toolResults : null,
      tokens_used: llmData.usage?.total_tokens || null,
    });

    // 10. Generate TTS if enabled
    let audioBase64: string | null = null;
    if (enable_tts && elevenLabsApiKey && assistantContent) {
      try {
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
              text: assistantContent,
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
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
      audio: audioBase64,
      tool_calls: toolCalls,
      tool_results: toolResults,
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
  }
});

function buildDefaultSystemPrompt(agent: any): string {
  const objective = agent.objective || 'ajudar clientes a encontrar o veículo ideal';
  const name = agent.name || 'Assistente';
  
  return `Você é ${name}, um assistente de vendas de veículos altamente especializado.

Seu objetivo principal é: ${objective}

INSTRUÇÕES:
1. Seja sempre cordial, profissional e empático
2. Responda SEMPRE em português brasileiro
3. Use as ferramentas disponíveis para buscar veículos, criar leads e agendar visitas
4. Quando o cliente mostrar interesse em um veículo, colete informações de contato
5. Sugira test-drive quando apropriado
6. Forneça informações precisas sobre preços e condições
7. Seja proativo em oferecer alternativas quando não houver exatamente o que o cliente procura

INFORMAÇÕES DA LOJA:
- Trabalhamos com veículos seminovos de qualidade
- Oferecemos financiamento facilitado
- Aceitamos veículos na troca
- Horário de funcionamento: Segunda a Sexta 8h-18h, Sábado 8h-12h

Mantenha suas respostas concisas mas informativas. Sempre que possível, faça perguntas para entender melhor as necessidades do cliente.`;
}

async function executeToolFunction(
  supabase: any, 
  functionName: string, 
  args: any,
  context: { lead_id?: string; phone?: string; supabaseUrl: string; serviceRoleKey: string; connectedTables?: string[] }
): Promise<any> {
  console.log(`Executing ${functionName} with args:`, args);

  switch (functionName) {
    case 'search_vehicles':
      return await searchVehicles(supabase, args);
    
    case 'create_or_update_lead':
      return await createOrUpdateLead(supabase, args, context.phone);
    
    case 'schedule_visit':
      return await scheduleVisit(supabase, args, context.lead_id);
    
    case 'send_whatsapp_message':
      return await sendWhatsAppMessage(args, context.supabaseUrl, context.serviceRoleKey);
    
    case 'get_vehicle_details':
      return await getVehicleDetails(supabase, args.vehicle_id);
    
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

async function searchVehicles(supabase: any, args: any): Promise<any> {
  let query = supabase
    .from('vehicles')
    .select('id, brand, model, year, price, mileage, fuel_type, color, photos, status')
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(args.limit || 5);

  if (args.brand) {
    query = query.ilike('brand', `%${args.brand}%`);
  }
  if (args.model) {
    query = query.ilike('model', `%${args.model}%`);
  }
  if (args.year_min) {
    query = query.gte('year', args.year_min);
  }
  if (args.year_max) {
    query = query.lte('year', args.year_max);
  }
  if (args.price_min) {
    query = query.gte('price', args.price_min);
  }
  if (args.price_max) {
    query = query.lte('price', args.price_max);
  }
  if (args.fuel_type) {
    query = query.ilike('fuel_type', `%${args.fuel_type}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Search vehicles error:', error);
    return { error: 'Failed to search vehicles' };
  }

  if (!data || data.length === 0) {
    return { 
      message: 'Nenhum veículo encontrado com os critérios especificados.',
      vehicles: [] 
    };
  }

  return {
    message: `Encontrei ${data.length} veículo(s) disponível(is).`,
    vehicles: data.map((v: any) => ({
      id: v.id,
      nome: `${v.brand} ${v.model} ${v.year}`,
      preco: `R$ ${(v.price || 0).toLocaleString('pt-BR')}`,
      km: `${(v.mileage || 0).toLocaleString('pt-BR')} km`,
      combustivel: v.fuel_type,
      cor: v.color,
      foto: v.photos?.[0] || null
    }))
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
    return { error: 'Vehicle not found' };
  }

  return {
    id: data.id,
    nome: `${data.brand} ${data.model} ${data.year}`,
    preco: `R$ ${(data.price || 0).toLocaleString('pt-BR')}`,
    km: `${(data.mileage || 0).toLocaleString('pt-BR')} km`,
    combustivel: data.fuel_type,
    cor: data.color,
    transmissao: data.transmission,
    motor: data.engine,
    portas: data.doors,
    placa_final: data.plate?.slice(-1),
    fotos: data.photos || [],
    opcional: data.features || [],
    observacoes: data.notes
  };
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
