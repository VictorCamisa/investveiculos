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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password, action } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Credenciais são obrigatórias' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = btoa(`${username}:${password}`);
    const baseUrl = 'https://integracao.autocerto.com';

    // Test connection first
    console.log('Testing Autocerto connection...');
    const testResponse = await fetch(`${baseUrl}/api/Health/Check`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    });

    if (!testResponse.ok) {
      console.error('Failed to connect to Autocerto:', testResponse.status, await testResponse.text());
      return new Response(
        JSON.stringify({ error: 'Falha na autenticação com Autocerto. Verifique suas credenciais.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Autocerto connection successful!');

    if (action === 'test') {
      return new Response(
        JSON.stringify({ success: true, message: 'Conexão com Autocerto estabelecida com sucesso!' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get complete stock
    console.log('Fetching stock from Autocerto...');
    const stockResponse = await fetch(`${baseUrl}/api/Veiculo/ObterEstoque`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    });

    if (!stockResponse.ok) {
      const errorText = await stockResponse.text();
      console.error('Failed to fetch stock:', stockResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Falha ao obter estoque: ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vehicles: AutocertoVehicle[] = await stockResponse.json();
    console.log(`Found ${vehicles.length} vehicles in Autocerto`);

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
        const photosResponse = await fetch(`${baseUrl}/api/Veiculo/ObterFotos?codigoVeiculo=${vehicle.Codigo}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/json',
          },
        });

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
