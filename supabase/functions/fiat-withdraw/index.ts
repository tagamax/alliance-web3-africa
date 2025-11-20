import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    const { amount, method, account_details } = await req.json();

    if (!amount || amount <= 0 || !method || !account_details) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify KYC
    const { data: userData } = await supabase
      .from("users")
      .select("kyc_status")
      .eq("id", user.id)
      .single();

    if (!userData || userData.kyc_status !== "verified") {
      return new Response(
        JSON.stringify({ success: false, error: "KYC verification required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check balance
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .eq("token_symbol", "GNF")
      .single();

    if (!wallet || wallet.balance < amount) {
      return new Response(
        JSON.stringify({ success: false, error: "Insufficient balance" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate fee (1%)
    const fee = amount * 0.01;
    const netAmount = amount - fee;

    // Deduct from wallet
    await supabase.rpc("update_wallet_balance", {
      p_user_id: user.id,
      p_token_symbol: "GNF",
      p_amount: -amount,
    });

    // Create withdrawal transaction
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "withdrawal",
        token_from: "GNF",
        amount_from: amount,
        fee_amount: fee,
        status: "pending",
        payment_method: method,
        metadata: {
          account_details: account_details,
          net_amount: netAmount,
        },
      })
      .select()
      .single();

    if (txError) {
      // Rollback
      await supabase.rpc("update_wallet_balance", {
        p_user_id: user.id,
        p_token_symbol: "GNF",
        p_amount: amount,
      });

      return new Response(
        JSON.stringify({ success: false, error: txError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "withdrawal_pending",
      title: "Withdrawal Initiated",
      message: `Your withdrawal of ${amount} GNF via ${method} is being processed`,
      data: { transaction_id: transaction.id },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          transaction_id: transaction.id,
          amount,
          fee,
          net_amount: netAmount,
          status: "pending",
          message: "Withdrawal request submitted. Processing within 24-48 hours.",
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Withdrawal error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
