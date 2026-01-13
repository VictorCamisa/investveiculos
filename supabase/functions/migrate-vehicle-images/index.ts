import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function downloadAndUploadImage(
  supabase: any,
  imageUrl: string,
  vehicleId: string,
  imageId: string
): Promise<string | null> {
  try {
    console.log(`Downloading image from: ${imageUrl}`)
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*',
        'Referer': 'https://autocerto.com/'
      }
    })
    
    if (!response.ok) {
      console.error(`Failed to download image: ${response.status}`)
      return null
    }
    
    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Get file extension from URL or default to jpg
    const ext = imageUrl.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${vehicleId}/${imageId}.${ext}`
    
    console.log(`Uploading to storage: ${fileName}`)
    
    const { data, error } = await supabase.storage
      .from('vehicle-images')
      .upload(fileName, uint8Array, {
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
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
    
    console.log(`Uploaded successfully: ${urlData.publicUrl}`)
    return urlData.publicUrl
  } catch (error) {
    console.error(`Error downloading/uploading image:`, error)
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { vehicleId, limit = 50 } = await req.json().catch(() => ({}))
    
    // Build query for images that haven't been migrated yet (external URLs)
    let query = supabase
      .from('vehicle_images')
      .select('id, vehicle_id, url')
      .not('url', 'ilike', '%supabase%')
      .limit(limit)
    
    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId)
    }
    
    const { data: images, error: fetchError } = await query
    
    if (fetchError) {
      console.error('Error fetching images:', fetchError)
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`Found ${images?.length || 0} images to migrate`)
    
    const results: any[] = []
    let successCount = 0
    let failCount = 0
    
    for (const image of images || []) {
      console.log(`Processing image ${image.id} for vehicle ${image.vehicle_id}`)
      
      const newUrl = await downloadAndUploadImage(
        supabase,
        image.url,
        image.vehicle_id,
        image.id
      )
      
      if (newUrl) {
        // Update the image URL in the database
        const { error: updateError } = await supabase
          .from('vehicle_images')
          .update({ url: newUrl })
          .eq('id', image.id)
        
        if (updateError) {
          console.error(`Error updating image ${image.id}:`, updateError)
          failCount++
          results.push({ id: image.id, status: 'error', message: updateError.message })
        } else {
          successCount++
          results.push({ id: image.id, status: 'success', newUrl })
        }
      } else {
        failCount++
        results.push({ id: image.id, status: 'error', message: 'Failed to download/upload' })
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        total: images?.length || 0,
        migrated: successCount,
        failed: failCount,
        results,
        message: `Migradas ${successCount} de ${images?.length || 0} imagens`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in migrate-vehicle-images:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})