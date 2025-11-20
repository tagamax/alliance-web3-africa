import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, Copy, CheckCircle, AlertCircle, ArrowLeft, Wallet, QrCode, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import QRCodeComponent from '../components/QRCode';
import { generateDynamicQR } from '../lib/qrSystem';
import { sendDepositNotification } from '../lib/notifications';

interface PaymentMethod {
  id: string;
  method_id: string;
  name: string;
  type: string;
  currency: string;
  network?: string;
  address?: string;
  instructions: string;
  deposit_enabled: boolean;
  withdraw_enabled: boolean;
  deposit_fee_percent: number;
  withdraw_fee_percent: number;
  min_deposit: number;
  max_deposit: number;
  min_withdraw: number;
  max_withdraw: number;
  processing_time: string;
  logo_url?: string;
  priority: number;
}

export default function Deposit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [qrData, setQrData] = useState<string>('');

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const loadPaymentMethods = async () => {
    // Load from database
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('active', true)
      .eq('deposit_enabled', true)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error loading payment methods:', error);
      return;
    }

    if (data) {
      setPaymentMethods(data);
      return;
    }

    // Fallback mock data
    const methods: PaymentMethod[] = [
      {
        id: 'crypto_usdt_trc20',
        name: 'USDT (TRC20)',
        type: 'crypto',
        address: 'TYourUSDTTRC20AddressHere',
        instructions: 'Réseau: TRON (TRC20). Envoyez uniquement des USDT TRC20 à cette adresse. Minimum 1 confirmation. Délai: 5-15 minutes.',
        fees: 0,
        min_amount: 10
      },
      {
        id: 'crypto_usdt_erc20',
        name: 'USDT (ERC20)',
        type: 'crypto',
        address: '0xYourUSDTERC20AddressHere',
        instructions: 'Réseau: Ethereum (ERC20). Envoyez uniquement des USDT ERC20. Minimum 12 confirmations. Délai: 5-30 minutes.',
        fees: 0,
        min_amount: 20
      },
      {
        id: 'crypto_btc',
        name: 'Bitcoin (BTC)',
        type: 'crypto',
        address: 'bc1qYourBTCAddressHere',
        instructions: 'Réseau: Bitcoin Mainnet. Minimum 3 confirmations. Délai: 30-60 minutes.',
        fees: 0,
        min_amount: 0.001
      },
      {
        id: 'crypto_eth',
        name: 'Ethereum (ETH)',
        type: 'crypto',
        address: '0xYourETHAddressHere',
        instructions: 'Réseau: Ethereum Mainnet. Minimum 12 confirmations. Délai: 5-30 minutes.',
        fees: 0,
        min_amount: 0.01
      },
      {
        id: 'crypto_bnb',
        name: 'BNB (BSC)',
        type: 'crypto',
        address: '0xYourBNBBSCAddressHere',
        instructions: 'Réseau: Binance Smart Chain (BSC/BEP20). Minimum 15 confirmations. Délai: 3-10 minutes.',
        fees: 0,
        min_amount: 0.1
      },
      {
        id: 'mobile_orange_money',
        name: 'Orange Money Guinée',
        type: 'mobile',
        address: '+224 620 XX XX XX',
        instructions: 'Composez *144# puis envoyez au numéro indiqué. Référence: Votre ID utilisateur. Frais Orange: 1%. Délai: Instantané à 1h.',
        fees: 1.5,
        min_amount: 5000
      },
      {
        id: 'mobile_mtn',
        name: 'MTN Mobile Money',
        type: 'mobile',
        address: '+224 660 XX XX XX',
        instructions: 'Menu MTN Mobile Money → Transfert d\'argent. Numéro bénéficiaire indiqué. Référence: Votre ID. Frais MTN: 1%. Délai: Instantané à 1h.',
        fees: 1.5,
        min_amount: 5000
      },
      {
        id: 'mobile_moov',
        name: 'Moov Money (Flooz)',
        type: 'mobile',
        address: '+224 664 XX XX XX',
        instructions: 'Composez *155# → Transfert. Numéro bénéficiaire indiqué. Référence obligatoire: Votre ID. Frais: 0.5-2%. Délai: Instantané.',
        fees: 1.5,
        min_amount: 5000
      },
      {
        id: 'mobile_wave',
        name: 'Wave (Sénégal/Côte d\'Ivoire)',
        type: 'mobile',
        address: '+221/+225 XX XXX XXXX',
        instructions: 'App Wave → Envoyer. Sélectionnez le pays (SN/CI). 0% de frais Wave. Délai: Instantané.',
        fees: 0,
        min_amount: 1000
      },
      {
        id: 'bank_ecobank',
        name: 'Ecobank (Virement)',
        type: 'bank',
        address: 'IBAN: GN74 XXXX XXXX XXXX XXXX XXXX XX',
        instructions: 'Bénéficiaire: Alliance Web3 Africa. SWIFT: ECOCGNCX. Agence: Conakry-Centre. Référence: Votre ID utilisateur. Délai: 24-48h.',
        fees: 0,
        min_amount: 100000
      },
      {
        id: 'bank_orabank',
        name: 'Orabank (Virement)',
        type: 'bank',
        address: 'IBAN: GN74 XXXX XXXX XXXX XXXX XXXX XX',
        instructions: 'Bénéficiaire: Alliance Web3 Africa. SWIFT: ORABGNCX. Référence obligatoire: Votre ID. Délai: 24-72h.',
        fees: 0,
        min_amount: 100000
      },
      {
        id: 'bank_bcrg',
        name: 'BCRG (Banque Centrale)',
        type: 'bank',
        address: 'Compte: XXXX XXXX XXXX XX',
        instructions: 'Virement uniquement via banques commerciales guinéennes. Référence: Votre ID. Délai: 1-3 jours ouvrés.',
        fees: 0,
        min_amount: 250000
      },
      {
        id: 'bank_uba',
        name: 'UBA Bank',
        type: 'bank',
        address: 'IBAN: GN74 XXXX XXXX XXXX XXXX XXXX XX',
        instructions: 'Bénéficiaire: Alliance Web3 Africa. SWIFT: UNAFGNCX. Agence: Conakry. Référence: Votre ID utilisateur. Délai: 24-48h.',
        fees: 0,
        min_amount: 100000
      },
      {
        id: 'bank_sky',
        name: 'SKY Bank',
        type: 'bank',
        address: 'IBAN: GN74 XXXX XXXX XXXX XXXX XXXX XX',
        instructions: 'Bénéficiaire: Alliance Web3 Africa. SWIFT: SKYBGNCX. Agence: Kipé. Référence obligatoire: Votre ID. Délai: 24-72h.',
        fees: 0,
        min_amount: 50000
      },
      {
        id: 'bank_vista',
        name: 'Vista Bank',
        type: 'bank',
        address: 'IBAN: GN74 XXXX XXXX XXXX XXXX XXXX XX',
        instructions: 'Bénéficiaire: Alliance Web3 Africa. SWIFT: VISTGNCX. Agence: Ratoma. Référence: Votre ID. Délai: 12-48h.',
        fees: 0,
        min_amount: 75000
      },
      {
        id: 'card_visa',
        name: 'Carte Visa/Mastercard',
        type: 'card',
        instructions: 'Paiement sécurisé via Stripe. Cartes acceptées: Visa, Mastercard. Traitement instantané. 3D Secure requis.',
        fees: 2.9,
        min_amount: 10
      },
      {
        id: 'paypal',
        name: 'PayPal',
        type: 'online',
        address: 'pay@allianceweb3africa.org',
        instructions: 'Envoyez via PayPal à l\'adresse indiquée. Sélectionnez "Envoyer à un ami" pour réduire les frais. Référence: Votre ID.',
        fees: 3.5,
        min_amount: 5
      },
      {
        id: 'perfect_money',
        name: 'Perfect Money',
        type: 'online',
        address: 'U12345678',
        instructions: 'Compte Perfect Money. USD uniquement. Envoyez au compte indiqué avec votre ID en note. Instantané.',
        fees: 0.5,
        min_amount: 10
      },
      {
        id: 'cash_pickup',
        name: 'Dépôt Cash (Agents)',
        type: 'cash',
        instructions: 'Rendez-vous chez l\'un de nos agents agréés en Guinée. Présentez votre ID et l\'argent cash. Liste des agents disponible sur demande.',
        fees: 1,
        min_amount: 20000
      }
    ];
    setPaymentMethods(methods);
  };

  const handleCopyAddress = () => {
    const method = paymentMethods.find(m => m.method_id === selectedMethod);
    if (method?.address) {
      navigator.clipboard.writeText(method.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const generateDepositQR = async () => {
    if (!amount || !selectedMethod || !user) return;

    try {
      const qrString = await generateDynamicQR({
        type: 'deposit',
        userId: user.id,
        amount: parseFloat(amount),
        currency: 'عLK3',
        metadata: {
          method: selectedMethod,
          methodName: selectedMethodData?.name,
        },
        expiresInMinutes: 30,
        maxUsage: 1,
      });
      setQrData(qrString);
    } catch (error) {
      console.error('QR generation error:', error);
    }
  };

  useEffect(() => {
    if (amount && selectedMethod && parseFloat(amount) >= (selectedMethodData?.min_deposit || 0)) {
      generateDepositQR();
    } else {
      setQrData('');
    }
  }, [amount, selectedMethod]);

  const handleSubmitDeposit = async () => {
    if (!selectedMethod || !amount || parseFloat(amount) <= 0) {
      alert('Veuillez sélectionner une méthode et entrer un montant valide');
      return;
    }

    const method = paymentMethods.find(m => m.method_id === selectedMethod);
    if (!method) return;

    if (parseFloat(amount) < method.min_deposit) {
      alert(`Le montant minimum est ${method.min_deposit} ${method.currency}`);
      return;
    }

    if (parseFloat(amount) > method.max_deposit) {
      alert(`Le montant maximum est ${method.max_deposit} ${method.currency}`);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          transaction_type: 'deposit',
          from_currency: method.currency,
          to_currency: 'عLK3',
          amount_from: parseFloat(amount),
          amount_to: parseFloat(amount),
          status: 'pending',
          metadata: {
            payment_method: selectedMethod,
            payment_method_name: method.name,
            payment_address: method.address,
            network: method.network,
            fees_percent: method.deposit_fee_percent,
            processing_time: method.processing_time
          }
        });

      if (error) throw error;

      if (user) {
        await sendDepositNotification(user.id, parseFloat(amount), method.name);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Erreur dépôt:', error);
      alert('Erreur lors de la création du dépôt');
    } finally {
      setLoading(false);
    }
  };

  const selectedMethodData = paymentMethods.find(m => m.method_id === selectedMethod);

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm rounded-xl p-8 border border-emerald-500/20 text-center">
          <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Demande de dépôt enregistrée!</h2>
          <p className="text-gray-400 mb-4">
            Votre demande de dépôt a été créée avec succès. Suivez les instructions de paiement.
          </p>
          <p className="text-sm text-gray-500">
            Les fonds seront crédités après confirmation du paiement.
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
          <ArrowDownToLine className="h-8 w-8 text-emerald-400" />
          Dépôt de Fonds
        </h1>
        <p className="text-gray-400">Rechargez votre compte avec عLK3 ou convertissez vos crypto/fiat</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-emerald-500/20">
          <h2 className="text-xl font-bold text-white mb-4">Méthodes de Paiement</h2>
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
                  {paymentMethods.filter(m => m.type === 'crypto').map((method) => (
                  <button
                    key={method.method_id}
                    onClick={() => setSelectedMethod(method.method_id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedMethod === method.method_id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-gray-700 hover:border-emerald-500/50 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white text-sm">{method.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Min: {method.min_deposit} • Frais: {method.deposit_fee_percent}%
                        </p>
                      </div>
                      <Wallet className={`h-4 w-4 ${selectedMethod === method.method_id ? 'text-emerald-400' : 'text-gray-500'}`} />
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
                  {paymentMethods.filter(m => m.type === 'mobile').map((method) => (
                  <button
                    key={method.method_id}
                    onClick={() => setSelectedMethod(method.method_id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedMethod === method.method_id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-gray-700 hover:border-emerald-500/50 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white text-sm">{method.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Min: {method.min_deposit.toLocaleString()} • Frais: {method.deposit_fee_percent}%
                        </p>
                      </div>
                      <Wallet className={`h-4 w-4 ${selectedMethod === method.method_id ? 'text-emerald-400' : 'text-gray-500'}`} />
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
                  {paymentMethods.filter(m => m.type === 'bank').map((method) => (
                  <button
                    key={method.method_id}
                    onClick={() => setSelectedMethod(method.method_id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedMethod === method.method_id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-gray-700 hover:border-emerald-500/50 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white text-sm">{method.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Min: {method.min_deposit.toLocaleString()} • Frais: {method.deposit_fee_percent}%
                        </p>
                      </div>
                      <Wallet className={`h-4 w-4 ${selectedMethod === method.method_id ? 'text-emerald-400' : 'text-gray-500'}`} />
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
                  {paymentMethods.filter(m => m.type === 'card' || m.type === 'online').map((method) => (
                  <button
                    key={method.method_id}
                    onClick={() => setSelectedMethod(method.method_id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedMethod === method.method_id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-gray-700 hover:border-emerald-500/50 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white text-sm">{method.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Min: {method.min_deposit} • Frais: {method.deposit_fee_percent}%
                        </p>
                      </div>
                      <Wallet className={`h-4 w-4 ${selectedMethod === method.method_id ? 'text-emerald-400' : 'text-gray-500'}`} />
                    </div>
                  </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cash */}
            {paymentMethods.filter(m => m.type === 'cash').length > 0 && (
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
                    {paymentMethods.filter(m => m.type === 'cash').map((method) => (
                    <button
                      key={method.method_id}
                      onClick={() => setSelectedMethod(method.method_id)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        selectedMethod === method.method_id
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-gray-700 hover:border-emerald-500/50 bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white text-sm">{method.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Min: {method.min_deposit.toLocaleString()} • Frais: {method.deposit_fee_percent}%
                          </p>
                        </div>
                        <Wallet className={`h-4 w-4 ${selectedMethod === method.method_id ? 'text-emerald-400' : 'text-gray-500'}`} />
                      </div>
                    </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-emerald-500/20">
          <h2 className="text-xl font-bold text-white mb-4">Détails du Dépôt</h2>

          {!selectedMethod ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">Sélectionnez une méthode de paiement</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Montant
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min: ${selectedMethodData?.min_amount}`}
                  className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {selectedMethodData?.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Adresse de Paiement
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={selectedMethodData.address}
                      readOnly
                      className="flex-1 px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white"
                    />
                    <button
                      onClick={handleCopyAddress}
                      className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg transition-all"
                    >
                      {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  <strong>Instructions:</strong><br />
                  {selectedMethodData?.instructions}
                </p>
              </div>

              {qrData && (
                <div className="bg-slate-900/50 border border-emerald-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-emerald-400 mb-4 text-center flex items-center justify-center gap-2">
                    <QrCode className="h-5 w-5" />
                    QR Code de Dépôt
                  </h3>
                  <QRCodeComponent
                    data={qrData}
                    size={200}
                    showActions={true}
                    label={`Dépôt: ${amount} عLK3`}
                    className="flex flex-col items-center"
                  />
                  <p className="text-xs text-gray-400 text-center mt-3">
                    ⚡ Scannez pour confirmer instantanément • Expire dans 30 min
                  </p>
                </div>
              )}

              <button
                onClick={handleSubmitDeposit}
                disabled={loading || !amount}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Traitement...' : 'Confirmer le Dépôt'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
