/*
  # Système de Bonus et Parrainage

  ## Vue d'ensemble
  Création du système de bonus complet avec parrainage, récompenses KYC,
  et programme de fidélité pour Alliance Web3 Africa.

  ## 1. Nouvelles Tables

  ### `referrals`
  - `id` (uuid, primary key) - Identifiant du parrainage
  - `referrer_id` (uuid, foreign key) - Utilisateur qui parraine
  - `referred_id` (uuid, foreign key) - Utilisateur parrainé
  - `referral_code` (text, unique) - Code de parrainage unique
  - `bonus_amount` (numeric) - Montant du bonus عLK3
  - `status` (text) - Statut: pending, completed, expired
  - `bonus_paid_at` (timestamptz) - Date de paiement du bonus
  - `created_at` (timestamptz) - Date de création

  ### `bonus_events`
  - `id` (uuid, primary key) - Identifiant de l'événement
  - `user_id` (uuid, foreign key) - Utilisateur concerné
  - `bonus_type` (text) - Type: welcome, kyc, referral, achievement, daily
  - `amount` (numeric) - Montant du bonus
  - `description` (text) - Description
  - `metadata` (jsonb) - Métadonnées
  - `status` (text) - Statut: pending, completed, cancelled
  - `created_at` (timestamptz) - Date de création
  - `completed_at` (timestamptz) - Date de complétion

  ### `loyalty_tiers`
  - `id` (uuid, primary key) - Identifiant du niveau
  - `tier_name` (text) - Nom: bronze, silver, gold, platinum, diamond
  - `min_crown_score` (integer) - Score CROWN minimum requis
  - `daily_bonus` (numeric) - Bonus quotidien عLK3
  - `transaction_fee_discount` (numeric) - Réduction frais (%)
  - `staking_apy_boost` (numeric) - Boost APY staking (%)
  - `priority_support` (boolean) - Support prioritaire
  - `benefits` (jsonb) - Autres avantages

  ## 2. Sécurité - Row Level Security (RLS)

  - Les parrainages sont visibles uniquement par les participants
  - Les bonus sont privés à chaque utilisateur
  - Les tiers de fidélité sont publics

  ## 3. Fonctionnalités

  - Génération automatique de codes de parrainage
  - Attribution automatique des bonus
  - Calcul automatique du tier de fidélité
  - Historique complet des bonus
*/

-- Créer la table des parrainages
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code text NOT NULL UNIQUE,
  bonus_amount numeric DEFAULT 500,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  bonus_paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT no_self_referral CHECK (referrer_id != referred_id)
);

-- Créer la table des événements de bonus
CREATE TABLE IF NOT EXISTS bonus_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bonus_type text NOT NULL CHECK (bonus_type IN ('welcome', 'kyc', 'referral', 'achievement', 'daily', 'streak', 'special')),
  amount numeric NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Créer la table des niveaux de fidélité
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name text NOT NULL UNIQUE,
  tier_level integer NOT NULL UNIQUE,
  min_crown_score integer NOT NULL,
  daily_bonus numeric DEFAULT 0,
  transaction_fee_discount numeric DEFAULT 0,
  staking_apy_boost numeric DEFAULT 0,
  priority_support boolean DEFAULT false,
  benefits jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Insérer les niveaux de fidélité par défaut
INSERT INTO loyalty_tiers (tier_name, tier_level, min_crown_score, daily_bonus, transaction_fee_discount, staking_apy_boost, priority_support, benefits)
VALUES
  ('Bronze', 1, 0, 1, 0, 0, false, '["Accès à toutes les fonctionnalités de base"]'::jsonb),
  ('Silver', 2, 600, 5, 10, 5, false, '["Bonus quotidien augmenté", "Réduction 10% sur les frais"]'::jsonb),
  ('Gold', 3, 750, 10, 20, 10, true, '["Bonus quotidien x2", "Réduction 20% sur les frais", "Support prioritaire"]'::jsonb),
  ('Platinum', 4, 850, 20, 30, 15, true, '["Bonus quotidien x4", "Réduction 30% sur les frais", "Accès anticipé nouvelles fonctionnalités"]'::jsonb),
  ('Diamond', 5, 950, 50, 50, 25, true, '["Bonus quotidien x10", "Réduction 50% sur les frais", "Statut VIP", "Événements exclusifs"]'::jsonb)
ON CONFLICT (tier_name) DO NOTHING;

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_bonus_events_user ON bonus_events(user_id);
CREATE INDEX IF NOT EXISTS idx_bonus_events_type ON bonus_events(bonus_type);

-- Activer RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour referrals
CREATE POLICY "Users can view own referrals as referrer"
  ON referrals FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid());

CREATE POLICY "Users can view own referrals as referred"
  ON referrals FOR SELECT
  TO authenticated
  USING (referred_id = auth.uid());

CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (referrer_id = auth.uid());

-- Politiques RLS pour bonus_events
CREATE POLICY "Users can view own bonus events"
  ON bonus_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own bonus events"
  ON bonus_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour loyalty_tiers (public)
CREATE POLICY "Anyone can view loyalty tiers"
  ON loyalty_tiers FOR SELECT
  TO authenticated
  USING (true);

-- Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM referrals WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour traiter un bonus
CREATE OR REPLACE FUNCTION process_bonus(
  p_user_id uuid,
  p_bonus_type text,
  p_amount numeric,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  bonus_id uuid;
BEGIN
  INSERT INTO bonus_events (user_id, bonus_type, amount, description, metadata, status, completed_at)
  VALUES (p_user_id, p_bonus_type, p_amount, p_description, p_metadata, 'completed', now())
  RETURNING id INTO bonus_id;

  UPDATE token_balances
  SET balance = balance + p_amount,
      usd_value = usd_value + p_amount
  WHERE user_id = p_user_id AND token_symbol = 'عLK3';

  INSERT INTO transactions (
    user_id, transaction_hash, transaction_type,
    from_currency, to_currency, amount_from, amount_to,
    fee, status, metadata, completed_at
  )
  VALUES (
    p_user_id,
    '0x' || encode(gen_random_bytes(32), 'hex'),
    'bonus',
    'عLK3', 'عLK3',
    p_amount, p_amount,
    0, 'completed',
    jsonb_build_object('bonus_id', bonus_id, 'bonus_type', p_bonus_type),
    now()
  );

  RETURN bonus_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le tier de fidélité d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_loyalty_tier(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  user_score integer;
  tier_info jsonb;
BEGIN
  SELECT crown_score INTO user_score
  FROM users
  WHERE id = p_user_id;

  SELECT jsonb_build_object(
    'tier_name', tier_name,
    'tier_level', tier_level,
    'daily_bonus', daily_bonus,
    'transaction_fee_discount', transaction_fee_discount,
    'staking_apy_boost', staking_apy_boost,
    'priority_support', priority_support,
    'benefits', benefits
  ) INTO tier_info
  FROM loyalty_tiers
  WHERE min_crown_score <= COALESCE(user_score, 0)
  ORDER BY min_crown_score DESC
  LIMIT 1;

  RETURN tier_info;
END;
$$ LANGUAGE plpgsql;
