import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use custom MY_SUPABASE secrets to bypass reserved/truncated Supabase secrets
    const supabaseUrl = Deno.env.get('MY_SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('MY_SUPABASE_SERVICE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    console.log('Using MY_SUPABASE_URL:', !!Deno.env.get('MY_SUPABASE_URL'));
    console.log('Using MY_SUPABASE_SERVICE_KEY:', !!Deno.env.get('MY_SUPABASE_SERVICE_KEY'));
    console.log('Service Role Key length:', serviceRoleKey?.length || 0);
    
    // Decode JWT to check the role - this is CRITICAL for debugging
    try {
      const jwtParts = serviceRoleKey.split('.');
      if (jwtParts.length === 3) {
        const payload = JSON.parse(atob(jwtParts[1]));
        console.log('JWT ROLE:', payload.role); // Should be "service_role", NOT "anon"
        console.log('JWT ref:', payload.ref);
      }
    } catch (e) {
      console.error('Failed to decode JWT:', e);
    }
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase configuration!');
      throw new Error('Missing Supabase URL or Service Role Key');
    }
    
    // Create client with service role - this bypasses RLS
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const payload = await req.json();
    console.log('WhatsApp Webhook received:', JSON.stringify(payload, null, 2));

    const { event, data, instance } = payload;

    const normalizeEvent = (e?: string) =>
      (e || '')
        .toLowerCase()
        .replace(/_/g, '.'); // e.g. MESSAGES_UPSERT -> messages.upsert

    const normalizedEvent = normalizeEvent(event);

    // Handle different event types from Evolution API
    switch (normalizedEvent) {
      case 'messages.upsert':
        await handleNewMessage(supabase, data, instance, payload);
        break;
      case 'messages.update':
        await handleMessageUpdate(supabase, data);
        break;
      case 'connection.update':
        await handleConnectionUpdate(supabase, data, instance);
        break;
      case 'qrcode.updated':
        await handleQRCodeUpdate(supabase, data, instance);
        break;
      default:
        console.log('Unhandled event type:', event, 'normalized:', normalizedEvent);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleNewMessage(supabase: any, data: any, instanceName: string, payload: any) {
  // Evolution API v2 sends message info inside data (or at the root level, depending on event structure)
  const message = data;
  const remoteJid = message.key?.remoteJid;
  const fromMe = message.key?.fromMe;
  const pushName = message.pushName;
  const messageId = message.key?.id;
  
  // Detect audio messages for transcription
  const audioMessage = message.message?.audioMessage;
  const isAudioMessage = !!audioMessage;
  
  let content =
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    '';
  
  // Note: Audio transcription will happen in handleAIAgentResponse 
  // where we have access to the agent's API keys
  // For now, just mark audio messages for later processing
  let audioBase64ForTranscription: string | null = null;
  
  if (isAudioMessage && message.key?.id) {
    console.log('Audio message detected, will transcribe after getting agent config...');
    
    // Get decrypted audio from Evolution API
    audioBase64ForTranscription = await getAudioBase64FromEvolution(instanceName, message.key);
    
    if (!audioBase64ForTranscription) {
      content = '[Áudio - falha ao obter mídia]';
    } else {
      content = '[AUDIO_PENDING_TRANSCRIPTION]';
    }
  }
  
  if (!content) {
    content = '[Mídia]';
  }

  const { phone, remoteJidToStore } = extractPhoneAndJid(message, payload);

  console.log('Processing message:', {
    remoteJid,
    remoteJidToStore,
    fromMe,
    phone,
    pushName,
    content: content?.substring(0, 50),
    messageId,
  });

  // Skip outgoing messages for lead creation
  if (fromMe) {
    await processOutgoingMessage(supabase, message, instanceName, phone, remoteJidToStore, content, messageId);
    return;
  }

  // ===== INCOMING MESSAGE: Process lead and contact =====
  
  // Find or create lead by phone
  let leadId: string | null = null;
  let contact: { id: string; lead_id?: string; unread_count?: number; phone?: string } | null = null;

  if (phone) {
    // Try to find existing lead
    leadId = await findLeadIdByPhone(supabase, phone);

    if (!leadId) {
      // Create new lead WITHOUT salesperson assignment (Round Robin runs on qualification)
      console.log('Creating new lead for phone:', phone, 'name:', pushName);
      leadId = await createLeadWithoutAssignment(supabase, phone, pushName || 'WhatsApp');
      console.log('Created lead:', leadId);
    } else {
      // Update existing lead's last contact
      console.log('Updating existing lead:', leadId);
      await supabase
        .from('leads')
        .update({ 
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);
    }

    // Find contact by phone
    const { data: existingContact } = await supabase
      .from('whatsapp_contacts')
      .select('id, lead_id, unread_count, phone')
      .eq('phone', phone)
      .single();
    
    contact = existingContact;
  }

  // If no contact found by phone but we have a lead, try to find existing contact by lead_id
  if (!contact && leadId) {
    contact = await findContactByLeadId(supabase, leadId);
  }

  // If still no phone and no contact, check if remoteJid looks like LID mode
  if (!contact && !phone && remoteJid) {
    const { data: contactByJid } = await supabase
      .from('whatsapp_contacts')
      .select('id, lead_id, unread_count, phone')
      .eq('phone', remoteJid.split('@')[0])
      .single();
    
    contact = contactByJid;
  }

  // Cannot process message without phone or existing contact
  if (!phone && !contact) {
    console.log('No phone resolved and no existing contact found, skipping message');
    return;
  }

  const effectivePhone = phone || contact?.phone || remoteJid?.split('@')[0] || '';

  if (!contact) {
    const { data: newContact } = await supabase
      .from('whatsapp_contacts')
      .insert({
        phone: effectivePhone,
        name: pushName,
        lead_id: leadId || null,
        last_message_at: new Date().toISOString(),
        unread_count: 1,
      })
      .select()
      .single();
    contact = newContact;
  } else {
    const currentUnread = typeof contact.unread_count === 'number' ? contact.unread_count : 0;

    await supabase
      .from('whatsapp_contacts')
      .update({
        last_message_at: new Date().toISOString(),
        unread_count: currentUnread + 1,
        lead_id: contact.lead_id || leadId || null,
        name: pushName || undefined,
      })
      .eq('id', contact.id);

    if (!contact.lead_id && leadId) {
      contact.lead_id = leadId;
    }
  }

  // Get instance
  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('id')
    .eq('instance_name', instanceName)
    .single();

  // Save message
  await supabase.from('whatsapp_messages').insert({
    instance_id: instance?.id,
    contact_id: contact?.id,
    remote_jid: remoteJidToStore || remoteJid || `${phone}@s.whatsapp.net`,
    message_id: messageId,
    direction: 'incoming',
    message_type: 'text',
    content,
    status: 'delivered',
    lead_id: contact?.lead_id || leadId,
  });

  // Create notification for incoming messages
  if (contact?.lead_id || leadId) {
    const finalLeadId = contact?.lead_id || leadId;
    const { data: lead } = await supabase
      .from('leads')
      .select('assigned_to, name')
      .eq('id', finalLeadId)
      .single();

    if (lead?.assigned_to) {
      await supabase.from('notifications').insert({
        user_id: lead.assigned_to,
        type: 'whatsapp_message',
        title: 'Nova mensagem WhatsApp',
        message: `${lead.name}: ${content.substring(0, 100)}`,
        link: '/whatsapp',
      });
    }
  }

  // Create lead interaction record
  if (leadId) {
    await supabase.from('lead_interactions').insert({
      lead_id: leadId,
      type: 'whatsapp',
      description: `Mensagem recebida via WhatsApp: ${content.substring(0, 200)}`,
    });
  }

  // ===== AI AGENT INTEGRATION =====
  // Check if there's an active AI agent connected to this WhatsApp instance
  await handleAIAgentResponse(supabase, instance?.id, effectivePhone, content, leadId, instanceName, isAudioMessage, audioBase64ForTranscription);
}

// Handle AI Agent auto-response
async function handleAIAgentResponse(
  supabase: any, 
  instanceId: string | undefined, 
  phone: string, 
  messageContent: string, 
  leadId: string | null,
  instanceName: string,
  isAudioMessage: boolean = false,
  audioBase64: string | null = null
) {
  if (!instanceId) {
    console.log('No instance ID, skipping AI agent check');
    return;
  }

  try {
    // Find an active AI agent connected to this WhatsApp instance
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('id, status, whatsapp_auto_reply, transfer_to_human_enabled, transfer_keywords, enable_voice, voice_id, api_key_encrypted, llm_provider')
      .eq('whatsapp_instance_id', instanceId)
      .eq('status', 'active')
      .eq('whatsapp_auto_reply', true)
      .single();

    if (agentError || !agent) {
      console.log('No active AI agent found for instance:', instanceId);
      return;
    }

    console.log('Found active AI agent:', agent.id);

    // Transcribe audio if pending, using agent's API key
    let actualMessageContent = messageContent;
    if (messageContent === '[AUDIO_PENDING_TRANSCRIPTION]' && audioBase64) {
      console.log('Transcribing audio with agent API key...');
      
      // Get OpenAI API key from agent config
      let openaiApiKey: string | null = null;
      if (agent.api_key_encrypted) {
        try {
          const keys = JSON.parse(agent.api_key_encrypted);
          openaiApiKey = keys.openai || null;
        } catch {
          // Legacy format - single key
          if (agent.llm_provider === 'openai') {
            openaiApiKey = agent.api_key_encrypted;
          }
        }
      }
      
      if (openaiApiKey) {
        const transcription = await transcribeAudioFromBase64(audioBase64, openaiApiKey);
        if (transcription) {
          actualMessageContent = transcription;
          console.log('Audio transcribed successfully:', actualMessageContent.substring(0, 50));
        } else {
          actualMessageContent = '[Áudio não transcrito]';
        }
      } else {
        console.log('No OpenAI API key found, trying Lovable gateway...');
        const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
        if (lovableApiKey) {
          const transcription = await transcribeAudioFromBase64(audioBase64, null, lovableApiKey);
          if (transcription) {
            actualMessageContent = transcription;
            console.log('Audio transcribed via Lovable:', actualMessageContent.substring(0, 50));
          } else {
            actualMessageContent = '[Áudio não transcrito]';
          }
        } else {
          actualMessageContent = '[Áudio - sem chave de transcrição]';
        }
      }
    }

    // Check if there's an active human takeover for this phone/lead
    const { data: takeover } = await supabase
      .from('ai_agent_human_takeover')
      .select('id')
      .eq('phone', phone)
      .is('released_at', null)
      .single();

    if (takeover) {
      console.log('Human takeover active for phone:', phone, '- skipping AI response');
      return;
    }

    // Check for transfer keywords
    const transferKeywords = agent.transfer_keywords || ['falar com humano', 'atendente', 'vendedor', 'pessoa real'];
    const messageLower = actualMessageContent.toLowerCase();
    const shouldTransfer = transferKeywords.some((keyword: string) => 
      messageLower.includes(keyword.toLowerCase())
    );

    if (shouldTransfer && agent.transfer_to_human_enabled) {
      console.log('Transfer keyword detected, creating human takeover');
      
      // Create human takeover record
      await supabase.from('ai_agent_human_takeover').insert({
        lead_id: leadId,
        phone,
        instance_id: instanceId,
        reason: `Cliente solicitou: "${actualMessageContent.substring(0, 100)}"`,
      });

      // Send transfer message via WhatsApp
      await sendWhatsAppMessage(
        instanceName,
        phone,
        'Entendi! Vou transferir você para um de nossos atendentes. Em instantes alguém entrará em contato. 👋',
        supabase,
        leadId
      );

      // Notify assigned salesperson if lead has one
      if (leadId) {
        const { data: lead } = await supabase
          .from('leads')
          .select('assigned_to, name')
          .eq('id', leadId)
          .single();

        if (lead?.assigned_to) {
          await supabase.from('notifications').insert({
            user_id: lead.assigned_to,
            type: 'transfer_request',
            title: '🔔 Transferência solicitada',
            message: `${lead.name} solicitou falar com um humano no WhatsApp`,
            link: '/whatsapp',
          });
        }
      }

      return;
    }

    // Call AI Agent chat function
    const supabaseUrl = Deno.env.get('MY_SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('MY_SUPABASE_SERVICE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    console.log('Calling AI agent chat for agent:', agent.id);

    // Buscar conversa existente recente (últimas 4 horas) para manter contexto
    // Após 4h de inatividade, uma nova conversa é criada automaticamente
    let conversationId: string | null = null;
    const SESSION_TIMEOUT_HOURS = 4;
    const sessionCutoff = new Date(Date.now() - SESSION_TIMEOUT_HOURS * 60 * 60 * 1000).toISOString();
    
    // Buscar conversa ativa recente por lead_id
    if (leadId) {
      const { data: leadConversation } = await supabase
        .from('ai_agent_conversations')
        .select('id, started_at')
        .eq('agent_id', agent.id)
        .eq('lead_id', leadId)
        .eq('status', 'active')
        .eq('channel', 'whatsapp')
        .gte('started_at', sessionCutoff)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (leadConversation) {
        conversationId = leadConversation.id;
        console.log('Found existing conversation for lead:', conversationId);
      }
    }
    
    // Se não encontrou por lead, buscar por phone nos metadados
    if (!conversationId && phone) {
      const { data: allRecentConvs } = await supabase
        .from('ai_agent_conversations')
        .select('id, metadata')
        .eq('agent_id', agent.id)
        .eq('status', 'active')
        .eq('channel', 'whatsapp')
        .gte('started_at', sessionCutoff)
        .order('started_at', { ascending: false })
        .limit(10);
      
      if (allRecentConvs) {
        const matchingConv = allRecentConvs.find((c: { id: string; metadata: any }) => {
          const meta = c.metadata as Record<string, any> | null;
          return meta?.phone === phone;
        });
        
        if (matchingConv) {
          conversationId = matchingConv.id;
          console.log('Found existing conversation by phone:', conversationId);
        }
      }
    }
    
    // Se não encontrou conversa recente, será criada uma nova pelo ai-agent-chat
    if (!conversationId) {
      console.log('No recent conversation found, will create new one');
    }
    
    const aiResponse = await fetch(`${supabaseUrl}/functions/v1/ai-agent-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
                body: JSON.stringify({
                  agent_id: agent.id,
                  message: actualMessageContent,
                  conversation_id: conversationId,
                  lead_id: leadId,
                  phone,
                  channel: 'whatsapp',
                  enable_tts: agent.enable_voice && isAudioMessage,
                  voice_id: agent.voice_id || 'JBFqnCBsd6RMkjVDRZzb',
                }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Agent error:', aiResponse.status, errorText);
      return;
    }

    const aiData = await aiResponse.json();
    const agentReply = aiData.response;

    // Atualizar o conversation_id retornado para uso futuro
    if (aiData.conversation_id && !conversationId) {
      console.log('New conversation created:', aiData.conversation_id);
      
      // Atualizar a conversa com o telefone nos metadados para futuras buscas
      await supabase
        .from('ai_agent_conversations')
        .update({ 
          metadata: { phone },
          lead_id: leadId 
        })
        .eq('id', aiData.conversation_id);
    }

    if (!agentReply) {
      console.log('No response from AI agent');
      return;
    }

    console.log('AI Agent response:', agentReply.substring(0, 100));

    // Check if we should send audio response (only when client sent audio)
    if (aiData.audio && agent.enable_voice && isAudioMessage) {
      console.log('Sending voice response via WhatsApp (client sent audio)...');
      const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
      const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
      
      if (evolutionApiUrl && evolutionApiKey) {
        const audioSent = await sendWhatsAppAudio(
          instanceName,
          phone,
          aiData.audio,
          evolutionApiUrl,
          evolutionApiKey
        );
        
        if (audioSent) {
          // Also save the text message to database for history
          if (supabase) {
            const { data: instance } = await supabase
              .from('whatsapp_instances')
              .select('id')
              .eq('instance_name', instanceName)
              .single();
            
            const formattedPhone = phone.replace(/\D/g, '');
            const { data: contact } = await supabase
              .from('whatsapp_contacts')
              .select('id, lead_id')
              .eq('phone', formattedPhone)
              .single();
            
            await supabase.from('whatsapp_messages').insert({
              instance_id: instance?.id,
              contact_id: contact?.id,
              remote_jid: `${formattedPhone}@s.whatsapp.net`,
              message_id: `ai-audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              direction: 'outgoing',
              message_type: 'audio',
              content: `[Áudio]: ${agentReply}`,
              status: 'sent',
              lead_id: contact?.lead_id || leadId,
            });
          }
          return; // Audio sent, no need to send text
        }
      }
    }

    // Fallback: Send the AI response as text via WhatsApp
    await sendWhatsAppMessage(instanceName, phone, agentReply, supabase, leadId);

  } catch (error) {
    console.error('Error in AI agent integration:', error);
  }
}

