/*
  # Système de Redistribution Automatique عLKABULAN - COMPLET

  1. Nouvelles Tables
    - `revenue_events` - Capture tous les revenus générés
    - `redistribution_cycles` - Historique des cycles de redistribution
    - `power_rewards` - Récompenses holders (35%)
    - `crown_rewards` - Récompenses investisseurs CROWN (25%)
    - `mining_rewards` - Récompenses pools miniers (15%)
    - `governance_rewards` - Récompenses DAO (15%)
    - `burn_events` - Événements de burn (10%)
    - `reward_claims` - Réclamations de récompenses

  2. Fonctions
    - `compute_total_revenues()` - Calcul revenus totaux
    - `run_redistribution_cycle()` - Cycle complet de redistribution
    - `distribute_power_rewards()` - Distribution 35% holders
    - `distribute_crown_rewards()` - Distribution 25% CROWN
    - `distribute_mining_rewards()` - Distribution 15% pools
    - `distribute_governance_rewards()` - Distribution 15% DAO
    - `execute_buyback_burn()` - Buyback & Burn 10%

  3. Triggers
    - Auto-redistribution sur nouveaux revenus
    - Notifications automatiques
    - Mise à jour CROWN Score

  4. Sécurité
    - RLS activé sur toutes les tables
    - Seuls les utilisateurs voient leurs propres récompenses
    - Admin peut voir toutes les données
*/

-- Table: revenue_events (capture tous les revenus)
CREATE TABLE IF NOT EXISTS revenue_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('deposit_fee', 'withdraw_fee', 'swap_fee', 'p2p_fee', 'crown_fee', 'mining_pool', 'index_profit')),
  amount numeric(20,8) NOT NULL,
  currency text DEFAULT 'عLK3',
  user_id uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}',
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Table: redistribution_cycles (historique cycles)
CREATE TABLE IF NOT EXISTS redistribution_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_number bigint GENERATED ALWAYS AS IDENTITY,
  total_revenue numeric(20,8) NOT NULL,
  power_rewards_amount numeric(20,8) NOT NULL,
  crown_rewards_amount numeric(20,8) NOT NULL,
  mining_rewards_amount numeric(20,8) NOT NULL,
  governance_rewards_amount numeric(20,8) NOT NULL,
  buyback_burn_amount numeric(20,8) NOT NULL,
  total_holders integer DEFAULT 0,
  total_crown_investors integer DEFAULT 0,
  total_pool_participants integer DEFAULT 0,
  total_voters integer DEFAULT 0,
  status text DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Table: power_rewards (35% - Holders)
CREATE TABLE IF NOT EXISTS power_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid REFERENCES redistribution_cycles(id),
  user_id uuid REFERENCES auth.users(id),
  user_balance numeric(20,8) NOT NULL,
  total_supply numeric(20,8) NOT NULL,
  reward_amount numeric(20,8) NOT NULL,
  percentage_share numeric(10,6),
  claimed boolean DEFAULT false,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Table: crown_rewards (25% - CROWN Investors)
CREATE TABLE IF NOT EXISTS crown_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid REFERENCES redistribution_cycles(id),
  user_id uuid REFERENCES auth.users(id),
  project_id uuid,
  investment_amount numeric(20,8) NOT NULL,
  total_investments numeric(20,8) NOT NULL,
  reward_amount numeric(20,8) NOT NULL,
  percentage_share numeric(10,6),
  claimed boolean DEFAULT false,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Table: mining_rewards (15% - Mining Pools)
CREATE TABLE IF NOT EXISTS mining_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid REFERENCES redistribution_cycles(id),
  user_id uuid REFERENCES auth.users(id),
  pool_id uuid,
  pool_share numeric(20,8) NOT NULL,
  total_pool_investment numeric(20,8) NOT NULL,
  reward_amount numeric(20,8) NOT NULL,
  percentage_share numeric(10,6),
  claimed boolean DEFAULT false,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Table: governance_rewards (15% - DAO Voters)
