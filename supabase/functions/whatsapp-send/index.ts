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
    // Use custom secrets to bypass reserved remix secrets
    const supabaseUrl = Deno.env.get('MY_SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('MY_SUPABASE_SERVICE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { phone, message, instanceId, leadId, userId } = await req.json();
    console.log('Sending WhatsApp message:', { phone, instanceId, leadId, userId });

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: 'Phone and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Global Evolution API config
    const evolutionUrl = (Deno.env.get('EVOLUTION_API_URL') ?? '').replace(/\/$/, '');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    // Get instance configuration - prioritize user's own instance
    let instance;
    let isUsingSharedInstance = false;
    
    // First, try to use specified instanceId
    if (instanceId) {
      const { data } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', instanceId)
        .single();
      instance = data;
      // Check if this is a shared instance being used by another user
      if (instance && instance.user_id && instance.user_id !== userId && instance.is_shared) {
        isUsingSharedInstance = true;
      }
    }
    
    // If no instanceId but userId provided, try user's own instance first
    if (!instance && userId) {
      const { data: userInstance } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'connected')
        .maybeSingle();
      
      if (userInstance) {
        console.log('Using user\'s own instance:', userInstance.instance_name);
        instance = userInstance;
      }
    }
    
    // If no own instance, try shared instance
    if (!instance && userId) {
      const { data: sharedInstance } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('is_shared', true)
        .eq('status', 'connected')
        .limit(1)
        .maybeSingle();
      
      if (sharedInstance) {
        console.log('Using shared instance:', sharedInstance.instance_name);
        instance = sharedInstance;
        isUsingSharedInstance = true;
      }
    }
    
    // Fallback: try default instance
    if (!instance) {
      const { data } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('is_default', true)
        .single();
      instance = data;
    }
    
    // Final fallback: first connected instance
    if (!instance) {
      const { data: firstInstance } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('status', 'connected')
        .limit(1)
        .single();
      instance = firstInstance;
    }

    if (!instance) {
      return new Response(
        JSON.stringify({ error: 'No WhatsApp instance available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (instance.status !== 'connected') {
      return new Response(
        JSON.stringify({ error: 'WhatsApp não está conectado. Por favor, escaneie o QR Code primeiro.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number (remove non-digits, ensure country code)
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }

    // Build final message with signature if using shared instance
    let finalMessage = message;
    
    if (isUsingSharedInstance && userId) {
      // Get sender's name
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();
      
      if (senderProfile?.full_name) {
        const signatureTemplate = instance.signature_template || '👤 {nome} está te atendendo';
        const signature = signatureTemplate.replace(/\{nome\}/g, senderProfile.full_name);
        finalMessage = `${signature}\n\n${message}`;
        console.log('Added signature to message for shared instance');
      }
    }

    // Use global Evolution API config (or instance's own config as fallback)
    const apiUrl = evolutionUrl || instance.api_url;
    const apiKey = evolutionKey || instance.api_key;

    // Send message via Evolution API
    const sendUrl = `${apiUrl}/message/sendText/${instance.instance_name}`;
    console.log('Calling Evolution API:', sendUrl);

    const response = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: finalMessage,
      }),
    });

    const result = await response.json();
    console.log('Evolution API response:', result);

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send message via Evolution API');
    }

    // Find or create contact
    const { data: existingContact } = await supabase
      .from('whatsapp_contacts')
      .select('id, lead_id')
      .eq('phone', formattedPhone)
      .single();

    let contactId = existingContact?.id;
    
    if (!existingContact) {
      const { data: newContact } = await supabase
        .from('whatsapp_contacts')
        .insert({
          phone: formattedPhone,
          lead_id: leadId,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();
      contactId = newContact?.id;
    } else {
      // Update last message time
      await supabase
        .from('whatsapp_contacts')
        .update({ 
          last_message_at: new Date().toISOString(),
          lead_id: leadId || existingContact.lead_id,
        })
        .eq('id', existingContact.id);
    }

    // Save message to database
    const { data: savedMessage, error: saveError } = await supabase
      .from('whatsapp_messages')
      .insert({
        instance_id: instance.id,
        contact_id: contactId,
        remote_jid: `${formattedPhone}@s.whatsapp.net`,
        message_id: result.key?.id,
        direction: 'outgoing',
        message_type: 'text',
        content: message,
        status: 'sent',
        lead_id: leadId,
        sent_by: userId,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving message:', saveError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: savedMessage,
        evolutionResponse: result 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Send message error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
