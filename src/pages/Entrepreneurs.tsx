import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Star, Award, CheckCircle, ThumbsUp, AlertTriangle, FileText, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';


interface Entrepreneur {
  id: string;
  companyName: string;
  category: string;
  rating: number;
  totalProjects: number;
  successRate: number;
  totalValue: number;
  verified: boolean;
  city: string;
  description: string;
  supportCount: number;
}

const MOCK_ENTREPRENEURS: Entrepreneur[] = [
  {
    id: '1',
    companyName: 'BTP Guinée Construction',
    category: 'Construction',
    rating: 4.8,
    totalProjects: 45,
    successRate: 95.5,
    totalValue: 12500000,
    verified: true,
    city: 'Conakry',
    description: 'Spécialisé dans les infrastructures routières et bâtiments publics',
    supportCount: 1250,
  },
  {
    id: '2',
    companyName: 'Agro-Tech Solutions',
    category: 'Agriculture',
    rating: 4.9,
    totalProjects: 28,
    successRate: 96.4,
    totalValue: 8900000,
    verified: true,
    city: 'Kindia',
    description: 'Technologies agricoles modernes et irrigation',
    supportCount: 890,
  },
  {
    id: '3',
    companyName: 'Digital Guinea Services',
    category: 'Technologie',
    rating: 4.7,
    totalProjects: 32,
    successRate: 93.8,
    totalValue: 5600000,
    verified: true,
    city: 'Conakry',
    description: 'Solutions digitales pour administration publique',
    supportCount: 670,
  },
];

interface PublicProject {
  id: string;
  name: string;
  agency: string;
  budget: number;
  status: string;
  progress: number;
  supportCount: number;
  concernCount: number;
}

const MOCK_PROJECTS: PublicProject[] = [
  {
    id: '1',
    name: 'Construction École Primaire - Dubreka',
    agency: 'Ministere Education Nationale',
    budget: 450000,
    status: 'in_progress',
    progress: 65,
    supportCount: 234,
    concernCount: 3,
  },
  {
    id: '2',
    name: 'Réfection Route Nationale RN1',
    agency: 'Ministère des Travaux Publics',
    budget: 2500000,
    status: 'in_progress',
    progress: 42,
    supportCount: 567,
    concernCount: 12,
  },
];

