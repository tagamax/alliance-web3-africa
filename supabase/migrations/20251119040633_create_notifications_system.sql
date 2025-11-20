/*
  # Système de Notifications

  1. Nouvelle Table
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, référence vers auth.users)
      - `type` (text) - Type de notification (activity, news, transaction, alert)
      - `title` (text) - Titre de la notification
      - `message` (text) - Message détaillé
      - `data` (jsonb) - Données additionnelles (liens, IDs, etc.)
      - `read` (boolean) - Statut de lecture
      - `created_at` (timestamptz) - Date de création
      - `expires_at` (timestamptz) - Date d'expiration optionnelle

  2. Sécurité
    - Enable RLS sur `notifications`
    - Politique : Les utilisateurs peuvent lire leurs propres notifications
    - Politique : Les utilisateurs peuvent marquer leurs notifications comme lues
    - Politique : Seul le système peut créer des notifications (via service role)

  3. Index
    - Index sur `user_id` pour des requêtes rapides
    - Index sur `created_at` pour le tri chronologique
    - Index sur `read` pour filtrer les notifications non lues
*/

-- Créer la table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('activity', 'news', 'transaction', 'alert', 'achievement')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  CONSTRAINT valid_expiration CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Activer RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent lire leurs propres notifications
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres notifications (marquer comme lu)
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type);

-- Fonction pour nettoyer les notifications expirées automatiquement
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL AND expires_at < now();
END;
$$;

-- Insérer quelques notifications de bienvenue pour les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION create_welcome_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Notification de bienvenue
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.id,
    'news',
    'Bienvenue sur Alliance Web3 Africa !',
    'Félicitations ! Vous avez reçu 1000 عLK3 de bienvenue. Explorez nos modules DeFi, NFT Impact et plus encore.',
    jsonb_build_object('action', 'dashboard', 'highlight', 'quick_actions')
  );

  -- Notification sur le CROWN Score
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.id,
    'achievement',
    'Votre CROWN Score initial',
    'Votre score de crédibilité CROWN a été initialisé à 500 points. Participez aux activités pour l''améliorer !',
    jsonb_build_object('action', 'crown', 'score', 500)
  );

  RETURN NEW;
END;
$$;

-- Trigger pour créer des notifications de bienvenue
DROP TRIGGER IF EXISTS on_user_created_welcome_notifications ON users;
CREATE TRIGGER on_user_created_welcome_notifications
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_welcome_notifications();

-- Insérer des notifications d'exemple pour les utilisateurs existants
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM users LOOP
    -- Vérifier si l'utilisateur a déjà des notifications
    IF NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = user_record.id) THEN
      -- Actualités récentes
      INSERT INTO notifications (user_id, type, title, message, data, created_at)
      VALUES (
        user_record.id,
        'news',
        'Nouveau : Mining Pools disponibles',
        'Vous pouvez maintenant participer aux pools de minage et gagner des récompenses عLK3.',
        jsonb_build_object('action', 'mining'),
        now() - interval '2 hours'
      );

      -- Activité système
      INSERT INTO notifications (user_id, type, title, message, data, created_at)
      VALUES (
        user_record.id,
        'activity',
        'Marché DeFi en hausse',
        'Le volume de trading sur la plateforme DeFi a augmenté de 45% cette semaine.',
        jsonb_build_object('action', 'defi'),
        now() - interval '5 hours'
      );

      -- Alerte
      INSERT INTO notifications (user_id, type, title, message, data, created_at)
      VALUES (
        user_record.id,
        'alert',
        'Complétez votre profil KYC',
        'Terminez votre vérification KYC pour débloquer toutes les fonctionnalités de la plateforme.',
        jsonb_build_object('action', 'dashboard', 'priority', 'high'),
        now() - interval '1 day'
      );
    END IF;
  END LOOP;
END $$;