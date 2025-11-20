/*
  # CROWN System & P2P Escrow Schema

  ## Overview
  This migration creates the CROWN investment/financing system and the ultra-secure P2P trading
  infrastructure with multi-role escrow contracts.

  ## 1. New Tables
  
  ### `crown_projects`
  - `id` (uuid, primary key) - Project identifier
  - `creator_id` (uuid, foreign key) - Project creator
  - `project_type` (text) - Type: investment, sale, purchase, public_guarantee
  - `title` (text) - Project title
  - `description` (text) - Detailed description
  - `category` (text) - Category: agriculture, infrastructure, technology, etc.
  - `target_amount` (numeric) - Funding goal
  - `raised_amount` (numeric) - Current raised amount
  - `currency` (text) - Currency symbol
  - `status` (text) - Status: draft, active, funded, in_progress, completed, cancelled
  - `start_date` (timestamptz) - Project start date
  - `end_date` (timestamptz) - Project end date
  - `location` (text) - Project location
  - `images` (jsonb) - Project images array
  - `documents` (jsonb) - Supporting documents
  - `milestones` (jsonb) - Project milestones
  - `esg_score` (integer) - Environmental/Social/Governance score
  - `verified` (boolean) - Verification status
  - `blockchain_address` (text) - Smart contract address
  - `metadata` (jsonb) - Additional project data
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `crown_investments`
  - `id` (uuid, primary key) - Investment identifier
  - `project_id` (uuid, foreign key) - Reference to crown_projects
  - `investor_id` (uuid, foreign key) - Investor user ID
  - `amount` (numeric) - Investment amount
  - `currency` (text) - Investment currency
  - `shares` (numeric) - Fractional shares received
  - `status` (text) - Status: pending, confirmed, released, refunded
  - `transaction_hash` (text) - Blockchain transaction hash
  - `created_at` (timestamptz) - Investment timestamp

  ### `p2p_trades`
  - `id` (uuid, primary key) - Trade identifier
  - `seller_id` (uuid, foreign key) - Seller user ID
  - `buyer_id` (uuid, foreign key) - Buyer user ID
  - `trade_type` (text) - Type: buy, sell
  - `from_currency` (text) - Currency being sold
  - `to_currency` (text) - Currency being bought
  - `amount` (numeric) - Trade amount
  - `price` (numeric) - Exchange rate/price
  - `payment_method` (text) - Payment method: mobile_money, bank_transfer, cash, crypto
  - `status` (text) - Status: open, locked, paid, released, disputed, completed, cancelled
  - `escrow_address` (text) - Escrow smart contract address
  - `payment_proof` (jsonb) - Payment proof documents/images
  - `chat_messages` (jsonb) - Trade chat history
  - `dispute_reason` (text) - Dispute reason if any
  - `mediator_id` (uuid) - Assigned mediator for disputes
  - `expires_at` (timestamptz) - Trade expiration time
  - `created_at` (timestamptz) - Trade creation timestamp
  - `completed_at` (timestamptz) - Completion timestamp

  ### `escrow_locks`
  - `id` (uuid, primary key) - Escrow identifier
  - `trade_id` (uuid, foreign key) - Reference to p2p_trades
  - `user_id` (uuid, foreign key) - User who locked funds
  - `amount` (numeric) - Locked amount
  - `currency` (text) - Locked currency
  - `status` (text) - Status: locked, released, refunded
  - `smart_contract_address` (text) - Blockchain contract address
  - `transaction_hash` (text) - Lock transaction hash
  - `release_hash` (text) - Release transaction hash
  - `created_at` (timestamptz) - Lock timestamp
  - `released_at` (timestamptz) - Release timestamp

  ### `crown_guarantees`
  - `id` (uuid, primary key) - Guarantee identifier
  - `project_id` (uuid, foreign key) - Reference to crown_projects
  - `entrepreneur_id` (uuid, foreign key) - Entrepreneur user ID
  - `guarantee_type` (text) - Type: public_contract, work_verification, milestone
  - `amount` (numeric) - Guarantee amount
  - `status` (text) - Status: pending, active, verified, released, revoked
  - `verifiers` (jsonb) - Citizen verifiers array
  - `verification_proofs` (jsonb) - Proof documents/images
  - `government_agency` (text) - Government agency name
  - `contract_number` (text) - Official contract number
  - `created_at` (timestamptz) - Creation timestamp
  - `verified_at` (timestamptz) - Verification timestamp

  ### `reputation_events`
  - `id` (uuid, primary key) - Event identifier
  - `user_id` (uuid, foreign key) - User affected
  - `event_type` (text) - Type: trade_completed, dispute_won, dispute_lost, kyc_verified, project_funded, milestone_completed
  - `score_change` (integer) - CROWN score delta (+/-)
  - `reference_id` (uuid) - Related trade/project/document ID
  - `notes` (text) - Event description
  - `created_at` (timestamptz) - Event timestamp

  ## 2. Security - Row Level Security (RLS)
  
  - CROWN projects are publicly viewable but only editable by creators
  - Investments are visible only to investors and project creators
  - P2P trades are visible only to participants (buyer, seller, mediator)
  - Escrow locks are strictly controlled by smart contracts
  - Guarantees are publicly transparent for accountability
  - Reputation events are visible only to the affected user

  ## 3. Indexes
  
  Performance indexes on frequently queried fields

  ## 4. Important Notes
  
  - All amounts use NUMERIC for financial precision
  - JSONB fields store flexible structured data
  - Status fields use CHECK constraints for data integrity
  - Blockchain addresses link on-chain and off-chain data
  - Reputation system automatically updates CROWN scores
*/

