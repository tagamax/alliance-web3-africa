/*
  # NFT Impact Environmental System & DeFi Features

  ## Overview
  This migration creates the environmental NFT system for protecting biodiversity
  and the DeFi features including staking, lending, and liquidity pools.

  ## 1. New Tables
  
  ### `nft_impact_categories`
  - `id` (uuid, primary key) - Category identifier
  - `name` (text) - Category name (Mangroves, Forests, Animals, etc.)
  - `description` (text) - Category description
  - `icon` (text) - Icon identifier
  - `total_minted` (integer) - Total NFTs minted in category
  - `created_at` (timestamptz) - Creation timestamp

  ### `nft_impacts`
  - `id` (uuid, primary key) - NFT identifier
  - `category_id` (uuid, foreign key) - Reference to nft_impact_categories
  - `owner_id` (uuid, foreign key) - Current owner
  - `token_id` (text, unique) - Blockchain token ID
  - `name` (text) - NFT name
  - `description` (text) - NFT description
  - `location` (text) - Geographic location
  - `coordinates` (jsonb) - GPS coordinates
  - `area_size` (numeric) - Protected area size (hectares, km²)
  - `image_url` (text) - IPFS image URL
  - `metadata_url` (text) - IPFS metadata URL
  - `carbon_credits` (numeric) - Associated carbon credits
  - `esg_impact_score` (integer) - Environmental impact score
  - `verification_status` (text) - Status: pending, verified, active
  - `verified_by` (text) - Verification authority
  - `blockchain_address` (text) - NFT contract address
  - `mint_transaction_hash` (text) - Minting transaction hash
  - `created_at` (timestamptz) - Mint timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `nft_rewards`
  - `id` (uuid, primary key) - Reward identifier
  - `nft_id` (uuid, foreign key) - Reference to nft_impacts
  - `owner_id` (uuid, foreign key) - Reward recipient
  - `reward_type` (text) - Type: staking, carbon_credit, badge, governance_vote
  - `amount` (numeric) - Reward amount in عLK3
  - `status` (text) - Status: pending, claimed, expired
  - `claimed_at` (timestamptz) - Claim timestamp
  - `created_at` (timestamptz) - Creation timestamp

  ### `staking_pools`
  - `id` (uuid, primary key) - Pool identifier
  - `pool_name` (text) - Pool name
  - `token_symbol` (text) - Staking token (عLK3)
  - `apy` (numeric) - Annual percentage yield
  - `min_stake` (numeric) - Minimum stake amount
  - `lock_period_days` (integer) - Lock period in days
  - `total_staked` (numeric) - Total amount staked
  - `status` (text) - Status: active, paused, closed
  - `created_at` (timestamptz) - Creation timestamp

  ### `user_stakes`
  - `id` (uuid, primary key) - Stake identifier
  - `user_id` (uuid, foreign key) - Staker user ID
  - `pool_id` (uuid, foreign key) - Reference to staking_pools
  - `amount` (numeric) - Staked amount
  - `rewards_earned` (numeric) - Accumulated rewards
  - `status` (text) - Status: active, unstaking, completed
  - `staked_at` (timestamptz) - Stake timestamp
  - `unlock_at` (timestamptz) - Unlock timestamp
  - `unstaked_at` (timestamptz) - Unstake timestamp

  ### `lending_pools`
  - `id` (uuid, primary key) - Pool identifier
  - `pool_name` (text) - Pool name
  - `token_symbol` (text) - Lending token
  - `interest_rate` (numeric) - Annual interest rate
  - `total_supplied` (numeric) - Total supplied
  - `total_borrowed` (numeric) - Total borrowed
  - `utilization_rate` (numeric) - Pool utilization %
  - `status` (text) - Status: active, paused
  - `created_at` (timestamptz) - Creation timestamp

  ### `user_loans`
  - `id` (uuid, primary key) - Loan identifier
  - `user_id` (uuid, foreign key) - Borrower user ID
  - `pool_id` (uuid, foreign key) - Reference to lending_pools
  - `borrowed_amount` (numeric) - Loan amount
  - `collateral_amount` (numeric) - Collateral amount
  - `interest_rate` (numeric) - Loan interest rate
  - `repaid_amount` (numeric) - Amount repaid
  - `status` (text) - Status: active, repaid, liquidated
  - `borrowed_at` (timestamptz) - Borrow timestamp
  - `due_at` (timestamptz) - Due date
  - `repaid_at` (timestamptz) - Repayment timestamp

  ### `liquidity_pools`
  - `id` (uuid, primary key) - Pool identifier
  - `pool_name` (text) - Pool name
  - `token_a` (text) - First token symbol
  - `token_b` (text) - Second token symbol
  - `reserve_a` (numeric) - Reserve of token A
  - `reserve_b` (numeric) - Reserve of token B
  - `total_liquidity` (numeric) - Total LP tokens
  - `fee_percentage` (numeric) - Swap fee %
  - `created_at` (timestamptz) - Creation timestamp

  ### `user_liquidity_positions`
  - `id` (uuid, primary key) - Position identifier
  - `user_id` (uuid, foreign key) - Provider user ID
  - `pool_id` (uuid, foreign key) - Reference to liquidity_pools
  - `lp_tokens` (numeric) - LP tokens owned
  - `amount_a` (numeric) - Amount of token A provided
  - `amount_b` (numeric) - Amount of token B provided
  - `fees_earned` (numeric) - Fees earned
  - `status` (text) - Status: active, withdrawn
  - `created_at` (timestamptz) - Creation timestamp
  - `withdrawn_at` (timestamptz) - Withdrawal timestamp

  ## 2. Security - Row Level Security (RLS)
  
  - NFT categories are publicly viewable
  - NFT ownership is tracked and verified
  - Staking/lending positions are private to users
  - Liquidity pools are publicly viewable
  - Rewards are claimable only by owners

  ## 3. Important Notes
  
  - NFTs link to IPFS for decentralized storage
  - Carbon credits are tokenized and tradeable
  - Staking rewards auto-compound
  - Lending uses over-collateralization
  - All DeFi operations are auditable on-chain
*/

