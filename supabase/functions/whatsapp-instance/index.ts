import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to slugify names for instance names
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 30);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, instanceId, userId } = body;
    
    // Use authenticated user's token instead of service_role key
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = 'https://rugbunseyblzapwzevqh.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1Z2J1bnNleWJsemFwd3pldnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5Nzg5ODIsImV4cCI6MjA4MzU1NDk4Mn0.1_DRJ9LU6IMZjrb418FktcYywDZ9HV2QJj-vM4Ga9bA';
    
    console.log('Auth config:', { 
      hasAuthHeader: !!authHeader,
      action,
      userId
    });
    
    // Create client with user's auth token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {}
      }
    });
    
    console.log('WhatsApp Instance action:', action, { instanceId, userId });

    // Global Evolution API config from secrets (validate URL is not a placeholder)
    const rawEvolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionUrl = rawEvolutionUrl.includes('PLACEHOLDER') || !rawEvolutionUrl.startsWith('http') 
      ? '' 
      : rawEvolutionUrl.replace(/\/$/, '');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';
    
    console.log('Evolution config:', { 
      hasValidUrl: !!evolutionUrl, 
      hasKey: !!evolutionKey,
      rawUrlPrefix: rawEvolutionUrl.substring(0, 30)
    });

    // === CHECK STATUS FOR USER (sync status from Evolution API) ===
    if (action === 'checkUserStatus') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!instance) {
        return new Response(
          JSON.stringify({ success: true, status: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check actual status in Evolution API
      try {
        const statusResponse = await fetch(`${evolutionUrl}/instance/connectionState/${instance.instance_name}`, {
          method: 'GET',
          headers: { 'apikey': evolutionKey },
        });
        const statusResult = await statusResponse.json();
        console.log('Check user status result:', statusResult);

        const statusMap: Record<string, string> = {
          open: 'connected',
          close: 'disconnected',
          connecting: 'qr_code',
        };

        const actualStatus = statusMap[statusResult.instance?.state] || instance.status;

        // Update DB if status changed
        if (actualStatus !== instance.status) {
          await supabase
            .from('whatsapp_instances')
            .update({ status: actualStatus })
            .eq('id', instance.id);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            instanceId: instance.id,
            status: actualStatus,
            phoneNumber: instance.phone_number
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        console.error('Error checking status:', err);
        return new Response(
          JSON.stringify({ success: true, instanceId: instance.id, status: instance.status }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // === CREATE FOR USER (new action) ===
    if (action === 'createForUser') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user already has an instance
      const { data: existingInstance } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingInstance) {
        // First check actual status from Evolution API
        try {
          const statusResponse = await fetch(`${evolutionUrl}/instance/connectionState/${existingInstance.instance_name}`, {
            method: 'GET',
            headers: { 'apikey': evolutionKey },
          });
          const statusResult = await statusResponse.json();
          console.log('Existing instance status:', statusResult);

          // If connected in Evolution, update our DB
          if (statusResult.instance?.state === 'open') {
            await supabase
              .from('whatsapp_instances')
              .update({ status: 'connected' })
              .eq('id', existingInstance.id);

            return new Response(
              JSON.stringify({ 
                success: true, 
                instanceId: existingInstance.id,
                status: 'connected',
                message: 'Instance already connected'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (err) {
          console.log('Error checking existing instance status:', err);
        }

        // If instance exists but disconnected, try to reconnect
        if (existingInstance.status !== 'connected') {
          // Get QR Code
          const connectResponse = await fetch(`${evolutionUrl}/instance/connect/${existingInstance.instance_name}`, {
            method: 'GET',
            headers: { 'apikey': evolutionKey },
          });
          const connectResult = await connectResponse.json();
          console.log('Reconnect result:', connectResult);

          if (connectResult.base64) {
            await supabase
              .from('whatsapp_instances')
              .update({
                qr_code: connectResult.base64,
                status: 'qr_code',
                qr_code_expires_at: new Date(Date.now() + 60000).toISOString(),
              })
              .eq('id', existingInstance.id);
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              instanceId: existingInstance.id,
              qrCode: connectResult.base64,
              status: 'qr_code'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            instanceId: existingInstance.id,
            status: existingInstance.status,
            message: 'Instance already exists'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const instanceName = `vendedor-${slugify(profile.full_name || 'user')}-${Date.now().toString(36)}`;
      console.log('Creating instance:', instanceName);

      // Create instance in Evolution API
      const createResponse = await fetch(`${evolutionUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey,
        },
        body: JSON.stringify({
          instanceName: instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      });
      const createResult = await createResponse.json();
      console.log('Create instance result:', createResult);

      // Handle already exists case
      if (createResult.error && !createResult.error.includes('already')) {
        return new Response(
          JSON.stringify({ error: createResult.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Save to database
      const { data: newInstance, error: insertError } = await supabase
        .from('whatsapp_instances')
        .insert({
          name: profile.full_name || 'WhatsApp',
          instance_name: instanceName,
          api_url: evolutionUrl,
          api_key: evolutionKey,
          user_id: userId,
          status: 'qr_code',
          is_default: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Configure webhook
      const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-webhook`;
      await fetch(`${evolutionUrl}/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey,
        },
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: webhookUrl,
            webhookByEvents: false,
            webhookBase64: true,
            events: [
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
              'CONNECTION_UPDATE',
              'QRCODE_UPDATED',
            ],
          },
        }),
      });

      // Get QR Code
      const connectResponse = await fetch(`${evolutionUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': evolutionKey },
      });
      const connectResult = await connectResponse.json();
      console.log('Connect result:', connectResult);

      if (connectResult.base64) {
        await supabase
          .from('whatsapp_instances')
          .update({
            qr_code: connectResult.base64,
            qr_code_expires_at: new Date(Date.now() + 60000).toISOString(),
          })
          .eq('id', newInstance.id);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          instanceId: newInstance.id,
          qrCode: connectResult.base64,
          status: 'qr_code'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === REFRESH QR CODE ===
    if (action === 'refreshQR') {
      if (!instanceId) {
        return new Response(
          JSON.stringify({ error: 'instanceId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', instanceId)
        .single();

      if (!instance) {
        return new Response(
          JSON.stringify({ error: 'Instance not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const connectResponse = await fetch(`${evolutionUrl}/instance/connect/${instance.instance_name}`, {
        method: 'GET',
        headers: { 'apikey': evolutionKey },
      });
      const connectResult = await connectResponse.json();
      console.log('Refresh QR result:', connectResult);

      if (connectResult.base64) {
        await supabase
          .from('whatsapp_instances')
          .update({
            qr_code: connectResult.base64,
            status: 'qr_code',
            qr_code_expires_at: new Date(Date.now() + 60000).toISOString(),
          })
          .eq('id', instanceId);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          qrCode: connectResult.base64 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === EXISTING ACTIONS (require instanceId) ===
    if (!instanceId) {
      return new Response(
        JSON.stringify({ error: 'instanceId is required for this action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get instance from database
    console.log('Fetching instance from DB with ID:', instanceId);
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    console.log('Instance query result:', { instance, error: instanceError });

    if (instanceError || !instance) {
      console.error('Instance not found error:', instanceError);
      return new Response(
        JSON.stringify({ error: 'Instance not found', details: instanceError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use instance values, but prefer env secrets if they are valid (not placeholders)
    const baseUrl = (instance.api_url || evolutionUrl || '').replace(/\/$/, '');
    // Prioritize evolutionKey from env if it's valid (env secret was updated)
    const apiKey = evolutionKey || instance.api_key || '';
    const instanceName = instance.instance_name;
    
    console.log('Using Evolution config:', { 
      baseUrl: baseUrl.substring(0, 50), 
      hasApiKey: !!apiKey,
      apiKeySource: evolutionKey ? 'env_secret' : 'database'
    });

    let result;

    switch (action) {
      case 'create': {
        // Create instance in Evolution API
        const createResponse = await fetch(`${baseUrl}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
          },
          body: JSON.stringify({
            instanceName: instanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          }),
        });
        result = await createResponse.json();
        console.log('Create instance result:', result);

        // If already exists (403 Forbidden or error message), try to connect instead
        const alreadyExists = createResponse.status === 403 || 
          (result.error && typeof result.error === 'string' && result.error.includes('already')) ||
          (result.response?.message && Array.isArray(result.response.message) && 
           result.response.message.some((m: string) => m.includes('already in use')));

        if (alreadyExists) {
          console.log('Instance already exists in Evolution API, attempting to connect...');
          // Instance exists, get QR code
          const connectResponse = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
            method: 'GET',
            headers: { 'apikey': apiKey },
          });
          result = await connectResponse.json();
          console.log('Connect to existing instance result:', result);

          if (result.base64) {
            await supabase
              .from('whatsapp_instances')
              .update({
                qr_code: result.base64,
                status: 'qr_code',
                qr_code_expires_at: new Date(Date.now() + 60000).toISOString(),
              })
              .eq('id', instanceId);
          }
        } else if (result.error) {
          throw new Error(result.error);
        }
        break;
      }

      case 'connect': {
        // Get QR Code from Evolution API
        const connectResponse = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
          },
        });
        result = await connectResponse.json();
        console.log('Connect result:', result);

        // Save QR code if returned
        if (result.base64) {
          await supabase
            .from('whatsapp_instances')
            .update({
              qr_code: result.base64,
              status: 'qr_code',
              qr_code_expires_at: new Date(Date.now() + 60000).toISOString(),
            })
            .eq('id', instanceId);
        }
        break;
      }

      case 'status': {
        // Check connection status
        const statusResponse = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
          },
        });
        result = await statusResponse.json();
        console.log('Status result:', result);

        // Map Evolution API status to our status
        const statusMap: Record<string, string> = {
          open: 'connected',
          close: 'disconnected',
          connecting: 'connecting',
        };

        const newStatus = statusMap[result.instance?.state] || 'disconnected';
        
        await supabase
          .from('whatsapp_instances')
          .update({ status: newStatus })
          .eq('id', instanceId);

        result.mappedStatus = newStatus;
        break;
      }

      case 'logout': {
        // Disconnect from WhatsApp
        const logoutResponse = await fetch(`${baseUrl}/instance/logout/${instanceName}`, {
          method: 'DELETE',
          headers: {
            'apikey': apiKey,
          },
        });
        result = await logoutResponse.json();
        console.log('Logout result:', result);

        await supabase
          .from('whatsapp_instances')
          .update({ 
            status: 'disconnected',
            qr_code: null,
            phone_number: null,
          })
          .eq('id', instanceId);
        break;
      }

      case 'restart': {
        // Restart instance
        const restartResponse = await fetch(`${baseUrl}/instance/restart/${instanceName}`, {
          method: 'PUT',
          headers: {
            'apikey': apiKey,
          },
        });
        result = await restartResponse.json();
        console.log('Restart result:', result);
        break;
      }

      case 'fetchInstances': {
        // Fetch all instances from Evolution API
        const fetchResponse = await fetch(`${baseUrl}/instance/fetchInstances`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
          },
        });
        result = await fetchResponse.json();
        console.log('Fetch instances result:', result);
        break;
      }

      case 'setWebhook': {
        // Configure webhook URL in Evolution API
        const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-webhook`;
        
        const webhookResponse = await fetch(`${baseUrl}/webhook/set/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
          },
          body: JSON.stringify({
            webhook: {
              enabled: true,
              url: webhookUrl,
              webhookByEvents: false,
              webhookBase64: true,
              events: [
                'MESSAGES_UPSERT',
                'MESSAGES_UPDATE',
                'CONNECTION_UPDATE',
                'QRCODE_UPDATED',
              ],
            },
          }),
        });
        result = await webhookResponse.json();
        console.log('Set webhook result:', result);

        await supabase
          .from('whatsapp_instances')
          .update({ webhook_url: webhookUrl })
          .eq('id', instanceId);
        break;
      }

      case 'delete': {
        // Delete instance from Evolution API and then from database
        console.log('Deleting instance from Evolution API:', instanceName);
        
        try {
          // First try to delete from Evolution API
          const deleteResponse = await fetch(`${baseUrl}/instance/delete/${instanceName}`, {
            method: 'DELETE',
            headers: { 'apikey': apiKey },
          });
          
          const deleteResult = await deleteResponse.json();
          console.log('Evolution delete result:', deleteResult);
          
          // Even if Evolution API fails, we still delete from our database
          if (!deleteResponse.ok) {
            console.warn('Evolution API delete failed, but continuing with database deletion:', deleteResult);
          }
        } catch (evolutionError) {
          // Log error but continue - we still want to delete from our database
          console.error('Error deleting from Evolution API:', evolutionError);
        }
        
        // Delete from database
        const { error: dbError } = await supabase
          .from('whatsapp_instances')
          .delete()
          .eq('id', instanceId);
        
        if (dbError) {
          console.error('Database delete error:', dbError);
          throw new Error(`Failed to delete from database: ${dbError.message}`);
        }
        
        result = { deleted: true, instanceName };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Instance action error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