// Get audio base64 from Evolution API (decrypts WhatsApp media)
async function getAudioBase64FromEvolution(
  instanceName: string,
  messageKey: any
): Promise<string | null> {
  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
  
  if (!evolutionApiUrl || !evolutionApiKey) {
    console.error('Missing Evolution API configuration');
    return null;
  }
  
  try {
    console.log('[Evolution] Getting base64 from media message...');
    
    const response = await fetch(`${evolutionApiUrl}/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        message: {
          key: {
            id: messageKey.id
          }
        },
        convertToMp4: false
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Evolution] Failed to get base64:', response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    console.log('[Evolution] Got base64 audio, length:', data.base64?.length || 0);
    return data.base64 || null;
  } catch (error) {
    console.error('[Evolution] Error getting base64:', error);
    return null;
  }
}

// Transcribe audio using OpenAI Whisper
async function transcribeAudioFromBase64(
  audioBase64: string,
  openaiApiKey: string | null = null,
  lovableApiKey: string | null = null
): Promise<string | null> {
  // Determine which API to use
  const useOpenAI = !!openaiApiKey;
  const useLovable = !useOpenAI && !!lovableApiKey;
  
  if (!useOpenAI && !useLovable) {
    console.error('No API key provided for audio transcription');
    return null;
  }
  
  try {
    // Decode base64 to buffer
    const binaryString = atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const audioBlob = new Blob([bytes], { type: 'audio/ogg' });
    
    // Create FormData for Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.ogg');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');
    
    // Choose endpoint and auth based on available key
    const endpoint = useOpenAI 
      ? 'https://api.openai.com/v1/audio/transcriptions'
      : 'https://ai.gateway.lovable.dev/v1/audio/transcriptions';
    const authKey = useOpenAI ? openaiApiKey : lovableApiKey;
    
    console.log(`Sending audio to Whisper for transcription via ${useOpenAI ? 'OpenAI' : 'Lovable'}...`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authKey}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper transcription failed:', response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    console.log('Transcription successful:', data.text?.substring(0, 50));
    return data.text || null;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return null;
  }
}

// Send audio message via Evolution API
async function sendWhatsAppAudio(
  instanceName: string,
  phone: string,
  audioBase64: string,
  evolutionApiUrl: string,
  evolutionApiKey: string
): Promise<boolean> {
  const formattedPhone = phone.replace(/\D/g, '');
  // Evolution API expects just the number without @s.whatsapp.net
  const number = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;
  
  try {
    console.log('[WhatsApp] Sending audio message to:', number);
    console.log('[WhatsApp] Audio base64 length:', audioBase64.length);
    
    // Evolution API accepts base64 directly (without data URI prefix)
    // The audio from ElevenLabs is already in MP3 format
    const response = await fetch(`${evolutionApiUrl}/message/sendWhatsAppAudio/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        number: number,
        audio: audioBase64,
        delay: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WhatsApp] Failed to send audio:', response.status, errorText);
      
      // Try with data URI prefix as fallback
      console.log('[WhatsApp] Retrying with data URI prefix...');
      const retryResponse = await fetch(`${evolutionApiUrl}/message/sendWhatsAppAudio/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          number: number,
          audio: `data:audio/mpeg;base64,${audioBase64}`,
          delay: 1000,
        }),
      });
      
      if (!retryResponse.ok) {
        const retryError = await retryResponse.text();
        console.error('[WhatsApp] Retry also failed:', retryResponse.status, retryError);
        return false;
      }
      
      console.log('[WhatsApp] Audio sent successfully with data URI');
      return true;
    }
    
    console.log('[WhatsApp] Audio message sent successfully');
    return true;
  } catch (error) {
    console.error('[WhatsApp] Error sending audio:', error);
    return false;
  }
}

// Split long messages into smaller parts for more natural conversation
function splitMessage(message: string): string[] {
  // If message is short, return as is
  if (message.length < 150) return [message.trim()];
  
  const parts: string[] = [];
  
  // First, split by paragraphs (double line breaks)
  const paragraphs = message.split(/\n\n+/).filter(p => p.trim());
  
  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    
    // If paragraph is short enough, add directly
    if (trimmedPara.length < 200) {
      parts.push(trimmedPara);
    } else {
      // Split by sentences for longer paragraphs
      const sentences = trimmedPara.split(/(?<=[.!?])\s+/);
      let currentPart = '';
      
      for (const sentence of sentences) {
        if ((currentPart + ' ' + sentence).length < 200) {
          currentPart += (currentPart ? ' ' : '') + sentence;
        } else {
          if (currentPart.trim()) parts.push(currentPart.trim());
          currentPart = sentence;
        }
      }
      if (currentPart.trim()) parts.push(currentPart.trim());
    }
  }
  
  // Limit to 5 parts max, grouping the rest
  if (parts.length > 5) {
    const first4 = parts.slice(0, 4);
    const rest = parts.slice(4).join(' ');
    return [...first4, rest].filter(p => p.length > 10);
  }
  
  return parts.filter(p => p.length > 10);
}

// Detect image URLs in text
function extractImageUrls(text: string): { urls: string[]; textWithoutUrls: string } {
  // Match common image URL patterns (direct image links)
  const imageUrlPattern = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|bmp)(?:\?[^\s]*)?)/gi;
  const urls: string[] = [];
  let textWithoutUrls = text;
  
  const matches = text.match(imageUrlPattern);
  if (matches) {
    matches.forEach(url => {
      urls.push(url);
      textWithoutUrls = textWithoutUrls.replace(url, '').trim();
    });
  }
  
  // Also check for Supabase storage URLs (they might not end with extension)
  const supabaseStoragePattern = /(https?:\/\/[^\s]*supabase[^\s]*\/storage\/v1\/object\/[^\s]+)/gi;
  const supabaseMatches = text.match(supabaseStoragePattern);
  if (supabaseMatches) {
    supabaseMatches.forEach(url => {
      if (!urls.includes(url)) {
        urls.push(url);
        textWithoutUrls = textWithoutUrls.replace(url, '').trim();
      }
    });
  }
  
  // Clean up extra whitespace
  textWithoutUrls = textWithoutUrls.replace(/\n{3,}/g, '\n\n').trim();
  
  return { urls, textWithoutUrls };
}

// Send image via Evolution API
async function sendWhatsAppImage(
  instanceName: string,
  phone: string,
  imageUrl: string,
  caption: string = '',
  evolutionApiUrl: string,
  evolutionApiKey: string
): Promise<boolean> {
  const formattedPhone = phone.replace(/\D/g, '');
  const remoteJid = formattedPhone.includes('@') ? formattedPhone : `${formattedPhone}@s.whatsapp.net`;
  
  try {
    console.log(`[WhatsApp] Sending image: ${imageUrl.substring(0, 80)}...`);
    
    const response = await fetch(`${evolutionApiUrl}/message/sendMedia/${instanceName}`, {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WhatsApp] Failed to send image:', response.status, errorText);
      return false;
    }
    
    console.log('[WhatsApp] Image sent successfully');
    return true;
  } catch (error) {
    console.error('[WhatsApp] Error sending image:', error);
    return false;
  }
}

// Send WhatsApp message via Evolution API and save to database
async function sendWhatsAppMessage(
  instanceName: string, 
  phone: string, 
  message: string,
  supabase?: any,
  leadId?: string | null
) {
  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

  if (!evolutionApiUrl || !evolutionApiKey) {
    console.error('Missing Evolution API configuration');
    return;
  }

  // Format phone number
  const formattedPhone = phone.replace(/\D/g, '');
  const remoteJid = formattedPhone.includes('@') ? formattedPhone : `${formattedPhone}@s.whatsapp.net`;

  try {
    // Extract image URLs from message
    const { urls: imageUrls, textWithoutUrls } = extractImageUrls(message);
    
    console.log(`[WhatsApp] Message analysis - Images found: ${imageUrls.length}, Has text: ${textWithoutUrls.length > 0}`);
    
    // Send text message in parts for more natural conversation
    if (textWithoutUrls.length > 0) {
      const messageParts = splitMessage(textWithoutUrls);
      console.log(`[WhatsApp] Splitting message into ${messageParts.length} parts`);
      
      for (let i = 0; i < messageParts.length; i++) {
        // Add humanized delay between parts (500-800ms)
        if (i > 0) {
          const delay = 500 + Math.random() * 300;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const response = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify({
            number: remoteJid,
            text: messageParts[i],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to send WhatsApp text message part ${i + 1}:`, response.status, errorText);
        } else {
          console.log(`WhatsApp text message part ${i + 1}/${messageParts.length} sent successfully`);
        }
      }
    }
    
    // Send images as media messages
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      // Add small delay between multiple images to avoid rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      await sendWhatsAppImage(instanceName, phone, imageUrl, '', evolutionApiUrl, evolutionApiKey);
    }
    
    // Save the outgoing message to the database
    if (supabase) {
      // Get instance
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('id')
        .eq('instance_name', instanceName)
        .single();
      
      // Get contact
      const { data: contact } = await supabase
        .from('whatsapp_contacts')
        .select('id, lead_id')
        .eq('phone', formattedPhone)
        .single();
      
      // Save the agent's message (full original message for history)
      const { error: insertError } = await supabase.from('whatsapp_messages').insert({
        instance_id: instance?.id,
        contact_id: contact?.id,
        remote_jid: remoteJid,
        message_id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        direction: 'outgoing',
        message_type: imageUrls.length > 0 ? 'media' : 'text',
        content: message,
        status: 'sent',
        lead_id: contact?.lead_id || leadId,
      });
      
      if (insertError) {
        console.error('Failed to save outgoing message:', insertError);
      } else {
        console.log('Outgoing AI message saved to database');
      }
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}


