/*
  # Commodity Index & ESG System - Alliance Web3 Africa (عLK3)

  ## Overview
  This migration creates the commodity tokenization system, ESG oracle, national economic index,
  and automatic redistribution engine that allows the token to gain value based on real economic
  data without owning physical assets.

  ## 1. New Tables
  
  ### `commodity_types`
  - `id` (uuid, primary key) - Commodity identifier
  - `name` (text) - Commodity name (Bauxite, Iron, Gold, Cocoa, Coffee, etc.)
  - `symbol` (text) - Trading symbol
  - `category` (text) - Category: mining, agriculture, energy, industrial
  - `unit` (text) - Measurement unit (tons, barrels, kg)
  - `icon` (text) - Icon identifier
  - `description` (text) - Commodity description
  - `created_at` (timestamptz) - Creation timestamp

  ### `commodity_prices`
  - `id` (uuid, primary key) - Price entry identifier
  - `commodity_id` (uuid, foreign key) - Reference to commodity_types
  - `price_usd` (numeric) - Current USD price per unit
  - `volume` (numeric) - Trading volume
  - `change_24h` (numeric) - 24h price change percentage
  - `market_cap` (numeric) - Market capitalization
  - `source` (text) - Data source (LME, LBMA, ICE, etc.)
  - `timestamp` (timestamptz) - Price timestamp

  ### `export_data`
  - `id` (uuid, primary key) - Export entry identifier
  - `commodity_id` (uuid, foreign key) - Reference to commodity_types
  - `country_code` (text) - ISO country code
  - `volume_raw` (numeric) - Raw export volume
  - `volume_processed` (numeric) - Processed export volume
  - `value_usd` (numeric) - Total export value USD
  - `destination` (text) - Destination country/region
  - `processing_level` (text) - raw, semi_processed, fully_processed
  - `period` (text) - Time period (2025-Q1, 2025-01, etc.)
  - `source` (text) - Data source
  - `verified` (boolean) - Verification status
  - `created_at` (timestamptz) - Entry timestamp

  ### `national_index`
  - `id` (uuid, primary key) - Index entry identifier
  - `country_code` (text) - ISO country code
  - `index_value` (numeric) - Current index value
  - `export_score` (numeric) - Export performance score (0-100)
  - `transformation_score` (numeric) - Local transformation score (0-100)
  - `esg_score` (numeric) - ESG score (0-100)
  - `innovation_score` (numeric) - Innovation score (0-100)
  - `adoption_score` (numeric) - Token adoption score (0-100)
  - `composite_score` (numeric) - Weighted composite score
  - `period` (text) - Time period
  - `calculation_metadata` (jsonb) - Calculation details
  - `created_at` (timestamptz) - Calculation timestamp

  ### `esg_metrics`
  - `id` (uuid, primary key) - Metric identifier
  - `entity_type` (text) - Type: project, nft, user, country
  - `entity_id` (uuid) - Referenced entity ID
  - `environmental_score` (numeric) - Environmental score (0-100)
  - `social_score` (numeric) - Social score (0-100)
  - `governance_score` (numeric) - Governance score (0-100)
  - `carbon_offset` (numeric) - Carbon offset in tons
  - `biodiversity_impact` (numeric) - Biodiversity impact score
  - `water_conservation` (numeric) - Water conservation score
  - `community_benefit` (numeric) - Community benefit score
  - `transparency_score` (numeric) - Transparency score
  - `verified_by` (text) - Verification authority
  - `verification_date` (timestamptz) - Verification date
  - `metadata` (jsonb) - Additional metrics
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `carbon_credits`
  - `id` (uuid, primary key) - Credit identifier
  - `nft_id` (uuid, foreign key) - Reference to nft_impacts
  - `owner_id` (uuid, foreign key) - Reference to users
  - `credit_amount` (numeric) - Amount in tons CO2
  - `price_per_ton` (numeric) - Price per ton USD
  - `certification` (text) - Certification standard
  - `vintage_year` (integer) - Year of carbon offset
  - `status` (text) - Status: active, traded, retired
  - `blockchain_hash` (text) - Blockchain transaction hash
  - `created_at` (timestamptz) - Creation timestamp
  - `traded_at` (timestamptz) - Trading timestamp

  ### `redistribution_events`
  - `id` (uuid, primary key) - Event identifier
  - `period` (text) - Distribution period
  - `total_pool` (numeric) - Total pool amount in عLK3
  - `recipients_count` (integer) - Number of recipients
  - `per_user_amount` (numeric) - Amount per user
  - `source` (text) - Source: export_index, transformation_bonus, esg_rewards, mining_pools
  - `country_code` (text) - Target country
  - `calculation_metadata` (jsonb) - Calculation details
  - `status` (text) - Status: pending, processing, completed
  - `processed_at` (timestamptz) - Processing timestamp
  - `created_at` (timestamptz) - Creation timestamp

  ### `user_redistributions`
  - `id` (uuid, primary key) - Distribution identifier
  - `user_id` (uuid, foreign key) - Reference to users
  - `event_id` (uuid, foreign key) - Reference to redistribution_events
  - `amount` (numeric) - Amount received in عLK3
  - `claimed` (boolean) - Claim status
  - `claimed_at` (timestamptz) - Claim timestamp
  - `created_at` (timestamptz) - Creation timestamp

  ## 2. Security - Row Level Security (RLS)
  
  - Commodity data is publicly viewable
  - Export data is publicly transparent
  - National index is publicly accessible
  - ESG metrics are publicly verifiable
  - Carbon credits ownership is tracked
  - Redistribution events are transparent
  - User redistributions are private to users

  ## 3. Important Notes
  
  - This system allows token value to grow based on real economic data
  - No need to own physical commodities
  - Data sourced from public APIs and oracles
  - Automatic redistribution based on index performance
  - ESG scoring creates additional value layer
  - Carbon credits are tokenized and tradeable
*/

