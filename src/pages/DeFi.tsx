import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TrendingUp, Wallet, DollarSign, Droplet, ArrowLeft, Lock, Unlock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';


interface StakingPool {
  id: string;
  pool_name: string;
  token_symbol: string;
  apy: number;
  lock_period_days: number;
  min_stake: number;
  total_staked: number;
  status: string;
}

interface UserStake {
  id: string;
  pool_id: string;
  amount: number;
  rewards_earned: number;
  status: string;
  staked_at: string;
  unlock_at: string;
  pool_name?: string;
  apy?: number;
}

export default function DeFi() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'staking' | 'lending' | 'liquidity'>('staking');
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [userStakes, setUserStakes] = useState<UserStake[]>([]);
  const [loading, setLoading] = useState(true);
  const [stakeAmount, setStakeAmount] = useState<{ [key: string]: string }>({});
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: poolsData, error: poolsError } = await supabase
        .from('staking_pools')
        .select('*')
        .eq('status', 'active')
        .order('lock_period_days');

      if (poolsError) throw poolsError;

      if (!poolsData || poolsData.length === 0) {
        await initializePools();
        return loadData();
      }

      setPools(poolsData || []);

      if (user) {
        const { data: stakesData } = await supabase
          .from('user_stakes')
          .select(`
            *,
            staking_pools (pool_name, apy)
          `)
          .eq('user_id', user.id)
          .in('status', ['active', 'unstaking']);

        const stakesWithPoolInfo = (stakesData || []).map((stake: any) => ({
          ...stake,
          pool_name: stake.staking_pools?.pool_name,
          apy: stake.staking_pools?.apy,
        }));

        setUserStakes(stakesWithPoolInfo);

        const { data: balanceData } = await supabase
          .from('token_balances')
          .select('balance')
          .eq('user_id', user.id)
          .eq('token_symbol', 'عLK3')
          .single();

        setUserBalance(balanceData?.balance || 0);
      }
    } catch (error) {
      console.error('Error loading DeFi data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializePools = async () => {
    const poolsData = [
      {
        pool_name: 'عLK3 Flexible',
        token_symbol: 'عLK3',
        apy: 8.0,
        min_stake: 100,
        lock_period_days: 0,
        total_staked: 0,
        status: 'active',
      },
      {
        pool_name: `عLK3 30 ${t('days_unit')}`,
        token_symbol: 'عLK3',
        apy: 12.0,
        min_stake: 500,
        lock_period_days: 30,
        total_staked: 0,
        status: 'active',
      },
      {
        pool_name: `عLK3 90 ${t('days_unit')}`,
        token_symbol: 'عLK3',
        apy: 18.0,
        min_stake: 1000,
        lock_period_days: 90,
        total_staked: 0,
        status: 'active',
      },
      {
        pool_name: `عLK3 180 ${t('days_unit')}`,
        token_symbol: 'عLK3',
        apy: 25.0,
        min_stake: 5000,
        lock_period_days: 180,
        total_staked: 0,
        status: 'active',
      },
    ];

    await supabase.from('staking_pools').insert(poolsData);
  };

  const handleStake = async (pool: StakingPool) => {
    if (!user) {
      alert(t('signIn'));
      return;
    }

    const amount = parseFloat(stakeAmount[pool.id] || '0');

    if (amount < pool.min_stake) {
      alert(`${t('minimum')}: ${pool.min_stake} عLK3`);
      return;
    }

    if (amount > userBalance) {
      alert(t('insufficientBalance'));
      return;
    }

    try {
      const unlockDate = new Date();
      unlockDate.setDate(unlockDate.getDate() + pool.lock_period_days);

      await supabase.from('user_stakes').insert({
        user_id: user.id,
        pool_id: pool.id,
        amount: amount,
        rewards_earned: 0,
        status: 'active',
        unlock_at: unlockDate.toISOString(),
      });

      await supabase
        .from('token_balances')
        .update({
          balance: userBalance - amount,
          locked_balance: amount
        })
        .eq('user_id', user.id)
        .eq('token_symbol', 'عLK3');

      await supabase
        .from('staking_pools')
        .update({ total_staked: pool.total_staked + amount })
        .eq('id', pool.id);

      await supabase.from('transactions').insert({
        user_id: user.id,
        transaction_hash: `0x${Math.random().toString(16).substring(2)}`,
        transaction_type: 'stake',
        from_currency: 'عLK3',
        to_currency: 'عLK3',
        amount_from: amount,
        amount_to: amount,
        fee: 0,
        status: 'completed',
        metadata: {
          pool_id: pool.id,
          pool_name: pool.pool_name,
          apy: pool.apy,
          lock_days: pool.lock_period_days,
        },
        completed_at: new Date().toISOString(),
      });

      alert(t('successMessage'));
      setStakeAmount({ ...stakeAmount, [pool.id]: '' });
      loadData();
    } catch (error) {
      console.error('Error staking:', error);
      alert(t('errorMessage'));
    }
  };

  const handleUnstake = async (stake: UserStake) => {
    if (!user) return;

    const unlockDate = new Date(stake.unlock_at);
    const now = new Date();

    if (now < unlockDate && stake.status === 'active') {
      const confirm = window.confirm(
        'La période de verrouillage n\'est pas terminée. Débloquer maintenant entraînera une pénalité de 10%. Continuer?'
      );
      if (!confirm) return;
    }

    try {
      const dailyReward = (stake.amount * (stake.apy || 0)) / 100 / 365;
      const daysStaked = Math.floor(
        (now.getTime() - new Date(stake.staked_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalRewards = dailyReward * daysStaked;

      await supabase
        .from('user_stakes')
        .update({
          status: 'completed',
          rewards_earned: totalRewards,
          unstaked_at: new Date().toISOString()
        })
        .eq('id', stake.id);

      const returnAmount = stake.amount + totalRewards;

      await supabase
        .from('token_balances')
        .update({
          balance: userBalance + returnAmount,
          locked_balance: 0
        })
        .eq('user_id', user.id)
        .eq('token_symbol', 'عLK3');

      await supabase.from('transactions').insert({
        user_id: user.id,
        transaction_hash: `0x${Math.random().toString(16).substring(2)}`,
        transaction_type: 'unstake',
        from_currency: 'عLK3',
        to_currency: 'عLK3',
        amount_from: stake.amount,
        amount_to: returnAmount,
        fee: 0,
        status: 'completed',
        metadata: {
          rewards: totalRewards,
          days_staked: daysStaked,
        },
        completed_at: new Date().toISOString(),
      });

      alert(`${t('successMessage')}! ${t('rewards')}: ${totalRewards.toFixed(2)} عLK3`);
      loadData();
    } catch (error) {
      console.error('Error unstaking:', error);
      alert(t('errorMessage'));
    }
  };

  const totalTVL = pools.reduce((sum, p) => sum + p.total_staked, 0);
  const avgAPY = pools.length > 0 ? pools.reduce((sum, p) => sum + p.apy, 0) / pools.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white rounded-lg transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('back')}
        </button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('defiTitle')}</h1>
        <p className="text-gray-400">{t('defiDesc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/20">
          <TrendingUp className="h-6 w-6 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">
            {totalTVL.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} عLK3
          </p>
          <p className="text-sm text-gray-400">{t('tvl')}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
          <Wallet className="h-6 w-6 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">
            {userBalance.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-400">{t('balance')}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 backdrop-blur-sm rounded-xl p-4 border border-amber-500/20">
          <DollarSign className="h-6 w-6 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">{avgAPY.toFixed(1)}%</p>
          <p className="text-sm text-gray-400">{t('apy')}</p>
        </div>
        <div className="bg-gradient-to-br from-teal-500/10 to-teal-600/10 backdrop-blur-sm rounded-xl p-4 border border-teal-500/20">
          <Droplet className="h-6 w-6 text-teal-400 mb-2" />
          <p className="text-2xl font-bold text-white">{userStakes.length}</p>
          <p className="text-sm text-gray-400">{t('staked')}</p>
        </div>
      </div>

      <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl border border-amber-500/20">
        <div className="flex border-b border-amber-500/20">
          <button
            onClick={() => setActiveTab('staking')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'staking'
                ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {t('staking')}
          </button>
          <button
            onClick={() => setActiveTab('lending')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'lending'
                ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {t('lending')}
          </button>
          <button
            onClick={() => setActiveTab('liquidity')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'liquidity'
                ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {t('liquidity')}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'staking' && (
            <div className="space-y-6 w-full max-w-full overflow-x-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pools.map((pool) => (
                  <div
                    key={pool.id}
                    className="bg-slate-800/50 rounded-xl p-6 border border-amber-500/10 hover:border-amber-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{pool.pool_name}</h3>
                        <p className="text-sm text-gray-400">
                          {pool.lock_period_days === 0 ? t('flexible') : `${t('locked')} ${pool.lock_period_days} ${t('days_unit')}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-emerald-400">{pool.apy}%</p>
                        <p className="text-xs text-gray-400">APY</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-slate-900/50 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">{t('minimum')}</p>
                        <p className="text-white font-semibold">{pool.min_stake} عLK3</p>
                      </div>
                      <div className="p-3 bg-slate-900/50 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">{t('staked')}</p>
                        <p className="text-white font-semibold">
                          {pool.total_staked.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="number"
                        value={stakeAmount[pool.id] || ''}
                        onChange={(e) => setStakeAmount({ ...stakeAmount, [pool.id]: e.target.value })}
                        placeholder={`Min: ${pool.min_stake} عLK3`}
                        className="w-full px-4 py-3 bg-slate-900/50 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleStake(pool)}
                        disabled={!stakeAmount[pool.id] || parseFloat(stakeAmount[pool.id]) < pool.min_stake}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
                      >
                        {t('stake')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {userStakes.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-white mb-4">{t('staked')}</h3>
                  <div className="space-y-4">
                    {userStakes.map((stake) => {
                      const unlockDate = new Date(stake.unlock_at);
                      const isUnlocked = new Date() >= unlockDate;

                      return (
                        <div
                          key={stake.id}
                          className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-amber-500/10"
                        >
                          <div className="flex items-center gap-4">
                            {isUnlocked ? (
                              <Unlock className="h-8 w-8 text-emerald-400" />
                            ) : (
                              <Lock className="h-8 w-8 text-amber-400" />
                            )}
                            <div>
                              <p className="text-white font-semibold">{stake.pool_name}</p>
                              <p className="text-sm text-gray-400">
                                {stake.amount.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} عLK3 • {stake.apy}% APY
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-gray-400">{t('status')}</p>
                              <p className="text-white font-semibold">
                                {isUnlocked ? t('available') : unlockDate.toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <button
                              onClick={() => handleUnstake(stake)}
                              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold rounded-lg transition-all"
                            >
                              {t('unstake')}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'lending' && (
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">{t('lending')} - {t('comingSoon')}</p>
              <p className="text-gray-500 text-sm">{t('defiDesc')}</p>
            </div>
          )}

          {activeTab === 'liquidity' && (
            <div className="text-center py-12">
              <Droplet className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">{t('liquidity')} - {t('comingSoon')}</p>
              <p className="text-gray-500 text-sm">{t('defiDesc')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
