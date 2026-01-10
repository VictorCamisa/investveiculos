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

// Helper function to make Autocerto API requests
async function autocertoFetch(url: string, authHeader: string): Promise<Response> {
  console.log('Making request to:', url);
  console.log('Auth header preview:', authHeader.substring(0, 20) + '...');
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Accept': 'application/json',
      'User-Agent': 'AutocertoClient/1.0',
      'Cache-Control': 'no-cache',
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
    const { action } = await req.json();

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

    console.log('Attempting auth with username:', username);
    console.log('Base URL (normalized):', baseUrl);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Encode credentials for Basic Auth
    const credentials = `${username}:${password}`;
    const authHeader = btoa(credentials);
    
    console.log('Auth credentials length:', credentials.length);

    // Test connection by fetching stock
    console.log('Fetching stock from Autocerto...');
    const stockResponse = await autocertoFetch(`${baseUrl}/api/Veiculo/ObterEstoque`, authHeader);

    console.log('Autocerto response status:', stockResponse.status);
    
    if (!stockResponse.ok) {
      const errorText = await stockResponse.text();
      console.error('Failed to connect to Autocerto:', stockResponse.status, errorText);
      
      if (stockResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Credenciais inválidas. Verifique os secrets AUTOCERTO_LOGIN e AUTOCERTO_PASSWORD.' }),
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

    for (const vehicle of vehicles) {
      try {
        // Map Autocerto status to our status
        let status = 'disponivel';
        if (vehicle.Status === 'Vendido') status = 'vendido';
        else if (vehicle.Status === 'Reservado') status = 'reservado';

        // Map transmission
        let transmission = vehicle.Cambio?.Descricao?.toLowerCase() || null;
        if (transmission?.includes('manual')) transmission = 'manual';
        else if (transmission?.includes('auto')) transmission = 'automatico';

        // Check if vehicle exists by plate
        const { data: existingVehicle } = await supabase
          .from('vehicles')
          .select('id')
          .eq('plate', vehicle.Placa)
          .maybeSingle();

        const vehicleData = {
          brand: vehicle.Marca?.Descricao || 'Desconhecida',
          model: vehicle.Modelo?.Descricao || 'Desconhecido',
          version: vehicle.Versao?.Descricao || null,
          year_fabrication: vehicle.AnoFabricacao,
          year_model: vehicle.AnoModelo,
          plate: vehicle.Placa,
          chassis: vehicle.Chassi,
          renavam: vehicle.Renavam,
          km: vehicle.Km,
          mileage: vehicle.Km,
          price_sale: vehicle.Preco,
          color: vehicle.Cor?.Descricao || null,
          fuel_type: vehicle.Combustivel?.Descricao?.toLowerCase() || null,
          transmission: transmission,
          doors: vehicle.Portas || null,
          description: vehicle.Observacao || null,
          status: status,
          updated_at: new Date().toISOString(),
        };

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
          authHeader
        );

        if (photosResponse.ok) {
          const photos: AutocertoPhoto[] = await photosResponse.json();
          console.log(`Found ${photos.length} photos for vehicle ${vehicle.Codigo}`);

          // Delete existing photos for this vehicle first
          await supabase
            .from('vehicle_images')
            .delete()
            .eq('vehicle_id', vehicleId);

          // Insert new photos
          for (const photo of photos) {
            const { error: photoError } = await supabase
              .from('vehicle_images')
              .insert({
                vehicle_id: vehicleId,
                url: photo.Url,
                image_url: photo.Url,
                is_main: photo.Principal,
                is_cover: photo.Principal,
                display_order: photo.Ordem,
                order_index: photo.Ordem,
              });

            if (photoError) {
              console.error('Error inserting photo:', photoError);
            }
          }

          // Also update the images array on the vehicle
          const imageUrls = photos.map(p => p.Url);
          await supabase
            .from('vehicles')
            .update({ images: imageUrls })
            .eq('id', vehicleId);
        } else {
          console.error('Failed to fetch photos:', photosResponse.status);
        }
      } catch (vehicleError) {
        console.error('Error processing vehicle:', vehicleError);
        errors++;
      }
    }

    console.log(`Import complete: ${imported} imported, ${updated} updated, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronização concluída!`,
        stats: {
          total: vehicles.length,
          imported,
          updated,
          errors,
        },
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