async function processOutgoingMessage(
  supabase: any,
  message: any,
  instanceName: string,
  phone: string | null,
  remoteJidToStore: string | undefined,
  content: string,
  messageId: string
) {
  const remoteJid = message.key?.remoteJid;
  
  let contact: { id: string; lead_id?: string } | null = null;

  if (phone) {
    const { data: existingContact } = await supabase
      .from('whatsapp_contacts')
      .select('id, lead_id')
      .eq('phone', phone)
      .single();
    contact = existingContact;
  }

  if (!contact && !phone && remoteJid) {
    const { data: contactByJid } = await supabase
      .from('whatsapp_contacts')
      .select('id, lead_id')
      .eq('phone', remoteJid.split('@')[0])
      .single();
    contact = contactByJid;
  }

  // Get instance
  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('id')
    .eq('instance_name', instanceName)
    .single();

  // Save message
  await supabase.from('whatsapp_messages').insert({
    instance_id: instance?.id,
    contact_id: contact?.id,
    remote_jid: remoteJidToStore || remoteJid,
    message_id: messageId,
    direction: 'outgoing',
    message_type: 'text',
    content,
    status: 'sent',
    lead_id: contact?.lead_id,
  });

  // Reset unread count when we send a message
  if (contact) {
    await supabase
      .from('whatsapp_contacts')
      .update({ unread_count: 0 })
      .eq('id', contact.id);
  }
}

