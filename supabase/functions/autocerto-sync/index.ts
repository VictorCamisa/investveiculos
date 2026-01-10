import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutocertoVehicle {
  Codigo: number;
  Placa: string;
  Chassi: string;
  Renavam: string;
  AnoFabricacao: number;
  AnoModelo: number;
  Km: number;
  Preco: number;
  PrecoPromocional: number | null;
  Observacao: string;
  DataCadastro: string;
  DataAlteracao: string;
  Status: string;
  Marca: { Codigo: number; Descricao: string };
  Modelo: { Codigo: number; Descricao: string };
  Versao: { Codigo: number; Descricao: string } | null;
  Combustivel: { Codigo: number; Descricao: string };
  Cor: { Codigo: number; Descricao: string };
  Cambio: { Codigo: number; Descricao: string };
  TipoVeiculo: { Codigo: number; Descricao: string };
  Portas: number;
  Final_Placa: string;
}

interface AutocertoPhoto {
  Codigo: number;
  Url: string;
  Principal: boolean;
  Ordem: number;
}

// Common headers to bypass CDN blocking
const browserHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

// Helper function to get OAuth2 access token
async function getOAuthToken(baseUrl: string, username: string, password: string): Promise<string> {
  const tokenUrl = `${baseUrl}/oauth/token`;
  console.log('Requesting OAuth token from:', tokenUrl);
  console.log('Username:', username);
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      ...browserHeaders,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: username,
      password: password,
    }),
  });
  
  console.log('OAuth response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('OAuth token request failed:', response.status, errorText);
    throw new Error(`OAuth authentication failed: ${errorText}`);
  }
  
  const data = await response.json();
  console.log('OAuth token obtained successfully');
  return data.access_token;
}