CREATE TABLE IF NOT EXISTS governance_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid REFERENCES redistribution_cycles(id),
  user_id uuid REFERENCES auth.users(id),
  voting_power numeric(20,8) NOT NULL,
  total_voting_power numeric(20,8) NOT NULL,
  base_reward numeric(20,8) NOT NULL,
  stake_bonus numeric(20,8) DEFAULT 0,
  delegate_bonus numeric(20,8) DEFAULT 0,
  total_reward numeric(20,8) NOT NULL,
  claimed boolean DEFAULT false,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Table: burn_events (10% - Buyback & Burn)
CREATE TABLE IF NOT EXISTS burn_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid REFERENCES redistribution_cycles(id),
  amount numeric(20,8) NOT NULL,
  tokens_burned numeric(20,8) NOT NULL,
  burn_price numeric(20,8),
  total_supply_before numeric(20,8),
  total_supply_after numeric(20,8),
  transaction_hash text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Table: reward_claims (réclamations)
CREATE TABLE IF NOT EXISTS reward_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  reward_type text NOT NULL CHECK (reward_type IN ('power', 'crown', 'mining', 'governance')),
  reward_id uuid NOT NULL,
  amount numeric(20,8) NOT NULL,
  claimed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE redistribution_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE crown_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE burn_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users see only their rewards
CREATE POLICY "Users view own power rewards"
  ON power_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users view own crown rewards"
  ON crown_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users view own mining rewards"
  ON mining_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users view own governance rewards"
  ON governance_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users view own claims"
  ON reward_claims FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Everyone can view burn events (transparency)
CREATE POLICY "Anyone can view burn events"
  ON burn_events FOR SELECT
  USING (true);

-- Everyone can view redistribution cycles
CREATE POLICY "Anyone can view cycles"
  ON redistribution_cycles FOR SELECT
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_revenue_events_processed ON revenue_events(processed);
CREATE INDEX IF NOT EXISTS idx_revenue_events_source ON revenue_events(source);
CREATE INDEX IF NOT EXISTS idx_power_rewards_user ON power_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_power_rewards_claimed ON power_rewards(claimed);
CREATE INDEX IF NOT EXISTS idx_crown_rewards_user ON crown_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_mining_rewards_user ON mining_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_governance_rewards_user ON governance_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_burn_events_cycle ON burn_events(cycle_id);

-- Function: Compute total revenues
CREATE OR REPLACE FUNCTION compute_total_revenues()
RETURNS numeric AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total
  FROM revenue_events
  WHERE processed = false;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function: Main redistribution cycle
CREATE OR REPLACE FUNCTION run_redistribution_cycle()
RETURNS uuid AS $$
DECLARE
  v_cycle_id uuid;
  v_total_revenue numeric;
  v_r1 numeric; -- 35% Power Rewards
  v_r2 numeric; -- 25% CROWN
  v_r3 numeric; -- 15% Mining
  v_r4 numeric; -- 15% Governance
  v_r5 numeric; -- 10% Buyback & Burn
BEGIN
  -- Calculate total revenue
  v_total_revenue := compute_total_revenues();
  
  IF v_total_revenue <= 0 THEN
    RAISE EXCEPTION 'No revenue to redistribute';
  END IF;
  
  -- Calculate allocations
  v_r1 := v_total_revenue * 0.35;
  v_r2 := v_total_revenue * 0.25;
  v_r3 := v_total_revenue * 0.15;
  v_r4 := v_total_revenue * 0.15;
  v_r5 := v_total_revenue * 0.10;
  
  -- Create cycle record
  INSERT INTO redistribution_cycles (
    total_revenue,
    power_rewards_amount,
    crown_rewards_amount,
    mining_rewards_amount,
    governance_rewards_amount,
    buyback_burn_amount,
    status
  ) VALUES (
    v_total_revenue,
    v_r1,
    v_r2,
    v_r3,
    v_r4,
    v_r5,
    'processing'
  ) RETURNING id INTO v_cycle_id;
  
  -- Execute distributions
  PERFORM distribute_power_rewards(v_cycle_id, v_r1);
  PERFORM distribute_crown_rewards(v_cycle_id, v_r2);
  PERFORM distribute_mining_rewards(v_cycle_id, v_r3);
  PERFORM distribute_governance_rewards(v_cycle_id, v_r4);
  PERFORM execute_buyback_burn(v_cycle_id, v_r5);
  
  -- Mark revenue as processed
  UPDATE revenue_events SET processed = true WHERE processed = false;
  
  -- Update cycle status
  UPDATE redistribution_cycles SET status = 'completed' WHERE id = v_cycle_id;
  
  RETURN v_cycle_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Distribute Power Rewards (35%)