-- Create nft_impact_categories table
CREATE TABLE IF NOT EXISTS nft_impact_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text,
  total_minted integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create nft_impacts table
CREATE TABLE IF NOT EXISTS nft_impacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES nft_impact_categories(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  location text,
  coordinates jsonb,
  area_size numeric,
  image_url text NOT NULL,
  metadata_url text NOT NULL,
  carbon_credits numeric DEFAULT 0,
  esg_impact_score integer DEFAULT 0 CHECK (esg_impact_score >= 0 AND esg_impact_score <= 100),
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'active', 'revoked')),
  verified_by text,
  blockchain_address text,
  mint_transaction_hash text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create nft_rewards table
CREATE TABLE IF NOT EXISTS nft_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id uuid NOT NULL REFERENCES nft_impacts(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type text NOT NULL CHECK (reward_type IN ('staking', 'carbon_credit', 'badge', 'governance_vote')),
  amount numeric DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired')),
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create staking_pools table
CREATE TABLE IF NOT EXISTS staking_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_name text UNIQUE NOT NULL,
  token_symbol text DEFAULT 'عLK3',
  apy numeric NOT NULL CHECK (apy >= 0),
  min_stake numeric DEFAULT 0,
  lock_period_days integer DEFAULT 0,
  total_staked numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  created_at timestamptz DEFAULT now()
);

-- Create user_stakes table
CREATE TABLE IF NOT EXISTS user_stakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pool_id uuid NOT NULL REFERENCES staking_pools(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  rewards_earned numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'unstaking', 'completed')),
  staked_at timestamptz DEFAULT now(),
  unlock_at timestamptz,
  unstaked_at timestamptz
);

-- Create lending_pools table
CREATE TABLE IF NOT EXISTS lending_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_name text UNIQUE NOT NULL,
  token_symbol text DEFAULT 'عLK3',
  interest_rate numeric NOT NULL CHECK (interest_rate >= 0),
  total_supplied numeric DEFAULT 0,
  total_borrowed numeric DEFAULT 0,
  utilization_rate numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at timestamptz DEFAULT now()
);

-- Create user_loans table
CREATE TABLE IF NOT EXISTS user_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pool_id uuid NOT NULL REFERENCES lending_pools(id) ON DELETE CASCADE,
  borrowed_amount numeric NOT NULL CHECK (borrowed_amount > 0),
  collateral_amount numeric NOT NULL CHECK (collateral_amount > 0),
  interest_rate numeric NOT NULL,
  repaid_amount numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'repaid', 'liquidated')),
  borrowed_at timestamptz DEFAULT now(),
  due_at timestamptz,
  repaid_at timestamptz
);

-- Create liquidity_pools table
CREATE TABLE IF NOT EXISTS liquidity_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_name text UNIQUE NOT NULL,
  token_a text NOT NULL,
  token_b text NOT NULL,
  reserve_a numeric DEFAULT 0,
  reserve_b numeric DEFAULT 0,
  total_liquidity numeric DEFAULT 0,
  fee_percentage numeric DEFAULT 0.3,
  created_at timestamptz DEFAULT now()
);

