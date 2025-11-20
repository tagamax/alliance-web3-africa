import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TrendingUp, Package, ShoppingCart, Shield, DollarSign, Users, Target, ArrowLeft, Plus, Calendar, MapPin, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';


interface Project {
  id: string;
  creator_id: string;
  project_type: 'investment' | 'fractional_sale' | 'group_purchase' | 'public_guarantee';
  title: string;
  description: string;
  category: string;
  target_amount: number;
  raised_amount: number;
  currency: string;
  status: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  images: string[];
  esg_score: number;
  verified: boolean;
  creator_name?: string;
}

interface Investment {
  id: string;
  project_id: string;
  amount: number;
  shares: number;
  status: string;
  created_at: string;
}

export default function Crown() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'investment' | 'fractional_sale' | 'group_purchase' | 'public_guarantee'>('investment');
  const [projects, setProjects] = useState<Project[]>([]);
  const [myInvestments, setMyInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [investAmount, setInvestAmount] = useState('');
  const [userBalance, setUserBalance] = useState(0);

  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    category: 'agriculture',
    target_amount: '',
    location: '',
    end_date: '',
  });

  useEffect(() => {
    loadData();
  }, [activeTab, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('crown_projects')
        .select(`
          *,
          users!crown_projects_creator_id_fkey (full_name)
        `)
        .eq('project_type', activeTab)
        .in('status', ['active', 'funded', 'in_progress'])
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      if (!projectsData || projectsData.length === 0) {
        await initializeProjects();
        return loadData();
      }

      const projectsWithCreator = (projectsData || []).map((p: any) => ({
        ...p,
        creator_name: p.users?.full_name || 'Utilisateur',
        images: Array.isArray(p.images) ? p.images : [],
      }));

      setProjects(projectsWithCreator);

      if (user) {
        const { data: investmentsData } = await supabase
          .from('crown_investments')
          .select('*')
          .eq('investor_id', user.id)
          .order('created_at', { ascending: false });

        setMyInvestments(investmentsData || []);

        const { data: balanceData } = await supabase
          .from('token_balances')
          .select('balance')
          .eq('user_id', user.id)
          .eq('token_symbol', 'عLK3')
          .single();

        setUserBalance(balanceData?.balance || 0);
      }
    } catch (error) {
      console.error('Error loading CROWN data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeProjects = async () => {
    const sampleProjects = [
      {
        project_type: 'investment',
        title: 'Ferme Agricole Bio - Kindia',
        description: 'Développement d\'une ferme agricole biologique de 50 hectares avec système d\'irrigation moderne et production de cultures maraîchères pour le marché local.',
        category: 'agriculture',
        target_amount: 50000,
        raised_amount: 0,
        currency: 'عLK3',
        status: 'active',
        location: 'Kindia, Guinée',
        images: ['https://images.pexels.com/photos/2933243/pexels-photo-2933243.jpeg?w=400'],
        esg_score: 92,
        verified: true,
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        project_type: 'fractional_sale',
        title: 'Panneaux Solaires Communautaires',
        description: 'Installation de panneaux solaires pour électrifier 200 foyers. Achat fractionné permettant à chacun de posséder une part de l\'installation.',
        category: 'energie',
        target_amount: 100000,
        raised_amount: 0,
        currency: 'عLK3',
        status: 'active',
        location: 'Conakry, Guinée',
        images: ['https://images.pexels.com/photos/433308/pexels-photo-433308.jpeg?w=400'],
        esg_score: 98,
        verified: true,
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        project_type: 'group_purchase',
        title: 'Achat Groupé de Matériel Médical',
        description: 'Achat groupé de matériel médical pour équiper 5 centres de santé ruraux. Prix réduit grâce à l\'achat en volume.',
        category: 'sante',
        target_amount: 75000,
        raised_amount: 0,
        currency: 'عLK3',
        status: 'active',
        location: 'Région de Labé',
        images: ['https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?w=400'],
        esg_score: 95,
        verified: true,
        end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        project_type: 'public_guarantee',
        title: 'Construction École Primaire - Mamou',
        description: 'Construction d\'une école primaire de 6 salles de classe. Projet garanti par contrat public avec suivi citoyen.',
        category: 'education',
        target_amount: 120000,
        raised_amount: 0,
        currency: 'عLK3',
        status: 'active',
        location: 'Mamou, Guinée',
        images: ['https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?w=400'],
        esg_score: 96,
        verified: true,
        end_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const { data: userData } = await supabase.from('users').select('id').limit(1).single();

    if (userData) {
      const projectsWithCreator = sampleProjects.map(p => ({
        ...p,
        creator_id: userData.id,
      }));

      await supabase.from('crown_projects').insert(projectsWithCreator);
    }
  };

  const handleCreateProject = async () => {
    if (!user) {
      alert('Veuillez vous connecter');
      return;
    }

    if (!newProject.title || !newProject.description || !newProject.target_amount) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await supabase.from('crown_projects').insert({
        creator_id: user.id,
        project_type: activeTab,
        title: newProject.title,
        description: newProject.description,
        category: newProject.category,
        target_amount: parseFloat(newProject.target_amount),
        raised_amount: 0,
        currency: 'عLK3',
        status: 'active',
        location: newProject.location,
        end_date: newProject.end_date || null,
        images: [],
        esg_score: 0,
        verified: false,
      });

      alert('Projet créé avec succès!');
      setShowCreateModal(false);
      setNewProject({
        title: '',
        description: '',
        category: 'agriculture',
        target_amount: '',
        location: '',
        end_date: '',
      });
      loadData();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Erreur lors de la création du projet');
    }
  };

  const handleInvest = async () => {
    if (!user || !selectedProject) return;

    const amount = parseFloat(investAmount);

    if (amount <= 0) {
      alert('Montant invalide');
      return;
    }

    if (amount > userBalance) {
      alert('Solde insuffisant');
      return;
    }

    try {
      const shares = (amount / selectedProject.target_amount) * 100;

      await supabase.from('crown_investments').insert({
        project_id: selectedProject.id,
        investor_id: user.id,
        amount: amount,
        currency: 'عLK3',
        shares: shares,
        status: 'confirmed',
        transaction_hash: `0x${Math.random().toString(16).substring(2)}`,
      });

      await supabase
        .from('crown_projects')
        .update({
          raised_amount: selectedProject.raised_amount + amount,
          status: selectedProject.raised_amount + amount >= selectedProject.target_amount ? 'funded' : 'active',
        })
        .eq('id', selectedProject.id);

      await supabase
        .from('token_balances')
        .update({ balance: userBalance - amount })
        .eq('user_id', user.id)
        .eq('token_symbol', 'عLK3');

      await supabase.from('transactions').insert({
        user_id: user.id,
        transaction_hash: `0x${Math.random().toString(16).substring(2)}`,
        transaction_type: 'crown_investment',
        from_currency: 'عLK3',
        to_currency: 'SHARES',
        amount_from: amount,
        amount_to: shares,
        fee: 0,
        status: 'completed',
        metadata: {
          project_id: selectedProject.id,
          project_title: selectedProject.title,
          shares: shares,
        },
        completed_at: new Date().toISOString(),
      });

      await supabase.from('reputation_events').insert({
        user_id: user.id,
        event_type: 'project_funded',
        score_change: 5,
        reference_id: selectedProject.id,
        notes: `Investissement de ${amount} عLK3 dans ${selectedProject.title}`,
      });

      alert(`Investissement réussi! Vous possédez ${shares.toFixed(2)}% du projet`);
      setSelectedProject(null);
      setInvestAmount('');
      loadData();
    } catch (error) {
      console.error('Error investing:', error);
      alert('Erreur lors de l\'investissement');
    }
  };

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'investment': return TrendingUp;
      case 'fractional_sale': return Package;
      case 'group_purchase': return ShoppingCart;
      case 'public_guarantee': return Shield;
      default: return TrendingUp;
    }
  };

  const getTabLabel = (type: string) => {
    switch (type) {
      case 'investment': return 'Financement';
      case 'fractional_sale': return 'Vente Fractionnée';
      case 'group_purchase': return 'Achat Groupé';
      case 'public_guarantee': return 'Garantie Publique';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white rounded-lg transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold rounded-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          Créer un Projet
        </button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('crownTitle')}</h1>
        <p className="text-gray-400">Investissements, ventes fractionnées et achats groupés sécurisés</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/20">
          <DollarSign className="h-6 w-6 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">
            {projects.reduce((sum, p) => sum + p.raised_amount, 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-gray-400">عLK3 Levés</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
          <Target className="h-6 w-6 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">{projects.length}</p>
          <p className="text-sm text-gray-400">Projets Actifs</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 backdrop-blur-sm rounded-xl p-4 border border-amber-500/20">
          <Users className="h-6 w-6 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">{myInvestments.length}</p>
          <p className="text-sm text-gray-400">Mes Investissements</p>
        </div>
        <div className="bg-gradient-to-br from-teal-500/10 to-teal-600/10 backdrop-blur-sm rounded-xl p-4 border border-teal-500/20">
          <Award className="h-6 w-6 text-teal-400 mb-2" />
          <p className="text-2xl font-bold text-white">
            {userBalance.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-400">Balance عLK3</p>
        </div>
      </div>

      <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl border border-amber-500/20">
        <div className="flex border-b border-amber-500/20 overflow-x-auto">
          {(['investment', 'fractional_sale', 'group_purchase', 'public_guarantee'] as const).map((type) => {
            const Icon = getTabIcon(type);
            return (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap ${
                  activeTab === type
                    ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {getTabLabel(type)}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((project) => {
              const progress = (project.raised_amount / project.target_amount) * 100;
              const endDate = project.end_date ? new Date(project.end_date) : null;
              const daysLeft = endDate ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

              return (
                <div
                  key={project.id}
                  className="bg-slate-800/50 rounded-xl overflow-hidden border border-amber-500/10 hover:border-amber-500/30 transition-all"
                >
                  {project.images.length > 0 && (
                    <img
                      src={project.images[0]}
                      alt={project.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-white">{project.title}</h3>
                          {project.verified && (
                            <Award className="h-5 w-5 text-emerald-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-1">par {project.creator_name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {project.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold mb-2">
                          ESG: {project.esg_score}/100
                        </div>
                        <div className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-semibold">
                          {project.category}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{project.description}</p>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Objectif</span>
                        <span className="text-white font-semibold">
                          {project.target_amount.toLocaleString('fr-FR')} {project.currency}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Levé</span>
                        <span className="text-emerald-400 font-semibold">
                          {project.raised_amount.toLocaleString('fr-FR')} {project.currency}
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{progress.toFixed(1)}% financé</span>
                        {daysLeft !== null && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {daysLeft} {t('daysRemaining')}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedProject(project)}
                      disabled={progress >= 100}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-gray-600 disabled:to-gray-700 text-black font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
                    >
                      {progress >= 100 ? 'Objectif Atteint' : 'Investir'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-amber-500/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Créer un Projet {getTabLabel(activeTab)}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Titre du projet *</label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
                  placeholder="Ex: Ferme Agricole Bio"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Description *</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
                  placeholder="Décrivez votre projet en détail..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Catégorie</label>
                  <select
                    value={newProject.category}
                    onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="agriculture">Agriculture</option>
                    <option value="energie">Énergie</option>
                    <option value="sante">Santé</option>
                    <option value="education">Éducation</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="technologie">Technologie</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Montant cible (عLK3) *</label>
                  <input
                    type="number"
                    value={newProject.target_amount}
                    onChange={(e) => setNewProject({ ...newProject, target_amount: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
                    placeholder="50000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Localisation</label>
                  <input
                    type="text"
                    value={newProject.location}
                    onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
                    placeholder="Conakry, Guinée"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Date de fin</label>
                  <input
                    type="date"
                    value={newProject.end_date}
                    onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateProject}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold rounded-lg transition-all"
              >
                Créer le Projet
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-amber-500/30 p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">Investir dans le projet</h2>
            <h3 className="text-lg text-gray-300 mb-6">{selectedProject.title}</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Votre balance</p>
                <p className="text-2xl font-bold text-white">{userBalance.toLocaleString('fr-FR')} عLK3</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Montant à investir (عLK3)</label>
                <input
                  type="number"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
                  placeholder="1000"
                />
              </div>
              {investAmount && parseFloat(investAmount) > 0 && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <p className="text-sm text-gray-400">Vous recevrez</p>
                  <p className="text-xl font-bold text-emerald-400">
                    {((parseFloat(investAmount) / selectedProject.target_amount) * 100).toFixed(2)}% du projet
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setSelectedProject(null);
                  setInvestAmount('');
                }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleInvest}
                disabled={!investAmount || parseFloat(investAmount) <= 0}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-gray-600 disabled:to-gray-700 text-black font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
              >
                Investir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