// Helper function to make authenticated requests to Autocerto API
async function autocertoFetch(url: string, accessToken: string): Promise<Response> {
  console.log('Making request to:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...browserHeaders,
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  console.log('Response status:', response.status);
  
  return response;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestUrl = new URL(req.url);
    const body = await req.json();
    const { action } = body;

    // Get credentials from environment variables
    // Remove trailing slashes from base URL to avoid double slashes in API paths
    const rawBaseUrl = Deno.env.get('AUTOCERTO_BASE_URL') || 'https://integracao.autocerto.com';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');
    const username = Deno.env.get('AUTOCERTO_LOGIN');
    const password = Deno.env.get('AUTOCERTO_PASSWORD');

    if (!username || !password) {
      console.error('Missing AUTOCERTO_LOGIN or AUTOCERTO_PASSWORD environment variables');
      return new Response(
        JSON.stringify({ error: 'Credenciais do Autocerto não configuradas. Configure os secrets AUTOCERTO_LOGIN e AUTOCERTO_PASSWORD.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Attempting OAuth auth with username:', username);
    console.log('Base URL (normalized):', baseUrl);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service key present:', !!supabaseServiceKey);
    
    // Create client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get OAuth2 access token
    let accessToken: string;
    try {
      accessToken = await getOAuthToken(baseUrl, username, password);
    } catch (oauthError) {
      console.error('OAuth authentication failed:', oauthError);
      return new Response(
        JSON.stringify({ error: 'Credenciais inválidas. Verifique os secrets AUTOCERTO_LOGIN e AUTOCERTO_PASSWORD.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch stock using the access token
    console.log('Fetching stock from Autocerto...');
    const stockResponse = await autocertoFetch(`${baseUrl}/api/Veiculo/ObterEstoque`, accessToken);

    console.log('Autocerto response status:', stockResponse.status);
    
    if (!stockResponse.ok) {
      const errorText = await stockResponse.text();
      console.error('Failed to fetch stock from Autocerto:', stockResponse.status, errorText);
      
      if (stockResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Token expirado ou inválido.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (stockResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: 'Acesso negado pelo servidor Autocerto.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Erro ao conectar: ${stockResponse.status}` }),
        { status: stockResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vehicles: AutocertoVehicle[] = await stockResponse.json();
    console.log(`Found ${vehicles.length} vehicles in Autocerto`);

    // If just testing connection, return success
    if (action === 'test') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Conexão estabelecida! ${vehicles.length} veículos encontrados no Autocerto.` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let imported = 0;
    let updated = 0;
    let errors = 0;

    // Process in batches to avoid timeout (max 150 seconds)
    // Each vehicle takes ~3-5 seconds to process with photos
    const BATCH_SIZE = 25; // Process 25 vehicles at a time
    const offset = parseInt(requestUrl.searchParams.get('offset') || body.offset?.toString() || '0');
    const vehiclesToProcess = vehicles.slice(offset, offset + BATCH_SIZE);
    const hasMore = offset + BATCH_SIZE < vehicles.length;
    
    console.log(`Processing batch: offset=${offset}, batch_size=${vehiclesToProcess.length}, total=${vehicles.length}, hasMore=${hasMore}`);

    // Log first vehicle to understand the API structure
    if (vehiclesToProcess.length > 0 && offset === 0) {
      console.log('Sample vehicle from API:', JSON.stringify(vehiclesToProcess[0], null, 2));
    }

    for (const vehicle of vehiclesToProcess) {
      try {
        // Log the raw vehicle data to understand its structure
        console.log(`Processing vehicle: Codigo=${vehicle.Codigo}, Placa=${vehicle.Placa}`);
        console.log(`  Marca: ${JSON.stringify(vehicle.Marca)}`);
        console.log(`  Modelo: ${JSON.stringify(vehicle.Modelo)}`);
        
        // Try multiple possible field names for brand/model
        const rawVehicle = vehicle as any;
        
        // Brand could be: Marca.Descricao, Marca.Nome, marca, MarcaDescricao, etc.
        let brand = vehicle.Marca?.Descricao 
          || rawVehicle.Marca?.Nome 
          || rawVehicle.MarcaDescricao 
          || rawVehicle.marca 
          || rawVehicle.Marca
          || 'Desconhecida';
        
        // Model could be: Modelo.Descricao, Modelo.Nome, modelo, ModeloDescricao, etc.
        let model = vehicle.Modelo?.Descricao 
          || rawVehicle.Modelo?.Nome 
          || rawVehicle.ModeloDescricao 
          || rawVehicle.modelo 
          || rawVehicle.Modelo
          || 'Desconhecido';
        
        // If Marca is a string directly, use it
        if (typeof rawVehicle.Marca === 'string') {
          brand = rawVehicle.Marca;
        }
        if (typeof rawVehicle.Modelo === 'string') {
          model = rawVehicle.Modelo;
        }
        
        console.log(`  Resolved brand: ${brand}, model: ${model}`);

        // Map Autocerto status to our status
        let status = 'disponivel';
        const vehicleStatus = rawVehicle.Status || rawVehicle.status || '';
        if (vehicleStatus.toLowerCase() === 'vendido') status = 'vendido';
        else if (vehicleStatus.toLowerCase() === 'reservado') status = 'reservado';

        // Map transmission - try multiple field names
        const cambioRaw = vehicle.Cambio?.Descricao || rawVehicle.Cambio || rawVehicle.cambio || rawVehicle.Transmissao || '';
        let transmission = typeof cambioRaw === 'string' ? cambioRaw.toLowerCase() : null;
        if (transmission?.includes('manual')) transmission = 'manual';
        else if (transmission?.includes('auto')) transmission = 'automatico';

        // Normalize plate (remove hyphens and spaces for comparison)
        const normalizedPlate = (vehicle.Placa || '').replace(/[-\s]/g, '').toUpperCase();
        
        // Check if vehicle exists by plate (try both original and normalized)
        const { data: existingVehicle } = await supabase
          .from('vehicles')
          .select('id')
          .or(`plate.eq.${vehicle.Placa},plate.ilike.%${normalizedPlate}%`)
          .maybeSingle();
        
        console.log(`  Looking for plate: ${vehicle.Placa} (normalized: ${normalizedPlate}), found: ${existingVehicle?.id || 'none'}`);

        // Try multiple price field names using rawVehicle for dynamic access
        const price = vehicle.Preco || rawVehicle.Preco || rawVehicle.preco || 
                     rawVehicle.Valor || rawVehicle.valor ||
                     rawVehicle.PrecoVenda || rawVehicle.precoVenda || 
                     rawVehicle.ValorVenda || rawVehicle.valorVenda ||
                     null;
        
        console.log(`  Price fields: Preco=${rawVehicle.Preco}, Valor=${rawVehicle.Valor}, PrecoVenda=${rawVehicle.PrecoVenda}, resolved=${price}`);

        const vehicleData = {
          brand: brand,
          model: model,
          version: vehicle.Versao?.Descricao || rawVehicle.Versao || null,
          year_fabrication: vehicle.AnoFabricacao || rawVehicle.anoFabricacao,
          year_model: vehicle.AnoModelo || rawVehicle.anoModelo,
          plate: vehicle.Placa || rawVehicle.placa,
          chassis: vehicle.Chassi || rawVehicle.chassi,
          renavam: vehicle.Renavam || rawVehicle.renavam,
          km: vehicle.Km || rawVehicle.km,
          mileage: vehicle.Km || rawVehicle.km,
          price_sale: price,
          color: vehicle.Cor?.Descricao || rawVehicle.Cor || rawVehicle.cor || null,
          fuel_type: (vehicle.Combustivel?.Descricao || rawVehicle.Combustivel || rawVehicle.combustivel || '').toLowerCase() || null,
          transmission: transmission,
          doors: vehicle.Portas || rawVehicle.portas || null,
          description: vehicle.Observacao || rawVehicle.observacao || null,
          status: status,
          updated_at: new Date().toISOString(),
        };
        
        console.log(`  Final vehicleData: brand=${vehicleData.brand}, model=${vehicleData.model}, plate=${vehicleData.plate}, price=${vehicleData.price_sale}`);

        let vehicleId: string;

        if (existingVehicle) {
          // Update existing vehicle
          const { error: updateError } = await supabase
            .from('vehicles')
            .update(vehicleData)
            .eq('id', existingVehicle.id);

          if (updateError) {
            console.error('Error updating vehicle:', updateError);
            errors++;
            continue;
          }
          vehicleId = existingVehicle.id;
          updated++;
        } else {
          // Insert new vehicle
          const { data: newVehicle, error: insertError } = await supabase
            .from('vehicles')
            .insert({ ...vehicleData, created_at: new Date().toISOString() })
            .select('id')
            .single();

          if (insertError) {
            console.error('Error inserting vehicle:', insertError);
            errors++;
            continue;
          }
          vehicleId = newVehicle.id;
          imported++;
        }

        // Fetch photos for this vehicle
        console.log(`Fetching photos for vehicle ${vehicle.Codigo}...`);
        const photosResponse = await autocertoFetch(
          `${baseUrl}/api/Veiculo/ObterFotos?codigoVeiculo=${vehicle.Codigo}`, 
          accessToken
        );

        if (photosResponse.ok) {
          const photos = await photosResponse.json();
          console.log(`Found ${photos.length} photos for vehicle ${vehicle.Codigo}`);
          
          // Log first photo structure to debug
          if (photos.length > 0) {
            console.log('Sample photo structure:', JSON.stringify(photos[0], null, 2));
          }

          // Delete existing photos for this vehicle first
          await supabase
            .from('vehicle_images')
            .delete()
            .eq('vehicle_id', vehicleId);

          // Insert new photos
          for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            // Try multiple possible URL field names - API uses "URL" (uppercase)
            const photoUrl = photo.URL || photo.Url || photo.url || photo.UrlFoto || photo.urlFoto || 
                           photo.Foto || photo.foto || photo.Link || photo.link || 
                           photo.Caminho || photo.caminho || photo.Path || photo.path;
            
            if (!photoUrl) {
              console.log(`Photo ${i} has no URL. Keys: ${Object.keys(photo).join(', ')}`);
              continue; // Skip photos without valid URL
            }
            
            const isPrincipal = photo.Principal === true || photo.principal === true || i === 0;
            const order = photo.Posicao ?? photo.Ordem ?? photo.ordem ?? photo.Order ?? photo.order ?? i;
            
            const { error: photoError } = await supabase
              .from('vehicle_images')
              .insert({
                vehicle_id: vehicleId,
                url: photoUrl,
                image_url: photoUrl,
                is_main: isPrincipal,
                is_cover: isPrincipal,
                display_order: order,
                order_index: order,
              });

            if (photoError) {
              console.error('Error inserting photo:', photoError);
            } else {
              console.log(`  Photo ${i + 1} saved: ${photoUrl.substring(0, 50)}...`);
            }
          }

          // Also update the images array on the vehicle - API uses "URL" (uppercase)
          const imageUrls = photos.map((p: Record<string, unknown>) => 
            p.URL || p.Url || p.url || p.UrlFoto || p.urlFoto || p.Foto || p.foto || p.Link || p.link
          ).filter((url: unknown) => url != null);
          
          const { error: updateImagesError } = await supabase
            .from('vehicles')
            .update({ images: imageUrls })
            .eq('id', vehicleId);
          
          if (updateImagesError) {
            console.error('Error updating vehicle images array:', updateImagesError);
          } else {
            console.log(`  Updated vehicle ${vehicleId} with ${imageUrls.length} image URLs`);
          }
        } else {
          console.error('Failed to fetch photos:', photosResponse.status);
        }
      } catch (vehicleError) {
        console.error('Error processing vehicle:', vehicleError);
        errors++;
      }
    }

    console.log(`Batch complete: ${imported} imported, ${updated} updated, ${errors} errors. Offset: ${offset}, HasMore: ${hasMore}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: hasMore 
          ? `Lote processado! ${imported + updated} veículos sincronizados. Continue para processar mais.`
          : `Sincronização concluída!`,
        stats: {
          total: vehicles.length,
          processed: offset + vehiclesToProcess.length,
          imported,
          updated,
          errors,
        },
        hasMore,
        nextOffset: hasMore ? offset + BATCH_SIZE : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in autocerto-sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
