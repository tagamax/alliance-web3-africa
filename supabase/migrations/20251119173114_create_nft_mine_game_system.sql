/*
  # NFT Mine Game & Protection System - Core Schema
  
  ## Overview
  Module Web3 gamifié pour protection environnementale et simulation minière éducative.
  Génère NFT Impact écologiques traçables on-chain.
  
  ## 1. New Tables
  
  ### Zones Minières Virtuelles
    - `mine_zones`
      - `id` (uuid, primary key)
      - `name` (text) - Nom de la zone
      - `location_gps` (jsonb) - Coordonnées GPS
      - `resource_type` (text) - Or, diamant, cobalt, etc.
      - `resource_density` (integer) - Densité 1-100
      - `biodiversity_level` (integer) - Score biodiversité 1-100
      - `water_quality` (integer) - Qualité eau 1-100
      - `risk_level` (text) - low, medium, high, critical
      - `is_protected` (boolean) - Zone protégée
      - `protection_reason` (text)
      - `metadata` (jsonb)
  
  ### NFT Parcelles Minières
    - `mine_nft`
      - `id` (uuid, primary key)
      - `token_id` (text, unique) - ID on-chain
      - `owner_id` (uuid, foreign key users)
      - `zone_id` (uuid, foreign key mine_zones)
      - `rarity` (text) - common, rare, epic, legendary
      - `size_hectares` (numeric)
      - `resource_capacity` (integer)
      - `acquisition_date` (timestamptz)
      - `metadata` (jsonb)
  
  ### NFT Machines d'Exploitation
    - `machine_nft`
      - `id` (uuid, primary key)
      - `token_id` (text, unique)
      - `owner_id` (uuid, foreign key users)
      - `machine_type` (text) - excavator, drill, pump, truck
      - `productivity_level` (integer) - 1-100
      - `energy_consumption` (integer) - kWh
      - `water_impact` (integer) - Score 1-100
      - `soil_impact` (integer)
      - `biodiversity_impact` (integer)
      - `durability` (integer) - Utilisations restantes
      - `is_eco_certified` (boolean)
      - `metadata` (jsonb)
  
  ### NFT Biodiversité
    - `wildlife_nft`
      - `id` (uuid, primary key)
      - `token_id` (text, unique)
      - `owner_id` (uuid, foreign key users)
      - `species_name` (text)
      - `species_type` (text) - mammal, bird, reptile, amphibian, fish
      - `protection_status` (text) - vulnerable, endangered, critical
      - `zone_id` (uuid, foreign key mine_zones)
      - `population_protected` (integer)
      - `funding_allocated` (numeric)
      - `gps_location` (jsonb)
      - `metadata` (jsonb)
  
  ### NFT Mangroves & Reforestation
    - `mangrove_nft`
      - `id` (uuid, primary key)
      - `token_id` (text, unique)
      - `owner_id` (uuid, foreign key users)
      - `tree_type` (text)
      - `quantity` (integer) - Nombre d'arbres
      - `zone_id` (uuid, foreign key mine_zones)
      - `planting_date` (date)
      - `carbon_offset_tons` (numeric)
      - `growth_status` (text) - planted, growing, mature
      - `verification_status` (text) - pending, verified
      - `gps_location` (jsonb)
      - `metadata` (jsonb)
  
  ### NFT Compensation Carbone
    - `carbon_offset_nft`
      - `id` (uuid, primary key)
      - `token_id` (text, unique)
      - `owner_id` (uuid, foreign key users)
      - `tons_co2` (numeric)
      - `verification_authority` (text)
      - `verification_date` (timestamptz)
      - `project_id` (uuid)
      - `validity_period` (text)
      - `metadata` (jsonb)
  
  ### Simulations Minières
    - `mining_simulations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key users)
      - `zone_id` (uuid, foreign key mine_zones)
      - `mine_nft_id` (uuid, foreign key mine_nft)
      - `machines_used` (jsonb) - Liste machines NFT
      - `exploitation_mode` (text) - artisanal, semi-mechanized, industrial
      - `duration_days` (integer)
      - `resource_extracted` (integer)
      - `revenue_generated` (numeric)
      - `water_pollution_level` (integer)
      - `soil_degradation_level` (integer)
      - `biodiversity_loss` (integer)
      - `carbon_emissions_tons` (numeric)
      - `population_impact` (integer)
      - `esg_score` (integer) - Score final 1-100
      - `simulation_date` (timestamptz)
      - `metadata` (jsonb)
  
  ### Scores ESG par Zone
    - `biodiversity_scores`
      - `id` (uuid, primary key)
      - `zone_id` (uuid, foreign key mine_zones)
      - `water_score` (integer)
      - `soil_score` (integer)
      - `air_score` (integer)
      - `biodiversity_score` (integer)
      - `carbon_score` (integer)
      - `population_score` (integer)
      - `infrastructure_score` (integer)
      - `overall_esg_score` (integer)
      - `last_updated` (timestamptz)
  
  ### Événements Impact
    - `impact_events`
      - `id` (uuid, primary key)
      - `zone_id` (uuid, foreign key mine_zones)
      - `simulation_id` (uuid, foreign key mining_simulations)
      - `event_type` (text) - pollution, deforestation, species_loss, erosion
      - `severity` (text) - low, medium, high, critical
      - `affected_area_hectares` (numeric)
      - `compensation_required` (numeric)
      - `compensation_completed` (boolean)
      - `nft_compensation_ids` (jsonb)
      - `event_date` (timestamptz)
      - `metadata` (jsonb)
  
  ### Joueurs & Progression
    - `mine_players`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key users, unique)
      - `xp_points` (integer)
      - `level` (integer)
      - `esg_reputation` (integer) - Score réputation 0-1000
      - `guardian_tier` (text) - bronze, silver, gold, platinum, diamond
      - `total_simulations` (integer)
      - `total_nft_owned` (integer)
      - `total_carbon_offset` (numeric)
      - `total_trees_planted` (integer)
      - `dao_votes_cast` (integer)
      - `badges` (jsonb)
      - `achievements` (jsonb)
  
  ### Projets Verts Financés
    - `green_projects`
      - `id` (uuid, primary key)
      - `project_name` (text)
      - `project_type` (text) - reforestation, wildlife_protection, water_treatment
      - `zone_id` (uuid, foreign key mine_zones)
      - `funding_goal` (numeric)
      - `funding_raised` (numeric)
      - `funding_source` (text) - escrow, nft_sales, donations
      - `status` (text) - proposed, funded, in_progress, completed
      - `impact_metrics` (jsonb)
      - `verification_status` (text)
      - `start_date` (date)
      - `completion_date` (date)
      - `dao_approved` (boolean)
      - `metadata` (jsonb)
  
  ### Registre Carbone
    - `carbon_registry`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key users)
      - `nft_id` (uuid)
      - `action_type` (text) - emission, offset, compensation
      - `tons_co2` (numeric)
      - `verification_hash` (text)
      - `transaction_date` (timestamptz)
      - `metadata` (jsonb)
  
  ### Votes DAO
    - `dao_mine_votes`
      - `id` (uuid, primary key)
      - `proposal_id` (uuid)
      - `proposal_type` (text) - exploitation_approval, project_funding, policy_change
      - `zone_id` (uuid, foreign key mine_zones)
      - `project_id` (uuid, foreign key green_projects)
      - `voter_id` (uuid, foreign key users)
      - `vote` (text) - approve, reject, abstain
      - `voting_power` (integer) - Basé sur ESG reputation
      - `vote_date` (timestamptz)
      - `reason` (text)
  
  ## 2. Security
    - Enable RLS on all tables
    - Policies for authenticated users based on ownership
    - Special policies for DAO voting
    - Public read for zones and projects
    - Admin policies for verification
*/

