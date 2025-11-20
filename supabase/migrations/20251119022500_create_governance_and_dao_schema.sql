/*
  # DAO Governance System

  ## Overview
  This migration creates the decentralized governance system for Alliance Web3 Africa,
  including proposals, voting, and CROWN Guardian management.

  ## 1. New Tables
  
  ### `dao_proposals`
  - `id` (uuid, primary key) - Proposal identifier
  - `proposer_id` (uuid, foreign key) - Proposal creator
  - `proposal_type` (text) - Type: budget, policy, technical, emergency, guardian_election
  - `title` (text) - Proposal title
  - `description` (text) - Detailed description
  - `category` (text) - Category: governance, finance, development, community
  - `required_quorum` (numeric) - Required quorum percentage
  - `voting_power_type` (text) - Voting: token_weighted, one_person_one_vote, crown_score_weighted
  - `status` (text) - Status: draft, active, passed, rejected, executed, cancelled
  - `votes_for` (numeric) - Total votes in favor
  - `votes_against` (numeric) - Total votes against
  - `votes_abstain` (numeric) - Total abstain votes
  - `total_voting_power` (numeric) - Total voting power used
  - `execution_data` (jsonb) - Data for automatic execution
  - `start_date` (timestamptz) - Voting start
  - `end_date` (timestamptz) - Voting end
  - `executed_at` (timestamptz) - Execution timestamp
  - `created_at` (timestamptz) - Creation timestamp

  ### `dao_votes`
  - `id` (uuid, primary key) - Vote identifier
  - `proposal_id` (uuid, foreign key) - Reference to dao_proposals
  - `voter_id` (uuid, foreign key) - Voter user ID
  - `vote_choice` (text) - Choice: for, against, abstain
  - `voting_power` (numeric) - Voter's voting power
  - `reason` (text) - Optional vote reasoning
  - `created_at` (timestamptz) - Vote timestamp

  ### `crown_guardians`
  - `id` (uuid, primary key) - Guardian identifier
  - `user_id` (uuid, foreign key) - Guardian user ID
  - `role` (text) - Role: auditor, mediator, verifier, treasurer
  - `status` (text) - Status: active, suspended, retired
  - `elected_at` (timestamptz) - Election timestamp
  - `term_end_at` (timestamptz) - Term end date
  - `cases_handled` (integer) - Number of cases handled
  - `performance_score` (integer) - Performance score (0-100)
  - `metadata` (jsonb) - Additional guardian data
  - `created_at` (timestamptz) - Creation timestamp

  ### `guardian_actions`
  - `id` (uuid, primary key) - Action identifier
  - `guardian_id` (uuid, foreign key) - Reference to crown_guardians
  - `action_type` (text) - Type: audit, mediation, verification, sanction
  - `reference_id` (uuid) - Related entity ID (trade, project, etc.)
  - `decision` (text) - Decision made
  - `notes` (text) - Action notes
  - `created_at` (timestamptz) - Action timestamp

  ### `dao_treasury`
  - `id` (uuid, primary key) - Treasury entry identifier
  - `transaction_type` (text) - Type: income, expense, allocation, grant
  - `amount` (numeric) - Amount
  - `currency` (text) - Currency
  - `category` (text) - Category: development, marketing, operations, grants
  - `description` (text) - Transaction description
  - `proposal_id` (uuid) - Related proposal if any
  - `approved_by` (uuid) - Approver user ID
  - `transaction_hash` (text) - Blockchain transaction hash
  - `created_at` (timestamptz) - Transaction timestamp

  ### `community_reports`
  - `id` (uuid, primary key) - Report identifier
  - `reporter_id` (uuid, foreign key) - Reporter user ID
  - `report_type` (text) - Type: fraud, abuse, bug, suggestion
  - `subject_type` (text) - Subject: user, trade, project, nft
  - `subject_id` (uuid) - ID of reported entity
  - `description` (text) - Report description
  - `evidence` (jsonb) - Evidence attachments
  - `status` (text) - Status: pending, investigating, resolved, dismissed
  - `assigned_to` (uuid) - Assigned guardian ID
  - `resolution` (text) - Resolution notes
  - `created_at` (timestamptz) - Report timestamp
  - `resolved_at` (timestamptz) - Resolution timestamp

  ## 2. Security - Row Level Security (RLS)
  
  - Proposals are publicly viewable
  - Only eligible users can create proposals
  - Votes are private but verifiable
  - Guardians have elevated permissions
  - Treasury is transparent
  - Reports are protected

  ## 3. Important Notes
  
  - Voting power can be based on tokens, reputation, or equal
  - Proposals auto-execute when passed
  - Guardians are elected through special proposals
  - All governance actions are recorded on-chain
  - Community moderation is decentralized
*/