export default function Entrepreneurs() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'entrepreneurs' | 'projects'>('entrepreneurs');
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState<Entrepreneur | null>(null);

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
        <h1 className="text-3xl font-bold text-white mb-2">Entrepreneurs & Marchés Publics</h1>
        <p className="text-gray-400">
          Transparence totale sur les projets publics et garanties citoyennes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
          <Building2 className="h-6 w-6 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">234</p>
          <p className="text-sm text-gray-400">Entrepreneurs vérifiés</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/20">
          <FileText className="h-6 w-6 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">156</p>
          <p className="text-sm text-gray-400">Projets actifs</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 backdrop-blur-sm rounded-xl p-4 border border-amber-500/20">
          <ThumbsUp className="h-6 w-6 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">12.4K</p>
          <p className="text-sm text-gray-400">Soutiens citoyens</p>
        </div>
        <div className="bg-gradient-to-br from-teal-500/10 to-teal-600/10 backdrop-blur-sm rounded-xl p-4 border border-teal-500/20">
          <Award className="h-6 w-6 text-teal-400 mb-2" />
          <p className="text-2xl font-bold text-white">94.8%</p>
          <p className="text-sm text-gray-400">Taux de réussite</p>
        </div>
      </div>

      <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl border border-amber-500/20">
        <div className="flex border-b border-amber-500/20">
          <button
            onClick={() => setActiveTab('entrepreneurs')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'entrepreneurs'
                ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Entrepreneurs
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'projects'
                ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Projets Publics
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'entrepreneurs' ? (
            <div className="space-y-4">
              {MOCK_ENTREPRENEURS.map((entrepreneur) => (
                <div
                  key={entrepreneur.id}
                  className="bg-slate-800/50 rounded-xl p-6 border border-amber-500/10 hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-black font-bold text-xl">
                        {entrepreneur.companyName.slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-white">{entrepreneur.companyName}</h3>
                          {entrepreneur.verified && (
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-sm text-gray-400">{entrepreneur.city}</span>
                          <span className="text-sm px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                            {entrepreneur.category}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                            <span className="text-sm text-white font-semibold">{entrepreneur.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">{entrepreneur.description}</p>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Projets réalisés</p>
                            <p className="text-lg font-bold text-white">{entrepreneur.totalProjects}</p>
                          </div>
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Taux de réussite</p>
                            <p className="text-lg font-bold text-emerald-400">{entrepreneur.successRate}%</p>
                          </div>
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Valeur livrée</p>
                            <p className="text-lg font-bold text-white">
                              ${(entrepreneur.totalValue / 1000000).toFixed(1)}M
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-3">
                        <ThumbsUp className="h-4 w-4 text-amber-400" />
                        <span className="text-sm text-white font-semibold">
                          {entrepreneur.supportCount} soutiens
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedEntrepreneur(entrepreneur)}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold rounded-lg transition-all shadow-lg shadow-amber-500/25"
                      >
                        Voir le profil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {MOCK_PROJECTS.map((project) => (
                <div
                  key={project.id}
                  className="bg-slate-800/50 rounded-xl p-6 border border-amber-500/10 hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{project.name}</h3>
                      <p className="text-sm text-gray-400 mb-3">{project.agency}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                          En cours
                        </span>
                        <span className="text-sm text-gray-400">
                          Budget: ${(project.budget / 1000).toFixed(0)}K
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Progression</span>
                      <span className="text-white font-semibold">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm text-white">{project.supportCount} soutiens</span>
                      </div>
                      {project.concernCount > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          <span className="text-sm text-white">{project.concernCount} préoccupations</span>
                        </div>
                      )}
                    </div>
                    <button className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-all">
                      Suivre le projet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-teal-500/10 to-teal-600/10 backdrop-blur-sm rounded-xl p-6 border border-teal-500/20">
        <h3 className="text-lg font-bold text-white mb-4">Comment ça marche ?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center mb-3">
              <Building2 className="h-6 w-6 text-teal-400" />
            </div>
            <h4 className="text-white font-semibold mb-2">Transparence Totale</h4>
            <p className="text-sm text-gray-400">
              Tous les projets publics sont visibles avec budgets, délais et entrepreneurs
            </p>
          </div>
          <div>
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mb-3">
              <ThumbsUp className="h-6 w-6 text-amber-400" />
            </div>
            <h4 className="text-white font-semibold mb-2">Garantie Citoyenne</h4>
            <p className="text-sm text-gray-400">
              Les citoyens peuvent soutenir ou signaler des préoccupations (micro-paiement)
            </p>
          </div>
          <div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
              <Award className="h-6 w-6 text-blue-400" />
            </div>
            <h4 className="text-white font-semibold mb-2">{t('crownReputation')}</h4>
            <p className="text-sm text-gray-400">
              Les entrepreneurs gagnent en réputation avec chaque projet réussi
            </p>
          </div>
        </div>
      </div>

      {selectedEntrepreneur && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full border border-amber-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-black font-bold text-2xl">
                  {selectedEntrepreneur.companyName.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-white">{selectedEntrepreneur.companyName}</h2>
                    {selectedEntrepreneur.verified && (
                      <CheckCircle className="h-6 w-6 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-gray-400">{selectedEntrepreneur.city}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEntrepreneur(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-300 mb-6">{selectedEntrepreneur.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-amber-500/10">
                <p className="text-sm text-gray-400 mb-1">Projets réalisés</p>
                <p className="text-2xl font-bold text-white">{selectedEntrepreneur.totalProjects}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-amber-500/10">
                <p className="text-sm text-gray-400 mb-1">Taux de réussite</p>
                <p className="text-2xl font-bold text-emerald-400">{selectedEntrepreneur.successRate}%</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-amber-500/10">
                <p className="text-sm text-gray-400 mb-1">Note moyenne</p>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  <p className="text-2xl font-bold text-white">{selectedEntrepreneur.rating}</p>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-amber-500/10">
                <p className="text-sm text-gray-400 mb-1">Valeur totale</p>
                <p className="text-2xl font-bold text-white">
                  ${(selectedEntrepreneur.totalValue / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold rounded-lg transition-all shadow-lg shadow-amber-500/25">
                Soutenir (0.10$)
              </button>
              <button className="flex-1 px-6 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-semibold rounded-lg transition-all">
                Voir le portfolio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
