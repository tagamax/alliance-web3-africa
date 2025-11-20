import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface StakeRequest {
  pool_id: string;
  amount: number;
  duration_days: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { pool_id, amount, duration_days }: StakeRequest = await req.json();

    if (!pool_id || !amount || amount <= 0 || !duration_days) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get pool info
    const { data: pool } = await supabase
      .from("staking_pools")
      .select("*")
      .eq("id", pool_id)
      .eq("is_active", true)
      .single();

    if (!pool) {
      return new Response(
        JSON.stringify({ success: false, error: "Pool not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check minimum stake
    if (amount < pool.min_stake) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Minimum stake is ${pool.min_stake} ${pool.token_symbol}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check balance
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .eq("token_symbol", pool.token_symbol)
      .single();

    if (!wallet || wallet.balance < amount) {
      return new Response(
        JSON.stringify({ success: false, error: "Insufficient balance" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const start_date = new Date();
    const end_date = new Date(start_date.getTime() + duration_days * 24 * 60 * 60 * 1000);

    // Create stake
    const { data: stake, error: stakeError } = await supabase
      .from("user_stakes")
      .insert({
        user_id: user.id,
        pool_id,
        amount,
        start_date: start_date.toISOString(),
        end_date: end_date.toISOString(),
        status: "active",
        apy: pool.apy,
      })
      .select()
      .single();

    if (stakeError) {
      return new Response(
        JSON.stringify({ success: false, error: stakeError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct from wallet
    await supabase.rpc("update_wallet_balance", {
      p_user_id: user.id,
      p_token_symbol: pool.token_symbol,
      p_amount: -amount,
    });

    // Update pool total staked
    await supabase.rpc("update_pool_total_staked", {
      p_pool_id: pool_id,
      p_amount: amount,
    });

    // Create transaction record
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "stake",
      token_from: pool.token_symbol,
      amount_from: amount,
      status: "completed",
      metadata: { stake_id: stake.id, pool_id },
    });

    // Send notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "stake_created",
      title: "Staking Success",
      message: `Staked ${amount} ${pool.token_symbol} at ${pool.apy}% APY`,
      data: { stake_id: stake.id },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          stake_id: stake.id,
          amount,
          apy: pool.apy,
          end_date: end_date.toISOString(),
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Stake error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