-- Zones minières virtuelles
CREATE TABLE IF NOT EXISTS mine_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location_gps jsonb NOT NULL,
  resource_type text NOT NULL,
  resource_density integer CHECK (resource_density BETWEEN 1 AND 100),
  biodiversity_level integer CHECK (biodiversity_level BETWEEN 1 AND 100),
  water_quality integer CHECK (water_quality BETWEEN 1 AND 100),
  risk_level text CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  is_protected boolean DEFAULT false,
  protection_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mine_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mine zones"
  ON mine_zones FOR SELECT
  TO authenticated
  USING (true);

-- NFT Parcelles
CREATE TABLE IF NOT EXISTS mine_nft (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id text UNIQUE NOT NULL,
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  zone_id uuid REFERENCES mine_zones(id) NOT NULL,
  rarity text CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  size_hectares numeric NOT NULL,
  resource_capacity integer NOT NULL,
  acquisition_date timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE mine_nft ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mine NFTs"
  ON mine_nft FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own mine NFTs"
  ON mine_nft FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- NFT Machines
CREATE TABLE IF NOT EXISTS machine_nft (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id text UNIQUE NOT NULL,
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  machine_type text NOT NULL,
  productivity_level integer CHECK (productivity_level BETWEEN 1 AND 100),
  energy_consumption integer NOT NULL,
  water_impact integer CHECK (water_impact BETWEEN 1 AND 100),
  soil_impact integer CHECK (soil_impact BETWEEN 1 AND 100),
  biodiversity_impact integer CHECK (biodiversity_impact BETWEEN 1 AND 100),
  durability integer NOT NULL,
  is_eco_certified boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE machine_nft ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own machine NFTs"
  ON machine_nft FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own machine NFTs"
  ON machine_nft FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- NFT Biodiversité
CREATE TABLE IF NOT EXISTS wildlife_nft (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id text UNIQUE NOT NULL,
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  species_name text NOT NULL,
  species_type text CHECK (species_type IN ('mammal', 'bird', 'reptile', 'amphibian', 'fish', 'insect')),
  protection_status text CHECK (protection_status IN ('vulnerable', 'endangered', 'critical')),
  zone_id uuid REFERENCES mine_zones(id),
  population_protected integer NOT NULL,
  funding_allocated numeric DEFAULT 0,
  gps_location jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wildlife_nft ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wildlife NFTs"
  ON wildlife_nft FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- NFT Mangroves
CREATE TABLE IF NOT EXISTS mangrove_nft (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id text UNIQUE NOT NULL,
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  tree_type text NOT NULL,
  quantity integer NOT NULL,
  zone_id uuid REFERENCES mine_zones(id),
  planting_date date NOT NULL,
  carbon_offset_tons numeric NOT NULL,
  growth_status text CHECK (growth_status IN ('planted', 'growing', 'mature')) DEFAULT 'planted',
  verification_status text CHECK (verification_status IN ('pending', 'verified')) DEFAULT 'pending',
  gps_location jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mangrove_nft ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mangrove NFTs"
  ON mangrove_nft FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- NFT Compensation Carbone
CREATE TABLE IF NOT EXISTS carbon_offset_nft (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id text UNIQUE NOT NULL,
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  tons_co2 numeric NOT NULL,
  verification_authority text NOT NULL,
  verification_date timestamptz NOT NULL,
  project_id uuid,
  validity_period text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE carbon_offset_nft ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own carbon offset NFTs"
  ON carbon_offset_nft FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Simulations minières
CREATE TABLE IF NOT EXISTS mining_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  zone_id uuid REFERENCES mine_zones(id) NOT NULL,
  mine_nft_id uuid REFERENCES mine_nft(id),
  machines_used jsonb DEFAULT '[]'::jsonb,
  exploitation_mode text CHECK (exploitation_mode IN ('artisanal', 'semi-mechanized', 'industrial')),
  duration_days integer NOT NULL,
  resource_extracted integer NOT NULL,
  revenue_generated numeric NOT NULL,
  water_pollution_level integer CHECK (water_pollution_level BETWEEN 0 AND 100),
  soil_degradation_level integer CHECK (soil_degradation_level BETWEEN 0 AND 100),
  biodiversity_loss integer CHECK (biodiversity_loss BETWEEN 0 AND 100),
  carbon_emissions_tons numeric NOT NULL,
  population_impact integer CHECK (population_impact BETWEEN 0 AND 100),
  esg_score integer CHECK (esg_score BETWEEN 0 AND 100),
  simulation_date timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE mining_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own simulations"
  ON mining_simulations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulations"
  ON mining_simulations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Scores ESG
CREATE TABLE IF NOT EXISTS biodiversity_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid REFERENCES mine_zones(id) UNIQUE NOT NULL,
  water_score integer CHECK (water_score BETWEEN 0 AND 100) DEFAULT 100,
  soil_score integer CHECK (soil_score BETWEEN 0 AND 100) DEFAULT 100,
  air_score integer CHECK (air_score BETWEEN 0 AND 100) DEFAULT 100,
  biodiversity_score integer CHECK (biodiversity_score BETWEEN 0 AND 100) DEFAULT 100,
  carbon_score integer CHECK (carbon_score BETWEEN 0 AND 100) DEFAULT 100,
  population_score integer CHECK (population_score BETWEEN 0 AND 100) DEFAULT 100,
  infrastructure_score integer CHECK (infrastructure_score BETWEEN 0 AND 100) DEFAULT 100,
  overall_esg_score integer CHECK (overall_esg_score BETWEEN 0 AND 100) DEFAULT 100,
  last_updated timestamptz DEFAULT now()
);

ALTER TABLE biodiversity_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ESG scores"
  ON biodiversity_scores FOR SELECT
  TO authenticated
  USING (true);

-- Événements impact
CREATE TABLE IF NOT EXISTS impact_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid REFERENCES mine_zones(id) NOT NULL,
  simulation_id uuid REFERENCES mining_simulations(id),
  event_type text CHECK (event_type IN ('pollution', 'deforestation', 'species_loss', 'erosion', 'water_contamination')),
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  affected_area_hectares numeric NOT NULL,
  compensation_required numeric NOT NULL,
  compensation_completed boolean DEFAULT false,
  nft_compensation_ids jsonb DEFAULT '[]'::jsonb,
  event_date timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE impact_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view impact events"
  ON impact_events FOR SELECT
  TO authenticated
  USING (true);

-- Joueurs
CREATE TABLE IF NOT EXISTS mine_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  xp_points integer DEFAULT 0,
  level integer DEFAULT 1,
  esg_reputation integer DEFAULT 0 CHECK (esg_reputation BETWEEN 0 AND 1000),
  guardian_tier text CHECK (guardian_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')) DEFAULT 'bronze',
  total_simulations integer DEFAULT 0,
  total_nft_owned integer DEFAULT 0,
  total_carbon_offset numeric DEFAULT 0,
  total_trees_planted integer DEFAULT 0,
  dao_votes_cast integer DEFAULT 0,
  badges jsonb DEFAULT '[]'::jsonb,
  achievements jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mine_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own player profile"
  ON mine_players FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own player profile"
  ON mine_players FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own player profile"
  ON mine_players FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Projets verts
CREATE TABLE IF NOT EXISTS green_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  project_type text CHECK (project_type IN ('reforestation', 'wildlife_protection', 'water_treatment', 'renewable_energy', 'education')),
  zone_id uuid REFERENCES mine_zones(id),
  funding_goal numeric NOT NULL,
  funding_raised numeric DEFAULT 0,
  funding_source text DEFAULT 'escrow',
  status text CHECK (status IN ('proposed', 'funded', 'in_progress', 'completed')) DEFAULT 'proposed',
  impact_metrics jsonb DEFAULT '{}'::jsonb,
  verification_status text CHECK (verification_status IN ('pending', 'verified')) DEFAULT 'pending',
  start_date date,
  completion_date date,
  dao_approved boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE green_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view green projects"
  ON green_projects FOR SELECT
  TO authenticated
  USING (true);

-- Registre carbone
CREATE TABLE IF NOT EXISTS carbon_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  nft_id uuid,
  action_type text CHECK (action_type IN ('emission', 'offset', 'compensation')),
  tons_co2 numeric NOT NULL,
  verification_hash text,
  transaction_date timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE carbon_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own carbon registry"
  ON carbon_registry FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- DAO Votes
CREATE TABLE IF NOT EXISTS dao_mine_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL,
  proposal_type text CHECK (proposal_type IN ('exploitation_approval', 'project_funding', 'policy_change')),
  zone_id uuid REFERENCES mine_zones(id),
  project_id uuid REFERENCES green_projects(id),
  voter_id uuid REFERENCES auth.users(id) NOT NULL,
  vote text CHECK (vote IN ('approve', 'reject', 'abstain')),
  voting_power integer NOT NULL,
  vote_date timestamptz DEFAULT now(),
  reason text
);

ALTER TABLE dao_mine_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own votes"
  ON dao_mine_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Anyone can view votes"
  ON dao_mine_votes FOR SELECT
  TO authenticated
  USING (true);

-- Indexes pour performance
CREATE INDEX idx_mine_nft_owner ON mine_nft(owner_id);
CREATE INDEX idx_machine_nft_owner ON machine_nft(owner_id);
CREATE INDEX idx_wildlife_nft_owner ON wildlife_nft(owner_id);
CREATE INDEX idx_simulations_user ON mining_simulations(user_id);
CREATE INDEX idx_simulations_zone ON mining_simulations(zone_id);
CREATE INDEX idx_scores_zone ON biodiversity_scores(zone_id);
CREATE INDEX idx_events_zone ON impact_events(zone_id);
CREATE INDEX idx_players_user ON mine_players(user_id);
CREATE INDEX idx_votes_proposal ON dao_mine_votes(proposal_id);
CREATE INDEX idx_votes_voter ON dao_mine_votes(voter_id);
