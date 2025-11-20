import { supabase } from './supabase';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins une minuscule' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
  }
  return { valid: true };
};

export const validateAmount = (amount: string | number, min?: number, max?: number): { valid: boolean; message?: string } => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount) || numAmount <= 0) {
    return { valid: false, message: 'Montant invalide' };
  }

  if (min !== undefined && numAmount < min) {
    return { valid: false, message: `Le montant minimum est ${min}` };
  }

  if (max !== undefined && numAmount > max) {
    return { valid: false, message: `Le montant maximum est ${max}` };
  }

  return { valid: true };
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

export const checkRateLimit = async (userId: string, action: string, maxAttempts: number = 5, windowMinutes: number = 15): Promise<boolean> => {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from('rate_limit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', windowStart);

  if (error) {
    console.error('Rate limit check error:', error);
    return true;
  }

  return (count || 0) < maxAttempts;
};

export const logSecurityEvent = async (
  userId: string | null,
  eventType: string,
  details: Record<string, unknown>,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
) => {
  try {
    await supabase.from('security_logs').insert({
      user_id: userId,
      event_type: eventType,
      details,
      severity,
      ip_address: null,
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

export const encryptSensitiveData = (data: string): string => {
  return btoa(data);
};

export const decryptSensitiveData = (encryptedData: string): string => {
  try {
    return atob(encryptedData);
  } catch {
    return '';
  }
};

export const validateCryptoAddress = (address: string, currency: string): boolean => {
  const patterns: Record<string, RegExp> = {
    BTC: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
    ETH: /^0x[a-fA-F0-9]{40}$/,
    USDT_TRC20: /^T[a-zA-Z0-9]{33}$/,
    USDT_ERC20: /^0x[a-fA-F0-9]{40}$/,
    BNB: /^0x[a-fA-F0-9]{40}$|^bnb1[a-z0-9]{38}$/,
  };

  const pattern = patterns[currency];
  return pattern ? pattern.test(address) : false;
};

export const validatePhoneNumber = (phone: string, countryCode: string = 'GN'): boolean => {
  const patterns: Record<string, RegExp> = {
    GN: /^(\+224|00224|224)?[6-7][0-9]{8}$/,
    CI: /^(\+225|00225|225)?[0-9]{10}$/,
    SN: /^(\+221|00221|221)?[7][0-9]{8}$/,
  };

  const pattern = patterns[countryCode] || /^[0-9]{8,15}$/;
  return pattern.test(phone.replace(/[\s-]/g, ''));
};

export const checkUserPermissions = async (userId: string, requiredPermission: string): Promise<boolean> => {
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('kyc_status, kyc_level, crown_score')
    .eq('user_id', userId)
    .single();

  if (!userProfile) return false;

  const permissionRequirements: Record<string, { kyc_level: number; crown_score?: number }> = {
    'basic_trading': { kyc_level: 1 },
    'p2p_trading': { kyc_level: 1, crown_score: 300 },
    'crown_invest': { kyc_level: 2, crown_score: 400 },
    'governance_vote': { kyc_level: 1, crown_score: 500 },
    'mining_pools': { kyc_level: 2, crown_score: 600 },
    'large_withdraw': { kyc_level: 3, crown_score: 700 },
  };

  const requirement = permissionRequirements[requiredPermission];
  if (!requirement) return true;

  if (userProfile.kyc_level < requirement.kyc_level) return false;
  if (requirement.crown_score && userProfile.crown_score < requirement.crown_score) return false;

  return userProfile.kyc_status === 'verified';
};

export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const hashData = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const validateSession = async (): Promise<boolean> => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) return false;

  const expiresAt = new Date(session.expires_at || 0).getTime();
  const now = Date.now();

  return expiresAt > now;
};

export const securityConfig = {
  passwordMinLength: 8,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  sessionTimeoutMinutes: 60,
  requireEmailVerification: false,
  require2FA: false,
  allowedOrigins: ['http://localhost:5173', 'https://allianceweb3africa.org'],
  csrfProtection: true,
  rateLimiting: {
    login: { maxAttempts: 5, windowMinutes: 15 },
    signup: { maxAttempts: 3, windowMinutes: 60 },
    withdraw: { maxAttempts: 10, windowMinutes: 60 },
    deposit: { maxAttempts: 20, windowMinutes: 60 },
    p2p: { maxAttempts: 50, windowMinutes: 60 },
  },
};