// Create lead WITHOUT salesperson assignment - Round Robin runs when moving to "Qualificado"
async function createLeadWithoutAssignment(
  supabase: any,
  phone: string,
  name: string
): Promise<string | null> {
  console.log('Creating lead without salesperson assignment:', { phone, name });

  // Create lead WITHOUT assignment
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert({
      phone,
      name,
      source: 'whatsapp',
      status: 'novo',
      assigned_to: null, // No salesperson assigned yet
    })
    .select()
    .single();

  if (leadError) {
    console.error('Error creating lead:', leadError);
    return null;
  }

  // Create negotiation WITHOUT salesperson
  const { error: negError } = await supabase.from('negotiations').insert({
    lead_id: lead.id,
    salesperson_id: null, // No salesperson assigned yet
    status: 'em_andamento',
    notes: 'Negociação criada automaticamente a partir de mensagem WhatsApp. Aguardando qualificação.',
  });

  if (negError) {
    console.error('Error creating negotiation:', negError);
  } else {
    console.log('Created negotiation without salesperson for lead:', lead.id);
  }

  // No lead_assignments created here
  // No notifications sent here
  // These will happen when the negotiation is moved to "Qualificado" status

  return lead.id;
}

// Get next salesperson using Round Robin algorithm
async function getNextRoundRobinSalesperson(supabase: any): Promise<string | null> {
  // Get all active round robin configs ordered by last_assigned_at (oldest first)
  const { data: configs, error } = await supabase
    .from('round_robin_config')
    .select('*')
    .eq('is_active', true)
    .order('last_assigned_at', { ascending: true, nullsFirst: true });

  if (error || !configs || configs.length === 0) {
    console.log('No active round robin configs found');
    return null;
  }

  // Find the next eligible salesperson
  // Check if they haven't exceeded their daily limit
  const today = new Date().toISOString().split('T')[0];
  
  for (const config of configs) {
    // If max_leads_per_day is set, check if limit reached
    if (config.max_leads_per_day !== null) {
      // Check if last_assigned_at is from today
      const lastAssignedDate = config.last_assigned_at 
        ? new Date(config.last_assigned_at).toISOString().split('T')[0]
        : null;
      
      // Reset counter if it's a new day
      if (lastAssignedDate !== today) {
        config.current_leads_today = 0;
      }

      if (config.current_leads_today >= config.max_leads_per_day) {
        continue; // Skip this salesperson, they've reached their limit
      }
    }

    // This salesperson is eligible
    return config.salesperson_id;
  }

  // If all salespeople reached their limits, return the first one (least recently assigned)
  return configs[0]?.salesperson_id || null;
}

