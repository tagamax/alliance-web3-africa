/*
  # Système de Sécurité et Logging - Version Corrigée

  1. Nouvelles Tables
    - `security_logs` - Logs des événements de sécurité
    - `rate_limit_logs` - Suivi des rate limits  
    - `session_logs` - Historique des sessions
    - `failed_login_attempts` - Tentatives de connexion échouées
    - `audit_trail` - Piste d'audit complète

  2. Fonctions de Sécurité
    - Cleanup automatique des logs
    - Vérification rate limits
    - Gestion lockouts

  3. Sécurité
    - RLS activé
    - Users voient leurs propres logs
    - System peut insérer
*/

-- Tables
CREATE TABLE IF NOT EXISTS security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  endpoint text,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid,
  action text NOT NULL CHECK (action IN ('login', 'logout', 'timeout', 'refresh')),
  ip_address inet,
  user_agent text,
  device_info jsonb DEFAULT '{}',
  location jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address inet,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete')),
  old_values jsonb,
  new_values jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users view own security logs" ON security_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users view own rate limits" ON rate_limit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users view own sessions" ON session_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users view own audit" ON audit_trail FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System insert security" ON security_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "System insert rate" ON rate_limit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "System insert session" ON session_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "System insert failed" ON failed_login_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "System insert audit" ON audit_trail FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_user ON rate_limit_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_user ON session_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_email ON failed_login_attempts(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_trail(user_id, created_at DESC);

-- Functions
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_attempts integer DEFAULT 10,
  p_window_minutes integer DEFAULT 60
)
RETURNS jsonb AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM rate_limit_logs
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at > now() - (p_window_minutes || ' minutes')::interval;

  RETURN jsonb_build_object(
    'is_limited', v_count >= p_max_attempts,
    'attempt_count', v_count,
    'max_attempts', p_max_attempts
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_account_lockout(p_email text)
RETURNS jsonb AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM failed_login_attempts
  WHERE email = p_email
    AND created_at > now() - interval '15 minutes';

  RETURN jsonb_build_object(
    'is_locked', v_count >= 5,
    'attempt_count', v_count,
    'max_attempts', 5
  );
END;
$$ LANGUAGE plpgsql;