-- Create user_liquidity_positions table
CREATE TABLE IF NOT EXISTS user_liquidity_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pool_id uuid NOT NULL REFERENCES liquidity_pools(id) ON DELETE CASCADE,
  lp_tokens numeric NOT NULL CHECK (lp_tokens > 0),
  amount_a numeric NOT NULL,
  amount_b numeric NOT NULL,
  fees_earned numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'withdrawn')),
  created_at timestamptz DEFAULT now(),
  withdrawn_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nft_impacts_owner ON nft_impacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_nft_impacts_category ON nft_impacts(category_id);
CREATE INDEX IF NOT EXISTS idx_nft_impacts_status ON nft_impacts(verification_status);
CREATE INDEX IF NOT EXISTS idx_nft_rewards_owner ON nft_rewards(owner_id);
CREATE INDEX IF NOT EXISTS idx_nft_rewards_nft ON nft_rewards(nft_id);
CREATE INDEX IF NOT EXISTS idx_user_stakes_user ON user_stakes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stakes_pool ON user_stakes(pool_id);
CREATE INDEX IF NOT EXISTS idx_user_loans_user ON user_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loans_pool ON user_loans(pool_id);
CREATE INDEX IF NOT EXISTS idx_user_liquidity_user ON user_liquidity_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_liquidity_pool ON user_liquidity_positions(pool_id);

-- Enable Row Level Security
ALTER TABLE nft_impact_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lending_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_liquidity_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nft_impact_categories (publicly viewable)
CREATE POLICY "Anyone can view NFT categories"
  ON nft_impact_categories FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for nft_impacts
CREATE POLICY "Anyone can view verified NFTs"
  ON nft_impacts FOR SELECT
  TO authenticated
  USING (verification_status IN ('verified', 'active'));

CREATE POLICY "Users can view own NFTs"
  ON nft_impacts FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can mint own NFTs"
  ON nft_impacts FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- RLS Policies for nft_rewards
CREATE POLICY "Users can view own NFT rewards"
  ON nft_rewards FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can claim own rewards"
  ON nft_rewards FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- RLS Policies for staking_pools (publicly viewable)
CREATE POLICY "Anyone can view staking pools"
  ON staking_pools FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_stakes
CREATE POLICY "Users can view own stakes"
  ON user_stakes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own stakes"
  ON user_stakes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own stakes"
  ON user_stakes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for lending_pools (publicly viewable)
CREATE POLICY "Anyone can view lending pools"
  ON lending_pools FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_loans
CREATE POLICY "Users can view own loans"
  ON user_loans FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own loans"
  ON user_loans FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own loans"
  ON user_loans FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for liquidity_pools (publicly viewable)
CREATE POLICY "Anyone can view liquidity pools"
  ON liquidity_pools FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_liquidity_positions
CREATE POLICY "Users can view own liquidity positions"
  ON user_liquidity_positions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own liquidity positions"
  ON user_liquidity_positions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own liquidity positions"
  ON user_liquidity_positions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_nft_impacts_updated_at
  BEFORE UPDATE ON nft_impacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default NFT Impact categories
INSERT INTO nft_impact_categories (name, description, icon) VALUES
  ('Mangroves', 'Protection des mangroves côtières', 'palm-tree'),
  ('Forêts', 'Conservation des forêts tropicales', 'trees'),
  ('Animaux', 'Protection de la faune sauvage africaine', 'paw-print'),
  ('Primates', 'Protection des chimpanzés et gorilles d''Afrique', 'monkey'),
  ('Grandes plaines', 'Préservation des savanes africaines', 'landscape'),
  ('Faune en danger', 'Espèces menacées d''extinction', 'wildlife'),
  ('Cours d''eau', 'Protection des rivières et lacs', 'water'),
  ('Biodiversité', 'Conservation de la diversité biologique', 'leaf'),
  ('Zones protégées', 'Réserves naturelles et sanctuaires', 'shield'),
  ('Parcs nationaux', 'Parcs nationaux africains', 'map')
ON CONFLICT (name) DO NOTHING;

-- Insert default staking pools
INSERT INTO staking_pools (pool_name, token_symbol, apy, min_stake, lock_period_days) VALUES
  ('عLK3 Flexible', 'عLK3', 8.0, 100, 0),
  ('عLK3 30 jours', 'عLK3', 12.0, 500, 30),
  ('عLK3 90 jours', 'عLK3', 18.0, 1000, 90),
  ('عLK3 180 jours', 'عLK3', 25.0, 5000, 180)
ON CONFLICT (pool_name) DO NOTHING;

-- Insert default liquidity pools
INSERT INTO liquidity_pools (pool_name, token_a, token_b, fee_percentage) VALUES
  ('عLK3/USDT', 'عLK3', 'USDT', 0.3),
  ('عLK3/GNF', 'عLK3', 'GNF', 0.3),
  ('عLK3/ETH', 'عLK3', 'ETH', 0.3)
ON CONFLICT (pool_name) DO NOTHING;