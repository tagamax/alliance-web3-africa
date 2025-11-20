import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowDownUp, Info, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';


interface TokenBalance {
  token_symbol: string;
  balance: number;
  wallet_id: string;
}

const CURRENCIES = [
  { symbol: 'عLK3', name: 'عLKabulan Coin', icon: '💎' },
  { symbol: 'USDT', name: 'Tether USD', icon: '💵' },
  { symbol: 'USD', name: 'US Dollar', icon: '$' },
  { symbol: 'EUR', name: 'Euro', icon: '€' },
  { symbol: 'GNF', name: 'Franc Guinéen', icon: '🇬🇳' },
  { symbol: 'CFA', name: 'Franc CFA', icon: '🌍' },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
];

const EXCHANGE_RATES: { [key: string]: number } = {
  'عLK3_USDT': 1.0,
  'عLK3_USD': 1.0,
  'عLK3_EUR': 0.92,
  'عLK3_GNF': 8500,
  'عLK3_CFA': 600,
  'عLK3_BTC': 0.000025,
  'عLK3_ETH': 0.00045,
  'USDT_عLK3': 1.0,
  'USD_عLK3': 1.0,
};

export default function Swap() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [fromCurrency, setFromCurrency] = useState('عLK3');
  const [toCurrency, setToCurrency] = useState('USDT');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadBalances();
  }, [user]);

  const loadBalances = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('token_balances')
        .select('token_symbol, balance, wallet_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setBalances(data || []);
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const getBalance = (symbol: string): number => {
    const balance = balances.find((b) => b.token_symbol === symbol);
    return balance?.balance || 0;
  };

  const getExchangeRate = (from: string, to: string): number => {
    const key = `${from}_${to}`;
    return EXCHANGE_RATES[key] || 1.0;
  };

  const handleSwapDirections = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    if (value && !isNaN(Number(value))) {
      const rate = getExchangeRate(fromCurrency, toCurrency);
      setToAmount((Number(value) * rate).toFixed(6));
    } else {
      setToAmount('');
    }
  };

  const handleSwap = async () => {
    if (!user || !fromAmount || !toAmount) return;

    const fromAmountNum = parseFloat(fromAmount);
    const toAmountNum = parseFloat(toAmount);

    if (fromAmountNum <= 0 || toAmountNum <= 0) {
      alert(t('errorMessage'));
      return;
    }

    const fromBalance = getBalance(fromCurrency);
    if (fromAmountNum > fromBalance) {
      alert(t('insufficientBalance'));
      return;
    }

    setLoading(true);

    try {
      const fromBalanceRecord = balances.find((b) => b.token_symbol === fromCurrency);
      const toBalanceRecord = balances.find((b) => b.token_symbol === toCurrency);

      if (!fromBalanceRecord) {
        throw new Error('Balance source introuvable');
      }

      await supabase
        .from('token_balances')
        .update({ balance: fromBalance - fromAmountNum })
        .eq('user_id', user.id)
        .eq('token_symbol', fromCurrency);

      if (toBalanceRecord) {
        await supabase
          .from('token_balances')
          .update({ balance: toBalanceRecord.balance + toAmountNum })
          .eq('user_id', user.id)
          .eq('token_symbol', toCurrency);
      } else {
        const { data: walletData } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .single();

        if (walletData) {
          await supabase.from('token_balances').insert({
            user_id: user.id,
            wallet_id: walletData.id,
            token_symbol: toCurrency,
            balance: toAmountNum,
            locked_balance: 0,
            usd_value: toAmountNum,
          });
        }
      }

      const { error: txError } = await supabase.from('transactions').insert({
        user_id: user.id,
        transaction_hash: `0x${Math.random().toString(16).substring(2)}`,
        transaction_type: 'swap',
        from_currency: fromCurrency,
        to_currency: toCurrency,
        amount_from: fromAmountNum,
        amount_to: toAmountNum,
        fee: 0,
        status: 'completed',
        metadata: {
          exchange_rate: getExchangeRate(fromCurrency, toCurrency),
        },
        completed_at: new Date().toISOString(),
      });

      if (txError) throw txError;

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      setFromAmount('');
      setToAmount('');
      loadBalances();
    } catch (error) {
      console.error('Error during swap:', error);
      alert(t('errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const fromBalance = getBalance(fromCurrency);
  const toBalance = getBalance(toCurrency);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white rounded-lg transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('back')}
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t('swapTitle')}</h1>
        <p className="text-gray-400">
          {t('swapDesc')}
        </p>
      </div>

      {showSuccess && (
        <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-emerald-400" />
          <p className="text-emerald-400 font-semibold">{t('successMessage')}</p>
        </div>
      )}

      <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-2xl p-6 border border-amber-500/20">
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-amber-500/10">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-gray-400">{t('fromToken')}</label>
              <span className="text-sm text-gray-400">
                {t('available')}: {fromBalance.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {fromCurrency}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-3xl text-white placeholder-gray-600 focus:outline-none"
              />
              <select
                value={fromCurrency}
                onChange={(e) => {
                  setFromCurrency(e.target.value);
                  handleFromAmountChange(fromAmount);
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-amber-500/20 focus:border-amber-500 focus:outline-none"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.symbol} value={currency.symbol}>
                    {currency.icon} {currency.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={handleSwapDirections}
              className="p-3 bg-slate-800 hover:bg-amber-500/20 rounded-full border-4 border-slate-900 transition-all hover:scale-110"
            >
              <ArrowDownUp className="h-5 w-5 text-amber-400" />
            </button>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-amber-500/10">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-gray-400">{t('toToken')}</label>
              <span className="text-sm text-gray-400">
                {t('available')}: {toBalance.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {toCurrency}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={toAmount}
                readOnly
                placeholder="0.00"
                className="flex-1 bg-transparent text-3xl text-white placeholder-gray-600 focus:outline-none"
              />
              <select
                value={toCurrency}
                onChange={(e) => {
                  setToCurrency(e.target.value);
                  handleFromAmountChange(fromAmount);
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-amber-500/20 focus:border-amber-500 focus:outline-none"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.symbol} value={currency.symbol}>
                    {currency.icon} {currency.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="flex-1 space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>{t('exchangeRate')}</span>
                <span className="text-white font-semibold">
                  1 {fromCurrency} = {getExchangeRate(fromCurrency, toCurrency).toLocaleString('fr-FR', { maximumFractionDigits: 6 })} {toCurrency}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('fees')}</span>
                <span className="text-emerald-400 font-semibold">0.00 عLK3</span>
              </div>
              <div className="flex justify-between">
                <span>Protection Escrow</span>
                <span className="text-emerald-400 font-semibold">✓ Activée</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSwap}
          disabled={loading || !fromAmount || parseFloat(fromAmount) <= 0 || parseFloat(fromAmount) > fromBalance}
          className="w-full mt-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-black disabled:text-gray-400 font-bold text-lg rounded-xl transition-all shadow-lg shadow-amber-500/25 disabled:shadow-none"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('loading')}...
            </span>
          ) : (
            t('swapNow')
          )}
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-lg rounded-xl p-4 border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <h3 className="text-white font-semibold">{t('fees')} 0%</h3>
          </div>
          <p className="text-sm text-gray-400">{t('swapDesc')}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-lg rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-blue-400" />
            <h3 className="text-white font-semibold">{t('instant')}</h3>
          </div>
          <p className="text-sm text-gray-400">{t('swapDesc')}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 backdrop-blur-lg rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-amber-400" />
            <h3 className="text-white font-semibold">{t('security')}</h3>
          </div>
          <p className="text-sm text-gray-400">{t('swapDesc')}</p>
        </div>
      </div>
    </div>
  );
}
