import { useState } from 'react';
import api from '../lib/api';

export function useSwap() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSwap = async (
    tokenFrom: string,
    tokenTo: string,
    amountFrom: number
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.swap.execute(tokenFrom, tokenTo, amountFrom);

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Swap failed');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const getRate = async (tokenFrom: string, tokenTo: string) => {
    const result = await api.swap.getRates(tokenFrom, tokenTo);
    return result.data?.rate || 0;
  };

  return {
    loading,
    error,
    executeSwap,
    getRate,
  };
}
