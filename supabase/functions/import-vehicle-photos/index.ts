import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MercadoLibrePicture {
  id: string
  url: string
  secure_url: string
  size: string
  max_size: string
  quality: string
}

interface MercadoLibreItem {
  id: string
  title: string
  pictures: MercadoLibrePicture[]
}

async function fetchMercadoLibrePhotos(mlId: string): Promise<string[]> {
  console.log(`Fetching photos for ML ID: ${mlId}`)
  
  try {
    const response = await fetch(`https://api.mercadolibre.com/items/${mlId}`, {
      headers: {
        'Accept': 'application/json',
      }
    })
    
    if (!response.ok) {
      console.error(`ML API error for ${mlId}: ${response.status} ${response.statusText}`)
      return []
    }
    
    const item: MercadoLibreItem = await response.json()
    
    if (!item.pictures || item.pictures.length === 0) {
      console.log(`No pictures found for ${mlId}`)
      return []
    }
    
    // Get the secure URLs in best quality
    const urls = item.pictures.map(pic => {
      // Replace -O with -F for full size images
      let url = pic.secure_url || pic.url
      url = url.replace('-O.jpg', '-F.jpg')
      return url
    })
    
    console.log(`Found ${urls.length} photos for ${mlId}`)
    return urls
  } catch (error) {
    console.error(`Error fetching ML photos for ${mlId}:`, error)
    return []
  }
}

async function downloadAndUploadImage(
  supabase: any,
  imageUrl: string,
  vehicleId: string,
  index: number
): Promise<string | null> {
  try {
    console.log(`Downloading image ${index + 1} from: ${imageUrl}`)
    
    const response = await fetch(imageUrl)
    if (!response.ok) {
      console.error(`Failed to download image: ${response.status}`)
      return null
    }
    
    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    const fileName = `${vehicleId}/${index + 1}.jpg`
    
    console.log(`Uploading to storage: ${fileName}`)
    
    const { data, error } = await supabase.storage
      .from('vehicle-images')
      .upload(fileName, uint8Array, {
        contentType: 'image/jpeg',
        upsert: true
      })
    
    if (error) {
      console.error(`Storage upload error:`, error)
      return null
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('vehicle-images')
      .getPublicUrl(fileName)
    
    console.log(`Uploaded: ${urlData.publicUrl}`)
    return urlData.publicUrl
  } catch (error) {
    console.error(`Error downloading/uploading image:`, error)
    return null
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { vehicleId, limit = 10 } = await req.json()
    
    // If vehicleId is provided, process single vehicle
    if (vehicleId) {
      const { data: vehicle, error: fetchError } = await supabase
        .from('vehicles')
        .select('id, mercadolibre_id, brand, model')
        .eq('id', vehicleId)
        .single()
      
      if (fetchError || !vehicle) {
        return new Response(
          JSON.stringify({ error: 'Veículo não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (!vehicle.mercadolibre_id) {
        return new Response(
          JSON.stringify({ error: 'Veículo não tem MercadoLibreId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const photoUrls = await fetchMercadoLibrePhotos(vehicle.mercadolibre_id)
      
      if (photoUrls.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Nenhuma foto encontrada no Mercado Livre',
            vehicle: `${vehicle.brand} ${vehicle.model}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Download and upload each photo
      const uploadedUrls: string[] = []
      for (let i = 0; i < photoUrls.length; i++) {
        const url = await downloadAndUploadImage(supabase, photoUrls[i], vehicle.id, i)
        if (url) {
          uploadedUrls.push(url)
        }
      }
      
      // Update vehicle with image URLs
      if (uploadedUrls.length > 0) {
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({ images: uploadedUrls })
          .eq('id', vehicle.id)
        
        if (updateError) {
          console.error(`Error updating vehicle images:`, updateError)
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          vehicle: `${vehicle.brand} ${vehicle.model}`,
          photosFound: photoUrls.length,
          photosUploaded: uploadedUrls.length,
          urls: uploadedUrls
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Process multiple vehicles with ML IDs that don't have images yet
    const { data: vehicles, error: fetchError } = await supabase
      .from('vehicles')
      .select('id, mercadolibre_id, brand, model, images')
      .not('mercadolibre_id', 'is', null)
      .or('images.is.null,images.eq.{}')
      .limit(limit)
    
    if (fetchError) {
      console.error('Error fetching vehicles:', fetchError)
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`Processing ${vehicles?.length || 0} vehicles for photo import`)
    
    const results: any[] = []
    
    for (const vehicle of vehicles || []) {
      if (!vehicle.mercadolibre_id) continue
      
      console.log(`Processing: ${vehicle.brand} ${vehicle.model} (${vehicle.mercadolibre_id})`)
      
      const photoUrls = await fetchMercadoLibrePhotos(vehicle.mercadolibre_id)
      
      if (photoUrls.length === 0) {
        results.push({
          vehicle: `${vehicle.brand} ${vehicle.model}`,
          status: 'no_photos',
          message: 'Nenhuma foto encontrada'
        })
        continue
      }
      
      // Download and upload each photo
      const uploadedUrls: string[] = []
      for (let i = 0; i < Math.min(photoUrls.length, 10); i++) { // Limit to 10 photos per vehicle
        const url = await downloadAndUploadImage(supabase, photoUrls[i], vehicle.id, i)
        if (url) {
          uploadedUrls.push(url)
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      // Update vehicle with image URLs
      if (uploadedUrls.length > 0) {
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({ images: uploadedUrls })
          .eq('id', vehicle.id)
        
        if (updateError) {
          console.error(`Error updating vehicle images:`, updateError)
          results.push({
            vehicle: `${vehicle.brand} ${vehicle.model}`,
            status: 'error',
            message: updateError.message
          })
        } else {
          results.push({
            vehicle: `${vehicle.brand} ${vehicle.model}`,
            status: 'success',
            photosUploaded: uploadedUrls.length
          })
        }
      }
      
      // Delay between vehicles to avoid ML API rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    const successful = results.filter(r => r.status === 'success').length
    const failed = results.filter(r => r.status === 'error').length
    const noPhotos = results.filter(r => r.status === 'no_photos').length
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        successful,
        failed,
        noPhotos,
        results,
        message: `Processados ${results.length} veículos: ${successful} com sucesso, ${noPhotos} sem fotos, ${failed} com erro`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in import-vehicle-photos function:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
