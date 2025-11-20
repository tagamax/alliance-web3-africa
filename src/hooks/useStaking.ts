import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export interface StakingPool {
  id: string;
  name: string;
  token_symbol: string;
  apy: number;
  min_stake: number;
  lock_period_days: number;
  total_staked: number;
  is_active: boolean;
}

export interface UserStake {
  id: string;
  user_id: string;
  pool_id: string;
  amount: number;
  start_date: string;
  end_date: string;
  status: string;
  apy: number;
  rewards_earned: number;
  staking_pools?: StakingPool;
}

export function useStaking() {
  const { user } = useAuth();
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [userStakes, setUserStakes] = useState<UserStake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPools = async () => {
    const result = await api.staking.getPools();
    if (result.success && result.data) {
      setPools(result.data);
    }
  };

  const loadUserStakes = async () => {
    if (!user) return;

    const result = await api.staking.getUserStakes(user.id);
    if (result.success && result.data) {
      setUserStakes(result.data);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadPools(), loadUserStakes()]);
      setLoading(false);
    };
    load();
  }, [user]);

  const stake = async (poolId: string, amount: number, durationDays: number) => {
    setError(null);
    const result = await api.staking.stake(poolId, amount, durationDays);

    if (result.success) {
      await loadUserStakes();
      return { success: true, data: result.data };
    } else {
      setError(result.error || 'Staking failed');
      return { success: false, error: result.error };
    }
  };

  const unstake = async (stakeId: string) => {
    setError(null);
    const result = await api.staking.unstake(stakeId);

    if (result.success) {
      await loadUserStakes();
      return { success: true, data: result.data };
    } else {
      setError(result.error || 'Unstaking failed');
      return { success: false, error: result.error };
    }
  };

  const getTotalStaked = () => {
    return userStakes
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + s.amount, 0);
  };

  const getTotalRewards = () => {
    return userStakes.reduce((sum, s) => sum + (s.rewards_earned || 0), 0);
  };

  return {
    pools,
    userStakes,
    loading,
    error,
    stake,
    unstake,
    reload: async () => {
      await Promise.all([loadPools(), loadUserStakes()]);
    },
    getTotalStaked,
    getTotalRewards,
  };
}