async function handleMessageUpdate(supabase: any, data: any) {
  // Evolution API can send updates in different shapes.
  const keyId = data?.keyId || data?.key?.id;
  if (!keyId) return;

  const rawStatus = data?.status ?? data?.update?.status;

  const numberStatusMap: Record<number, string> = {
    2: 'sent',
    3: 'delivered',
    4: 'read',
  };

  const stringStatusMap: Record<string, string> = {
    SERVER_ACK: 'sent',
    DELIVERY_ACK: 'delivered',
    READ: 'read',
    READ_ACK: 'read',
    FAILED: 'failed',
    ERROR: 'failed',
  };

  const status =
    typeof rawStatus === 'number'
      ? numberStatusMap[rawStatus]
      : typeof rawStatus === 'string'
        ? stringStatusMap[rawStatus]
        : undefined;

  if (!status) return;

  await supabase
    .from('whatsapp_messages')
    .update({ status })
    .eq('message_id', keyId);
}

async function handleConnectionUpdate(supabase: any, data: any, instanceName: string) {
  const { state } = data;
  const statusMap: Record<string, string> = {
    open: 'connected',
    close: 'disconnected',
    connecting: 'connecting',
  };

  const status = statusMap[state] || 'disconnected';
  
  await supabase
    .from('whatsapp_instances')
    .update({ status })
    .eq('instance_name', instanceName);
}

