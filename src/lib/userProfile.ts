import { supabase } from './supabase';

export async function initializeUserProfile(userId: string, email: string) {
  try {
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) {
      return { success: true, message: 'Profile already exists' };
    }

    const walletAddress = `0x${Math.random().toString(16).substring(2, 42).padEnd(40, '0')}`;

    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        full_name: email.split('@')[0],
        kyc_status: 'pending',
        kyc_level: 1,
        crown_score: 500,
        wallet_address: walletAddress,
        wallet_type: 'custodial',
        biometric_enabled: false,
        country_code: 'GN',
        preferred_language: 'fr'
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return { success: false, error: profileError };
    }

    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        wallet_address: walletAddress,
        wallet_type: 'custodial',
        chain: 'ethereum',
        is_primary: true
      })
      .select()
      .single();

    if (walletError) {
      console.error('Error creating wallet:', walletError);
      return { success: false, error: walletError };
    }

    const WELCOME_BONUS = 1000;
    const REFERRAL_BONUS = 500;
    const KYC_BONUS = 250;

    const tokens = [
      { symbol: 'عLK3', balance: WELCOME_BONUS, usd_value: WELCOME_BONUS },
      { symbol: 'USDT', balance: 0, usd_value: 0 },
      { symbol: 'BTC', balance: 0, usd_value: 0 },
      { symbol: 'ETH', balance: 0, usd_value: 0 }
    ];

    const balanceInserts = tokens.map(token => ({
      user_id: userId,
      wallet_id: wallet.id,
      token_symbol: token.symbol,
      balance: token.balance,
      locked_balance: 0,
      usd_value: token.usd_value
    }));

    const { error: balanceError } = await supabase
      .from('token_balances')
      .insert(balanceInserts);

    if (balanceError) {
      console.error('Error creating balances:', balanceError);
      return { success: false, error: balanceError };
    }

    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        transaction_hash: `0x${Math.random().toString(16).substring(2)}`,
        transaction_type: 'airdrop',
        from_currency: 'عLK3',
        to_currency: 'عLK3',
        amount_from: WELCOME_BONUS,
        amount_to: WELCOME_BONUS,
        fee: 0,
        status: 'completed',
        metadata: {
          type: 'welcome_bonus',
          description: 'Bonus de bienvenue',
          bonus_details: {
            welcome: WELCOME_BONUS,
            kyc_pending: KYC_BONUS,
            referral_available: REFERRAL_BONUS
          }
        },
        completed_at: new Date().toISOString()
      });

    if (txError) {
      console.error('Error creating welcome transaction:', txError);
    }

    await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          title: '🎁 Bonus de Bienvenue!',
          message: `Félicitations! Vous avez reçu ${WELCOME_BONUS} عLK3 en cadeau de bienvenue. Explorez toutes nos fonctionnalités!`,
          type: 'achievement',
          read: false,
          action_url: '/dashboard',
          data: { amount: WELCOME_BONUS, type: 'welcome_bonus' }
        },
        {
          user_id: userId,
          title: '💎 Bonus Disponibles',
          message: `Complétez votre KYC pour gagner ${KYC_BONUS} عLK3 supplémentaires! Parrainez des amis et gagnez ${REFERRAL_BONUS} عLK3 par parrainage.`,
          type: 'news',
          read: false,
          action_url: '/dashboard',
          data: { kyc_bonus: KYC_BONUS, referral_bonus: REFERRAL_BONUS }
        }
      ]);

    await supabase
      .from('reputation_events')
      .insert({
        user_id: userId,
        event_type: 'kyc_verified',
        score_change: 50,
        notes: 'Bonus d\'inscription - Bienvenue dans l\'écosystème Alliance Web3 Africa'
      });

    return {
      success: true,
      message: 'Profile initialized successfully',
      bonuses: {
        welcome_bonus: WELCOME_BONUS,
        pending_kyc_bonus: KYC_BONUS,
        referral_bonus_per_user: REFERRAL_BONUS
      }
    };
  } catch (error) {
    console.error('Error initializing profile:', error);
    return { success: false, error };
  }
}
