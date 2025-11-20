import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Shield, Clock, Star, CheckCircle, AlertTriangle, ArrowLeft, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';


interface Listing {
  id: string;
  user_id: string;
  listing_type: string;
  token_symbol: string;
  amount: number;
  remaining_amount: number;
  price: number;
  currency: string;
  payment_methods: string[];
  min_order: number;
  max_order: number;
  time_limit: number;
  status: string;
  user_name?: string;
  rating?: number;
  total_trades?: number;
}

export default function P2P() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadListings();
  }, [tradeType]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('p2p_listings')
        .select(`
          *,
          users!p2p_listings_user_id_fkey (
            full_name
          )
        `)
        .eq('listing_type', tradeType)
        .eq('status', 'active')
        .gt('remaining_amount', 0)
        .order('price', { ascending: tradeType === 'buy' });

      if (error) throw error;

      const listingsWithRatings = await Promise.all(
        (data || []).map(async (listing) => {
          const { data: ratingData } = await supabase
            .rpc('get_user_p2p_rating', { user_uuid: listing.user_id });

          return {
            ...listing,
            user_name: listing.users?.full_name || 'Utilisateur',
            rating: ratingData?.[0]?.average_rating || 0,
            total_trades: ratingData?.[0]?.total_trades || 0,
          };
        })
      );

      setListings(listingsWithRatings);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (listing: Listing, amount: number) => {
    if (!user) return;

    try {
      const total = amount * listing.price;
      const paymentDeadline = new Date();
      paymentDeadline.setMinutes(paymentDeadline.getMinutes() + listing.time_limit);

      const { error } = await supabase.from('p2p_orders').insert({
        listing_id: listing.id,
        buyer_id: tradeType === 'buy' ? user.id : listing.user_id,
        seller_id: tradeType === 'buy' ? listing.user_id : user.id,
        amount: amount,
        price: listing.price,
        total: total,
        currency: listing.currency,
        payment_method: listing.payment_methods[0],
        status: 'pending',
        payment_deadline: paymentDeadline.toISOString(),
      });

      if (error) throw error;

      await supabase
        .from('p2p_listings')
        .update({ remaining_amount: listing.remaining_amount - amount })
        .eq('id', listing.id);

      alert(t('successMessage'));
      loadListings();
    } catch (error) {
      console.error('Error creating order:', error);
      alert(t('errorMessage'));
    }
  };

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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('p2pTitle')}</h1>
          <p className="text-gray-400">{t('p2pDesc')}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold rounded-lg transition-all shadow-lg shadow-amber-500/25"
        >
          <Plus className="h-5 w-5" />
          {t('createOffer')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-amber-500/20">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setTradeType('buy')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  tradeType === 'buy'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50'
                }`}
              >
                {t('buy')} عLK3
              </button>
              <button
                onClick={() => setTradeType('sell')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  tradeType === 'sell'
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50'
                }`}
              >
                {t('sell')} عLK3
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg mb-2">{t('noData')}</p>
                <p className="text-sm">{t('comingSoon')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="p-5 bg-slate-800/30 rounded-lg border border-amber-500/10 hover:border-amber-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold">
                            {(listing.user_name || 'A').charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-semibold">{listing.user_name || 'Anonyme'}</p>
                              {(listing.rating || 0) >= 4.5 && (
                                <CheckCircle className="h-4 w-4 text-emerald-400" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                              <span>{(listing.rating || 0).toFixed(1)}</span>
                              <span>•</span>
                              <span>{listing.total_trades} trades</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">{t('quantity')}</p>
                            <p className="text-white font-semibold">
                              {listing.remaining_amount.toLocaleString()} {listing.token_symbol}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">{t('price')}</p>
                            <p className="text-white font-semibold">
                              {listing.price} {listing.currency}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Limites</p>
                            <p className="text-white text-sm">
                              {listing.min_order} - {listing.max_order}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">{t('paymentMethod')}</p>
                            <div className="flex flex-wrap gap-1">
                              {listing.payment_methods.slice(0, 2).map((method, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded"
                                >
                                  {method}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>Délai de paiement: {listing.time_limit} minutes</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const amount = prompt(
                            `Quantité à ${tradeType === 'buy' ? 'acheter' : 'vendre'} (${listing.min_order}-${listing.max_order}):`
                          );
                          if (amount) {
                            const numAmount = parseFloat(amount);
                            if (numAmount >= listing.min_order && numAmount <= listing.max_order) {
                              handleCreateOrder(listing, numAmount);
                            } else {
                              alert('Montant invalide');
                            }
                          }
                        }}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                          tradeType === 'buy'
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                      >
                        {tradeType === 'buy' ? t('buy') : t('sell')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-lg rounded-xl p-6 border border-blue-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-blue-400" />
              <h3 className="text-lg font-bold text-white">{t('security')}</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Vos fonds sont sécurisés dans un contrat intelligent jusqu'à confirmation de la transaction.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Garantie 100%</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Support 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Résolution de litiges</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 backdrop-blur-lg rounded-xl p-6 border border-amber-500/20">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Conseils de sécurité</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Vérifiez toujours la réputation du trader</li>
              <li>• Ne partagez jamais vos clés privées</li>
              <li>• Utilisez le chat intégré uniquement</li>
              <li>• Respectez les délais de paiement</li>
            </ul>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateListingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadListings();
          }}
        />
      )}
    </div>
  );
}

function CreateListingModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    listing_type: 'sell',
    token_symbol: 'عLK3',
    amount: '',
    price: '',
    currency: 'GNF',
    payment_methods: ['Orange Money'],
    min_order: '',
    max_order: '',
    time_limit: '30',
    terms: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from('p2p_listings').insert({
        user_id: user.id,
        listing_type: formData.listing_type,
        token_symbol: formData.token_symbol,
        amount: parseFloat(formData.amount),
        remaining_amount: parseFloat(formData.amount),
        price: parseFloat(formData.price),
        currency: formData.currency,
        payment_methods: formData.payment_methods,
        min_order: parseFloat(formData.min_order),
        max_order: parseFloat(formData.max_order),
        time_limit: parseInt(formData.time_limit),
        terms: formData.terms,
        status: 'active',
      });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Erreur lors de la création de l\'offre');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full border border-amber-500/20">
        <h2 className="text-2xl font-bold text-white mb-4">Créer une offre P2P</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Type</label>
            <select
              value={formData.listing_type}
              onChange={(e) => setFormData({ ...formData, listing_type: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
            >
              <option value="sell">Vendre</option>
              <option value="buy">Acheter</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Quantité</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Prix par token</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Min</label>
              <input
                type="number"
                value={formData.min_order}
                onChange={(e) => setFormData({ ...formData, min_order: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Max</label>
              <input
                type="number"
                value={formData.max_order}
                onChange={(e) => setFormData({ ...formData, max_order: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold rounded-lg transition-all"
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
