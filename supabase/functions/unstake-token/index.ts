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

    const { stake_id } = await req.json();

    if (!stake_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Stake ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get stake info
    const { data: stake, error: stakeError } = await supabase
      .from("user_stakes")
      .select("*, staking_pools(*)")
      .eq("id", stake_id)
      .eq("user_id", user.id)
      .single();

    if (stakeError || !stake) {
      return new Response(
        JSON.stringify({ success: false, error: "Stake not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (stake.status !== "active") {
      return new Response(
        JSON.stringify({ success: false, error: "Stake already unstaked" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate rewards
    const startDate = new Date(stake.start_date);
    const now = new Date();
    const daysStaked = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const yearlyReward = stake.amount * (stake.apy / 100);
    const dailyReward = yearlyReward / 365;
    const totalReward = dailyReward * daysStaked;

    // Check early withdrawal penalty
    const endDate = new Date(stake.end_date);
    const isEarly = now < endDate;
    const penalty = isEarly ? totalReward * 0.2 : 0; // 20% penalty if early
    const finalReward = totalReward - penalty;

    // Update stake status
    const { error: updateError } = await supabase
      .from("user_stakes")
      .update({
        status: "completed",
        end_date: now.toISOString(),
        rewards_earned: finalReward,
      })
      .eq("id", stake_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return tokens + rewards to wallet
    const totalReturn = stake.amount + finalReward;
    await supabase.rpc("update_wallet_balance", {
      p_user_id: user.id,
      p_token_symbol: stake.staking_pools.token_symbol,
      p_amount: totalReturn,
    });

    // Update pool total staked
    await supabase.rpc("update_pool_total_staked", {
      p_pool_id: stake.pool_id,
      p_amount: -stake.amount,
    });

    // Create transaction record
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "unstake",
      token_to: stake.staking_pools.token_symbol,
      amount_to: totalReturn,
      status: "completed",
      metadata: {
        stake_id,
        original_amount: stake.amount,
        reward: finalReward,
        days_staked: daysStaked,
        early_withdrawal: isEarly,
      },
    });

    // Send notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "unstake_completed",
      title: "Unstaking Successful",
      message: `Unstaked ${stake.amount} + ${finalReward.toFixed(2)} reward${
        isEarly ? " (early withdrawal penalty applied)" : ""
      }`,
      data: { stake_id },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          amount_returned: stake.amount,
          reward: finalReward,
          total: totalReturn,
          days_staked: daysStaked,
          early_withdrawal: isEarly,
          penalty: penalty,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unstake error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
