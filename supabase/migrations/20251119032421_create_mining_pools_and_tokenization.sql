/*
  # Mining Pools & Commodity Tokenization System

  ## Overview
  This migration creates virtual mining pools where users can invest in tokenized commodities
  without owning physical assets. The value is derived from real commodity data and indices.

  ## 1. New Tables
  
  ### `mining_pools`
  - `id` (uuid, primary key) - Pool identifier
  - `pool_name` (text) - Pool name
  - `commodity_id` (uuid, foreign key) - Reference to commodity_types
  - `pool_type` (text) - Type: export_index, transformation, mixed, esg_bonus
  - `description` (text) - Pool description
  - `target_amount` (numeric) - Target pool size in عLK3
  - `current_amount` (numeric) - Current pool size
  - `min_investment` (numeric) - Minimum investment
  - `max_investment` (numeric) - Maximum investment
  - `apy` (numeric) - Annual percentage yield
  - `lock_period_days` (integer) - Lock period in days
  - `index_weight_export` (numeric) - Weight for export index
  - `index_weight_transformation` (numeric) - Weight for transformation
  - `index_weight_esg` (numeric) - Weight for ESG score
  - `status` (text) - Status: active, paused, closed, matured
  - `start_date` (timestamptz) - Pool start date
  - `end_date` (timestamptz) - Pool end date
  - `total_participants` (integer) - Number of participants
  - `performance_score` (numeric) - Performance score
  - `metadata` (jsonb) - Additional pool data
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `pool_investments`
  - `id` (uuid, primary key) - Investment identifier
  - `pool_id` (uuid, foreign key) - Reference to mining_pools
  - `investor_id` (uuid, foreign key) - Investor user ID
  - `amount_invested` (numeric) - Amount invested in عLK3
  - `shares` (numeric) - Pool shares received
  - `entry_price` (numeric) - Entry price per share
  - `current_value` (numeric) - Current investment value
  - `rewards_earned` (numeric) - Rewards earned
  - `status` (text) - Status: active, locked, withdrawn
  - `invested_at` (timestamptz) - Investment timestamp
  - `unlock_at` (timestamptz) - Unlock timestamp
  - `withdrawn_at` (timestamptz) - Withdrawal timestamp

  ### `pool_performance`
  - `id` (uuid, primary key) - Performance record identifier
  - `pool_id` (uuid, foreign key) - Reference to mining_pools
  - `period` (text) - Time period
  - `index_value` (numeric) - Index value for period
  - `export_volume` (numeric) - Export volume tracked
  - `transformation_rate` (numeric) - Transformation rate
  - `esg_score` (numeric) - ESG score
  - `apy_actual` (numeric) - Actual APY achieved
  - `rewards_distributed` (numeric) - Total rewards distributed
  - `metadata` (jsonb) - Performance metadata
  - `created_at` (timestamptz) - Creation timestamp

  ### `commodity_tokens`
  - `id` (uuid, primary key) - Token identifier
  - `commodity_id` (uuid, foreign key) - Reference to commodity_types
  - `token_name` (text) - Token name
  - `token_symbol` (text) - Token symbol
  - `total_supply` (numeric) - Total token supply
  - `circulating_supply` (numeric) - Circulating supply
  - `price_usd` (numeric) - Current price USD
  - `market_cap` (numeric) - Market capitalization
  - `backed_by_volume` (numeric) - Volume of commodity backing
  - `backing_percentage` (numeric) - Percentage backed by real data
  - `status` (text) - Status: active, paused
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `token_holders`
  - `id` (uuid, primary key) - Holder record identifier
  - `token_id` (uuid, foreign key) - Reference to commodity_tokens
  - `user_id` (uuid, foreign key) - User holder
  - `balance` (numeric) - Token balance
  - `locked_balance` (numeric) - Locked balance
  - `average_buy_price` (numeric) - Average purchase price
  - `realized_gains` (numeric) - Realized gains/losses
  - `unrealized_gains` (numeric) - Unrealized gains/losses
  - `last_updated` (timestamptz) - Last update timestamp

  ### `transformation_tracking`
  - `id` (uuid, primary key) - Tracking identifier
  - `commodity_id` (uuid, foreign key) - Reference to commodity_types
  - `country_code` (text) - ISO country code
  - `transformation_type` (text) - Type: local, external
  - `input_volume` (numeric) - Raw input volume
  - `output_volume` (numeric) - Processed output volume
  - `value_added` (numeric) - Value added USD
  - `transformation_rate` (numeric) - Transformation percentage
  - `period` (text) - Time period
  - `facility_name` (text) - Processing facility name
  - `verified` (boolean) - Verification status
  - `source` (text) - Data source
  - `created_at` (timestamptz) - Creation timestamp

  ## 2. Security - Row Level Security (RLS)
  
  - Mining pools are publicly viewable
  - Pool investments are private to investors
  - Performance data is publicly transparent
  - Commodity tokens are publicly viewable
  - Token holdings are private to holders
  - Transformation tracking is publicly transparent

  ## 3. Important Notes
  
  - No actual ownership of physical commodities
  - Value derived from real economic data via oracles
  - Automatic rewards distribution based on index performance
  - Transformation tracking incentivizes local processing
  - Users can trade commodity tokens on secondary markets
*/

