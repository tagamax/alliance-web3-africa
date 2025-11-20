import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export interface Wallet {
  id: string;
  user_id: string;
  token_symbol: string;
  balance: number;
  usd_value: number;
  created_at: string;
}

export function useWallet() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWallets = async () => {
    if (!user) return;

    setLoading(true);
    const result = await api.wallet.getBalance(user.id);

    if (result.success && result.data) {
      setWallets(result.data);
      setError(null);
    } else {
      setError(result.error || 'Failed to load wallets');
    }

    setLoading(false);
  };

  useEffect(() => {
    loadWallets();
  }, [user]);

  const getBalance = (tokenSymbol: string): number => {
    const wallet = wallets.find(w => w.token_symbol === tokenSymbol);
    return wallet?.balance || 0;
  };

  const getTotalUSDValue = (): number => {
    return wallets.reduce((sum, w) => sum + (w.usd_value || 0), 0);
  };

  return {
    wallets,
    loading,
    error,
    reload: loadWallets,
    getBalance,
    getTotalUSDValue,
  };
}
