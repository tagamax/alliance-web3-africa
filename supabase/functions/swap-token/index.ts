import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SwapRequest {
  token_from: string;
  token_to: string;
  amount_from: number;
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

    const { token_from, token_to, amount_from }: SwapRequest = await req.json();

    // Validation
    if (!token_from || !token_to || !amount_from || amount_from <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get exchange rates
    const { data: rates } = await supabase
      .from("exchange_rates")
      .select("*")
      .eq("token_from", token_from)
      .eq("token_to", token_to)
      .eq("is_active", true)
      .single();

    if (!rates) {
      return new Response(
        JSON.stringify({ success: false, error: "Exchange rate not available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rate = rates.rate;
    const fee_percentage = 0.005; // 0.5% fee
    const amount_to = amount_from * rate * (1 - fee_percentage);
    const fee = amount_from * rate * fee_percentage;

    // Check balance
    const { data: walletFrom } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .eq("token_symbol", token_from)
      .single();

    if (!walletFrom || walletFrom.balance < amount_from) {
      return new Response(
        JSON.stringify({ success: false, error: "Insufficient balance" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Execute swap transaction
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "swap",
        token_from,
        token_to,
        amount_from,
        amount_to,
        exchange_rate: rate,
        fee_amount: fee,
        status: "completed",
      })
      .select()
      .single();

    if (txError) {
      return new Response(
        JSON.stringify({ success: false, error: txError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update balances
    await supabase.rpc("update_wallet_balance", {
      p_user_id: user.id,
      p_token_symbol: token_from,
      p_amount: -amount_from,
    });

    await supabase.rpc("update_wallet_balance", {
      p_user_id: user.id,
      p_token_symbol: token_to,
      p_amount: amount_to,
    });

    // Send notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "swap_completed",
      title: "Swap Completed",
      message: `Swapped ${amount_from} ${token_from} to ${amount_to.toFixed(4)} ${token_to}`,
      data: { transaction_id: transaction.id },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          transaction_id: transaction.id,
          amount_from,
          amount_to,
          rate,
          fee,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Swap error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