-- Create mining_pools table
CREATE TABLE IF NOT EXISTS mining_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_name text UNIQUE NOT NULL,
  commodity_id uuid REFERENCES commodity_types(id) ON DELETE CASCADE,
  pool_type text NOT NULL CHECK (pool_type IN ('export_index', 'transformation', 'mixed', 'esg_bonus')),
  description text NOT NULL,
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  current_amount numeric DEFAULT 0 CHECK (current_amount >= 0),
  min_investment numeric DEFAULT 100,
  max_investment numeric,
  apy numeric NOT NULL CHECK (apy >= 0),
  lock_period_days integer DEFAULT 0,
  index_weight_export numeric DEFAULT 0.4 CHECK (index_weight_export >= 0 AND index_weight_export <= 1),
  index_weight_transformation numeric DEFAULT 0.4 CHECK (index_weight_transformation >= 0 AND index_weight_transformation <= 1),
  index_weight_esg numeric DEFAULT 0.2 CHECK (index_weight_esg >= 0 AND index_weight_esg <= 1),
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'matured')),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  total_participants integer DEFAULT 0,
  performance_score numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pool_investments table
CREATE TABLE IF NOT EXISTS pool_investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id uuid NOT NULL REFERENCES mining_pools(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_invested numeric NOT NULL CHECK (amount_invested > 0),
  shares numeric NOT NULL CHECK (shares > 0),
  entry_price numeric NOT NULL,
  current_value numeric DEFAULT 0,
  rewards_earned numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'locked', 'withdrawn')),
  invested_at timestamptz DEFAULT now(),
  unlock_at timestamptz,
  withdrawn_at timestamptz
);

-- Create pool_performance table
CREATE TABLE IF NOT EXISTS pool_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id uuid NOT NULL REFERENCES mining_pools(id) ON DELETE CASCADE,
  period text NOT NULL,
  index_value numeric NOT NULL,
  export_volume numeric DEFAULT 0,
  transformation_rate numeric DEFAULT 0,
  esg_score numeric DEFAULT 0,
  apy_actual numeric DEFAULT 0,
  rewards_distributed numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create commodity_tokens table
CREATE TABLE IF NOT EXISTS commodity_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_id uuid UNIQUE NOT NULL REFERENCES commodity_types(id) ON DELETE CASCADE,
  token_name text UNIQUE NOT NULL,
  token_symbol text UNIQUE NOT NULL,
  total_supply numeric NOT NULL CHECK (total_supply > 0),
  circulating_supply numeric DEFAULT 0 CHECK (circulating_supply >= 0),
  price_usd numeric DEFAULT 0 CHECK (price_usd >= 0),
  market_cap numeric DEFAULT 0,
  backed_by_volume numeric DEFAULT 0,
  backing_percentage numeric DEFAULT 0 CHECK (backing_percentage >= 0 AND backing_percentage <= 100),
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create token_holders table
CREATE TABLE IF NOT EXISTS token_holders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid NOT NULL REFERENCES commodity_tokens(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance numeric DEFAULT 0 CHECK (balance >= 0),
  locked_balance numeric DEFAULT 0 CHECK (locked_balance >= 0),
  average_buy_price numeric DEFAULT 0,
  realized_gains numeric DEFAULT 0,
  unrealized_gains numeric DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(token_id, user_id)
);

