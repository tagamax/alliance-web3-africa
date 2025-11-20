import { createClient } from 'npm:@supabase/supabase-js@2.83.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();

    if (action === 'run_cycle') {
      const { data: cycleData, error: cycleError } = await supabase
        .rpc('run_redistribution_cycle');

      if (cycleError) throw cycleError;

      const { data: cycleInfo, error: infoError } = await supabase
        .from('redistribution_cycles')
        .select('*')
        .eq('id', cycleData)
        .single();

      if (infoError) throw infoError;

      await supabase.from('notifications').insert({
        title: 'Redistribution Complétée',
        message: `Cycle #${cycleInfo.cycle_number} terminé. ${cycleInfo.total_revenue.toLocaleString()} عLK3 redistribués.`,
        type: 'redistribution',
        read: false,
      });

      return new Response(
        JSON.stringify({
          success: true,
          cycle: cycleInfo,
          message: 'Redistribution cycle completed successfully',
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (action === 'get_stats') {
      const { data: lastCycle } = await supabase
        .from('redistribution_cycles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { data: totalBurned } = await supabase
        .from('burn_events')
        .select('tokens_burned');

      const totalTokensBurned = totalBurned?.reduce((sum, event) => sum + Number(event.tokens_burned), 0) || 0;

      const { data: userRewards } = await supabase
        .from('power_rewards')
        .select('reward_amount')
        .eq('user_id', req.headers.get('user-id'));

      const totalUserRewards = userRewards?.reduce((sum, r) => sum + Number(r.reward_amount), 0) || 0;

      return new Response(
        JSON.stringify({
          lastCycle,
          totalTokensBurned,
          totalUserRewards,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (action === 'claim_rewards') {
      const { rewardType, rewardId } = await req.json();
      const userId = req.headers.get('user-id');

      const tableName = `${rewardType}_rewards`;

      const { data: reward, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', rewardId)
        .eq('user_id', userId)
        .eq('claimed', false)
        .single();

      if (fetchError || !reward) {
        throw new Error('Reward not found or already claimed');
      }

      const { error: updateError } = await supabase
        .from(tableName)
        .update({ claimed: true, claimed_at: new Date().toISOString() })
        .eq('id', rewardId);

      if (updateError) throw updateError;

      await supabase.from('reward_claims').insert({
        user_id: userId,
        reward_type: rewardType,
        reward_id: rewardId,
        amount: reward.reward_amount,
      });

      return new Response(
        JSON.stringify({
          success: true,
          amount: reward.reward_amount,
          message: 'Reward claimed successfully',
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Redistribution engine error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