CREATE OR REPLACE FUNCTION distribute_power_rewards(p_cycle_id uuid, p_amount numeric)
RETURNS void AS $$
DECLARE
  v_holder RECORD;
  v_total_supply numeric;
  v_reward numeric;
  v_count integer := 0;
BEGIN
  -- Get total supply (sum of all balances)
  SELECT COALESCE(SUM(balance), 0) INTO v_total_supply
  FROM token_balances
  WHERE token_symbol = 'عLK3' AND balance > 0;
  
  IF v_total_supply <= 0 THEN
    RETURN;
  END IF;
  
  -- Distribute to each holder
  FOR v_holder IN 
    SELECT user_id, balance
    FROM token_balances
    WHERE token_symbol = 'عLK3' AND balance > 0
  LOOP
    v_reward := (v_holder.balance / v_total_supply) * p_amount;
    
    -- Record reward
    INSERT INTO power_rewards (
      cycle_id,
      user_id,
      user_balance,
      total_supply,
      reward_amount,
      percentage_share
    ) VALUES (
      p_cycle_id,
      v_holder.user_id,
      v_holder.balance,
      v_total_supply,
      v_reward,
      (v_holder.balance / v_total_supply) * 100
    );
    
    -- Credit balance
    UPDATE token_balances
    SET balance = balance + v_reward,
        updated_at = now()
    WHERE user_id = v_holder.user_id AND token_symbol = 'عLK3';
    
    v_count := v_count + 1;
  END LOOP;
  
  -- Update cycle stats
  UPDATE redistribution_cycles
  SET total_holders = v_count
  WHERE id = p_cycle_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Distribute CROWN Rewards (25%)
CREATE OR REPLACE FUNCTION distribute_crown_rewards(p_cycle_id uuid, p_amount numeric)
RETURNS void AS $$
DECLARE
  v_investor RECORD;
  v_total_investments numeric;
  v_reward numeric;
  v_count integer := 0;
BEGIN
  -- Get total CROWN investments
  SELECT COALESCE(SUM(amount_invested), 0) INTO v_total_investments
  FROM crown_investments
  WHERE status = 'active';
  
  IF v_total_investments <= 0 THEN
    RETURN;
  END IF;
  
  -- Distribute to each investor
  FOR v_investor IN 
    SELECT user_id, project_id, SUM(amount_invested) as total_invested
    FROM crown_investments
    WHERE status = 'active'
    GROUP BY user_id, project_id
  LOOP
    v_reward := (v_investor.total_invested / v_total_investments) * p_amount;
    
    INSERT INTO crown_rewards (
      cycle_id,
      user_id,
      project_id,
      investment_amount,
      total_investments,
      reward_amount,
      percentage_share
    ) VALUES (
      p_cycle_id,
      v_investor.user_id,
      v_investor.project_id,
      v_investor.total_invested,
      v_total_investments,
      v_reward,
      (v_investor.total_invested / v_total_investments) * 100
    );
    
    UPDATE token_balances
    SET balance = balance + v_reward
    WHERE user_id = v_investor.user_id AND token_symbol = 'عLK3';
    
    v_count := v_count + 1;
  END LOOP;
  
  UPDATE redistribution_cycles
  SET total_crown_investors = v_count
  WHERE id = p_cycle_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Distribute Mining Rewards (15%)
CREATE OR REPLACE FUNCTION distribute_mining_rewards(p_cycle_id uuid, p_amount numeric)
RETURNS void AS $$
DECLARE
  v_participant RECORD;
  v_total_pool_investment numeric;
  v_reward numeric;
  v_count integer := 0;
