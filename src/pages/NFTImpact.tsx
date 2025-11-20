import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Leaf, Trees, Fish, Bird, Mountain, Droplet, Globe, Shield, MapPin, ArrowLeft, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { translateCategoryName } from '../lib/translationHelpers';


interface NFTCategory {
  id: string;
  name: string;
  description: string;
  total_minted: number;
}

interface NFT {
  id: string;
  name: string;
  description: string;
  location: string;
  area_size: number;
  carbon_credits: number;
  esg_impact_score: number;
  image_url: string;
  category_id: string;
  category_name?: string;
  verification_status: string;
}

const CATEGORY_ICONS: { [key: string]: any } = {
  'Mangroves': Trees,
  'Forêts': Trees,
  'Animaux': Bird,
  'Grandes plaines': Mountain,
  'Faune en danger': Fish,
  'Cours d\'eau': Droplet,
  'Biodiversité': Leaf,
  'Zones protégées': Shield,
  'Parcs nationaux': Globe,
};

const CATEGORY_COLORS: { [key: string]: string } = {
  'Mangroves': 'from-teal-500 to-teal-600',
  'Forêts': 'from-green-500 to-green-600',
  'Animaux': 'from-gray-500 to-gray-600',
  'Grandes plaines': 'from-amber-500 to-amber-600',
  'Faune en danger': 'from-red-500 to-red-600',
  'Cours d\'eau': 'from-blue-500 to-blue-600',
  'Biodiversité': 'from-emerald-500 to-emerald-600',
  'Zones protégées': 'from-violet-500 to-violet-600',
  'Parcs nationaux': 'from-cyan-500 to-cyan-600',
};

