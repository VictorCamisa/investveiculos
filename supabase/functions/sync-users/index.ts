import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SyncResult = {
  processed: number;
  upserted: number;
  errors: Array<{ userId: string; message: string }>;
};

async function listAllUsers(supabaseAdmin: any) {
  const users: Array<{ id: string; email: string | null; user_metadata?: Record<string, unknown> }> = [];

  let page = 1;
  const perPage = 1000;

  // Paginação para contas maiores
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const batch = (data?.users ?? []).map((u: any) => ({
      id: u.id,
      email: u.email ?? null,
      user_metadata: (u.user_metadata ?? {}) as Record<string, unknown>,
    }));

    users.push(...batch);

    if (batch.length < perPage) break;
    page += 1;
  }

  return users;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use custom secrets to bypass reserved remix secrets
    const supabaseUrl = Deno.env.get("MY_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("MY_SUPABASE_SERVICE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const { data: { user: requestingUser } } = await supabaseAdmin.auth.getUser(token);

    if (!requestingUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verifica se é gerente OU is_master
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "gerente")
      .maybeSingle();

    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("is_master")
      .eq("id", requestingUser.id)
      .single();

    const isAuthorized = roleData || profileData?.is_master === true;

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Apenas Administradores podem sincronizar usuários" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const users = await listAllUsers(supabaseAdmin);

    const result: SyncResult = {
      processed: users.length,
      upserted: 0,
      errors: [],
    };

    const now = new Date().toISOString();

    // Upsert em lote para reduzir chamadas
    // Nota: em contas muito grandes, pode ser necessário chunking.
    const rows = users.map((u) => {
      const fullName = (u.user_metadata?.full_name as string | undefined) ?? null;
      return {
        id: u.id,
        email: u.email,
        full_name: fullName,
        is_active: true,
        updated_at: now,
      };
    });

    const { error: upsertError } = await supabaseAdmin
      .from("profiles")
      .upsert(rows, { onConflict: "id" });

    if (upsertError) {
      console.error("sync-users upsert error:", upsertError);
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    result.upserted = rows.length;

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("sync-users error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
