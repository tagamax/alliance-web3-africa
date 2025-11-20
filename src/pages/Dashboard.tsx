import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, Award, Leaf, ArrowUpRight, ArrowDownRight, Coins, Users, Bell, DollarSign, Send, ArrowDownToLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface UserProfile {
  full_name: string;
  crown_score: number;
  kyc_status: string;
  wallet_address: string | null;
}

interface TokenBalance {
  token_symbol: string;
  balance: number;
  usd_value: number;
}

interface Transaction {
  id: string;
  transaction_type: string;
  from_currency: string;
  to_currency: string;
  amount_from: number;
  amount_to: number;
  status: string;
  created_at: string;
  metadata: any;
}

function getTimeAgo(dateString: string, t: (key: string) => string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return t('justNow');
  if (diffMins < 60) return t('minutesAgo').replace('{minutes}', String(diffMins));
  if (diffHours < 24) return t('hoursAgo').replace('{hours}', String(diffHours));
  return t('daysAgo').replace('{days}', String(diffDays));
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    loadUnreadNotifications();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from('users')
        .select('full_name, crown_score, kyc_status, wallet_address')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      const { data: balanceData } = await supabase
        .from('token_balances')
        .select('token_symbol, balance, usd_value')
        .eq('user_id', user.id);

      if (balanceData) {
        setBalances(balanceData);
      }

      const { data: transactionData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (transactionData) {
        setTransactions(transactionData);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadNotifications = async () => {
    if (!user) return;

    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setUnreadNotifications(count || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const elk3Balance = balances.find(b => b.token_symbol === 'عLK3')?.balance || 0;
  const totalUsdValue = balances.reduce((sum, b) => sum + (b.usd_value || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {t('welcome')}, {profile?.full_name || t('user')}
          </h1>
          <p className="text-gray-400 mt-1">{t('dashboardSubtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/deposit')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 hover:from-emerald-500/30 hover:to-emerald-600/30 rounded-lg border-2 border-emerald-500/40 hover:border-emerald-500 transition-all text-emerald-400 hover:text-emerald-300 font-semibold shadow-lg hover:shadow-emerald-500/20"
          >
            <ArrowDownToLine className="h-4 w-4" />
            <span className="hidden sm:inline">{t('deposit')}</span>
          </button>
          <button
            onClick={() => navigate('/withdraw')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 rounded-lg border-2 border-blue-500/40 hover:border-blue-500 transition-all text-blue-400 hover:text-blue-300 font-semibold shadow-lg hover:shadow-blue-500/20"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">{t('send')}</span>
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-lg border-2 border-amber-500/40 shadow-lg">
            <Award className="h-5 w-5 text-amber-400 animate-pulse" />
            <span className="text-amber-400 font-bold">{t('crownScore')}: {profile?.crown_score || 500}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
          <div className="flex items-center justify-between mb-4">
            <Wallet className="h-8 w-8 text-amber-400" />
            <span className="text-xs text-gray-400">عLK3</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {elk3Balance.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-400">{t('elkabulanCoin')}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-8 w-8 text-emerald-400" />
            <ArrowUpRight className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            ${totalUsdValue.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-400">{t('totalValue')}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <Award className="h-8 w-8 text-blue-400" />
            <span className="text-xs text-gray-400">KYC</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1 capitalize">
            {profile?.kyc_status ? t(`${profile.kyc_status}_status`) : t('pending_status')}
          </p>
          <p className="text-sm text-gray-400">{t('verificationStatus')}</p>
        </div>

        <div className="bg-gradient-to-br from-teal-500/10 to-teal-600/10 backdrop-blur-sm rounded-xl p-6 border border-teal-500/20">
          <div className="flex items-center justify-between mb-4">
            <Leaf className="h-8 w-8 text-teal-400" />
            <span className="text-xs text-gray-400">NFT</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">0</p>
          <p className="text-sm text-gray-400">{t('nftImpactCount')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-amber-500/20 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-4">{t('recentTransactions')}</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {transactions.length > 0 ? (
              transactions.map((tx) => {
                const isIncoming = tx.transaction_type === 'transfer' || tx.status === 'completed';
                const timeAgo = getTimeAgo(tx.created_at, t);

                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-amber-500/10">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${isIncoming ? 'bg-emerald-500/10' : 'bg-red-500/10'} rounded-lg`}>
                        {isIncoming ? (
                          <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium capitalize">{tx.transaction_type}</p>
                        <p className="text-sm text-gray-400">
                          {tx.metadata?.description || `${tx.from_currency} → ${tx.to_currency || tx.from_currency}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${isIncoming ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isIncoming ? '+' : '-'}{tx.amount_from.toLocaleString('fr-FR')} {tx.from_currency}
                      </p>
                      <p className="text-xs text-gray-400">{timeAgo}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>{t('noTransactions')}</p>
                <p className="text-sm mt-2">{t('startUsingElk')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-amber-500/20">
          <h2 className="text-xl font-bold text-white mb-4">{t('quickActions')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-4 bg-gradient-to-br from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 rounded-lg border-2 border-red-500/40 hover:border-red-500 transition-all shadow-lg hover:shadow-red-500/20"
            >
              <Bell className="h-6 w-6 text-red-400 mb-2" />
              <p className="text-white font-semibold text-sm">{t('notifications')}</p>
              <p className="text-xs text-red-400 mt-1">{t('news')}</p>
              {unreadNotifications > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/nft')}
              className="p-4 bg-gradient-to-br from-teal-500/10 to-teal-600/10 hover:from-teal-500/20 hover:to-teal-600/20 rounded-lg border-2 border-teal-500/40 hover:border-teal-500 transition-all shadow-lg hover:shadow-teal-500/20"
            >
              <Leaf className="h-6 w-6 text-teal-400 mb-2" />
              <p className="text-white font-semibold text-sm">{t('nftImpact')}</p>
              <p className="text-xs text-teal-400 mt-1">{t('conservation')}</p>
            </button>
            <button
              onClick={() => navigate('/defi')}
              className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20 rounded-lg border-2 border-purple-500/40 hover:border-purple-500 transition-all shadow-lg hover:shadow-purple-500/20"
            >
              <Coins className="h-6 w-6 text-purple-400 mb-2" />
              <p className="text-white font-semibold text-sm">{t('defi')}</p>
              <p className="text-xs text-purple-400 mt-1">{t('finance')}</p>
            </button>
            <button
              onClick={() => navigate('/redistributions')}
              className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 hover:from-emerald-500/20 hover:to-emerald-600/20 rounded-lg border-2 border-emerald-500/40 hover:border-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/20"
            >
              <DollarSign className="h-6 w-6 text-emerald-400 mb-2" />
              <p className="text-white font-semibold text-sm">{t('redistributions')}</p>
              <p className="text-xs text-emerald-400 mt-1">{t('indexRewards')}</p>
            </button>
            <button
              onClick={() => navigate('/swap')}
              className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition-all"
            >
              <Wallet className="h-6 w-6 text-amber-400 mb-2" />
              <p className="text-white font-medium text-sm">SWAP</p>
            </button>
            <button
              onClick={() => navigate('/crown')}
              className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-all"
            >
              <TrendingUp className="h-6 w-6 text-blue-400 mb-2" />
              <p className="text-white font-medium text-sm">{t('crown')}</p>
            </button>
            <button
              onClick={() => navigate('/p2p')}
              className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 hover:from-emerald-500/20 hover:to-emerald-600/20 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
            >
              <Users className="h-6 w-6 text-emerald-400 mb-2" />
              <p className="text-white font-medium text-sm">P2P</p>
            </button>
            <button
              onClick={() => navigate('/entrepreneurs')}
              className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/10 hover:from-orange-500/20 hover:to-orange-600/20 rounded-lg border border-orange-500/20 hover:border-orange-500/40 transition-all"
            >
              <ArrowUpRight className="h-6 w-6 text-orange-400 mb-2" />
              <p className="text-white font-medium text-sm">Entrepreneurs</p>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Publicité 1 - NFT Impact */}
        <div className="bg-gradient-to-br from-teal-500/10 via-emerald-500/10 to-green-500/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-teal-500/30 hover:border-teal-500/60 transition-all cursor-pointer group" onClick={() => navigate('/nft')}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-2xl group-hover:scale-110 transition-transform shrink-0">
              <Leaf className="h-8 w-8 sm:h-10 sm:w-10 text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{t('protectEnvironment')}</h3>
              <p className="text-gray-300 text-xs sm:text-sm mb-3">{t('protectEnvironmentDesc')}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 sm:px-3 py-1 bg-teal-500/20 text-teal-400 text-xs font-semibold rounded-full whitespace-nowrap">{t('impactESG')}</span>
                <span className="px-2 sm:px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full whitespace-nowrap">{t('certifiedNFT')}</span>
              </div>
            </div>
            <button className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-teal-500/25 group-hover:shadow-teal-500/50 group-hover:scale-105 shrink-0">
              {t('discover')}
            </button>
          </div>
        </div>

        {/* Publicité 2 - Financement Participatif */}
        <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-blue-500/30 hover:border-purple-500/60 transition-all cursor-pointer group" onClick={() => navigate('/crown')}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl group-hover:scale-110 transition-transform shrink-0">
              <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{t('crown')} - {t('africanProjects')}</h3>
              <p className="text-gray-300 text-xs sm:text-sm mb-3">{t('investInProjects')}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 sm:px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full whitespace-nowrap">{t('roiUpTo')}</span>
                <span className="px-2 sm:px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full whitespace-nowrap">{t('verified')}</span>
              </div>
            </div>
            <button className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/25 group-hover:shadow-purple-500/50 group-hover:scale-105 shrink-0">
              {t('invest')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
