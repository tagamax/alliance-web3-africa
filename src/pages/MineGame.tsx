import { useState, useEffect } from 'react';
import {
  Pickaxe, Leaf, Zap, Droplet, Trees, Bird,
  TrendingUp, Shield, Map, Package, Play,
  Star, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { translateRiskLevel, translateGuardianTier } from '../lib/translationHelpers';

interface PlayerStats {
  xp_points: number;
  level: number;
  esg_reputation: number;
  guardian_tier: string;
  total_simulations: number;
  total_carbon_offset: number;
  total_trees_planted: number;
}

interface MineZone {
  id: string;
  name: string;
  resource_type: string;
  resource_density: number;
  biodiversity_level: number;
  water_quality: number;
  risk_level: string;
  is_protected: boolean;
}

export default function MineGame() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [zones, setZones] = useState<MineZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    loadPlayerStats();
    loadZones();
  }, [user]);

  const loadPlayerStats = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('mine_players')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!data && !error) {
      await supabase.from('mine_players').insert({
        user_id: user.id,
        xp_points: 0,
        level: 1,
        esg_reputation: 0,
        guardian_tier: 'bronze',
      });
      loadPlayerStats();
    } else if (data) {
      setPlayerStats(data);
    }
  };

  const loadZones = async () => {
    const mockZones: MineZone[] = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Forêt de Ziama',
        resource_type: 'Or',
        resource_density: 75,
        biodiversity_level: 90,
        water_quality: 85,
        risk_level: 'high',
        is_protected: true,
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Plateau de Fouta',
        resource_type: 'Bauxite',
        resource_density: 85,
        biodiversity_level: 70,
        water_quality: 75,
        risk_level: 'medium',
        is_protected: false,
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Bassin du Niger',
        resource_type: 'Diamant',
        resource_density: 60,
        biodiversity_level: 95,
        water_quality: 90,
        risk_level: 'critical',
        is_protected: true,
      },
    ];
    setZones(mockZones);
  };

  const startSimulation = async () => {
    if (!selectedZone || !selectedMode || !user) {
      alert(t('selectZoneAndMode'));
      return;
    }

    setLoading(true);

    try {
      const impacts = calculateImpacts(selectedMode);
      const zone = zones.find(z => z.id === selectedZone);

      // Insert simulation
      const { data, error } = await supabase
        .from('mining_simulations')
        .insert({
          user_id: user.id,
          zone_id: selectedZone,
          exploitation_mode: selectedMode,
          duration_days: 30,
          resource_extracted: impacts.resource,
          revenue_generated: impacts.revenue,
          water_pollution_level: impacts.water,
          soil_degradation_level: impacts.soil,
          biodiversity_loss: impacts.biodiversity,
          carbon_emissions_tons: impacts.carbon,
          population_impact: impacts.population,
          esg_score: impacts.esg_score,
        })
        .select()
        .single();

      if (error) {
        console.error('Simulation error:', error);
        alert(t('simulationError') + ': ' + error.message);
        setLoading(false);
        return;
      }

      // Update player stats
      const { error: updateError } = await supabase
        .from('mine_players')
        .update({
          xp_points: (playerStats?.xp_points || 0) + impacts.xp,
          total_simulations: (playerStats?.total_simulations || 0) + 1,
          esg_reputation: (playerStats?.esg_reputation || 0) + Math.floor(impacts.esg_score / 10),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
      }

      // Show result
      setSimulationResult({
        zone: zone?.name,
        mode: selectedMode,
        ...impacts
      });
      setShowResult(true);

      // Reload stats
      await loadPlayerStats();

    } catch (err: any) {
      console.error('Simulation error:', err);
      alert('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateImpacts = (mode: string) => {
    const zone = zones.find(z => z.id === selectedZone);
    if (!zone) return { resource: 0, revenue: 0, water: 0, soil: 0, biodiversity: 0, carbon: 0, population: 0, esg_score: 0, xp: 0 };

    let multiplier = 1;
    let pollution = 20;
    let xp = 50;

    if (mode === 'artisanal') {
      multiplier = 0.5;
      pollution = 10;
      xp = 30;
    } else if (mode === 'semi-mechanized') {
      multiplier = 1.5;
      pollution = 40;
      xp = 80;
    } else if (mode === 'industrial') {
      multiplier = 3;
      pollution = 70;
      xp = 150;
    }

    const resource = Math.floor(zone.resource_density * multiplier);
    const revenue = resource * 10;
    const water = pollution;
    const soil = pollution * 0.8;
    const biodiversity = pollution * 0.6;
    const carbon = pollution * 0.05;
    const population = pollution * 0.4;
    const esg_score = Math.max(0, 100 - pollution);

    return { resource, revenue, water, soil, biodiversity, carbon, population, esg_score, xp };
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'critical': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-amber-700 bg-amber-500/20';
      case 'silver': return 'text-gray-300 bg-gray-500/20';
      case 'gold': return 'text-yellow-400 bg-yellow-500/20';
      case 'platinum': return 'text-cyan-400 bg-cyan-500/20';
      case 'diamond': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Pickaxe className="h-10 w-10 text-amber-400" />
              {t('mineGame')}
            </h1>
            <p className="text-gray-400">{t('educationalDesc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-amber-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Star className="h-5 w-5 text-amber-400" />
              <span className="text-gray-400">{t('level')}</span>
            </div>
            <p className="text-3xl font-bold text-white">{playerStats?.level || 1}</p>
            <p className="text-sm text-gray-400">{playerStats?.xp_points || 0} XP</p>
          </div>

          <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-emerald-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              <span className="text-gray-400">{t('esgReputation')}</span>
            </div>
            <p className="text-3xl font-bold text-white">{playerStats?.esg_reputation || 0}</p>
            <span className={`text-xs px-2 py-1 rounded-full ${getTierColor(playerStats?.guardian_tier || 'bronze')}`}>
              {translateGuardianTier(t, playerStats?.guardian_tier || 'bronze').toUpperCase()}
            </span>
          </div>

          <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-green-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Trees className="h-5 w-5 text-green-400" />
              <span className="text-gray-400">{t('treesPlanted')}</span>
            </div>
            <p className="text-3xl font-bold text-white">{playerStats?.total_trees_planted || 0}</p>
            <p className="text-sm text-gray-400">{playerStats?.total_carbon_offset?.toFixed(2) || 0} t CO₂</p>
          </div>

          <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-blue-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Play className="h-5 w-5 text-blue-400" />
              <span className="text-gray-400">{t('simulations')}</span>
            </div>
            <p className="text-3xl font-bold text-white">{playerStats?.total_simulations || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-amber-500/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Map className="h-6 w-6 text-amber-400" />
              {t('miningZones')}
            </h2>

            <div className="space-y-4">
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedZone === zone.id
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">{zone.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(zone.risk_level)}`}>
                      {translateRiskLevel(t, zone.risk_level).toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-amber-400" />
                      <span className="text-gray-400">{zone.resource_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      <span className="text-gray-400">{t('density')}: {zone.resource_density}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bird className="h-4 w-4 text-green-400" />
                      <span className="text-gray-400">{t('bio')}: {zone.biodiversity_level}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-400">{t('water')}: {zone.water_quality}%</span>
                    </div>
                  </div>

                  {zone.is_protected && (
                    <div className="mt-2 flex items-center gap-2 text-yellow-400 text-xs">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{t('protectedZone')}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-emerald-500/20">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="h-6 w-6 text-emerald-400" />
                {t('exploitationMode')}
              </h2>

              <div className="space-y-3">
                {['artisanal', 'semi-mechanized', 'industrial'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    disabled={!selectedZone}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedMode === mode
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <h3 className="text-lg font-bold text-white mb-1">{mode === 'artisanal' ? t('artisanal') : mode === 'semi-mechanized' ? t('semiMechanized') : t('industrial')}</h3>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                      <div>
                        <p className="text-emerald-400">{t('gains')}</p>
                        <p>{mode === 'artisanal' ? t('low') : mode === 'semi-mechanized' ? t('medium') : t('high')}</p>
                      </div>
                      <div>
                        <p className="text-orange-400">{t('pollution')}</p>
                        <p>{mode === 'artisanal' ? t('low') : mode === 'semi-mechanized' ? t('medium') : t('high')}</p>
                      </div>
                      <div>
                        <p className="text-amber-400">XP</p>
                        <p>+{mode === 'artisanal' ? '30' : mode === 'semi-mechanized' ? '80' : '150'}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startSimulation}
              disabled={!selectedZone || !selectedMode || loading}
              className="w-full py-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xl flex items-center justify-center gap-3 shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                  <span>{t('loading')}..</span>
                </>
              ) : (
                <>
                  <Play className="h-6 w-6" />
                  {t('startSimulation')}
                </>
              )}
            </button>

            {!selectedZone && !selectedMode && (
              <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm">👆 Sélectionnez d'abord une zone et un mode</p>
              </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Leaf className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-semibold mb-1">Mode Éducatif</p>
                  <p>Chaque simulation génère des données ESG réelles. Les impacts négatifs peuvent être compensés par des NFT environnementaux (arbres, protection faune).</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Result Modal */}
      {showResult && simulationResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border-2 border-amber-500 shadow-2xl shadow-amber-500/20">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-4">
                <Play className="h-8 w-8 text-amber-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Simulation Terminée!</h2>
              <p className="text-gray-400">{simulationResult.zone} • {simulationResult.mode}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Ressources Extraites</p>
                <p className="text-2xl font-bold text-amber-400">{simulationResult.resource} unités</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Revenu Généré</p>
                <p className="text-2xl font-bold text-emerald-400">{simulationResult.revenue} عLK3</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Score ESG</p>
                <p className="text-2xl font-bold text-blue-400">{simulationResult.esg_score}/100</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">XP Gagné</p>
                <p className="text-2xl font-bold text-purple-400">+{simulationResult.xp} XP</p>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Impacts Environnementaux
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('pollution')} eau:</span>
                  <span className="text-red-400">{simulationResult.water.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dégradation sol:</span>
                  <span className="text-red-400">{simulationResult.soil.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Perte biodiversité:</span>
                  <span className="text-red-400">{simulationResult.biodiversity.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Émissions CO₂:</span>
                  <span className="text-red-400">{simulationResult.carbon.toFixed(2)} t</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowResult(false);
                setSimulationResult(null);
                setSelectedZone('');
                setSelectedMode('');
              }}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold rounded-xl transition-all"
            >
              Continuer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
