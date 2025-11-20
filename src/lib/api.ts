import { supabase } from './supabase';

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

async function callEdgeFunction<T = any>(
  functionName: string,
  body?: any
): Promise<ApiResponse<T>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${FUNCTIONS_URL}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export const api = {
  // ==================== SWAP ====================
  swap: {
    execute: async (tokenFrom: string, tokenTo: string, amountFrom: number) => {
      return callEdgeFunction('swap-token', {
        token_from: tokenFrom,
        token_to: tokenTo,
        amount_from: amountFrom,
      });
    },

    getRates: async (tokenFrom: string, tokenTo: string) => {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('token_from', tokenFrom)
        .eq('token_to', tokenTo)
        .eq('is_active', true)
        .single();

      return { success: !error, data, error: error?.message };
    },
  },

  // ==================== STAKING ====================
  staking: {
    stake: async (poolId: string, amount: number, durationDays: number) => {
      return callEdgeFunction('stake-token', {
        pool_id: poolId,
        amount,
        duration_days: durationDays,
      });
    },

    unstake: async (stakeId: string) => {
      return callEdgeFunction('unstake-token', {
        stake_id: stakeId,
      });
    },

    getPools: async () => {
      const { data, error } = await supabase
        .from('staking_pools')
        .select('*')
        .eq('is_active', true)
        .order('apy', { ascending: false });

      return { success: !error, data, error: error?.message };
    },

    getUserStakes: async (userId: string) => {
      const { data, error } = await supabase
        .from('user_stakes')
        .select('*, staking_pools(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return { success: !error, data, error: error?.message };
    },
  },

  // ==================== P2P ====================
  p2p: {
    createOffer: async (offer: {
      type: 'buy' | 'sell';
      token_symbol: string;
      amount: number;
      price_per_unit: number;
      payment_method: string;
      min_order?: number;
      max_order?: number;
    }) => {
      return callEdgeFunction('p2p-create-offer', offer);
    },

    placeOrder: async (listingId: string, amount: number) => {
      return callEdgeFunction('p2p-order', {
        listing_id: listingId,
        amount,
      });
    },

    releaseEscrow: async (transactionId: string) => {
      return callEdgeFunction('p2p-release', {
        transaction_id: transactionId,
      });
    },

    getListings: async (type?: 'buy' | 'sell', tokenSymbol?: string) => {
      let query = supabase
        .from('p2p_listings')
        .select('*')
        .eq('status', 'active')
        .gt('amount_remaining', 0)
        .order('created_at', { ascending: false });

      if (type) query = query.eq('type', type);
      if (tokenSymbol) query = query.eq('token_symbol', tokenSymbol);

      const { data, error } = await query;
      return { success: !error, data, error: error?.message };
    },
  },

  // ==================== WALLET ====================
  wallet: {
    getBalance: async (userId: string, tokenSymbol?: string) => {
      let query = supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId);

      if (tokenSymbol) query = query.eq('token_symbol', tokenSymbol);

      const { data, error } = await query;
      return { success: !error, data, error: error?.message };
    },

    getTransactions: async (userId: string, limit = 50) => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return { success: !error, data, error: error?.message };
    },

    deposit: async (tokenSymbol: string, amount: number, method: string) => {
      return callEdgeFunction('fiat-deposit', {
        token_symbol: tokenSymbol,
        amount,
        method,
      });
    },

    withdraw: async (tokenSymbol: string, amount: number, method: string) => {
      return callEdgeFunction('fiat-withdraw', {
        token_symbol: tokenSymbol,
        amount,
        method,
      });
    },
  },

  // ==================== NFT ====================
  nft: {
    mint: async (nftData: {
      name: string;
      description: string;
      category: string;
      impact_type: string;
      metadata: any;
    }) => {
      return callEdgeFunction('nft-mint', nftData);
    },

    getUserNFTs: async (userId: string) => {
      const { data, error } = await supabase
        .from('nft_impact')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      return { success: !error, data, error: error?.message };
    },

    getAllNFTs: async (category?: string) => {
      let query = supabase
        .from('nft_impact')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (category) query = query.eq('category', category);

      const { data, error } = await query;
      return { success: !error, data, error: error?.message };
    },
  },

  // ==================== CROWN ====================
  crown: {
    getProjects: async (status?: string) => {
      let query = supabase
        .from('crown_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      return { success: !error, data, error: error?.message };
    },

    invest: async (projectId: string, amount: number) => {
      return callEdgeFunction('crown-invest', {
        project_id: projectId,
        amount,
      });
    },

    getUserInvestments: async (userId: string) => {
      const { data, error } = await supabase
        .from('crown_contributions')
        .select('*, crown_projects(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return { success: !error, data, error: error?.message };
    },
  },

  // ==================== KYC ====================
  kyc: {
    submit: async (documents: {
      document_type: string;
      document_number: string;
      front_image: string;
      back_image?: string;
      selfie_image: string;
    }) => {
      return callEdgeFunction('kyc-submit', documents);
    },

    getStatus: async (userId: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('kyc_status, kyc_level')
        .eq('id', userId)
        .single();

      return { success: !error, data, error: error?.message };
    },
  },

  // ==================== NOTIFICATIONS ====================
  notifications: {
    getAll: async (userId: string) => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      return { success: !error, data, error: error?.message };
    },

    markAsRead: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      return { success: !error, error: error?.message };
    },

    markAllAsRead: async (userId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      return { success: !error, error: error?.message };
    },
  },

  // ==================== ADMIN ====================
  admin: {
    getStats: async () => {
      return callEdgeFunction('admin-backend', { action: 'stats' });
    },

    getUsers: async (limit = 50, offset = 0) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      return { success: !error, data, error: error?.message };
    },

    updateUser: async (userId: string, updates: any) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      return { success: !error, data, error: error?.message };
    },

    approveKYC: async (userId: string) => {
      return callEdgeFunction('admin-kyc-approve', {
        user_id: userId,
        action: 'approve',
      });
    },

    rejectKYC: async (userId: string, reason: string) => {
      return callEdgeFunction('admin-kyc-approve', {
        user_id: userId,
        action: 'reject',
        reason,
      });
    },
  },
};

export default api;