-- Create crown_projects table
CREATE TABLE IF NOT EXISTS crown_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_type text NOT NULL CHECK (project_type IN ('investment', 'fractional_sale', 'group_purchase', 'public_guarantee')),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  target_amount numeric NOT NULL CHECK (target_amount > 0),
  raised_amount numeric DEFAULT 0 CHECK (raised_amount >= 0),
  currency text DEFAULT 'عLK3',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'funded', 'in_progress', 'completed', 'cancelled')),
  start_date timestamptz,
  end_date timestamptz,
  location text,
  images jsonb DEFAULT '[]'::jsonb,
  documents jsonb DEFAULT '[]'::jsonb,
  milestones jsonb DEFAULT '[]'::jsonb,
  esg_score integer DEFAULT 0 CHECK (esg_score >= 0 AND esg_score <= 100),
  verified boolean DEFAULT false,
  blockchain_address text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create crown_investments table
CREATE TABLE IF NOT EXISTS crown_investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES crown_projects(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'عLK3',
  shares numeric DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'released', 'refunded')),
  transaction_hash text,
  created_at timestamptz DEFAULT now()
);

-- Create p2p_trades table
CREATE TABLE IF NOT EXISTS p2p_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  trade_type text NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  price numeric NOT NULL CHECK (price > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('mobile_money', 'bank_transfer', 'cash', 'crypto')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'locked', 'paid', 'released', 'disputed', 'completed', 'cancelled')),
  escrow_address text,
  payment_proof jsonb DEFAULT '[]'::jsonb,
  chat_messages jsonb DEFAULT '[]'::jsonb,
  dispute_reason text,
  mediator_id uuid REFERENCES users(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create escrow_locks table
CREATE TABLE IF NOT EXISTS escrow_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL REFERENCES p2p_trades(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL,
  status text DEFAULT 'locked' CHECK (status IN ('locked', 'released', 'refunded')),
  smart_contract_address text,
  transaction_hash text,
  release_hash text,
  created_at timestamptz DEFAULT now(),
  released_at timestamptz
);

-- Create crown_guarantees table
CREATE TABLE IF NOT EXISTS crown_guarantees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES crown_projects(id) ON DELETE CASCADE,
  entrepreneur_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guarantee_type text NOT NULL CHECK (guarantee_type IN ('public_contract', 'work_verification', 'milestone')),
  amount numeric NOT NULL CHECK (amount > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'verified', 'released', 'revoked')),
  verifiers jsonb DEFAULT '[]'::jsonb,
  verification_proofs jsonb DEFAULT '[]'::jsonb,
  government_agency text,
  contract_number text,
  created_at timestamptz DEFAULT now(),
  verified_at timestamptz
);

