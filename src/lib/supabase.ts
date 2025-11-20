import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string | null;
          email: string | null;
          full_name: string;
          kyc_status: 'pending' | 'verified' | 'rejected';
          kyc_level: number;
          crown_score: number;
          wallet_address: string | null;
          wallet_type: 'custodial' | 'non_custodial';
          biometric_enabled: boolean;
          country_code: string;
          preferred_language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
    };
  };
};