async function handleQRCodeUpdate(supabase: any, data: any, instanceName: string) {
  const { qrcode } = data;
  
  await supabase
    .from('whatsapp_instances')
    .update({ 
      qr_code: qrcode?.base64,
      status: 'qr_code',
      qr_code_expires_at: new Date(Date.now() + 60000).toISOString()
    })
    .eq('instance_name', instanceName);
}

function normalizePhone(input?: string): string | null {
  if (!input) return null;
  
  // Remove the @lid or @s.whatsapp.net suffix if present
  const cleaned = input.split('@')[0];
  const digits = cleaned.replace(/\D/g, '');
  
  if (!digits || digits.length < 10) return null;
  
  // If it's a LID (starts with 1 and has too many digits), it's not a valid phone
  if (digits.startsWith('1') && digits.length > 13) return null;
  
  return digits.startsWith('55') ? digits : `55${digits}`;
}

function extractPhoneAndJid(message: any, payload: any): { phone: string | null; remoteJidToStore?: string } {
  const remoteJid = message?.key?.remoteJid as string | undefined;
  const remoteJidAlt = message?.key?.remoteJidAlt as string | undefined;
  const sender = payload?.sender as string | undefined;
  const participant = message?.key?.participant as string | undefined;
  const fromMe = message?.key?.fromMe === true;

  // For incoming messages (fromMe=false), the remoteJid is the sender's phone
  // For outgoing messages (fromMe=true), remoteJidAlt contains the real phone when using LID mode
  
  let phoneCandidate: string | null = null;
  let bestJid: string | undefined = undefined;

  // For incoming messages, prioritize remoteJid if it's a real phone (not LID)
  if (!fromMe && remoteJid && !remoteJid.endsWith('@lid')) {
    phoneCandidate = normalizePhone(remoteJid);
    bestJid = remoteJid;
  }

  // For outgoing messages or if remoteJid was LID, try remoteJidAlt
  if (!phoneCandidate && remoteJidAlt && !remoteJidAlt.endsWith('@lid')) {
    phoneCandidate = normalizePhone(remoteJidAlt);
    bestJid = remoteJidAlt;
  }
  
  // Try participant
  if (!phoneCandidate && participant && !participant.endsWith('@lid')) {
    phoneCandidate = normalizePhone(participant);
    bestJid = participant;
  }
  
  // Try sender from payload
  if (!phoneCandidate && sender && !sender.endsWith('@lid')) {
    phoneCandidate = normalizePhone(sender);
    bestJid = sender;
  }

  const remoteJidToStore = bestJid || (phoneCandidate ? `${phoneCandidate}@s.whatsapp.net` : undefined) || remoteJid;

  return { phone: phoneCandidate, remoteJidToStore };
}

async function findLeadIdByPhone(supabase: any, formattedPhone: string): Promise<string | null> {
  const phoneNoCountry = formattedPhone.replace(/^55/, '');
  const candidates = [formattedPhone, phoneNoCountry, `+${formattedPhone}`, `+${phoneNoCountry}`];

  for (const candidate of candidates) {
    if (!candidate) continue;

    const { data } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', candidate)
      .limit(1)
      .maybeSingle();

    if (data?.id) return data.id as string;
  }

  return null;
}

// Try to find an existing contact by lead_id when phone matching fails
async function findContactByLeadId(supabase: any, leadId: string): Promise<{ id: string; phone: string } | null> {
  const { data } = await supabase
    .from('whatsapp_contacts')
    .select('id, phone')
    .eq('lead_id', leadId)
    .limit(1)
    .maybeSingle();
  
  return data || null;
}
