import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, Coins, Users, Leaf, TrendingUp, Vote, Wallet, Activity, Building2, Zap, ChevronDown, LayoutGrid, Bell, User, Copy, CheckCircle, Pickaxe, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname.slice(1) || 'dashboard';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [walletCopied, setWalletCopied] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    if (user) {
      loadUnreadCount();

      const subscription = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          loadUnreadCount();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-menu')) {
        setMoreMenuOpen(false);
        setProfileMenuOpen(false);
        setLangMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUnreadCount = async () => {
    if (!user) return;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setUnreadCount(count || 0);
  };

  const mainNavigation = [
    { name: t('dashboard'), icon: Home, page: 'dashboard' },
  ];

  const secondaryNavigation = [
    { name: t('mineGame'), icon: Pickaxe, page: 'mine-game', featured: true },
    { name: t('nftImpact'), icon: Leaf, page: 'nft' },
    { name: t('defi'), icon: Wallet, page: 'defi' },
    { name: t('entrepreneurs'), icon: Building2, page: 'entrepreneurs' },
    { name: t('indexNational'), icon: Activity, page: 'index' },
    { name: t('redistributions'), icon: TrendingUp, page: 'redistributions' },
    { name: t('swap'), icon: Coins, page: 'swap' },
    { name: t('p2pTrading'), icon: Users, page: 'p2p' },
    { name: t('crown'), icon: TrendingUp, page: 'crown' },
    { name: t('miningPools'), icon: Zap, page: 'mining' },
    { name: t('governance'), icon: Vote, page: 'governance' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 w-full overflow-x-hidden">
      <nav className="sticky top-0 z-50 bg-black bg-opacity-40 backdrop-blur-lg border-b border-amber-500/20 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-16">
            {/* Logo à gauche */}
            <div className="flex-shrink-0 flex items-center">
              <Leaf className="h-8 w-8 text-amber-400" />
              <span className="ml-2 text-xl font-bold text-white hidden lg:inline">Alliance Web3 Africa</span>
              <span className="ml-2 text-lg font-bold text-white lg:hidden">عLK3</span>
            </div>

            {/* Navigation au centre */}
            <div className="hidden md:flex md:items-center md:space-x-3">
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                const isFeatured = 'featured' in item && item.featured;
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(`/${item.page}`)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                      currentPage === item.page
                        ? isFeatured
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/50'
                          : 'bg-amber-500 text-black'
                        : isFeatured
                        ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 border-2 border-amber-500/40 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/30'
                        : 'text-gray-300 hover:bg-amber-500/10 hover:text-amber-400'
                    } ${isFeatured ? 'ring-2 ring-amber-500/30' : ''}`}
                  >
                    <Icon className={`h-4 w-4 ${isFeatured ? 'animate-pulse-slow' : ''}`} />
                    {item.name}
                  </button>
                );
              })}

              <div className="relative dropdown-menu">
                <button
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    secondaryNavigation.some(item => item.page === currentPage)
                      ? 'bg-amber-500 text-black'
                      : 'text-gray-300 hover:bg-amber-500/10 hover:text-amber-400'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  {t('more')}
                  <ChevronDown className={`h-4 w-4 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {moreMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[60]"
                      onClick={() => setMoreMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 rounded-lg shadow-2xl border border-amber-500/30 py-2 z-[70] backdrop-blur-sm">
                      {secondaryNavigation.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.name}
                            onClick={() => {
                              navigate(`/${item.page}`);
                              setMoreMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                              currentPage === item.page
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'text-gray-300 hover:bg-amber-500/10 hover:text-amber-400'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-sm font-medium">{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions utilisateur à droite */}
            <div className="flex items-center gap-3">
              {user && (
                <>
                  {/* Language Selector */}
                  <div className="relative dropdown-menu">
                    <button
                      onClick={() => setLangMenuOpen(!langMenuOpen)}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all"
                    >
                      <Globe className="h-4 w-4 text-amber-400" />
                      <span className="text-sm text-white uppercase">{language}</span>
                    </button>

                    {langMenuOpen && (
                      <div className="absolute right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-50">
                        <button
                          onClick={() => {
                            setLanguage('fr');
                            setLangMenuOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left transition-colors ${
                            language === 'fr' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-300 hover:bg-slate-700'
                          }`}
                        >
                          🇫🇷 Français
                        </button>
                        <button
                          onClick={() => {
                            setLanguage('en');
                            setLangMenuOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left transition-colors ${
                            language === 'en' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-300 hover:bg-slate-700'
                          }`}
                        >
                          🇬🇧 English
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative dropdown-menu">
                    <button
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-lg border border-slate-600/30 hover:border-amber-500/30 transition-all"
                    >
                      <div className="relative">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold shadow-lg">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                      </div>
                      <span className="hidden md:block text-sm text-white font-mono">
                        0x...{user.id.slice(-6)}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {profileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                        <div className="p-4 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-b border-slate-700">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold">
                              <User className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-semibold">{user.email?.split('@')[0]}</p>
                              <p className="text-xs text-gray-400 font-mono">ID: {user.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(user.id);
                              setWalletCopied(true);
                              setTimeout(() => setWalletCopied(false), 2000);
                            }}
                            className="w-full px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-between group"
                          >
                            <span className="text-xs text-gray-300 font-mono truncate">{user.id}</span>
                            {walletCopied ? (
                              <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 ml-2" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-400 group-hover:text-amber-400 flex-shrink-0 ml-2" />
                            )}
                          </button>
                        </div>

                        <div className="p-2">
                          <button
                            onClick={() => {
                              navigate('/dashboard');
                              setProfileMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-gray-300 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-3"
                          >
                            <Home className="h-4 w-4" />
                            <span>{t('dashboard')}</span>
                          </button>
                          <button
                            onClick={() => {
                              navigate('/deposit');
                              setProfileMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-gray-300 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-3"
                          >
                            <Wallet className="h-4 w-4" />
                            <span>{t('deposit')}</span>
                          </button>
                          <button
                            onClick={() => {
                              navigate('/withdraw');
                              setProfileMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-gray-300 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-3"
                          >
                            <TrendingUp className="h-4 w-4" />
                            <span>{t('withdraw')}</span>
                          </button>
                        </div>

                        <div className="p-2 border-t border-slate-700">
                          <button
                            onClick={() => {
                              signOut();
                              setProfileMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-3"
                          >
                            <X className="h-4 w-4" />
                            <span>{t('signOut')}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/notifications')}
                    className="relative p-2 rounded-lg text-gray-300 hover:bg-amber-500/10 hover:text-amber-400 transition-all"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden lg:inline">Déconnexion</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:bg-amber-500/10 hover:text-amber-400"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-amber-500/20 bg-black bg-opacity-40 backdrop-blur-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <div className="px-2 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Modules Principaux
              </div>
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                const isFeatured = 'featured' in item && item.featured;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigate(`/${item.page}`);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-all ${
                      currentPage === item.page
                        ? isFeatured
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg'
                          : 'bg-amber-500 text-black'
                        : isFeatured
                        ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 border-2 border-amber-500/40'
                        : 'text-gray-300 hover:bg-amber-500/10 hover:text-amber-400'
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${isFeatured ? 'animate-pulse-slow' : ''}`} />
                    <span>{item.name}</span>
                    {isFeatured ? (
                      <span className="ml-auto text-xs bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full">
                        ★
                      </span>
                    ) : null}
                  </button>
                );
              })}

              <div className="px-2 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Autres Modules
              </div>
              {secondaryNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigate(`/${item.page}`);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentPage === item.page
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-gray-300 hover:bg-amber-500/10 hover:text-amber-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
              {user && (
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium text-red-400 hover:bg-red-500/10"
                >
                  Déconnexion
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>

      <footer className="mt-auto py-6 border-t border-amber-500/20 bg-black bg-opacity-20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400 text-sm">
          Alliance Web3 Africa - عLKabulan Coin (عLK3) © 2025
        </div>
      </footer>
    </div>
  );
}