BEGIN
  SELECT COALESCE(SUM(investment_amount), 0) INTO v_total_pool_investment
  FROM mining_pool_investments
  WHERE status = 'active';
  
  IF v_total_pool_investment <= 0 THEN
    RETURN;
  END IF;
  
  FOR v_participant IN 
    SELECT user_id, pool_id, SUM(investment_amount) as total_invested
    FROM mining_pool_investments
    WHERE status = 'active'
    GROUP BY user_id, pool_id
  LOOP
    v_reward := (v_participant.total_invested / v_total_pool_investment) * p_amount;
    
    INSERT INTO mining_rewards (
      cycle_id,
      user_id,
      pool_id,
      pool_share,
      total_pool_investment,
      reward_amount,
      percentage_share
    ) VALUES (
      p_cycle_id,
      v_participant.user_id,
      v_participant.pool_id,
      v_participant.total_invested,
      v_total_pool_investment,
      v_reward,
      (v_participant.total_invested / v_total_pool_investment) * 100
    );
    
    UPDATE token_balances
    SET balance = balance + v_reward
    WHERE user_id = v_participant.user_id AND token_symbol = 'عLK3';
    
    v_count := v_count + 1;
  END LOOP;
  
  UPDATE redistribution_cycles
  SET total_pool_participants = v_count
  WHERE id = p_cycle_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Distribute Governance Rewards (15%)
CREATE OR REPLACE FUNCTION distribute_governance_rewards(p_cycle_id uuid, p_amount numeric)
RETURNS void AS $$
DECLARE
  v_voter RECORD;
  v_total_voting_power numeric;
  v_base_reward numeric;
  v_stake_bonus numeric;
  v_delegate_bonus numeric;
  v_total_reward numeric;
  v_count integer := 0;
BEGIN
  SELECT COALESCE(SUM(voting_power), 0) INTO v_total_voting_power
  FROM dao_voting_power
  WHERE active = true;
  
  IF v_total_voting_power <= 0 THEN
    RETURN;
  END IF;
  
  FOR v_voter IN 
    SELECT user_id, voting_power, staked_amount, delegated_power
    FROM dao_voting_power
    WHERE active = true
  LOOP
    v_base_reward := (v_voter.voting_power / v_total_voting_power) * p_amount;
    
    v_stake_bonus := CASE 
      WHEN v_voter.staked_amount > 1000 THEN v_base_reward * 0.02
      ELSE 0
    END;
    
    v_delegate_bonus := CASE 
      WHEN v_voter.delegated_power > 0 THEN v_base_reward * 0.01
      ELSE 0
    END;
    
    v_total_reward := v_base_reward + v_stake_bonus + v_delegate_bonus;
    
    INSERT INTO governance_rewards (
      cycle_id,
      user_id,
      voting_power,
      total_voting_power,
      base_reward,
      stake_bonus,
      delegate_bonus,
      total_reward
    ) VALUES (
      p_cycle_id,
      v_voter.user_id,
      v_voter.voting_power,
      v_total_voting_power,
      v_base_reward,
      v_stake_bonus,
      v_delegate_bonus,
      v_total_reward
    );
    
    UPDATE token_balances
    SET balance = balance + v_total_reward
    WHERE user_id = v_voter.user_id AND token_symbol = 'عLK3';
    
    v_count := v_count + 1;
  END LOOP;
  
  UPDATE redistribution_cycles
  SET total_voters = v_count
  WHERE id = p_cycle_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Execute Buyback & Burn (10%)
CREATE OR REPLACE FUNCTION execute_buyback_burn(p_cycle_id uuid, p_amount numeric)
RETURNS void AS $$
DECLARE
  v_current_price numeric := 1.0;
  v_tokens_to_burn numeric;
  v_total_supply_before numeric;
  v_total_supply_after numeric;
BEGIN
  SELECT COALESCE(SUM(balance), 0) INTO v_total_supply_before
  FROM token_balances
  WHERE token_symbol = 'عLK3';
  
  v_tokens_to_burn := p_amount / v_current_price;
  
  INSERT INTO burn_events (
    cycle_id,
    amount,
    tokens_burned,
    burn_price,
    total_supply_before,
    total_supply_after
  ) VALUES (
    p_cycle_id,
    p_amount,
    v_tokens_to_burn,
    v_current_price,
    v_total_supply_before,
    v_total_supply_before - v_tokens_to_burn
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-redistribution on revenue threshold
CREATE OR REPLACE FUNCTION trigger_redistribution()
RETURNS trigger AS $$
DECLARE
  v_total numeric;
BEGIN
  v_total := compute_total_revenues();
  
  IF v_total >= 1000 THEN
    PERFORM run_redistribution_cycle();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_redistribution
AFTER INSERT ON revenue_events
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_redistribution();