-- Create commodity_types table
CREATE TABLE IF NOT EXISTS commodity_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  symbol text UNIQUE NOT NULL,
  category text NOT NULL CHECK (category IN ('mining', 'agriculture', 'energy', 'industrial')),
  unit text NOT NULL,
  icon text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create commodity_prices table
CREATE TABLE IF NOT EXISTS commodity_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_id uuid NOT NULL REFERENCES commodity_types(id) ON DELETE CASCADE,
  price_usd numeric NOT NULL CHECK (price_usd >= 0),
  volume numeric DEFAULT 0,
  change_24h numeric DEFAULT 0,
  market_cap numeric DEFAULT 0,
  source text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Create export_data table
CREATE TABLE IF NOT EXISTS export_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_id uuid NOT NULL REFERENCES commodity_types(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  volume_raw numeric DEFAULT 0 CHECK (volume_raw >= 0),
  volume_processed numeric DEFAULT 0 CHECK (volume_processed >= 0),
  value_usd numeric NOT NULL CHECK (value_usd >= 0),
  destination text,
  processing_level text CHECK (processing_level IN ('raw', 'semi_processed', 'fully_processed')),
  period text NOT NULL,
  source text NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create national_index table
CREATE TABLE IF NOT EXISTS national_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  index_value numeric NOT NULL CHECK (index_value >= 0),
  export_score numeric DEFAULT 0 CHECK (export_score >= 0 AND export_score <= 100),
  transformation_score numeric DEFAULT 0 CHECK (transformation_score >= 0 AND transformation_score <= 100),
  esg_score numeric DEFAULT 0 CHECK (esg_score >= 0 AND esg_score <= 100),
  innovation_score numeric DEFAULT 0 CHECK (innovation_score >= 0 AND innovation_score <= 100),
  adoption_score numeric DEFAULT 0 CHECK (adoption_score >= 0 AND adoption_score <= 100),
  composite_score numeric DEFAULT 0 CHECK (composite_score >= 0 AND composite_score <= 100),
  period text NOT NULL,
  calculation_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(country_code, period)
);

-- Create esg_metrics table
CREATE TABLE IF NOT EXISTS esg_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('project', 'nft', 'user', 'country', 'entrepreneur')),
  entity_id uuid NOT NULL,
  environmental_score numeric DEFAULT 0 CHECK (environmental_score >= 0 AND environmental_score <= 100),
  social_score numeric DEFAULT 0 CHECK (social_score >= 0 AND social_score <= 100),
  governance_score numeric DEFAULT 0 CHECK (governance_score >= 0 AND governance_score <= 100),
  carbon_offset numeric DEFAULT 0,
  biodiversity_impact numeric DEFAULT 0,
  water_conservation numeric DEFAULT 0,
  community_benefit numeric DEFAULT 0,
  transparency_score numeric DEFAULT 0 CHECK (transparency_score >= 0 AND transparency_score <= 100),
  verified_by text,
  verification_date timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create carbon_credits table
