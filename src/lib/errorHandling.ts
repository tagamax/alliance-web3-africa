import { PostgrestError } from '@supabase/supabase-js';

export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const handleSupabaseError = (error: PostgrestError | Error): string => {
  if ('code' in error) {
    const supabaseError = error as PostgrestError;

    const errorMessages: Record<string, string> = {
      '23505': 'Cette entrée existe déjà',
      '23503': 'Référence invalide',
      '23502': 'Champ requis manquant',
      '42501': 'Permission refusée',
      '42P01': 'Table inexistante',
      'PGRST116': 'Ligne non trouvée',
      'PGRST301': 'Trop de requêtes',
    };

    return errorMessages[supabaseError.code] || `Erreur base de données: ${supabaseError.message}`;
  }

  return error.message || 'Une erreur est survenue';
};

export const handleAuthError = (error: Error): string => {
  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials') || message.includes('invalid_credentials')) {
    return 'Email ou mot de passe incorrect';
  }
  if (message.includes('email not confirmed')) {
    return 'Veuillez confirmer votre email';
  }
  if (message.includes('user already registered')) {
    return 'Cet email est déjà utilisé';
  }
  if (message.includes('password')) {
    return 'Le mot de passe ne respecte pas les critères de sécurité';
  }
  if (message.includes('rate limit')) {
    return 'Trop de tentatives. Veuillez réessayer plus tard';
  }
  if (message.includes('network')) {
    return 'Erreur de connexion. Vérifiez votre internet';
  }

  return 'Erreur d\'authentification. Veuillez réessayer';
};

export const handleTransactionError = (error: Error | unknown): string => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('insufficient')) {
      return 'Solde insuffisant';
    }
    if (message.includes('minimum')) {
      return 'Le montant est en dessous du minimum requis';
    }
    if (message.includes('maximum')) {
      return 'Le montant dépasse le maximum autorisé';
    }
    if (message.includes('kyc') || message.includes('verification')) {
      return 'Vérification KYC requise';
    }
    if (message.includes('permission') || message.includes('authorized')) {
      return 'Vous n\'êtes pas autorisé à effectuer cette action';
    }
    if (message.includes('address')) {
      return 'Adresse invalide';
    }

    return error.message;
  }

  return 'Erreur lors de la transaction';
};

export const logError = (error: Error | unknown, context?: Record<string, unknown>) => {
  console.error('Error:', {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  });
};

export const showUserFriendlyError = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    if (error.message.includes('auth')) {
      return handleAuthError(error);
    }
    if (error.message.includes('transaction') || error.message.includes('balance')) {
      return handleTransactionError(error);
    }
    if ('code' in error) {
      return handleSupabaseError(error as PostgrestError);
    }
    return error.message;
  }

  return 'Une erreur inattendue est survenue. Veuillez réessayer.';
};

export const validateAndCatch = async <T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    logError(error);
    return {
      data: null,
      error: errorMessage || showUserFriendlyError(error),
    };
  }
};

export const retry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
};
