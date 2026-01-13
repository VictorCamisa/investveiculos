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

async function processBatch(supabase: any, limit: number, vehicleId?: string) {
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
    return { success: 0, failed: 0, total: 0 }
  }
  
  console.log(`Processing batch of ${images?.length || 0} images`)
  
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
      } else {
        successCount++
      }
    } else {
      failCount++
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  console.log(`Batch complete: ${successCount} success, ${failCount} failed`)
  return { success: successCount, failed: failCount, total: images?.length || 0 }
}

async function migrateAllImages(supabase: any, batchSize: number) {
  let totalSuccess = 0
  let totalFailed = 0
  let hasMore = true
  let batchNumber = 0
  
  while (hasMore) {
    batchNumber++
    console.log(`\n=== Starting batch ${batchNumber} ===`)
    
    const result = await processBatch(supabase, batchSize)
    totalSuccess += result.success
    totalFailed += result.failed
    
    // If we processed fewer images than the batch size, we're done
    hasMore = result.total === batchSize
    
    console.log(`Running total: ${totalSuccess} success, ${totalFailed} failed`)
    
    // Small delay between batches
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  console.log(`\n=== Migration complete ===`)
  console.log(`Total migrated: ${totalSuccess}`)
  console.log(`Total failed: ${totalFailed}`)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { vehicleId, limit = 50, migrateAll = false } = await req.json().catch(() => ({}))
    
    // Check how many images are pending
    const { count: pendingCount } = await supabase
      .from('vehicle_images')
      .select('id', { count: 'exact', head: true })
      .not('url', 'ilike', '%supabase%')
    
    const { count: migratedCount } = await supabase
      .from('vehicle_images')
      .select('id', { count: 'exact', head: true })
      .ilike('url', '%supabase%')
    
    if (migrateAll) {
      // Use EdgeRuntime.waitUntil for background processing
      // @ts-ignore - EdgeRuntime is available in Supabase edge functions
      EdgeRuntime.waitUntil(migrateAllImages(supabase, 30))
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Migração iniciada em background para ${pendingCount} imagens`,
          pending: pendingCount,
          migrated: migratedCount,
          status: 'processing'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Single batch mode
    const result = await processBatch(supabase, limit, vehicleId)
    
    return new Response(
      JSON.stringify({
        success: true,
        total: result.total,
        migrated: result.success,
        failed: result.failed,
        pending: (pendingCount || 0) - result.success,
        alreadyMigrated: migratedCount,
        message: `Migradas ${result.success} de ${result.total} imagens`
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
