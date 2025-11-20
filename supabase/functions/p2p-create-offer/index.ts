import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface P2POfferRequest {
  type: "buy" | "sell";
  token_symbol: string;
  amount: number;
  price_per_unit: number;
  payment_method: string;
  min_order?: number;
  max_order?: number;
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

    const {
      type,
      token_symbol,
      amount,
      price_per_unit,
      payment_method,
      min_order,
      max_order,
    }: P2POfferRequest = await req.json();

    // Validation
    if (!type || !token_symbol || !amount || !price_per_unit || !payment_method) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (amount <= 0 || price_per_unit <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid amount or price" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If selling, check balance and lock tokens
    if (type === "sell") {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .eq("token_symbol", token_symbol)
        .single();

      if (!wallet || wallet.balance < amount) {
        return new Response(
          JSON.stringify({ success: false, error: "Insufficient balance" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Lock tokens in escrow
      await supabase.rpc("update_wallet_balance", {
        p_user_id: user.id,
        p_token_symbol: token_symbol,
        p_amount: -amount,
      });
    }

    const total_value = amount * price_per_unit;

    // Create P2P listing
    const { data: listing, error: listingError } = await supabase
      .from("p2p_listings")
      .insert({
        user_id: user.id,
        type,
        token_symbol,
        amount_total: amount,
        amount_remaining: amount,
        price_per_unit,
        total_value,
        payment_method,
        min_order_amount: min_order || amount * 0.1,
        max_order_amount: max_order || amount,
        status: "active",
      })
      .select()
      .single();

    if (listingError) {
      // Rollback if sell
      if (type === "sell") {
        await supabase.rpc("update_wallet_balance", {
          p_user_id: user.id,
          p_token_symbol: token_symbol,
          p_amount: amount,
        });
      }

      return new Response(
        JSON.stringify({ success: false, error: listingError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create escrow record if selling
    if (type === "sell") {
      await supabase.from("escrow_transactions").insert({
        listing_id: listing.id,
        seller_id: user.id,
        amount_locked: amount,
        token_symbol,
        status: "locked",
      });
    }

    // Send notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "p2p_listing_created",
      title: "P2P Offer Created",
      message: `Your ${type} offer for ${amount} ${token_symbol} is now active`,
      data: { listing_id: listing.id },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          listing_id: listing.id,
          type,
          amount,
          price_per_unit,
          total_value,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("P2P create offer error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