-- Create dao_proposals table
CREATE TABLE IF NOT EXISTS dao_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposal_type text NOT NULL CHECK (proposal_type IN ('budget', 'policy', 'technical', 'emergency', 'guardian_election', 'parameter_change')),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('governance', 'finance', 'development', 'community', 'environment')),
  required_quorum numeric DEFAULT 10.0 CHECK (required_quorum > 0 AND required_quorum <= 100),
  voting_power_type text DEFAULT 'token_weighted' CHECK (voting_power_type IN ('token_weighted', 'one_person_one_vote', 'crown_score_weighted')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'passed', 'rejected', 'executed', 'cancelled')),
  votes_for numeric DEFAULT 0,
  votes_against numeric DEFAULT 0,
  votes_abstain numeric DEFAULT 0,
  total_voting_power numeric DEFAULT 0,
  execution_data jsonb DEFAULT '{}'::jsonb,
  start_date timestamptz,
  end_date timestamptz,
  executed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create dao_votes table
CREATE TABLE IF NOT EXISTS dao_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES dao_proposals(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_choice text NOT NULL CHECK (vote_choice IN ('for', 'against', 'abstain')),
  voting_power numeric NOT NULL CHECK (voting_power > 0),
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(proposal_id, voter_id)
);

-- Create crown_guardians table
CREATE TABLE IF NOT EXISTS crown_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('auditor', 'mediator', 'verifier', 'treasurer')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'retired')),
  elected_at timestamptz DEFAULT now(),
  term_end_at timestamptz,
  cases_handled integer DEFAULT 0,
  performance_score integer DEFAULT 100 CHECK (performance_score >= 0 AND performance_score <= 100),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create guardian_actions table
CREATE TABLE IF NOT EXISTS guardian_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id uuid NOT NULL REFERENCES crown_guardians(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('audit', 'mediation', 'verification', 'sanction', 'approval')),
  reference_id uuid,
  decision text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create dao_treasury table
CREATE TABLE IF NOT EXISTS dao_treasury (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL CHECK (transaction_type IN ('income', 'expense', 'allocation', 'grant', 'fee')),
  amount numeric NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'عLK3',
  category text NOT NULL CHECK (category IN ('development', 'marketing', 'operations', 'grants', 'rewards', 'reserves')),
  description text NOT NULL,
  proposal_id uuid REFERENCES dao_proposals(id),
  approved_by uuid REFERENCES users(id),
  transaction_hash text,
  created_at timestamptz DEFAULT now()
);

-- Create community_reports table
CREATE TABLE IF NOT EXISTS community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('fraud', 'abuse', 'scam', 'bug', 'suggestion', 'other')),
  subject_type text NOT NULL CHECK (subject_type IN ('user', 'trade', 'project', 'nft', 'proposal')),
  subject_id uuid NOT NULL,
  description text NOT NULL,
  evidence jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  assigned_to uuid REFERENCES crown_guardians(id),
  resolution text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dao_proposals_proposer ON dao_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_status ON dao_proposals(status);
CREATE INDEX IF NOT EXISTS idx_dao_proposals_end_date ON dao_proposals(end_date);
CREATE INDEX IF NOT EXISTS idx_dao_votes_proposal ON dao_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_dao_votes_voter ON dao_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_crown_guardians_user ON crown_guardians(user_id);
CREATE INDEX IF NOT EXISTS idx_crown_guardians_status ON crown_guardians(status);
CREATE INDEX IF NOT EXISTS idx_guardian_actions_guardian ON guardian_actions(guardian_id);
CREATE INDEX IF NOT EXISTS idx_dao_treasury_category ON dao_treasury(category);
CREATE INDEX IF NOT EXISTS idx_community_reports_reporter ON community_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status);
CREATE INDEX IF NOT EXISTS idx_community_reports_assigned ON community_reports(assigned_to);

-- Enable Row Level Security
ALTER TABLE dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crown_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dao_proposals (publicly viewable)
CREATE POLICY "Anyone can view active proposals"
  ON dao_proposals FOR SELECT
  TO authenticated
  USING (status IN ('active', 'passed', 'rejected', 'executed'));

