import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    console.log("[create-user] Starting...");
    console.log("[create-user] URL:", supabaseUrl);
    console.log("[create-user] Service role key exists:", !!serviceRoleKey);

    // Create admin client with service role key - this bypasses RLS
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      },
    });

    // Get the requesting user's auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[create-user] No authorization header");
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate the JWT using admin client's getUser
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !requestingUser) {
      console.error("[create-user] JWT validation error:", userError);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[create-user] Requesting user:", requestingUser.id, requestingUser.email);

    // Check if requesting user is a gerente (admin) using security definer function
    const { data: isGerente, error: roleCheckError } = await supabaseAdmin
      .rpc('check_user_role', { 
        check_user_id: requestingUser.id, 
        check_role: 'gerente' 
      });

    console.log("[create-user] Role check via RPC:", { isGerente, roleCheckError });

    if (roleCheckError) {
      console.error("[create-user] Role check error:", roleCheckError);
      return new Response(JSON.stringify({ error: "Erro ao verificar permissões" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isGerente) {
      return new Response(JSON.stringify({ error: "Apenas gerentes podem criar usuários" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get request body
    const { email, password, full_name, role } = await req.json();

    console.log("[create-user] Creating user:", { email, full_name, role });

    if (!email || !password || !full_name || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      console.error("[create-user] Error creating user:", createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[create-user] User created:", newUser.user.id);

    // Ensure profile exists
    const now = new Date().toISOString();
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: newUser.user.id,
          email: newUser.user.email,
          full_name,
          is_active: true,
          updated_at: now,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("[create-user] Error creating profile:", profileError);
    }

    // Assign the role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUser.user.id, role });

    if (roleError) {
      console.error("[create-user] Error assigning role:", roleError);
    }

    console.log("[create-user] Success!");

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: newUser.user.id, 
          email: newUser.user.email,
          full_name 
        } 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("[create-user] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
