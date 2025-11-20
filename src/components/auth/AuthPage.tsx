import { useState } from 'react';
import { Leaf, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName) {
          throw new Error('Le nom complet est requis');
        }
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-black bg-opacity-40 backdrop-blur-lg rounded-2xl p-8 border border-amber-500/20 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-3 rounded-2xl mb-4">
              <Leaf className="h-10 w-10 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Alliance Web3 Africa</h1>
            <p className="text-amber-400 text-lg font-semibold">عLKabulan Coin (عLK3)</p>
            <p className="text-gray-400 text-sm mt-2 text-center">
              L'écosystème économique, citoyen et environnemental de l'Afrique
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-amber-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Votre nom complet"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-amber-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-amber-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>{isSignUp ? 'Créer un compte' : 'Se connecter'}</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
            >
              {isSignUp
                ? 'Vous avez déjà un compte ? Se connecter'
                : 'Pas encore de compte ? S\'inscrire'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-amber-500/20">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-amber-400">150K+</p>
                <p className="text-xs text-gray-400">Utilisateurs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-400">$50M+</p>
                <p className="text-xs text-gray-400">Volume</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-400">45+</p>
                <p className="text-xs text-gray-400">Pays</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          En créant un compte, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité
        </p>
      </div>
    </div>
  );
}
