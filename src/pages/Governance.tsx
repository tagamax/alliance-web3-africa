import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Vote, CheckCircle, XCircle, Clock, TrendingUp, ArrowLeft, Plus, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';


interface Proposal {
  id: string;
  proposer_id: string;
  proposal_type: string;
  title: string;
  description: string;
  category: string;
  required_quorum: number;
  voting_power_type: string;
  status: string;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  total_voting_power: number;
  start_date: string;
  end_date: string;
  proposer_name?: string;
}

interface UserVote {
  id: string;
  proposal_id: string;
  vote_choice: string;
  voting_power: number;
}

export default function Governance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [myVotes, setMyVotes] = useState<UserVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [voteChoice, setVoteChoice] = useState<'for' | 'against' | 'abstain' | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [votingPower, setVotingPower] = useState(0);

  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    category: 'governance',
    proposal_type: 'policy',
    end_date: '',
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: proposalsData, error: proposalsError } = await supabase
        .from('dao_proposals')
        .select(`
          *,
          users!dao_proposals_proposer_id_fkey (full_name)
        `)
        .in('status', ['active', 'passed', 'rejected'])
        .order('created_at', { ascending: false });

      if (proposalsError) throw proposalsError;

      if (!proposalsData || proposalsData.length === 0) {
        await initializeProposals();
        return loadData();
      }

      const proposalsWithProposer = (proposalsData || []).map((p: any) => ({
        ...p,
        proposer_name: p.users?.full_name || 'Utilisateur',
      }));

      setProposals(proposalsWithProposer);

      if (user) {
        const { data: votesData } = await supabase
          .from('dao_votes')
          .select('*')
          .eq('voter_id', user.id);

        setMyVotes(votesData || []);

        const { data: balanceData } = await supabase
          .from('token_balances')
          .select('balance')
          .eq('user_id', user.id)
          .eq('token_symbol', 'عLK3')
          .single();

        setVotingPower(balanceData?.balance || 0);
      }
    } catch (error) {
      console.error('Error loading governance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeProposals = async () => {
    const sampleProposals = [
      {
        proposal_type: 'budget',
        title: 'Augmentation du budget marketing - Q2 2025',
        description: 'Proposition d\'augmenter le budget marketing de 50K عLK3 pour le Q2 2025 afin d\'accélérer l\'adoption de la plateforme en Guinée et dans la sous-région.',
        category: 'finance',
        required_quorum: 10,
        voting_power_type: 'token_weighted',
        status: 'active',
        votes_for: 0,
        votes_against: 0,
        votes_abstain: 0,
        total_voting_power: 0,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        proposal_type: 'technical',
        title: 'Nouveau type de NFT: Protection des océans',
        description: 'Ajouter une nouvelle catégorie de NFT Impact pour la protection des écosystèmes marins et côtiers, avec traçabilité complète des actions environnementales.',
        category: 'development',
        required_quorum: 10,
        voting_power_type: 'token_weighted',
        status: 'active',
        votes_for: 0,
        votes_against: 0,
        votes_abstain: 0,
        total_voting_power: 0,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        proposal_type: 'policy',
        title: 'Réduction des frais de transaction P2P',
        description: 'Réduire les frais P2P de 0.5% à 0.3% pour encourager l\'utilisation et l\'inclusion financière des populations non bancarisées.',
        category: 'governance',
        required_quorum: 10,
        voting_power_type: 'token_weighted',
        status: 'active',
        votes_for: 0,
        votes_against: 0,
        votes_abstain: 0,
        total_voting_power: 0,
        start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const { data: userData } = await supabase.from('users').select('id').limit(1).single();

    if (userData) {
      const proposalsWithProposer = sampleProposals.map(p => ({
        ...p,
        proposer_id: userData.id,
      }));

      await supabase.from('dao_proposals').insert(proposalsWithProposer);
    }
  };

  const handleCreateProposal = async () => {
    if (!user) {
      alert('Veuillez vous connecter');
      return;
    }

    if (!newProposal.title || !newProposal.description || !newProposal.end_date) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await supabase.from('dao_proposals').insert({
        proposer_id: user.id,
        proposal_type: newProposal.proposal_type,
        title: newProposal.title,
        description: newProposal.description,
        category: newProposal.category,
        required_quorum: 10,
        voting_power_type: 'token_weighted',
        status: 'active',
        votes_for: 0,
        votes_against: 0,
        votes_abstain: 0,
        total_voting_power: 0,
        start_date: new Date().toISOString(),
        end_date: newProposal.end_date,
      });

      alert('Proposition créée avec succès!');
      setShowCreateModal(false);
      setNewProposal({
        title: '',
        description: '',
        category: 'governance',
        proposal_type: 'policy',
        end_date: '',
      });
      loadData();
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Erreur lors de la création de la proposition');
    }
  };

  const handleVote = async () => {
    if (!user || !selectedProposal || !voteChoice) return;

    const hasVoted = myVotes.some(v => v.proposal_id === selectedProposal.id);
    if (hasVoted) {
      alert('Vous avez déjà voté sur cette proposition');
      return;
    }

    try {
      await supabase.from('dao_votes').insert({
        proposal_id: selectedProposal.id,
        voter_id: user.id,
        vote_choice: voteChoice,
        voting_power: votingPower,
      });

      const updatedVotesFor = voteChoice === 'for' ? selectedProposal.votes_for + votingPower : selectedProposal.votes_for;
      const updatedVotesAgainst = voteChoice === 'against' ? selectedProposal.votes_against + votingPower : selectedProposal.votes_against;
      const updatedVotesAbstain = voteChoice === 'abstain' ? selectedProposal.votes_abstain + votingPower : selectedProposal.votes_abstain;

      await supabase
        .from('dao_proposals')
        .update({
          votes_for: updatedVotesFor,
          votes_against: updatedVotesAgainst,
          votes_abstain: updatedVotesAbstain,
          total_voting_power: selectedProposal.total_voting_power + votingPower,
        })
        .eq('id', selectedProposal.id);

      await supabase.from('transactions').insert({
        user_id: user.id,
        transaction_hash: `0x${Math.random().toString(16).substring(2)}`,
        transaction_type: 'governance_vote',
        from_currency: 'عLK3',
        to_currency: 'VOTE',
        amount_from: votingPower,
        amount_to: 1,
        fee: 0,
        status: 'completed',
        metadata: {
          proposal_id: selectedProposal.id,
          proposal_title: selectedProposal.title,
          vote_choice: voteChoice,
        },
        completed_at: new Date().toISOString(),
      });

      alert('Vote enregistré avec succès!');
      setSelectedProposal(null);
      setVoteChoice(null);
      loadData();
    } catch (error) {
      console.error('Error voting:', error);
      alert('Erreur lors du vote');
    }
  };

  const activeProposals = proposals.filter(p => p.status === 'active');
  const totalProposals = proposals.length;
  const passedProposals = proposals.filter(p => p.status === 'passed').length;
  const adoptionRate = totalProposals > 0 ? (passedProposals / totalProposals) * 100 : 0;

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
          Créer une Proposition
        </button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Gouvernance DAO</h1>
        <p className="text-gray-400">Votez sur les propositions et participez aux décisions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
          <Vote className="h-6 w-6 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">{totalProposals}</p>
          <p className="text-sm text-gray-400">Propositions totales</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/20">
          <CheckCircle className="h-6 w-6 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">{adoptionRate.toFixed(0)}%</p>
          <p className="text-sm text-gray-400">Taux d'adoption</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 backdrop-blur-sm rounded-xl p-4 border border-amber-500/20">
          <TrendingUp className="h-6 w-6 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">{votingPower.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</p>
          <p className="text-sm text-gray-400">Votre pouvoir de vote</p>
        </div>
        <div className="bg-gradient-to-br from-violet-500/10 to-violet-600/10 backdrop-blur-sm rounded-xl p-4 border border-violet-500/20">
          <Clock className="h-6 w-6 text-violet-400 mb-2" />
          <p className="text-2xl font-bold text-white">{activeProposals.length}</p>
          <p className="text-sm text-gray-400">Propositions actives</p>
        </div>
      </div>

      <div className="space-y-4">
        {proposals.map((proposal) => {
          const totalVotes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain;
          const forPercentage = totalVotes > 0 ? (proposal.votes_for / totalVotes) * 100 : 0;
          const againstPercentage = totalVotes > 0 ? (proposal.votes_against / totalVotes) * 100 : 0;
          const abstainPercentage = totalVotes > 0 ? (proposal.votes_abstain / totalVotes) * 100 : 0;
          const hasVoted = myVotes.some(v => v.proposal_id === proposal.id);
          const endDate = new Date(proposal.end_date);
          const isExpired = endDate < new Date();

          return (
            <div
              key={proposal.id}
              className="bg-black bg-opacity-40 backdrop-blur-lg rounded-xl p-6 border border-amber-500/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{proposal.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        proposal.status === 'active'
                          ? 'bg-blue-500/20 text-blue-400'
                          : proposal.status === 'passed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {proposal.status === 'active'
                        ? 'En cours'
                        : proposal.status === 'passed'
                        ? 'Adoptée'
                        : 'Rejetée'}
                    </span>
                    {hasVoted && (
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-semibold">
                        Vous avez voté
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-2">
                    Par {proposal.proposer_name} • {proposal.category}
                  </p>
                  <p className="text-gray-300 mb-4">{proposal.description}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Pour
                    </span>
                    <span className="text-white font-semibold">
                      {proposal.votes_for.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} ({forPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${forPercentage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-red-400 flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Contre
                    </span>
                    <span className="text-white font-semibold">
                      {proposal.votes_against.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} ({againstPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${againstPercentage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Abstention</span>
                    <span className="text-white font-semibold">
                      {proposal.votes_abstain.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} ({abstainPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gray-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${abstainPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Se termine le {endDate.toLocaleDateString('fr-FR')}
                  {isExpired && <span className="text-red-400 ml-2">(Expiré)</span>}
                </div>
                {proposal.status === 'active' && !hasVoted && !isExpired && (
                  <button
                    onClick={() => setSelectedProposal(proposal)}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
                  >
                    Voter
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-amber-500/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Créer une Proposition</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Titre *</label>
                <input
                  type="text"
                  value={newProposal.title}
                  onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
                  placeholder="Ex: Réduction des frais de transaction"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Description *</label>
                <textarea
                  value={newProposal.description}
                  onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
                  placeholder="Décrivez votre proposition en détail..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Type</label>
                  <select
                    value={newProposal.proposal_type}
                    onChange={(e) => setNewProposal({ ...newProposal, proposal_type: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="policy">Politique</option>
                    <option value="budget">Budget</option>
                    <option value="technical">Technique</option>
                    <option value="emergency">Urgence</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Catégorie</label>
                  <select
                    value={newProposal.category}
                    onChange={(e) => setNewProposal({ ...newProposal, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="governance">Gouvernance</option>
                    <option value="finance">Finance</option>
                    <option value="development">Développement</option>
                    <option value="community">Communauté</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Date de fin *</label>
                <input
                  type="datetime-local"
                  value={newProposal.end_date}
                  onChange={(e) => setNewProposal({ ...newProposal, end_date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-gray-700 focus:border-amber-500 focus:outline-none"
                />
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
                onClick={handleCreateProposal}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold rounded-lg transition-all"
              >
                Créer la Proposition
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProposal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-amber-500/20">
            <h2 className="text-2xl font-bold text-white mb-4">Voter sur la proposition</h2>
            <p className="text-gray-400 mb-6">{selectedProposal.title}</p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => setVoteChoice('for')}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                  voteChoice === 'for'
                    ? 'bg-emerald-500/20 border-emerald-500'
                    : 'bg-slate-800/50 border-slate-700 hover:border-emerald-500/50'
                }`}
              >
                <span className="text-white font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  Pour
                </span>
                {voteChoice === 'for' && <CheckCircle className="h-5 w-5 text-emerald-400" />}
              </button>

              <button
                onClick={() => setVoteChoice('against')}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                  voteChoice === 'against'
                    ? 'bg-red-500/20 border-red-500'
                    : 'bg-slate-800/50 border-slate-700 hover:border-red-500/50'
                }`}
              >
                <span className="text-white font-semibold flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-400" />
                  Contre
                </span>
                {voteChoice === 'against' && <CheckCircle className="h-5 w-5 text-red-400" />}
              </button>

              <button
                onClick={() => setVoteChoice('abstain')}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                  voteChoice === 'abstain'
                    ? 'bg-gray-500/20 border-gray-500'
                    : 'bg-slate-800/50 border-slate-700 hover:border-gray-500/50'
                }`}
              >
                <span className="text-white font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  Abstention
                </span>
                {voteChoice === 'abstain' && <CheckCircle className="h-5 w-5 text-gray-400" />}
              </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6">
              <p className="text-sm text-blue-400">
                Votre pouvoir de vote: {votingPower.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} عLK3 = {votingPower.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} votes
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedProposal(null);
                  setVoteChoice(null);
                }}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleVote}
                disabled={!voteChoice}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
              >
                Confirmer le vote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
