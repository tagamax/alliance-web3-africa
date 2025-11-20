/*
  # Moteur de Redistribution Automatique Alliance Web3 Africa

  ## Vue d'ensemble
  Ce système crée un moteur de redistribution automatique qui distribue les gains
  basés sur la performance de l'عIndex économique, permettant au token de prendre
  de la valeur sans posséder d'actifs physiques.

  ## Fonctionnalités

  1. **Redistribution basée sur l'Index**
     - Calcul automatique basé sur l'عIndex
     - Distribution proportionnelle aux holders
     - Bonus pour transformation locale
     - Récompenses ESG

  2. **Sources de Redistribution**
     - Export Index (40%)
     - Transformation Bonus (30%)
     - ESG Rewards (20%)
     - Mining Pools Performance (10%)

  3. **Critères d'Éligibilité**
     - Holders avec balance > 100 عLK3
     - Compte actif (transaction < 90 jours)
     - KYC niveau 1 minimum
     - CROWN score > 400

  4. **Périodes de Distribution**
     - Hebdomadaire: Petites distributions
     - Mensuelle: Distributions moyennes
     - Trimestrielle: Grandes redistributions

  ## Calculs

  La redistribution totale est calculée comme suit:
  
  Total Pool = (
    Export_Growth * 0.4 +
    Transformation_Increase * 0.3 +
    ESG_Improvement * 0.2 +
    Mining_Performance * 0.1
  ) * Base_Multiplier * User_Count

  Par utilisateur = Total_Pool / Eligible_Users * User_Multiplier

  User_Multiplier prend en compte:
  - Balance détenue (poids 40%)
  - CROWN score (poids 30%)
  - Durée de détention (poids 20%)
  - Participation DAO (poids 10%)
*/