export default function NFTImpact() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<NFTCategory[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [myNFTs, setMyNFTs] = useState<NFT[]>([]);


  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: categoriesData, error: catError } = await supabase
        .from('nft_impact_categories')
        .select('*')
        .order('name');

      if (catError) throw catError;

      if (!categoriesData || categoriesData.length === 0) {
        await initializeCategories();
        return loadData();
      }

      setCategories(categoriesData || []);

      const { data: nftsData, error: nftsError } = await supabase
        .from('nft_impacts')
        .select(`
          *,
          nft_impact_categories (name)
        `)
        .eq('verification_status', 'verified')
        .is('owner_id', null);

      if (nftsError) throw nftsError;

      const nftsWithCategory = (nftsData || []).map((nft: any) => ({
        ...nft,
        category_name: nft.nft_impact_categories?.name,
      }));

      setNfts(nftsWithCategory);

      if (user) {
        const { data: myNFTsData } = await supabase
          .from('nft_impacts')
          .select(`
            *,
            nft_impact_categories (name)
          `)
          .eq('owner_id', user.id);

        const myNFTsWithCategory = (myNFTsData || []).map((nft: any) => ({
          ...nft,
          category_name: nft.nft_impact_categories?.name,
        }));

        setMyNFTs(myNFTsWithCategory);
      }
    } catch (error) {
      console.error('Error loading NFT data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeCategories = async () => {
    const categoriesData = [
      { name: 'Mangroves', description: 'Protection des mangroves côtières', icon: 'trees' },
      { name: 'Forêts', description: 'Conservation des forêts tropicales', icon: 'trees' },
      { name: 'Animaux', description: 'Protection de la faune sauvage', icon: 'bird' },
      { name: 'Grandes plaines', description: 'Préservation des plaines', icon: 'mountain' },
      { name: 'Faune en danger', description: 'Espèces menacées', icon: 'fish' },
      { name: 'Cours d\'eau', description: 'Protection des rivières et lacs', icon: 'droplet' },
      { name: 'Biodiversité', description: 'Conservation de la biodiversité', icon: 'leaf' },
      { name: 'Zones protégées', description: 'Zones de conservation', icon: 'shield' },
      { name: 'Parcs nationaux', description: 'Parcs nationaux africains', icon: 'globe' },
    ];

    const { error } = await supabase
      .from('nft_impact_categories')
      .insert(categoriesData);

    if (error) console.error('Error creating categories:', error);

    await createSampleNFTs();
  };

  const createSampleNFTs = async () => {
    const { data: categories } = await supabase
      .from('nft_impact_categories')
      .select('id, name');

    if (!categories) return;

    const mangrovesCat = categories.find(c => c.name === 'Mangroves');
    const forestsCat = categories.find(c => c.name === 'Forêts');
    const waterCat = categories.find(c => c.name === 'Cours d\'eau');

    const sampleNFTs = [
      {
        category_id: mangrovesCat?.id,
        name: 'Mangrove de Kakossa',
        description: 'Protection de 15.5 hectares de mangroves dans la région de Boké',
        location: 'Région de Boké, Guinée',
        coordinates: { lat: 10.9345, lng: -14.2928 },
        area_size: 15.5,
        image_url: 'https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg',
        carbon_credits: 250,
        esg_impact_score: 95,
        verification_status: 'verified',
        verified_by: 'Ministry of Environment, Guinea',
        blockchain_address: `0x${Math.random().toString(16).substring(2, 42)}`,
        token_id: `NFT-${Date.now()}-1`,
      },
      {
        category_id: forestsCat?.id,
        name: 'Forêt de Ziama',
        description: 'Conservation de 50.2 hectares de forêt tropicale en Guinée Forestière',
        location: 'Guinée Forestière',
        coordinates: { lat: 8.3667, lng: -8.9333 },
        area_size: 50.2,
        image_url: 'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg',
        carbon_credits: 1200,
        esg_impact_score: 98,
        verification_status: 'verified',
        verified_by: 'UNESCO World Heritage',
        blockchain_address: `0x${Math.random().toString(16).substring(2, 42)}`,
        token_id: `NFT-${Date.now()}-2`,
      },
      {
        category_id: waterCat?.id,
        name: 'Rivière Niger - Segment',
        description: 'Protection de 8.3 km de berges du fleuve Niger',
        location: 'Haute Guinée',
        coordinates: { lat: 10.0, lng: -9.0 },
        area_size: 8.3,
        image_url: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
        carbon_credits: 180,
        esg_impact_score: 92,
        verification_status: 'verified',
        verified_by: 'Basin Authority',
        blockchain_address: `0x${Math.random().toString(16).substring(2, 42)}`,
        token_id: `NFT-${Date.now()}-3`,
      },
    ];

    await supabase.from('nft_impacts').insert(sampleNFTs);
  };

  const handlePurchaseNFT = async (nft: NFT) => {
    if (!user) {
      alert(t('signIn'));
      return;
    }

    const price = nft.carbon_credits * 2;

    const { data: balanceData } = await supabase
      .from('token_balances')
      .select('balance')
      .eq('user_id', user.id)
      .eq('token_symbol', 'عLK3')
      .single();

    if (!balanceData || balanceData.balance < price) {
      alert(t('insufficientBalance'));
      return;
    }

    try {
      await supabase
        .from('nft_impacts')
        .update({ owner_id: user.id })
        .eq('id', nft.id);

      await supabase
        .from('token_balances')
        .update({ balance: balanceData.balance - price })
        .eq('user_id', user.id)
        .eq('token_symbol', 'عLK3');

      await supabase.from('transactions').insert({
        user_id: user.id,
        transaction_hash: `0x${Math.random().toString(16).substring(2)}`,
        transaction_type: 'nft',
        from_currency: 'عLK3',
        to_currency: 'NFT',
        amount_from: price,
        amount_to: 1,
        fee: 0,
        status: 'completed',
        metadata: {
          nft_id: nft.id,
          nft_name: nft.name,
          carbon_credits: nft.carbon_credits,
        },
        completed_at: new Date().toISOString(),
      });

      alert(t('successMessage'));
      loadData();
    } catch (error) {
      console.error('Error purchasing NFT:', error);
      alert(t('errorMessage'));
    }
  };

  const filteredNFTs = selectedCategory
    ? nfts.filter(nft => nft.category_id === selectedCategory)
    : nfts;

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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('nftImpactTitle')}</h1>
          <p className="text-gray-400">
            {t('nftImpactDesc')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">{t('myNFTs')}</p>
          <p className="text-2xl font-bold text-emerald-400">{myNFTs.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`p-3 rounded-xl border-2 transition-all ${
            selectedCategory === null
              ? 'border-amber-500 bg-amber-500/20'
              : 'border-slate-700 bg-slate-800/50 hover:border-amber-500/50'
          }`}
        >
          <Globe className="h-6 w-6 text-white mx-auto mb-1" />
          <p className="text-xs text-white font-medium">{t('all')}</p>
        </button>
        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category.name] || Leaf;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-3 rounded-xl border-2 transition-all ${
                selectedCategory === category.id
                  ? 'border-amber-500 bg-amber-500/20'
                  : 'border-slate-700 bg-slate-800/50 hover:border-amber-500/50'
              }`}
            >
              <Icon className="h-6 w-6 text-white mx-auto mb-1" />
              <p className="text-xs text-white font-medium truncate">{translateCategoryName(t, category.name)}</p>
              <p className="text-xs text-gray-400">{category.total_minted}</p>
            </button>
          );
        })}
      </div>

      {filteredNFTs.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700">
          <Leaf className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">{t('noData')}</p>
          <p className="text-gray-500 text-sm">{t('comingSoon')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNFTs.map((nft) => {
            const color = CATEGORY_COLORS[nft.category_name || ''] || 'from-gray-500 to-gray-600';
            const price = nft.carbon_credits * 2;

            return (
              <div
                key={nft.id}
                className="bg-slate-800/50 backdrop-blur-lg rounded-xl overflow-hidden border border-amber-500/20 hover:border-amber-500/50 transition-all"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={nft.image_url}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute top-3 left-3 px-3 py-1 bg-gradient-to-r ${color} rounded-full text-white text-xs font-semibold`}>
                    {nft.category_name}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-2">{nft.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                    <MapPin className="h-4 w-4" />
                    <span>{nft.location}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">{t('impactArea')}</p>
                      <p className="text-sm font-bold text-white">{nft.area_size} ha</p>
                    </div>
                    <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">{t('carbonOffset')}</p>
                      <p className="text-sm font-bold text-emerald-400">{nft.carbon_credits}</p>
                    </div>
                    <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">{t('esgScore')}</p>
                      <p className="text-sm font-bold text-blue-400">{nft.esg_impact_score}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">{t('price')}</p>
                      <p className="text-xl font-bold text-amber-400">{price} عLK3</p>
                    </div>
                    <button
                      onClick={() => handlePurchaseNFT(nft)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {t('buy')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
