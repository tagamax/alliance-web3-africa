import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { TrendingUp, Zap, Lock, DollarSign, Activity, ArrowLeft } from 'lucide-react';


interface MiningPool {
  id: string;
  name: string;
  commodity: string;
  type: string;
  apy: number;
  lockDays: number;
  minInvestment: number;
  currentAmount: number;
  targetAmount: number;
  participants: number;
  indexWeights: {
    export: number;
    transformation: number;
    esg: number;
  };
}

const MOCK_POOLS: MiningPool[] = [
  {
    id: '1',
    name: 'Bauxite Export Index Pool',
    commodity: 'Bauxite',
    type: 'Export Index',
    apy: 15.5,
    lockDays: 90,
    minInvestment: 500,
    currentAmount: 780000,
    targetAmount: 1000000,
    participants: 234,
    indexWeights: { export: 60, transformation: 30, esg: 10 },
  },
  {
    id: '2',
    name: 'Gold Transformation Pool',
    commodity: 'Gold',
    type: 'Transformation',
    apy: 22.0,
    lockDays: 180,
    minInvestment: 1000,
    currentAmount: 340000,
    targetAmount: 500000,
    participants: 145,
    indexWeights: { export: 20, transformation: 60, esg: 20 },
  },
  {
    id: '3',
    name: 'Cocoa ESG Bonus Pool',
    commodity: 'Cocoa',
    type: 'ESG Bonus',
    apy: 18.0,
    lockDays: 120,
    minInvestment: 300,
    currentAmount: 215000,
    targetAmount: 300000,
    participants: 189,
    indexWeights: { export: 30, transformation: 30, esg: 40 },
  },
  {
    id: '4',
    name: 'Iron Ore Mixed Pool',
    commodity: 'Iron Ore',
    type: 'Mixed',
    apy: 16.5,
    lockDays: 60,
    minInvestment: 250,
    currentAmount: 450000,
    targetAmount: 800000,
    participants: 312,
    indexWeights: { export: 40, transformation: 40, esg: 20 },
  },
];

export default function MiningPools() {
  const navigate = useNavigate();
  const [selectedPool, setSelectedPool] = useState<MiningPool | null>(null);
  const [investAmount, setInvestAmount] = useState('');

  const handleInvest = () => {
    if (!selectedPool || !investAmount) return;
    setSelectedPool(null);
    setInvestAmount('');
  };

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
        <h1 className="text-3xl font-bold text-white mb-2">Mining Pools Virtuels</h1>
        <p className="text-gray-400">
          Investissez dans des pools indexés sur les données économiques réelles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 backdrop-blur-sm rounded-xl p-4 border border-amber-500/20">
          <TrendingUp className="h-6 w-6 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">$2.8M</p>
          <p className="text-sm text-gray-400">TVL Total</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/20">
          <DollarSign className="h-6 w-6 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">18.2%</p>
          <p className="text-sm text-gray-400">APY Moyen</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
          <Activity className="h-6 w-6 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">880</p>
          <p className="text-sm text-gray-400">Participants</p>
        </div>
        <div className="bg-gradient-to-br from-teal-500/10 to-teal-600/10 backdrop-blur-sm rounded-xl p-4 border border-teal-500/20">
          <Zap className="h-6 w-6 text-teal-400 mb-2" />
          <p className="text-2xl font-bold text-white">$124K</p>
          <p className="text-sm text-gray-400">Rewards distribués</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
        <h3 className="text-lg font-bold text-white mb-3">Innovation unique</h3>
        <p className="text-gray-300 mb-4">
          Les Mining Pools sont des pools d'investissement basés sur des données économiques réelles.
          Vous n'investissez pas dans des mines physiques, mais dans la valeur générée par les exportations,
          la transformation locale et l'impact ESG.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <strong className="text-amber-400">Export Index:</strong> Basé sur le volume d'exportation réel
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <strong className="text-teal-400">Transformation:</strong> Bonus pour transformation locale
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <strong className="text-emerald-400">ESG Score:</strong> Impact environnemental & social
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {MOCK_POOLS.map((pool) => {
          const progressPercentage = (pool.currentAmount / pool.targetAmount) * 100;

          return (
            <div
              key={pool.id}
              className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-amber-500/10 hover:border-amber-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{pool.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full">
                      {pool.commodity}
                    </span>
                    <span className="text-sm px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                      {pool.type}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-emerald-400">{pool.apy}%</p>
                  <p className="text-sm text-gray-400">APY</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="h-4 w-4 text-gray-400" />
                    <p className="text-xs text-gray-400">Période</p>
                  </div>
                  <p className="text-sm font-bold text-white">{pool.lockDays} {t('days_unit')}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Minimum</p>
                  <p className="text-sm font-bold text-white">{pool.minInvestment} عLK3</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Pool TVL</p>
                  <p className="text-sm font-bold text-white">
                    ${(pool.currentAmount / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Participants</p>
                  <p className="text-sm font-bold text-white">{pool.participants}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Progression du pool</span>
                  <span className="text-white font-semibold">{progressPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-400 mb-2">Poids de l'indice</p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Export</p>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full"
                          style={{ width: `${pool.indexWeights.export}%` }}
                        />
                      </div>
                      <span className="text-xs text-white">{pool.indexWeights.export}%</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Transform</p>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                        <div
                          className="bg-teal-500 h-1.5 rounded-full"
                          style={{ width: `${pool.indexWeights.transformation}%` }}
                        />
                      </div>
                      <span className="text-xs text-white">{pool.indexWeights.transformation}%</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">ESG</p>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${pool.indexWeights.esg}%` }}
                        />
                      </div>
                      <span className="text-xs text-white">{pool.indexWeights.esg}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPool(pool)}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-emerald-500/25"
              >
                Investir dans ce pool
              </button>
            </div>
          );
        })}
      </div>

      {selectedPool && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-amber-500/20">
            <h2 className="text-2xl font-bold text-white mb-4">Investir dans {selectedPool.name}</h2>

            <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-amber-500/10">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">APY</span>
                <span className="text-emerald-400 font-bold">{selectedPool.apy}%</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Période de blocage</span>
                <span className="text-white">{selectedPool.lockDays} {t('days_unit')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Minimum</span>
                <span className="text-white">{selectedPool.minInvestment} عLK3</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Montant à investir (عLK3)
              </label>
              <input
                type="number"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                placeholder={`Min ${selectedPool.minInvestment}`}
                className="w-full px-4 py-3 bg-slate-800 border border-amber-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              {investAmount && Number(investAmount) >= selectedPool.minInvestment && (
                <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                  <p className="text-sm text-emerald-400">
                    Rewards estimés après {selectedPool.lockDays} {t('days_unit')}: {' '}
                    <strong>
                      {((Number(investAmount) * selectedPool.apy / 100) * (selectedPool.lockDays / 365)).toFixed(2)} عLK3
                    </strong>
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedPool(null);
                  setInvestAmount('');
                }}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleInvest}
                disabled={!investAmount || Number(investAmount) < selectedPool.minInvestment}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg shadow-emerald-500/25"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
