import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TrendingUp, Flame, Award, ArrowLeft, Wallet, Vote, Pickaxe, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface RedistributionCycle {
  id: string;
  cycle_number: number;
  total_revenue: number;
  power_rewards_amount: number;
  crown_rewards_amount: number;
  mining_rewards_amount: number;
  governance_rewards_amount: number;
  buyback_burn_amount: number;
  total_holders: number;
  total_crown_investors: number;
  total_pool_participants: number;
  total_voters: number;
  status: string;
  created_at: string;
}

interface UserRewards {
  powerRewards: number;
  crownRewards: number;
  miningRewards: number;
  governanceRewards: number;
  totalRewards: number;
}

export default function Redistributions() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [cycles, setCycles] = useState<RedistributionCycle[]>([]);
  const [userRewards, setUserRewards] = useState<UserRewards>({
    powerRewards: 0,
    crownRewards: 0,
    miningRewards: 0,
    governanceRewards: 0,
    totalRewards: 0,
  });
  const [totalBurned, setTotalBurned] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: cyclesData } = await supabase
        .from('redistribution_cycles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setCycles(cyclesData || []);

      if (user) {
        const { data: powerData } = await supabase
          .from('power_rewards')
          .select('reward_amount')
          .eq('user_id', user.id);

        const { data: crownData } = await supabase
          .from('crown_rewards')
          .select('reward_amount')
          .eq('user_id', user.id);

        const { data: miningData } = await supabase
          .from('mining_rewards')
          .select('reward_amount')
          .eq('user_id', user.id);

        const { data: govData } = await supabase
          .from('governance_rewards')
          .select('total_reward')
          .eq('user_id', user.id);

        const power = (powerData || []).reduce((sum, r) => sum + Number(r.reward_amount), 0);
        const crown = (crownData || []).reduce((sum, r) => sum + Number(r.reward_amount), 0);
        const mining = (miningData || []).reduce((sum, r) => sum + Number(r.reward_amount), 0);
        const governance = (govData || []).reduce((sum, r) => sum + Number(r.total_reward), 0);

        setUserRewards({
          powerRewards: power,
          crownRewards: crown,
          miningRewards: mining,
          governanceRewards: governance,
          totalRewards: power + crown + mining + governance,
        });
      }

      const { data: burnData } = await supabase
        .from('burn_events')
        .select('tokens_burned');

      const burned = (burnData || []).reduce((sum, event) => sum + Number(event.tokens_burned), 0);
      setTotalBurned(burned);
    } catch (error) {
      console.error('Error loading redistributions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const lastCycle = cycles[0];

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white rounded-lg transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Redistributions Automatiques عLKABULAN</h1>
        <p className="text-gray-400">Système de redistribution à 5 poches basé sur la performance économique réelle</p>
      </div>

      <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-orange-500/10 backdrop-blur-sm rounded-xl p-6 border border-amber-500/30">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <TrendingUp className="h-7 w-7 text-amber-400" />
          Mes Récompenses Totales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-5 w-5 text-emerald-400" />
              <p className="text-sm text-gray-400">Power Rewards</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {userRewards.powerRewards.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-emerald-400">35% • Holders</p>
          </div>

          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-purple-400" />
              <p className="text-sm text-gray-400">{t('crownFinance')}</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {userRewards.crownRewards.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-purple-400">25% • Investors</p>
          </div>

          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Pickaxe className="h-5 w-5 text-orange-400" />
              <p className="text-sm text-gray-400">Mining Pools</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {userRewards.miningRewards.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-orange-400">15% • Pools</p>
          </div>

          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Vote className="h-5 w-5 text-blue-400" />
              <p className="text-sm text-gray-400">Governance</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {userRewards.governanceRewards.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-blue-400">15% • DAO</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-lg p-4 border border-amber-500/40">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-amber-400" />
              <p className="text-sm text-amber-200 font-semibold">Total Gagné</p>
            </div>
            <p className="text-3xl font-bold text-white">
              {userRewards.totalRewards.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-amber-400">عLK3 • Lifetime</p>
          </div>
        </div>
      </div>

      {lastCycle && (
        <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-amber-500/20">
          <h2 className="text-xl font-bold text-white mb-4">Dernier Cycle de Redistribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-400">Cycle #</p>
              <p className="text-2xl font-bold text-white">{lastCycle.cycle_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Revenus Totaux</p>
              <p className="text-2xl font-bold text-amber-400">
                {lastCycle.total_revenue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Tokens Brûlés</p>
              <p className="text-2xl font-bold text-red-400">
                {totalBurned.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Statut</p>
              <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-400">
                {lastCycle.status}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-emerald-400" />
                  <p className="font-semibold text-white">Power Rewards (35%)</p>
                </div>
                <p className="text-emerald-400 font-bold">
                  {lastCycle.power_rewards_amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} عLK3
                </p>
              </div>
              <p className="text-sm text-gray-400">{lastCycle.total_holders} holders récompensés</p>
            </div>

            <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-purple-400" />
                  <p className="font-semibold text-white">{t('crownFinance')} (25%)</p>
                </div>
                <p className="text-purple-400 font-bold">
                  {lastCycle.crown_rewards_amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} عLK3
                </p>
              </div>
              <p className="text-sm text-gray-400">{lastCycle.total_crown_investors} investisseurs récompensés</p>
            </div>

            <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Pickaxe className="h-5 w-5 text-orange-400" />
                  <p className="font-semibold text-white">Mining Pools (15%)</p>
                </div>
                <p className="text-orange-400 font-bold">
                  {lastCycle.mining_rewards_amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} عLK3
                </p>
              </div>
              <p className="text-sm text-gray-400">{lastCycle.total_pool_participants} participants récompensés</p>
            </div>

            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Vote className="h-5 w-5 text-blue-400" />
                  <p className="font-semibold text-white">Governance (15%)</p>
                </div>
                <p className="text-blue-400 font-bold">
                  {lastCycle.governance_rewards_amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} عLK3
                </p>
              </div>
              <p className="text-sm text-gray-400">{lastCycle.total_voters} votants récompensés</p>
            </div>

            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-red-400" />
                  <p className="font-semibold text-white">Buyback & Burn (10%)</p>
                </div>
                <p className="text-red-400 font-bold">
                  {lastCycle.buyback_burn_amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} عLK3
                </p>
              </div>
              <p className="text-sm text-gray-400">Tokens achetés et brûlés • Supply réduit</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-blue-500/20">
        <h2 className="text-xl font-bold text-white mb-4">Historique des Cycles</h2>
        <div className="space-y-3">
          {cycles.map((cycle) => (
            <div
              key={cycle.id}
              className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-amber-500/50 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-white font-semibold">Cycle #{cycle.cycle_number}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(cycle.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-400">
                    {cycle.total_revenue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} عLK3
                  </p>
                  <p className="text-xs text-gray-400">Revenus distribués</p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 text-xs mt-3">
                <div className="text-center">
                  <p className="text-gray-400">Power</p>
                  <p className="text-emerald-400 font-semibold">35%</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">{t('crown')}</p>
                  <p className="text-purple-400 font-semibold">25%</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">Mining</p>
                  <p className="text-orange-400 font-semibold">15%</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">GOV</p>
                  <p className="text-blue-400 font-semibold">15%</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">Burn</p>
                  <p className="text-red-400 font-semibold">10%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
        <h3 className="text-lg font-bold text-white mb-4">💡 Comment Maximiser Vos Récompenses?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Wallet className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold">Détenez plus de عLK3</p>
                <p className="text-sm text-gray-400">35% des revenus redistribués aux holders proportionnellement</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Crown className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold">{t('investInCrown')}</p>
                <p className="text-sm text-gray-400">25% redistribués aux investisseurs de projets</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Pickaxe className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold">Participez aux Mining Pools</p>
                <p className="text-sm text-gray-400">15% pour les investisseurs des pools miniers</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Vote className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold">Votez dans la DAO</p>
                <p className="text-sm text-gray-400">15% pour les participants actifs + bonus stake</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
