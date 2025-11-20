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

    const { amount, method, reference } = await req.json();

    if (!amount || amount <= 0 || !method) {
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

    // Create pending deposit transaction
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "deposit",
        token_to: "GNF",
        amount_to: amount,
        status: "pending",
        payment_method: method,
        reference_id: reference,
      })
      .select()
      .single();

    if (txError) {
      return new Response(
        JSON.stringify({ success: false, error: txError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "deposit_pending",
      title: "Deposit Initiated",
      message: `Your deposit of ${amount} GNF via ${method} is being processed`,
      data: { transaction_id: transaction.id },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          transaction_id: transaction.id,
          amount,
          method,
          status: "pending",
          message: "Deposit initiated. Please complete payment and provide proof.",
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Deposit error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
