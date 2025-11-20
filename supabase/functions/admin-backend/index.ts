import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized - No auth token",
        } as ApiResponse),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized - Invalid token",
        } as ApiResponse),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("id, role_id, admin_roles(role_name, level, permissions)")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (adminError || !adminData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Forbidden - Not an admin",
        } as ApiResponse),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.replace("/admin-backend/", "");
    const method = req.method;

    let response: ApiResponse;

    // ==================== DASHBOARD ====================
    if (path === "stats" && method === "GET") {
      // Get comprehensive stats
      const { count: usersCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      const { count: newUsers24h } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { count: txCount } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true });

      const { data: elkData } = await supabase
        .from("wallets")
        .select("balance")
        .eq("token_symbol", "عLK3");

      const totalElk = elkData?.reduce((sum, w) => sum + w.balance, 0) || 0;

      response = {
        success: true,
        data: {
          total_users: usersCount || 0,
          new_users_24h: newUsers24h || 0,
          total_transactions: txCount || 0,
          total_elk3_balance: totalElk,
          admin_info: {
            role: (adminData.admin_roles as any).role_name,
            level: (adminData.admin_roles as any).level,
          },
        },
      };
    }

    // ==================== USERS MANAGEMENT ====================
    else if (path.startsWith("users")) {
      const parts = path.split("/");

      if (method === "GET" && parts.length === 1) {
        // List all users
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");

        const { data, error, count } = await supabase
          .from("users")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        response = {
          success: !error,
          data: {
            users: data || [],
            total: count || 0,
            limit,
            offset,
          },
          error: error?.message,
        };
      } else if (method === "GET" && parts.length === 2) {
        // Get single user
        const userId = parts[1];
        const { data, error } = await supabase
          .from("users")
          .select("*, wallets(*), transactions(count)")
          .eq("id", userId)
          .single();

        response = {
          success: !error,
          data,
          error: error?.message,
        };
      } else if (method === "PUT" && parts.length === 2) {
        // Update user
        const userId = parts[1];
        const body = await req.json();

        const { data, error } = await supabase
          .from("users")
          .update(body)
          .eq("id", userId)
          .select()
          .single();

        // Log action
        await supabase.from("admin_audit_logs").insert({
          admin_user_id: adminData.id,
          action: "update_user",
          module: "users",
          entity_type: "user",
          entity_id: userId,
          new_values: body,
        });

        response = {
          success: !error,
          data,
          error: error?.message,
          message: "User updated successfully",
        };
      } else if (method === "DELETE" && parts.length === 2) {
        // Suspend user
        const userId = parts[1];

        const { data, error } = await supabase
          .from("users")
          .update({ kyc_status: "suspended" })
          .eq("id", userId)
          .select()
          .single();

        await supabase.from("admin_audit_logs").insert({
          admin_user_id: adminData.id,
          action: "suspend_user",
          module: "users",
          entity_type: "user",
          entity_id: userId,
        });

        response = {
          success: !error,
          data,
          error: error?.message,
          message: "User suspended",
        };
      } else {
        response = { success: false, error: "Invalid users endpoint" };
      }
    }

    // ==================== TRANSACTIONS MANAGEMENT ====================
    else if (path.startsWith("transactions")) {
      const parts = path.split("/");

      if (method === "GET" && parts.length === 1) {
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const status = url.searchParams.get("status");

        let query = supabase
          .from("transactions")
          .select("*, users(full_name, email)", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) {
          query = query.eq("status", status);
        }

        const { data, error, count } = await query;

        response = {
          success: !error,
          data: {
            transactions: data || [],
            total: count || 0,
          },
          error: error?.message,
        };
      } else if (method === "PUT" && parts.length === 2) {
        // Update transaction status
        const txId = parts[1];
        const body = await req.json();

        const { data, error } = await supabase
          .from("transactions")
          .update({ status: body.status })
          .eq("id", txId)
          .select()
          .single();

        await supabase.from("admin_audit_logs").insert({
          admin_user_id: adminData.id,
          action: "update_transaction",
          module: "transactions",
          entity_type: "transaction",
          entity_id: txId,
          new_values: body,
        });

        response = {
          success: !error,
          data,
          error: error?.message,
          message: "Transaction updated",
        };
      } else {
        response = { success: false, error: "Invalid transactions endpoint" };
      }
    }

    // ==================== SETTINGS ====================
    else if (path.startsWith("settings")) {
      if (method === "GET") {
        const { data, error } = await supabase
          .from("admin_settings")
          .select("*")
          .order("category");

        response = {
          success: !error,
          data,
          error: error?.message,
        };
      } else if (method === "PUT") {
        const body = await req.json();
        const { setting_key, setting_value } = body;

        const { data, error } = await supabase
          .from("admin_settings")
          .update({ setting_value, updated_at: new Date().toISOString() })
          .eq("setting_key", setting_key)
          .select()
          .single();

        await supabase.from("admin_audit_logs").insert({
          admin_user_id: adminData.id,
          action: "update_setting",
          module: "settings",
          entity_type: "setting",
          new_values: body,
        });

        response = {
          success: !error,
          data,
          error: error?.message,
          message: "Setting updated",
        };
      } else {
        response = { success: false, error: "Invalid settings endpoint" };
      }
    }

    // ==================== AUDIT LOGS ====================
    else if (path === "audit-logs" && method === "GET") {
      const limit = parseInt(url.searchParams.get("limit") || "100");
      const offset = parseInt(url.searchParams.get("offset") || "0");

      const { data, error, count } = await supabase
        .from("admin_audit_logs")
        .select("*, admin_users(user_id, users(full_name))", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      response = {
        success: !error,
        data: {
          logs: data || [],
          total: count || 0,
        },
        error: error?.message,
      };
    }

    // ==================== HEALTH CHECK ====================
    else if (path === "health" && method === "GET") {
      response = {
        success: true,
        data: {
          status: "healthy",
          timestamp: new Date().toISOString(),
          admin: true,
        },
      };
    }

    // ==================== NOT FOUND ====================
    else {
      response = {
        success: false,
        error: "Endpoint not found: " + path,
      };
    }

    return new Response(JSON.stringify(response), {
      status: response.success ? 200 : 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Admin Backend Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
      } as ApiResponse),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
