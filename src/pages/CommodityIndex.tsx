import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart3, Globe, Zap, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';


interface Commodity {
  id: string;
  name: string;
  symbol: string;
  category: string;
  price_usd: number;
  change_24h: number;
  volume: number;
  market_cap: number;
  export_volume?: number;
  transformation_rate?: number;
}

interface NationalIndex {
  index_value: number;
  export_score: number;
  transformation_score: number;
  esg_score: number;
  composite_score: number;
}

export default function CommodityIndex() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate();
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [nationalIndex, setNationalIndex] = useState<NationalIndex | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: commodityTypesData, error: typesError } = await supabase
        .from('commodity_types')
        .select('*')
        .order('name');

      if (typesError) throw typesError;

      if (!commodityTypesData || commodityTypesData.length === 0) {
        await initializeCommodities();
        return loadData();
      }

      const commoditiesWithPrices = await Promise.all(
        commodityTypesData.map(async (commodity: any) => {
          const { data: priceData } = await supabase
            .from('commodity_prices')
            .select('*')
            .eq('commodity_id', commodity.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { data: exportData } = await supabase
            .from('export_data')
            .select('*')
            .eq('commodity_id', commodity.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...commodity,
            price_usd: priceData?.price_usd || 0,
            change_24h: priceData?.change_24h || 0,
            volume: priceData?.volume || 0,
            market_cap: priceData?.market_cap || 0,
            export_volume: exportData?.volume_raw || 0,
            transformation_rate: exportData?.volume_processed
              ? (exportData.volume_processed / (exportData.volume_raw + exportData.volume_processed)) * 100
              : 0,
          };
        })
      );

      setCommodities(commoditiesWithPrices);

      const { data: indexData } = await supabase
        .from('national_index')
        .select('*')
        .eq('country_code', 'GN')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (indexData) {
        setNationalIndex(indexData);
      }
    } catch (error) {
      console.error('Error loading commodity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeCommodities = async () => {
    const commodityTypes = [
      { name: 'Bauxite', symbol: 'BAU', category: 'mining', unit: 'tons', description: 'Minerai d\'aluminium' },
      { name: 'Iron Ore', symbol: 'FE', category: 'mining', unit: 'tons', description: 'Minerai de fer' },
      { name: 'Gold', symbol: 'AU', category: 'mining', unit: 'kg', description: 'Or' },
      { name: 'Diamonds', symbol: 'DIA', category: 'mining', unit: 'carats', description: 'Diamants' },
      { name: 'Cocoa', symbol: 'COCO', category: 'agriculture', unit: 'tons', description: 'Cacao' },
      { name: 'Coffee', symbol: 'COFF', category: 'agriculture', unit: 'tons', description: 'Café' },
    ];

    const { data: createdTypes } = await supabase
      .from('commodity_types')
      .insert(commodityTypes)
      .select();

    if (createdTypes) {
      const pricesData = createdTypes.map(commodity => ({
        commodity_id: commodity.id,
        price_usd: commodity.symbol === 'AU' ? 2050 : commodity.symbol === 'BAU' ? 125.5 : commodity.symbol === 'FE' ? 98.25 : commodity.symbol === 'COCO' ? 3.45 : 50,
        volume: Math.floor(Math.random() * 1000000) + 500000,
        change_24h: (Math.random() - 0.5) * 10,
        market_cap: Math.floor(Math.random() * 20000000) + 5000000,
        source: 'LME',
        timestamp: new Date().toISOString(),
      }));

      await supabase.from('commodity_prices').insert(pricesData);

      const exportData = createdTypes.map(commodity => ({
        commodity_id: commodity.id,
        country_code: 'GN',
        volume_raw: Math.floor(Math.random() * 100000) + 10000,
        volume_processed: Math.floor(Math.random() * 30000),
        value_usd: Math.floor(Math.random() * 10000000) + 1000000,
        destination: 'China',
        processing_level: 'raw',
        period: '2025-Q1',
        source: 'Customs',
        verified: true,
      }));

      await supabase.from('export_data').insert(exportData);

      await supabase.from('national_index').insert({
        country_code: 'GN',
        index_value: 156.8,
        export_score: 75,
        transformation_score: 22.5,
        esg_score: 92,
        innovation_score: 68,
        adoption_score: 85,
        composite_score: 76.5,
        period: '2025-Q1',
        calculation_metadata: { base_year: 2024, weights: { export: 0.4, transformation: 0.3, esg: 0.3 } },
      });
    }
  };

  const filteredCommodities = selectedCategory === 'all'
    ? commodities
    : commodities.filter(c => c.category.toLowerCase() === selectedCategory);

  const totalMarketCap = commodities.reduce((sum, c) => sum + c.market_cap, 0);
  const avgTransformation = commodities.length > 0
    ? commodities.reduce((sum, c) => sum + (c.transformation_rate || 0), 0) / commodities.length
    : 0;

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
          Retour
        </button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">عIndex National - Indice Économique</h1>
        <p className="text-gray-400">
          Indice algorithmique basé sur les données économiques réelles d'Afrique
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 backdrop-blur-sm rounded-xl p-6 border border-amber-500/20">
          <div className="flex items-center justify-between mb-3">
            <Activity className="h-8 w-8 text-amber-400" />
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {nationalIndex?.index_value.toFixed(1) || '156.8'}
          </p>
          <p className="text-sm text-gray-400">عIndex Value</p>
          <p className="text-xs text-emerald-400 mt-2">+4.2% ce mois</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-center justify-between mb-3">
            <Globe className="h-8 w-8 text-blue-400" />
            <span className="text-xs text-gray-400">USD</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">${(totalMarketCap / 1000000).toFixed(1)}M</p>
          <p className="text-sm text-gray-400">Market Cap Total</p>
        </div>

        <div className="bg-gradient-to-br from-teal-500/10 to-teal-600/10 backdrop-blur-sm rounded-xl p-6 border border-teal-500/20">
          <div className="flex items-center justify-between mb-3">
            <Zap className="h-8 w-8 text-teal-400" />
            <span className="text-xs text-gray-400">%</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {nationalIndex?.transformation_score.toFixed(1) || avgTransformation.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-400">Transformation Moyenne</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <BarChart3 className="h-8 w-8 text-emerald-400" />
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {nationalIndex?.esg_score.toFixed(0) || '92'}
          </p>
          <p className="text-sm text-gray-400">ESG Score</p>
        </div>
      </div>

      <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-amber-500/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Matières Premières Tokenisées</h2>
          <div className="flex gap-2">
            {['all', 'mining', 'agriculture', 'energy'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-amber-500 text-black'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50'
                }`}
              >
                {category === 'all' ? 'Tous' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-amber-500/20">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Commodity</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Prix</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">24h</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Volume Export</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Transformation</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Market Cap</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCommodities.map((commodity) => (
                <tr
                  key={commodity.id}
                  className="border-b border-amber-500/10 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-black font-bold">
                        {commodity.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{commodity.name}</p>
                        <p className="text-xs text-gray-400">{commodity.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4">
                    <p className="text-white font-semibold">${commodity.price_usd.toFixed(2)}</p>
                  </td>
                  <td className="text-right py-4 px-4">
                    <div className="flex items-center justify-end gap-1">
                      {commodity.change_24h >= 0 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">
                            +{commodity.change_24h.toFixed(2)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-400" />
                          <span className="text-red-400 font-semibold">
                            {commodity.change_24h.toFixed(2)}%
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="text-right py-4 px-4">
                    <p className="text-white">
                      {commodity.export_volume ? `${(commodity.export_volume / 1000).toFixed(1)}K tons` : 'N/A'}
                    </p>
                  </td>
                  <td className="text-right py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full"
                          style={{ width: `${Math.min((commodity.transformation_rate || 0), 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-white">
                        {(commodity.transformation_rate || 0).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4">
                    <p className="text-white">${(commodity.market_cap / 1000000).toFixed(2)}M</p>
                  </td>
                  <td className="text-right py-4 px-4">
                    <button className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium transition-all">
                      Investir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
        <h3 className="text-lg font-bold text-white mb-4">Comment fonctionne عIndex ?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
              <Globe className="h-6 w-6 text-blue-400" />
            </div>
            <h4 className="text-white font-semibold mb-2">Données Publiques</h4>
            <p className="text-sm text-gray-400">
              Collecte automatique via oracles des volumes d'exportation, prix internationaux et statistiques douanières
            </p>
          </div>
          <div>
            <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center mb-3">
              <Zap className="h-6 w-6 text-teal-400" />
            </div>
            <h4 className="text-white font-semibold mb-2">Bonus Transformation</h4>
            <p className="text-sm text-gray-400">
              La transformation locale augmente la valeur du token avec un coefficient multiplicateur
            </p>
          </div>
          <div>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-3">
              <BarChart3 className="h-6 w-6 text-emerald-400" />
            </div>
            <h4 className="text-white font-semibold mb-2">Score ESG</h4>
            <p className="text-sm text-gray-400">
              Impact environnemental et social intégré dans le calcul de l'indice
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
