import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Activity, DollarSign, TrendingUp, AlertCircle,
  Settings, Shield, FileText, BarChart3, UserCog, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  total_users: number;
  new_users_24h: number;
  new_users_7d: number;
  total_transactions: number;
  transactions_24h: number;
  total_volume: number;
  volume_24h: number;
  total_elk3_balance: number;
  total_nfts: number;
  active_nfts: number;
}

interface AdminUser {
  id: string;
  role_name: string;
  display_name: string;
  level: number;
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [adminInfo, setAdminInfo] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    // Check if user is admin
    const { data: adminData, error } = await supabase
      .from('admin_users')
      .select(`
        id,
        role_id,
        is_active,
        admin_roles (
          role_name,
          display_name,
          level
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error || !adminData) {
      navigate('/dashboard');
      return;
    }

    const roleData = adminData.admin_roles as any;
    setAdminInfo({
      id: adminData.id,
      role_name: roleData.role_name,
      display_name: roleData.display_name,
      level: roleData.level
    });

    loadStats();
  };

  const loadStats = async () => {
    try {
      // Get users count
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: newUsers24h } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { count: newUsers7d } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Get transactions
      const { count: txCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      const { count: tx24h } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get volume
      const { data: volumeData } = await supabase
        .from('transactions')
        .select('amount_from')
        .eq('status', 'completed');

      const totalVolume = volumeData?.reduce((sum, tx) => sum + tx.amount_from, 0) || 0;

      // Get ELK3 balance
      const { data: elkData } = await supabase
        .from('wallets')
        .select('balance')
        .eq('token_symbol', 'عLK3');

      const totalElk = elkData?.reduce((sum, w) => sum + w.balance, 0) || 0;

      // Get NFT stats
      const { count: nftCount } = await supabase
        .from('nft_impact')
        .select('*', { count: 'exact', head: true });

      const { count: activeNftCount } = await supabase
        .from('nft_impact')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setStats({
        total_users: usersCount || 0,
        new_users_24h: newUsers24h || 0,
        new_users_7d: newUsers7d || 0,
        total_transactions: txCount || 0,
        transactions_24h: tx24h || 0,
        total_volume: totalVolume,
        volume_24h: 0,
        total_elk3_balance: totalElk,
        total_nfts: nftCount || 0,
        active_nfts: activeNftCount || 0
      });

    } catch (error) {
      console.error('Error loading stats:', error);
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

  if (!adminInfo) {
    return (
      <div className="text-center py-12">
        <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Accès Refusé</h2>
        <p className="text-gray-400">Vous n'avez pas les permissions administrateur</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-amber-400" />
            Panneau d'Administration
          </h1>
          <p className="text-gray-400 mt-1">
            Rôle: <span className="text-amber-400 font-semibold">{adminInfo.display_name}</span>
            {' '} • Niveau: {adminInfo.level}
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-all"
        >
          Retour Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Vue d\'ensemble', icon: BarChart3 },
          { id: 'users', label: 'Utilisateurs', icon: Users },
          { id: 'transactions', label: 'Transactions', icon: Activity },
          { id: 'settings', label: 'Paramètres', icon: Settings },
          { id: 'audit', label: 'Audit Logs', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6 w-full max-w-full overflow-x-hidden">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-8 w-8 text-blue-400" />
                <span className="text-xs text-green-400">+{stats.new_users_24h} (24h)</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {stats.total_users.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">Utilisateurs Totaux</p>
              <p className="text-xs text-gray-500 mt-2">+{stats.new_users_7d} cette semaine</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-4">
                <Activity className="h-8 w-8 text-emerald-400" />
                <span className="text-xs text-green-400">+{stats.transactions_24h} (24h)</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {stats.total_transactions.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">Transactions Totales</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="h-8 w-8 text-amber-400" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {stats.total_elk3_balance.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-gray-400">عLK3 en Circulation</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                ${(stats.total_volume / 10).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-gray-400">Volume Total (USD)</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UserCog className="h-5 w-5 text-amber-400" />
              Actions Rapides
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('users')}
                className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-left transition-all group"
              >
                <Users className="h-6 w-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-white font-semibold">Gérer Utilisateurs</p>
                <p className="text-sm text-gray-400">Voir et modifier les comptes</p>
              </button>

              <button
                onClick={() => setActiveTab('transactions')}
                className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-left transition-all group"
              >
                <Activity className="h-6 w-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-white font-semibold">Transactions</p>
                <p className="text-sm text-gray-400">Surveiller les opérations</p>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-left transition-all group"
              >
                <Settings className="h-6 w-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-white font-semibold">Paramètres</p>
                <p className="text-sm text-gray-400">Configuration plateforme</p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              Activité Récente
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-white text-sm">Nouvel utilisateur inscrit</p>
                  <p className="text-xs text-gray-400">Il y a 5 minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-lg">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-white text-sm">Transaction complétée</p>
                  <p className="text-xs text-gray-400">Il y a 12 minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-lg">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-white text-sm">Nouveau NFT créé</p>
                  <p className="text-xs text-gray-400">Il y a 34 minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Tabs */}
      {activeTab !== 'dashboard' && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-12 border border-slate-700 text-center">
          <AlertCircle className="h-16 w-16 text-amber-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Module en Construction</h3>
          <p className="text-gray-400">Cette section sera disponible prochainement</p>
        </div>
      )}
    </div>
  );
}