CREATE TABLE IF NOT EXISTS carbon_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id uuid REFERENCES nft_impacts(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credit_amount numeric NOT NULL CHECK (credit_amount > 0),
  price_per_ton numeric NOT NULL CHECK (price_per_ton >= 0),
  certification text NOT NULL,
  vintage_year integer NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'traded', 'retired')),
  blockchain_hash text,
  created_at timestamptz DEFAULT now(),
  traded_at timestamptz
);

-- Create redistribution_events table
CREATE TABLE IF NOT EXISTS redistribution_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period text NOT NULL,
  total_pool numeric NOT NULL CHECK (total_pool > 0),
  recipients_count integer DEFAULT 0,
  per_user_amount numeric DEFAULT 0,
  source text NOT NULL CHECK (source IN ('export_index', 'transformation_bonus', 'esg_rewards', 'mining_pools', 'defi_yields')),
  country_code text,
  calculation_metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create user_redistributions table
CREATE TABLE IF NOT EXISTS user_redistributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES redistribution_events(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  claimed boolean DEFAULT false,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_commodity_prices_commodity ON commodity_prices(commodity_id);
CREATE INDEX IF NOT EXISTS idx_commodity_prices_timestamp ON commodity_prices(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_export_data_commodity ON export_data(commodity_id);
CREATE INDEX IF NOT EXISTS idx_export_data_country ON export_data(country_code);
CREATE INDEX IF NOT EXISTS idx_export_data_period ON export_data(period);
CREATE INDEX IF NOT EXISTS idx_national_index_country ON national_index(country_code);
CREATE INDEX IF NOT EXISTS idx_national_index_period ON national_index(period);
CREATE INDEX IF NOT EXISTS idx_esg_metrics_entity ON esg_metrics(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_carbon_credits_owner ON carbon_credits(owner_id);
CREATE INDEX IF NOT EXISTS idx_carbon_credits_nft ON carbon_credits(nft_id);
CREATE INDEX IF NOT EXISTS idx_redistribution_events_period ON redistribution_events(period);
CREATE INDEX IF NOT EXISTS idx_user_redistributions_user ON user_redistributions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_redistributions_event ON user_redistributions(event_id);

-- Enable Row Level Security
ALTER TABLE commodity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE commodity_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE national_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE esg_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE redistribution_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_redistributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (all public data except user redistributions)
CREATE POLICY "Anyone can view commodity types"
  ON commodity_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view commodity prices"
  ON commodity_prices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view export data"
  ON export_data FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view national index"
  ON national_index FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view ESG metrics"
  ON esg_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own carbon credits"
  ON carbon_credits FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Anyone can view redistribution events"
  ON redistribution_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own redistributions"
  ON user_redistributions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can claim own redistributions"
  ON user_redistributions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Triggers
CREATE TRIGGER update_esg_metrics_updated_at
  BEFORE UPDATE ON esg_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default commodities
INSERT INTO commodity_types (name, symbol, category, unit, icon, description) VALUES
  ('Bauxite', 'BAU', 'mining', 'tons', 'mountain', 'Aluminum ore - primary source of aluminum'),
  ('Iron Ore', 'FE', 'mining', 'tons', 'box', 'Primary source of metallic iron'),
  ('Gold', 'AU', 'mining', 'kg', 'coins', 'Precious metal used in jewelry and investment'),
  ('Diamond', 'DIA', 'mining', 'carats', 'gem', 'Precious gemstone'),
  ('Cocoa', 'COCO', 'agriculture', 'tons', 'coffee', 'Raw material for chocolate production'),
  ('Coffee', 'COFF', 'agriculture', 'tons', 'coffee', 'Coffee beans'),
  ('Palm Oil', 'PALM', 'agriculture', 'tons', 'droplet', 'Vegetable oil from palm fruit'),
  ('Rubber', 'RUB', 'agriculture', 'tons', 'circle', 'Natural latex'),
  ('Timber', 'TIMB', 'agriculture', 'cubic_meters', 'trees', 'Wood for construction and paper'),
  ('Crude Oil', 'OIL', 'energy', 'barrels', 'fuel', 'Unrefined petroleum'),
  ('Natural Gas', 'GAS', 'energy', 'cubic_meters', 'wind', 'Fossil fuel gas'),
  ('Uranium', 'U', 'energy', 'kg', 'zap', 'Nuclear fuel'),
  ('Lithium', 'LI', 'mining', 'tons', 'battery', 'Battery material'),
  ('Cobalt', 'CO', 'mining', 'tons', 'cpu', 'Battery and alloy material'),
  ('Manganese', 'MN', 'mining', 'tons', 'package', 'Steel production material')
ON CONFLICT (name) DO NOTHING;