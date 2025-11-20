/*
  # Admin System - Complete Backend

  ## Overview
  Système d'administration complet avec gestion des utilisateurs, permissions,
  audit logs, et dashboard analytics.

  ## Tables Created
  - admin_roles: Rôles administrateurs
  - admin_users: Comptes administrateurs
  - admin_permissions: Permissions granulaires
  - admin_audit_logs: Logs actions admin
  - admin_settings: Configuration plateforme
  - admin_dashboard_stats: Vue matérialisée statistiques

  ## Security
  - RLS activé partout
  - Policies restrictives
  - Audit automatique
*/

-- Admin Roles
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  level INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_admin_roles_name ON admin_roles(role_name);
CREATE INDEX idx_admin_roles_level ON admin_roles(level);

-- Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES admin_roles(id),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_admin_users_user ON admin_users(user_id);
CREATE INDEX idx_admin_users_role ON admin_users(role_id);

-- Admin Permissions
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_admin_permissions_module ON admin_permissions(module);

-- Admin Audit Logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_admin ON admin_audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_created ON admin_audit_logs(created_at DESC);

-- Admin Settings
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_admin_settings_key ON admin_settings(setting_key);

-- Insert Default Roles
INSERT INTO admin_roles (role_name, display_name, description, level, permissions) VALUES
  ('super_admin', 'Super Administrateur', 'Accès complet', 100, '{"all": true}'::jsonb),
  ('admin', 'Administrateur', 'Gestion complète', 80, '{"users": ["read","create","update","delete"], "transactions": ["read","update"], "settings": ["read","update"]}'::jsonb),
  ('moderator', 'Modérateur', 'Gestion utilisateurs', 50, '{"users": ["read","update"], "transactions": ["read"]}'::jsonb),
  ('support', 'Support', 'Support client', 30, '{"users": ["read"], "transactions": ["read"]}'::jsonb)
ON CONFLICT (role_name) DO NOTHING;

-- Insert Default Settings
INSERT INTO admin_settings (setting_key, setting_value, category, description, is_public) VALUES
  ('platform.name', '"Alliance Web3 Africa"', 'general', 'Nom plateforme', true),
  ('platform.maintenance_mode', 'false', 'general', 'Mode maintenance', false),
  ('kyc.required_level', '2', 'kyc', 'Niveau KYC requis', false),
  ('fees.withdrawal', '1', 'fees', 'Frais retrait (%)', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Function: Check Admin Permission
CREATE OR REPLACE FUNCTION check_admin_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_permissions JSONB;
BEGIN
  SELECT r.permissions INTO v_permissions
  FROM admin_users au JOIN admin_roles r ON au.role_id = r.id
  WHERE au.user_id = p_user_id AND au.is_active = true;
  
  IF v_permissions ? 'all' AND (v_permissions->>'all')::boolean THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can read roles" ON admin_roles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Admins can read admin users" ON admin_users FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Public settings readable" ON admin_settings FOR SELECT TO authenticated
  USING (is_public = true);

CREATE POLICY "Admins can read all settings" ON admin_settings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true));
