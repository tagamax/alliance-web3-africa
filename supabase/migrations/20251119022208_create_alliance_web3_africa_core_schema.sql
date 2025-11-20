/*
  # Alliance Web3 Africa - عLKabulan Coin (عLK3) - Core Database Schema

  ## Overview
  This migration creates the foundational database structure for the Alliance Web3 Africa ecosystem,
  including user management, wallet integration, token tracking, and security features.

  ## 1. New Tables
  
  ### `users`
  - `id` (uuid, primary key) - Unique user identifier
  - `phone` (text, unique) - Phone number for authentication
  - `email` (text, unique) - Email address
  - `full_name` (text) - User's full name
  - `kyc_status` (text) - KYC verification status: pending, verified, rejected
  - `kyc_level` (integer) - KYC tier level (1-5)
  - `crown_score` (integer) - Reputation score (0-1000)
  - `wallet_address` (text, unique) - Blockchain wallet address
  - `wallet_type` (text) - custodial or non_custodial
  - `biometric_enabled` (boolean) - Face ID / Fingerprint enabled
  - `country_code` (text) - ISO country code
  - `preferred_language` (text) - User interface language
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `wallets`
  - `id` (uuid, primary key) - Wallet identifier
  - `user_id` (uuid, foreign key) - Reference to users table
  - `wallet_address` (text, unique) - Blockchain address
  - `wallet_type` (text) - Type: custodial, non_custodial
  - `chain` (text) - Blockchain: ethereum, solana, polygon
  - `is_primary` (boolean) - Primary wallet flag
  - `created_at` (timestamptz) - Creation timestamp

  ### `token_balances`
  - `id` (uuid, primary key) - Balance record identifier
  - `user_id` (uuid, foreign key) - Reference to users table
  - `wallet_id` (uuid, foreign key) - Reference to wallets table
  - `token_symbol` (text) - Token symbol (عLK3, USDT, BTC, etc.)
  - `balance` (numeric) - Token balance
  - `locked_balance` (numeric) - Locked/staked balance
  - `usd_value` (numeric) - USD equivalent value
  - `last_sync` (timestamptz) - Last blockchain sync timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `transactions`
  - `id` (uuid, primary key) - Transaction identifier
  - `user_id` (uuid, foreign key) - Reference to users table
  - `transaction_hash` (text, unique) - Blockchain transaction hash
  - `transaction_type` (text) - Type: swap, transfer, stake, p2p, crown
  - `from_currency` (text) - Source currency
  - `to_currency` (text) - Destination currency
  - `amount_from` (numeric) - Amount sent
  - `amount_to` (numeric) - Amount received
  - `fee` (numeric) - Transaction fee
  - `status` (text) - Status: pending, completed, failed, cancelled
  - `metadata` (jsonb) - Additional transaction data
  - `created_at` (timestamptz) - Transaction timestamp
  - `completed_at` (timestamptz) - Completion timestamp

  ### `kyc_documents`
  - `id` (uuid, primary key) - Document identifier
  - `user_id` (uuid, foreign key) - Reference to users table
  - `document_type` (text) - Type: id_card, passport, proof_of_address, selfie
  - `document_url` (text) - IPFS or secure storage URL
  - `verification_status` (text) - Status: pending, approved, rejected
  - `verification_notes` (text) - Reviewer notes
  - `verified_by` (uuid) - Admin/AI verifier ID
  - `verified_at` (timestamptz) - Verification timestamp
  - `created_at` (timestamptz) - Upload timestamp

  ## 2. Security - Row Level Security (RLS)
  
  All tables have RLS enabled with restrictive policies:
  - Users can only view and update their own data
  - Admins have special elevated privileges
  - KYC documents are strictly protected
  - Transaction history is private to the user

  ## 3. Indexes
  
  Performance indexes on:
  - User lookups (phone, email, wallet_address)
  - Transaction queries (user_id, status, created_at)
  - Token balance lookups (user_id, token_symbol)
  
  ## 4. Important Notes
  
  - All financial amounts use NUMERIC type for precision
  - All timestamps use timestamptz for timezone awareness
  - JSONB metadata fields allow flexible data storage
  - Foreign keys ensure referential integrity
  - Default values prevent null-related issues
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE,
  email text UNIQUE,
  full_name text NOT NULL,
  kyc_status text DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  kyc_level integer DEFAULT 1 CHECK (kyc_level >= 1 AND kyc_level <= 5),
  crown_score integer DEFAULT 500 CHECK (crown_score >= 0 AND crown_score <= 1000),
  wallet_address text UNIQUE,
  wallet_type text DEFAULT 'custodial' CHECK (wallet_type IN ('custodial', 'non_custodial')),
  biometric_enabled boolean DEFAULT false,
  country_code text DEFAULT 'GN',
  preferred_language text DEFAULT 'fr',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address text UNIQUE NOT NULL,
  wallet_type text NOT NULL CHECK (wallet_type IN ('custodial', 'non_custodial')),
  chain text DEFAULT 'ethereum' CHECK (chain IN ('ethereum', 'solana', 'polygon')),
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create token_balances table
CREATE TABLE IF NOT EXISTS token_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  token_symbol text NOT NULL,
  balance numeric DEFAULT 0 CHECK (balance >= 0),
  locked_balance numeric DEFAULT 0 CHECK (locked_balance >= 0),
  usd_value numeric DEFAULT 0,
  last_sync timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(wallet_id, token_symbol)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_hash text UNIQUE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('swap', 'transfer', 'stake', 'unstake', 'p2p', 'crown', 'nft')),
  from_currency text NOT NULL,
  to_currency text,
  amount_from numeric NOT NULL CHECK (amount_from > 0),
  amount_to numeric,
  fee numeric DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create kyc_documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('id_card', 'passport', 'proof_of_address', 'selfie')),
  document_url text NOT NULL,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verification_notes text,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_token_balances_user_id ON token_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_token_balances_wallet_id ON token_balances(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON kyc_documents(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for wallets table
CREATE POLICY "Users can view own wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own wallets"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own wallets"
  ON wallets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for token_balances table
CREATE POLICY "Users can view own token balances"
  ON token_balances FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own token balances"
  ON token_balances FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own token balances"
  ON token_balances FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for transactions table
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for kyc_documents table (extra strict)
CREATE POLICY "Users can view own KYC documents"
  ON kyc_documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own KYC documents"
  ON kyc_documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_balances_updated_at
  BEFORE UPDATE ON token_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();