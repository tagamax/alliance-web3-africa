import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, CheckCircle, AlertCircle, ArrowLeft, Wallet, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { sendWithdrawNotification } from '../lib/notifications';

interface WithdrawMethod {
  id: string;
  method_id: string;
  name: string;
  type: string;
  currency: string;
  network?: string;
  withdraw_fee_percent: number;
  min_withdraw: number;
  max_withdraw: number;
  processing_time: string;
  instructions: string;
}

export default function Withdraw() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [withdrawMethods, setWithdrawMethods] = useState<WithdrawMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [balance, setBalance] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  useEffect(() => {
    loadWithdrawMethods();
    loadBalance();
  }, [user]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const loadBalance = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('token_balances')
      .select('balance')
      .eq('user_id', user.id)
      .eq('token_symbol', 'عLK3')
      .maybeSingle();

    if (data) {
      setBalance(data.balance);
    }
  };

  const loadWithdrawMethods = async () => {
    // Load from database
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('active', true)
      .eq('withdraw_enabled', true)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error loading withdrawal methods:', error);
      return;
    }

    if (data) {
      setWithdrawMethods(data);
      return;
    }

    // Fallback mock data
    const methods: WithdrawMethod[] = [
      {
        id: 'crypto_usdt_trc20',
        name: 'USDT (TRC20)',
        type: 'crypto',
        fees: 1,
        min_amount: 20,
        max_amount: 50000,
        processing_time: '5-15 min'
      },
      {
        id: 'crypto_usdt_erc20',
        name: 'USDT (ERC20)',
        type: 'crypto',
        fees: 2.5,
        min_amount: 50,
        max_amount: 100000,
        processing_time: '5-30 min'
      },
      {
        id: 'crypto_btc',
        name: 'Bitcoin (BTC)',
        type: 'crypto',
        fees: 0.5,
        min_amount: 100,
        max_amount: 200000,
        processing_time: '30-60 min'
      },
      {
        id: 'crypto_eth',
        name: 'Ethereum (ETH)',
        type: 'crypto',
        fees: 1.5,
        min_amount: 50,
        max_amount: 150000,
        processing_time: '5-30 min'
      },
      {
        id: 'crypto_bnb',
        name: 'BNB (BSC)',
        type: 'crypto',
        fees: 0.5,
        min_amount: 30,
        max_amount: 100000,
        processing_time: '3-10 min'
      },
      {
        id: 'mobile_orange_money',
        name: 'Orange Money Guinée',
        type: 'mobile',
        fees: 1.5,
        min_amount: 5000,
        max_amount: 3000000,
        processing_time: 'Instant-1h'
      },
      {
        id: 'mobile_mtn',
        name: 'MTN Mobile Money',
        type: 'mobile',
        fees: 1.5,
        min_amount: 5000,
        max_amount: 3000000,
        processing_time: 'Instant-1h'
      },
      {
        id: 'mobile_moov',
        name: 'Moov Money (Flooz)',
        type: 'mobile',
        fees: 1.5,
        min_amount: 5000,
        max_amount: 2000000,
        processing_time: 'Instant'
      },
      {
        id: 'mobile_wave',
        name: 'Wave (SN/CI)',
        type: 'mobile',
        fees: 0,
        min_amount: 1000,
        max_amount: 5000000,
        processing_time: 'Instant'
      },
      {
        id: 'bank_ecobank',
        name: 'Ecobank (Virement)',
        type: 'bank',
        fees: 0,
        min_amount: 100000,
        max_amount: 50000000,
        processing_time: '24-48h'
      },
      {
        id: 'bank_orabank',
        name: 'Orabank (Virement)',
        type: 'bank',
        fees: 0,
        min_amount: 100000,
        max_amount: 50000000,
        processing_time: '24-72h'
      },
      {
        id: 'bank_bcrg',
        name: 'BCRG (Banque Centrale)',
        type: 'bank',
        fees: 0,
        min_amount: 250000,
        max_amount: 100000000,
        processing_time: '1-3 jours'
      },
      {
        id: 'bank_uba',
        name: 'UBA Bank',
        type: 'bank',
        fees: 0,
        min_amount: 100000,
        max_amount: 50000000,
        processing_time: '24-48h'
      },
      {
        id: 'bank_sky',
        name: 'SKY Bank',
        type: 'bank',
        fees: 0,
        min_amount: 50000,
        max_amount: 30000000,
        processing_time: '24-72h'
      },
      {
        id: 'bank_vista',
        name: 'Vista Bank',
        type: 'bank',
        fees: 0,
        min_amount: 75000,
        max_amount: 40000000,
        processing_time: '12-48h'
      },
      {
        id: 'card_visa',
        name: 'Carte Visa/Mastercard',
        type: 'card',
        fees: 3.5,
        min_amount: 10,
        max_amount: 10000,
        processing_time: '1-5 jours'
      },
      {
        id: 'paypal',
        name: 'PayPal',
        type: 'online',
        fees: 3.5,
        min_amount: 10,
        max_amount: 50000,
        processing_time: 'Instant-24h'
      },
      {
        id: 'perfect_money',
        name: 'Perfect Money',
        type: 'online',
        fees: 0.5,
        min_amount: 10,
        max_amount: 100000,
        processing_time: 'Instant'
      },
      {
        id: 'cash_pickup',
        name: 'Retrait Cash (Agents)',
        type: 'cash',
        fees: 1,
        min_amount: 20000,
        max_amount: 10000000,
        processing_time: '2-24h'
      }
    ];
    setWithdrawMethods(methods);
  };

  const handleSubmitWithdraw = async () => {
    if (!selectedMethod || !amount || !destination || parseFloat(amount) <= 0) {
      alert('Veuillez remplir tous les champs correctement');
      return;
    }

    const method = withdrawMethods.find(m => m.method_id === selectedMethod);
    if (!method) return;

    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount < method.min_withdraw) {
      alert(`Le montant minimum est ${method.min_withdraw} ${method.currency}`);
      return;
    }

    if (withdrawAmount > method.max_withdraw) {
      alert(`Le montant maximum est ${method.max_withdraw} ${method.currency}`);
      return;
    }

    if (withdrawAmount > balance) {
      alert('Solde insuffisant');
      return;
    }

    setLoading(true);

    try {
      const fees = (withdrawAmount * method.withdraw_fee_percent) / 100;
      const amountAfterFees = withdrawAmount - fees;

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          transaction_type: 'withdrawal',
          from_currency: 'عLK3',
          to_currency: method.type === 'crypto' ? method.name.split(' ')[0] : 'GNF',
          amount_from: withdrawAmount,
          amount_to: amountAfterFees,
          status: 'pending',
          metadata: {
            payment_method: selectedMethod,
            destination_address: destination,
            fees: fees,
            processing_time: method.processing_time
          }
        });

      if (transactionError) throw transactionError;

      const { error: balanceError } = await supabase
        .from('token_balances')
        .update({
          balance: balance - withdrawAmount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)
        .eq('token_symbol', 'عLK3');

      if (balanceError) throw balanceError;

      await supabase
        .from('notifications')
        .insert({
          user_id: user?.id,
          title: 'Retrait en cours',
          message: `Votre retrait de ${withdrawAmount.toLocaleString()} عLK3 est en cours de traitement`,
          type: 'withdrawal',
          read: false
        });

      if (user) {
        await sendWithdrawNotification(user.id, withdrawAmount, selectedMethodData?.name || 'Méthode inconnue');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Erreur retrait:', error);
      alert('Erreur lors de la création du retrait');
    } finally {
      setLoading(false);
    }
  };

  const selectedMethodData = withdrawMethods.find(m => m.id === selectedMethod);
  const calculatedFees = selectedMethodData && amount ? (parseFloat(amount) * selectedMethodData.fees) / 100 : 0;
  const amountAfterFees = amount ? parseFloat(amount) - calculatedFees : 0;

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-xl p-8 border border-blue-500/20 text-center">
          <CheckCircle className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Retrait demandé avec succès!</h2>
          <p className="text-gray-400 mb-4">
            Votre demande de retrait a été créée et sera traitée sous peu.
          </p>
          <p className="text-sm text-gray-500">
            Vous recevrez une notification une fois le retrait traité.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white rounded-lg transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Send className="h-8 w-8 text-blue-400" />
          Retrait de Fonds
        </h1>
        <p className="text-gray-400">Retirez vos عLK3 vers votre wallet ou compte bancaire</p>
      </div>

      <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 rounded-lg p-4 mb-6 border border-amber-500/20">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-amber-400" />
          <div>
            <p className="text-sm text-gray-400">Solde disponible</p>
            <p className="text-2xl font-bold text-white">{balance.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} عLK3</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-blue-500/20">
          <h2 className="text-xl font-bold text-white mb-4">Méthodes de Retrait</h2>
          <div className="space-y-4">
            {/* Crypto */}
            <div>
              <button
                onClick={() => toggleGroup('crypto')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/30 transition-all"
              >
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">💰 Cryptomonnaies</p>
                {expandedGroups.includes('crypto') ? (
                  <ChevronUp className="h-4 w-4 text-amber-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-amber-400" />
                )}
              </button>
              {expandedGroups.includes('crypto') && (
                <div className="space-y-2 mt-2">
                  {withdrawMethods.filter(m => m.type === 'crypto').map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.method_id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedMethod === method.method_id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-blue-500/50 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-white text-sm">{method.name}</p>
                      <Send className={`h-4 w-4 ${selectedMethod === method.method_id ? 'text-blue-400' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-xs text-gray-400">
                      <p>Min: {method.min_withdraw} • Max: {method.max_withdraw.toLocaleString()} عLK3</p>
                      <p>Frais: {method.withdraw_fee_percent}% • {method.processing_time}</p>
                    </div>
                  </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Money */}
            <div>
              <button
                onClick={() => toggleGroup('mobile')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/30 transition-all"
              >
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">📱 Mobile Money</p>
                {expandedGroups.includes('mobile') ? (
                  <ChevronUp className="h-4 w-4 text-blue-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-blue-400" />
                )}
              </button>
              {expandedGroups.includes('mobile') && (
                <div className="space-y-2 mt-2">
                  {withdrawMethods.filter(m => m.type === 'mobile').map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.method_id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedMethod === method.method_id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-blue-500/50 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-white text-sm">{method.name}</p>
                      <Send className={`h-4 w-4 ${selectedMethod === method.method_id ? 'text-blue-400' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-xs text-gray-400">
                      <p>Min: {method.min_withdraw.toLocaleString()} • Max: {method.max_withdraw.toLocaleString()} عLK3</p>
                      <p>Frais: {method.withdraw_fee_percent}% • {method.processing_time}</p>
                    </div>
                  </button>
                  ))}
                </div>
              )}
            </div>

            {/* Banques */}
            <div>
              <button
                onClick={() => toggleGroup('bank')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/30 transition-all"
              >
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide">🏦 Virements Bancaires</p>
                {expandedGroups.includes('bank') ? (
                  <ChevronUp className="h-4 w-4 text-purple-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-purple-400" />
                )}
              </button>
              {expandedGroups.includes('bank') && (
                <div className="space-y-2 mt-2">
                  {withdrawMethods.filter(m => m.type === 'bank').map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.method_id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedMethod === method.method_id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-blue-500/50 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-white text-sm">{method.name}</p>
                      <Send className={`h-4 w-4 ${selectedMethod === method.method_id ? 'text-blue-400' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-xs text-gray-400">
                      <p>Min: {method.min_withdraw.toLocaleString()} • Max: {method.max_withdraw.toLocaleString()} GNF</p>
                      <p>Frais: {method.withdraw_fee_percent}% • {method.processing_time}</p>
                    </div>
                  </button>
                  ))}
                </div>
              )}
            </div>

            {/* Online & Card */}
            <div>
              <button
                onClick={() => toggleGroup('online')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/30 transition-all"
              >
                <p className="text-xs font-semibold text-green-400 uppercase tracking-wide">💳 Cartes & Online</p>
                {expandedGroups.includes('online') ? (
                  <ChevronUp className="h-4 w-4 text-green-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-green-400" />
                )}
              </button>
              {expandedGroups.includes('online') && (
                <div className="space-y-2 mt-2">
                  {withdrawMethods.filter(m => m.type === 'card' || m.type === 'online').map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.method_id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedMethod === method.method_id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-blue-500/50 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-white text-sm">{method.name}</p>
                      <Send className={`h-4 w-4 ${selectedMethod === method.method_id ? 'text-blue-400' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-xs text-gray-400">
                      <p>Min: {method.min_withdraw} • Max: {method.max_withdraw.toLocaleString()} USD</p>
                      <p>Frais: {method.withdraw_fee_percent}% • {method.processing_time}</p>
                    </div>
                  </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cash */}
            {withdrawMethods.filter(m => m.type === 'cash').length > 0 && (
              <div>
                <button
                  onClick={() => toggleGroup('cash')}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/30 transition-all"
                >
                  <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">💵 Cash</p>
                  {expandedGroups.includes('cash') ? (
                    <ChevronUp className="h-4 w-4 text-orange-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-orange-400" />
                  )}
                </button>
                {expandedGroups.includes('cash') && (
                  <div className="space-y-2 mt-2">
                    {withdrawMethods.filter(m => m.type === 'cash').map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.method_id)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        selectedMethod === method.method_id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 hover:border-blue-500/50 bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-white text-sm">{method.name}</p>
                        <Send className={`h-4 w-4 ${selectedMethod === method.method_id ? 'text-blue-400' : 'text-gray-500'}`} />
                      </div>
                      <div className="text-xs text-gray-400">
                        <p>Min: {method.min_withdraw.toLocaleString()} • Max: {method.max_withdraw.toLocaleString()} GNF</p>
                        <p>Frais: {method.withdraw_fee_percent}% • {method.processing_time}</p>
                      </div>
                    </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-blue-500/20">
          <h2 className="text-xl font-bold text-white mb-4">Détails du Retrait</h2>

          {!selectedMethod ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">Sélectionnez une méthode de retrait</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Montant (عLK3)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min: ${selectedMethodData?.min_amount}`}
                  className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Adresse de Destination
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder={selectedMethodData?.type === 'crypto' ? 'Adresse wallet' : 'Numéro de téléphone / IBAN'}
                  className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {amount && parseFloat(amount) > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Montant:</span>
                    <span className="text-white font-semibold">{parseFloat(amount).toLocaleString()} عLK3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Frais ({selectedMethodData?.fees}%):</span>
                    <span className="text-red-400">-{calculatedFees.toLocaleString()} عLK3</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 flex justify-between">
                    <span className="text-white font-semibold">Vous recevrez:</span>
                    <span className="text-blue-400 font-bold text-lg">{amountAfterFees.toLocaleString()} عLK3</span>
                  </div>
                </div>
              )}

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-300">
                  <strong>Sécurité:</strong> Vérifiez attentivement l'adresse de destination. Les transactions crypto sont irréversibles.
                </p>
              </div>

              <button
                onClick={handleSubmitWithdraw}
                disabled={loading || !amount || !destination || parseFloat(amount) > balance}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Traitement...' : 'Confirmer le Retrait'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