-- Create transformation_tracking table
CREATE TABLE IF NOT EXISTS transformation_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_id uuid NOT NULL REFERENCES commodity_types(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  transformation_type text NOT NULL CHECK (transformation_type IN ('local', 'external')),
  input_volume numeric NOT NULL CHECK (input_volume > 0),
  output_volume numeric NOT NULL CHECK (output_volume > 0),
  value_added numeric NOT NULL CHECK (value_added >= 0),
  transformation_rate numeric DEFAULT 0 CHECK (transformation_rate >= 0 AND transformation_rate <= 100),
  period text NOT NULL,
  facility_name text,
  verified boolean DEFAULT false,
  source text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mining_pools_commodity ON mining_pools(commodity_id);
CREATE INDEX IF NOT EXISTS idx_mining_pools_status ON mining_pools(status);
CREATE INDEX IF NOT EXISTS idx_pool_investments_pool ON pool_investments(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_investments_investor ON pool_investments(investor_id);
CREATE INDEX IF NOT EXISTS idx_pool_performance_pool ON pool_performance(pool_id);
CREATE INDEX IF NOT EXISTS idx_commodity_tokens_commodity ON commodity_tokens(commodity_id);
CREATE INDEX IF NOT EXISTS idx_token_holders_token ON token_holders(token_id);
CREATE INDEX IF NOT EXISTS idx_token_holders_user ON token_holders(user_id);
CREATE INDEX IF NOT EXISTS idx_transformation_tracking_commodity ON transformation_tracking(commodity_id);
CREATE INDEX IF NOT EXISTS idx_transformation_tracking_country ON transformation_tracking(country_code);

-- Enable Row Level Security
ALTER TABLE mining_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE commodity_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformation_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mining_pools
CREATE POLICY "Anyone can view mining pools"
  ON mining_pools FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for pool_investments
CREATE POLICY "Users can view own pool investments"
  ON pool_investments FOR SELECT
  TO authenticated
  USING (investor_id = auth.uid());

CREATE POLICY "Users can create own pool investments"
  ON pool_investments FOR INSERT
  TO authenticated
  WITH CHECK (investor_id = auth.uid());

-- RLS Policies for pool_performance
CREATE POLICY "Anyone can view pool performance"
  ON pool_performance FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for commodity_tokens
CREATE POLICY "Anyone can view commodity tokens"
  ON commodity_tokens FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for token_holders
CREATE POLICY "Users can view own token holdings"
  ON token_holders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for transformation_tracking
CREATE POLICY "Anyone can view transformation tracking"
  ON transformation_tracking FOR SELECT
  TO authenticated
  USING (true);

-- Triggers
CREATE TRIGGER update_mining_pools_updated_at
  BEFORE UPDATE ON mining_pools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commodity_tokens_updated_at
  BEFORE UPDATE ON commodity_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample mining pools
INSERT INTO mining_pools (pool_name, commodity_id, pool_type, description, target_amount, apy, lock_period_days, index_weight_export, index_weight_transformation, index_weight_esg) 
SELECT 
  'Bauxite Export Index Pool', 
  id, 
  'export_index', 
  'Invest in tokenized bauxite export performance with automatic rewards based on real export data',
  1000000,
  15.5,
  90,
  0.6,
  0.3,
  0.1
FROM commodity_types WHERE symbol = 'BAU'
ON CONFLICT DO NOTHING;

INSERT INTO mining_pools (pool_name, commodity_id, pool_type, description, target_amount, apy, lock_period_days, index_weight_export, index_weight_transformation, index_weight_esg) 
SELECT 
  'Gold Transformation Pool', 
  id, 
  'transformation', 
  'Higher returns for gold transformation tracking - rewards local processing',
  500000,
  22.0,
  180,
  0.2,
  0.6,
  0.2
FROM commodity_types WHERE symbol = 'AU'
ON CONFLICT DO NOTHING;

INSERT INTO mining_pools (pool_name, commodity_id, pool_type, description, target_amount, apy, lock_period_days, index_weight_export, index_weight_transformation, index_weight_esg) 
SELECT 
  'Cocoa ESG Bonus Pool', 
  id, 
  'esg_bonus', 
  'Invest in sustainable cocoa with ESG-weighted rewards',
  300000,
  18.0,
  120,
  0.3,
  0.3,
  0.4
FROM commodity_types WHERE symbol = 'COCO'
ON CONFLICT DO NOTHING;