CREATE POLICY "Users can view own proposals"
  ON dao_proposals FOR SELECT
  TO authenticated
  USING (proposer_id = auth.uid());

CREATE POLICY "Verified users can create proposals"
  ON dao_proposals FOR INSERT
  TO authenticated
  WITH CHECK (
    proposer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.kyc_status = 'verified'
      AND users.crown_score >= 600
    )
  );

CREATE POLICY "Users can update own draft proposals"
  ON dao_proposals FOR UPDATE
  TO authenticated
  USING (proposer_id = auth.uid() AND status = 'draft')
  WITH CHECK (proposer_id = auth.uid());

-- RLS Policies for dao_votes
CREATE POLICY "Users can view own votes"
  ON dao_votes FOR SELECT
  TO authenticated
  USING (voter_id = auth.uid());

CREATE POLICY "Proposal creators can view votes on their proposals"
  ON dao_votes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dao_proposals
      WHERE dao_proposals.id = dao_votes.proposal_id
      AND dao_proposals.proposer_id = auth.uid()
    )
  );

CREATE POLICY "Verified users can vote"
  ON dao_votes FOR INSERT
  TO authenticated
  WITH CHECK (
    voter_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.kyc_status = 'verified'
    )
  );

-- RLS Policies for crown_guardians (publicly viewable)
CREATE POLICY "Anyone can view active guardians"
  ON crown_guardians FOR SELECT
  TO authenticated
  USING (status = 'active');

-- RLS Policies for guardian_actions (publicly transparent)
CREATE POLICY "Anyone can view guardian actions"
  ON guardian_actions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Guardians can create own actions"
  ON guardian_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crown_guardians
      WHERE crown_guardians.user_id = auth.uid()
      AND crown_guardians.id = guardian_actions.guardian_id
      AND crown_guardians.status = 'active'
    )
  );

-- RLS Policies for dao_treasury (publicly transparent)
CREATE POLICY "Anyone can view treasury transactions"
  ON dao_treasury FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for community_reports
CREATE POLICY "Users can view own reports"
  ON community_reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

CREATE POLICY "Guardians can view assigned reports"
  ON community_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crown_guardians
      WHERE crown_guardians.user_id = auth.uid()
      AND crown_guardians.id = community_reports.assigned_to
      AND crown_guardians.status = 'active'
    )
  );

CREATE POLICY "Users can create reports"
  ON community_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Guardians can update assigned reports"
  ON community_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crown_guardians
      WHERE crown_guardians.user_id = auth.uid()
      AND crown_guardians.id = community_reports.assigned_to
      AND crown_guardians.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crown_guardians
      WHERE crown_guardians.user_id = auth.uid()
      AND crown_guardians.id = community_reports.assigned_to
      AND crown_guardians.status = 'active'
    )
  );

-- Function to calculate voting power
CREATE OR REPLACE FUNCTION calculate_voting_power(
  user_uuid uuid,
  power_type text
) RETURNS numeric AS $$
DECLARE
  power numeric;
BEGIN
  IF power_type = 'one_person_one_vote' THEN
    RETURN 1.0;
  ELSIF power_type = 'crown_score_weighted' THEN
    SELECT crown_score::numeric INTO power
    FROM users
    WHERE id = user_uuid;
    RETURN COALESCE(power, 0);
  ELSE -- token_weighted
    SELECT SUM(balance)::numeric INTO power
    FROM token_balances
    WHERE user_id = user_uuid AND token_symbol = 'عLK3';
    RETURN COALESCE(power, 0);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update proposal vote counts
CREATE OR REPLACE FUNCTION update_proposal_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vote_choice = 'for' THEN
    UPDATE dao_proposals
    SET votes_for = votes_for + NEW.voting_power,
        total_voting_power = total_voting_power + NEW.voting_power
    WHERE id = NEW.proposal_id;
  ELSIF NEW.vote_choice = 'against' THEN
    UPDATE dao_proposals
    SET votes_against = votes_against + NEW.voting_power,
        total_voting_power = total_voting_power + NEW.voting_power
    WHERE id = NEW.proposal_id;
  ELSE -- abstain
    UPDATE dao_proposals
    SET votes_abstain = votes_abstain + NEW.voting_power,
        total_voting_power = total_voting_power + NEW.voting_power
    WHERE id = NEW.proposal_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vote counts
CREATE TRIGGER update_dao_proposal_votes
  AFTER INSERT ON dao_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_proposal_votes();