-- Create reputation_events table
CREATE TABLE IF NOT EXISTS reputation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('trade_completed', 'dispute_won', 'dispute_lost', 'kyc_verified', 'project_funded', 'milestone_completed', 'guarantee_verified')),
  score_change integer NOT NULL,
  reference_id uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crown_projects_creator ON crown_projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_crown_projects_status ON crown_projects(status);
CREATE INDEX IF NOT EXISTS idx_crown_projects_category ON crown_projects(category);
CREATE INDEX IF NOT EXISTS idx_crown_investments_project ON crown_investments(project_id);
CREATE INDEX IF NOT EXISTS idx_crown_investments_investor ON crown_investments(investor_id);
CREATE INDEX IF NOT EXISTS idx_p2p_trades_seller ON p2p_trades(seller_id);
CREATE INDEX IF NOT EXISTS idx_p2p_trades_buyer ON p2p_trades(buyer_id);
CREATE INDEX IF NOT EXISTS idx_p2p_trades_status ON p2p_trades(status);
CREATE INDEX IF NOT EXISTS idx_escrow_locks_trade ON escrow_locks(trade_id);
CREATE INDEX IF NOT EXISTS idx_crown_guarantees_project ON crown_guarantees(project_id);
CREATE INDEX IF NOT EXISTS idx_reputation_events_user ON reputation_events(user_id);

-- Enable Row Level Security
ALTER TABLE crown_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE crown_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crown_guarantees ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crown_projects (publicly viewable, creator can edit)
CREATE POLICY "Anyone can view active projects"
  ON crown_projects FOR SELECT
  TO authenticated
  USING (status IN ('active', 'funded', 'in_progress', 'completed'));

CREATE POLICY "Users can view own projects"
  ON crown_projects FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Users can create own projects"
  ON crown_projects FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON crown_projects FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- RLS Policies for crown_investments
CREATE POLICY "Investors can view own investments"
  ON crown_investments FOR SELECT
  TO authenticated
  USING (investor_id = auth.uid());

CREATE POLICY "Project creators can view project investments"
  ON crown_investments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crown_projects
      WHERE crown_projects.id = crown_investments.project_id
      AND crown_projects.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own investments"
  ON crown_investments FOR INSERT
  TO authenticated
  WITH CHECK (investor_id = auth.uid());

-- RLS Policies for p2p_trades
CREATE POLICY "Users can view own trades"
  ON p2p_trades FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid() OR buyer_id = auth.uid() OR mediator_id = auth.uid());

CREATE POLICY "Users can create own trades"
  ON p2p_trades FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Trade participants can update trades"
  ON p2p_trades FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid() OR buyer_id = auth.uid() OR mediator_id = auth.uid())
  WITH CHECK (seller_id = auth.uid() OR buyer_id = auth.uid() OR mediator_id = auth.uid());

-- RLS Policies for escrow_locks
CREATE POLICY "Users can view own escrow locks"
  ON escrow_locks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own escrow locks"
  ON escrow_locks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for crown_guarantees (public transparency)
CREATE POLICY "Anyone can view guarantees"
  ON crown_guarantees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own guarantees"
  ON crown_guarantees FOR INSERT
  TO authenticated
  WITH CHECK (entrepreneur_id = auth.uid());

-- RLS Policies for reputation_events
CREATE POLICY "Users can view own reputation events"
  ON reputation_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_crown_projects_updated_at
  BEFORE UPDATE ON crown_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update CROWN score based on reputation events
CREATE OR REPLACE FUNCTION update_crown_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET crown_score = GREATEST(0, LEAST(1000, crown_score + NEW.score_change))
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update CROWN score
CREATE TRIGGER update_user_crown_score
  AFTER INSERT ON reputation_events
  FOR EACH ROW
  EXECUTE FUNCTION update_crown_score();