-- Fonction pour calculer l'éligibilité à la redistribution
CREATE OR REPLACE FUNCTION is_eligible_for_redistribution(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_balance numeric;
  user_crown_score integer;
  user_kyc_level integer;
  last_transaction_date timestamptz;
BEGIN
  -- Récupérer les données utilisateur
  SELECT 
    COALESCE((SELECT balance FROM token_balances WHERE user_id = p_user_id AND token_symbol = 'عLK3'), 0),
    crown_score,
    kyc_level
  INTO user_balance, user_crown_score, user_kyc_level
  FROM users
  WHERE id = p_user_id;

  -- Récupérer la date de dernière transaction
  SELECT MAX(created_at)
  INTO last_transaction_date
  FROM transactions
  WHERE user_id = p_user_id;

  -- Vérifier les critères d'éligibilité
  IF user_balance < 100 THEN
    RETURN false;
  END IF;

  IF user_kyc_level < 1 THEN
    RETURN false;
  END IF;

  IF user_crown_score < 400 THEN
    RETURN false;
  END IF;

  IF last_transaction_date IS NULL OR last_transaction_date < (now() - interval '90 days') THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le multiplicateur utilisateur
CREATE OR REPLACE FUNCTION calculate_user_multiplier(p_user_id uuid)
RETURNS numeric AS $$
DECLARE
  user_balance numeric;
  user_crown_score integer;
  account_age_days integer;
  dao_participation_count integer;
  balance_weight numeric;
  crown_weight numeric;
  age_weight numeric;
  dao_weight numeric;
  total_multiplier numeric;
BEGIN
  -- Récupérer les données
  SELECT 
    COALESCE((SELECT balance FROM token_balances WHERE user_id = p_user_id AND token_symbol = 'عLK3'), 0),
    crown_score,
    EXTRACT(day FROM (now() - created_at))
  INTO user_balance, user_crown_score, account_age_days
  FROM users
  WHERE id = p_user_id;

  -- Compter la participation DAO
  SELECT COUNT(*)
  INTO dao_participation_count
  FROM dao_votes
  WHERE voter_id = p_user_id;

  -- Calculer les poids (normalisation)
  balance_weight := LEAST(user_balance / 10000, 1.0) * 0.4; -- Max à 10K tokens
  crown_weight := (user_crown_score / 1000.0) * 0.3; -- Max à 1000 score
  age_weight := LEAST(account_age_days / 365.0, 1.0) * 0.2; -- Max à 1 an
  dao_weight := LEAST(dao_participation_count / 20.0, 1.0) * 0.1; -- Max à 20 votes

  total_multiplier := 0.5 + balance_weight + crown_weight + age_weight + dao_weight;

  RETURN total_multiplier;
END;
$$ LANGUAGE plpgsql;

-- Fonction principale de redistribution
CREATE OR REPLACE FUNCTION execute_redistribution(
  p_period text,
  p_country_code text DEFAULT 'GN'
)
RETURNS jsonb AS $$
DECLARE
  latest_index record;
  previous_index record;
  export_growth numeric;
  transformation_increase numeric;
  esg_improvement numeric;
  mining_performance numeric;
  total_pool numeric;
  eligible_users uuid[];
  user_id uuid;
  user_multiplier numeric;
  total_multipliers numeric := 0;
  user_amount numeric;
  event_id uuid;
  distributed_count integer := 0;
  total_distributed numeric := 0;
BEGIN
  -- Récupérer le dernier index et le précédent
  SELECT * INTO latest_index
  FROM national_index
  WHERE country_code = p_country_code
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT * INTO previous_index
  FROM national_index
  WHERE country_code = p_country_code
  AND created_at < latest_index.created_at
  ORDER BY created_at DESC
  LIMIT 1;

  -- Si pas d'index précédent, utiliser des valeurs par défaut
  IF previous_index IS NULL THEN
    previous_index := latest_index;
  END IF;

  -- Calculer les croissances
  export_growth := GREATEST(0, (latest_index.export_score - previous_index.export_score) / 100.0);
  transformation_increase := GREATEST(0, (latest_index.transformation_score - previous_index.transformation_score) / 100.0);
  esg_improvement := GREATEST(0, (latest_index.esg_score - previous_index.esg_score) / 100.0);
  
  -- Performance des mining pools (moyenne des APY)
  SELECT COALESCE(AVG(apy) / 100.0, 0) INTO mining_performance
  FROM mining_pools
  WHERE status = 'active';

  -- Calculer le pool total (base 1000 عLK3 multiplié par les facteurs)
  total_pool := (
    export_growth * 400 +
    transformation_increase * 300 +
    esg_improvement * 200 +
    mining_performance * 100
  );

  -- Si le pool est trop petit, retourner
  IF total_pool < 100 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Pool trop petit pour distribution',
      'total_pool', total_pool
    );
  END IF;

  -- Récupérer les utilisateurs éligibles
  SELECT ARRAY_AGG(id)
  INTO eligible_users
  FROM users
  WHERE is_eligible_for_redistribution(id);

  -- Si pas d'utilisateurs éligibles
  IF eligible_users IS NULL OR array_length(eligible_users, 1) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Aucun utilisateur éligible',
      'total_pool', total_pool
    );
  END IF;

  -- Calculer la somme totale des multiplicateurs
  FOREACH user_id IN ARRAY eligible_users
  LOOP
    total_multipliers := total_multipliers + calculate_user_multiplier(user_id);
  END LOOP;

  -- Créer l'événement de redistribution
  INSERT INTO redistribution_events (
    period,
    total_pool,
    recipients_count,
    per_user_amount,
    source,
    country_code,
    calculation_metadata,
    status
  )
  VALUES (
    p_period,
    total_pool,
    array_length(eligible_users, 1),
    total_pool / array_length(eligible_users, 1),
    jsonb_build_object(
      'export_growth', export_growth,
      'transformation_increase', transformation_increase,
      'esg_improvement', esg_improvement,
      'mining_performance', mining_performance
    )::text,
    p_country_code,
    jsonb_build_object(
      'latest_index_value', latest_index.index_value,
      'previous_index_value', previous_index.index_value,
      'eligible_users_count', array_length(eligible_users, 1),
      'total_multipliers', total_multipliers
    ),
    'processing'
  )
  RETURNING id INTO event_id;

  -- Distribuer aux utilisateurs éligibles
  FOREACH user_id IN ARRAY eligible_users
  LOOP
    user_multiplier := calculate_user_multiplier(user_id);
    user_amount := (total_pool * user_multiplier / total_multipliers);

    -- Créer l'entrée de redistribution utilisateur
    INSERT INTO user_redistributions (
      user_id,
      event_id,
      amount,
      claimed
    )
    VALUES (
      user_id,
      event_id,
      user_amount,
      false
    );

    -- Ajouter directement au solde
    UPDATE token_balances
    SET 
      balance = balance + user_amount,
      usd_value = usd_value + user_amount
    WHERE user_id = user_id AND token_symbol = 'عLK3';

    -- Marquer comme réclamé
    UPDATE user_redistributions
    SET claimed = true, claimed_at = now()
    WHERE user_id = user_id AND event_id = event_id;

    -- Créer une transaction
    INSERT INTO transactions (
      user_id,
      transaction_hash,
      transaction_type,
      from_currency,
      to_currency,
      amount_from,
      amount_to,
      fee,
      status,
      metadata,
      completed_at
    )
    VALUES (
      user_id,
      '0x' || encode(gen_random_bytes(32), 'hex'),
      'redistribution',
      'عLK3',
      'عLK3',
      user_amount,
      user_amount,
      0,
      'completed',
      jsonb_build_object(
        'event_id', event_id,
        'period', p_period,
        'user_multiplier', user_multiplier
      ),
      now()
    );

    -- Créer une notification
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      read,
      data
    )
    VALUES (
      user_id,
      '💰 Redistribution عIndex',
      format('Vous avez reçu %.2f عLK3 de la redistribution %s basée sur la performance économique!', user_amount, p_period),
      'transaction',
      false,
      jsonb_build_object(
        'amount', user_amount,
        'event_id', event_id,
        'period', p_period
      )
    );

    distributed_count := distributed_count + 1;
    total_distributed := total_distributed + user_amount;
  END LOOP;

  -- Marquer l'événement comme complété
  UPDATE redistribution_events
  SET 
    status = 'completed',
    processed_at = now()
  WHERE id = event_id;

  RETURN jsonb_build_object(
    'success', true,
    'event_id', event_id,
    'period', p_period,
    'total_pool', total_pool,
    'distributed_count', distributed_count,
    'total_distributed', total_distributed,
    'average_per_user', total_distributed / NULLIF(distributed_count, 0)
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour exécuter une redistribution de test
CREATE OR REPLACE FUNCTION test_redistribution()
RETURNS jsonb AS $$
BEGIN
  RETURN execute_redistribution('test-' || to_char(now(), 'YYYY-MM-DD-HH24-MI-SS'), 'GN');
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON FUNCTION is_eligible_for_redistribution IS 'Vérifie si un utilisateur est éligible pour recevoir une redistribution';
COMMENT ON FUNCTION calculate_user_multiplier IS 'Calcule le multiplicateur de redistribution pour un utilisateur basé sur plusieurs facteurs';
COMMENT ON FUNCTION execute_redistribution IS 'Exécute une redistribution automatique basée sur la performance de l''عIndex';
COMMENT ON FUNCTION test_redistribution IS 'Exécute une redistribution de test pour vérifier le système';
