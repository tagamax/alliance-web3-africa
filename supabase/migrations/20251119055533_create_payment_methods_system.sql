/*
  # Système de Méthodes de Paiement

  1. Nouvelles Tables
    - `payment_methods`
      - `id` (uuid, primary key)
      - `method_id` (text, unique) - ID unique de la méthode
      - `name` (text) - Nom affiché
      - `type` (text) - Type: crypto, mobile, bank, card, online, cash
      - `currency` (text) - Devise: USD, GNF, BTC, etc.
      - `network` (text) - Réseau pour crypto: TRC20, ERC20, BSC, etc.
      - `address` (text) - Adresse de réception
      - `instructions` (text) - Instructions détaillées
      - `deposit_enabled` (boolean) - Activer pour dépôts
      - `withdraw_enabled` (boolean) - Activer pour retraits
      - `deposit_fee_percent` (numeric) - Frais dépôt en %
      - `withdraw_fee_percent` (numeric) - Frais retrait en %
      - `min_deposit` (numeric) - Montant minimum dépôt
      - `max_deposit` (numeric) - Montant maximum dépôt
      - `min_withdraw` (numeric) - Montant minimum retrait
      - `max_withdraw` (numeric) - Montant maximum retrait
      - `processing_time` (text) - Délai de traitement
      - `logo_url` (text) - URL du logo
      - `active` (boolean) - Actif/Inactif
      - `priority` (integer) - Ordre d'affichage
      - `metadata` (jsonb) - Métadonnées additionnelles
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur `payment_methods`
    - Public peut lire les méthodes actives
    - Seulement admin peut modifier

  3. Données Initiales
    - 16 méthodes de paiement pré-configurées
    - Crypto: USDT (TRC20/ERC20), BTC, ETH, BNB
    - Mobile: Orange Money, MTN, Moov, Wave
    - Banques: Ecobank, Orabank, BCRG
    - Online: Visa/MC, PayPal, Perfect Money, Cash
*/

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method_id text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('crypto', 'mobile', 'bank', 'card', 'online', 'cash')),
  currency text DEFAULT 'USD',
  network text,
  address text,
  instructions text NOT NULL,
  deposit_enabled boolean DEFAULT true,
  withdraw_enabled boolean DEFAULT true,
  deposit_fee_percent numeric(5,2) DEFAULT 0,
  withdraw_fee_percent numeric(5,2) DEFAULT 0,
  min_deposit numeric(20,8) DEFAULT 0,
  max_deposit numeric(20,8) DEFAULT 999999999,
  min_withdraw numeric(20,8) DEFAULT 0,
  max_withdraw numeric(20,8) DEFAULT 999999999,
  processing_time text DEFAULT 'Instantané',
  logo_url text,
  active boolean DEFAULT true,
  priority integer DEFAULT 100,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Public can read active payment methods
CREATE POLICY "Anyone can view active payment methods"
  ON payment_methods FOR SELECT
  USING (active = true);

-- Only authenticated users can read all methods (including inactive)
CREATE POLICY "Authenticated users can view all payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_priority ON payment_methods(priority);

-- Insert initial payment methods
INSERT INTO payment_methods (method_id, name, type, currency, network, address, instructions, deposit_fee_percent, withdraw_fee_percent, min_deposit, max_deposit, min_withdraw, max_withdraw, processing_time, priority) VALUES
  ('crypto_usdt_trc20', 'USDT (TRC20)', 'crypto', 'USDT', 'TRC20', 'TYourUSDTTRC20AddressHere', 'Réseau: TRON (TRC20). Envoyez uniquement des USDT TRC20. Minimum 1 confirmation. Délai: 5-15 minutes.', 0, 1, 10, 999999, 20, 50000, '5-15 min', 10),
  ('crypto_usdt_erc20', 'USDT (ERC20)', 'crypto', 'USDT', 'ERC20', '0xYourUSDTERC20AddressHere', 'Réseau: Ethereum (ERC20). Envoyez uniquement des USDT ERC20. Minimum 12 confirmations. Délai: 5-30 minutes.', 0, 2.5, 20, 999999, 50, 100000, '5-30 min', 11),
  ('crypto_btc', 'Bitcoin (BTC)', 'crypto', 'BTC', 'Bitcoin', 'bc1qYourBTCAddressHere', 'Réseau: Bitcoin Mainnet. Minimum 3 confirmations. Délai: 30-60 minutes.', 0, 0.5, 0.001, 100, 0.001, 10, '30-60 min', 12),
  ('crypto_eth', 'Ethereum (ETH)', 'crypto', 'ETH', 'Ethereum', '0xYourETHAddressHere', 'Réseau: Ethereum Mainnet. Minimum 12 confirmations. Délai: 5-30 minutes.', 0, 1.5, 0.01, 1000, 0.01, 1000, '5-30 min', 13),
  ('crypto_bnb', 'BNB (BSC)', 'crypto', 'BNB', 'BSC', '0xYourBNBBSCAddressHere', 'Réseau: Binance Smart Chain (BSC/BEP20). Minimum 15 confirmations. Délai: 3-10 minutes.', 0, 0.5, 0.1, 10000, 0.1, 10000, '3-10 min', 14),
  
  ('mobile_orange_money', 'Orange Money Guinée', 'mobile', 'GNF', NULL, '+224 620 XX XX XX', 'Composez *144# puis envoyez au numéro indiqué. Référence: Votre ID utilisateur. Frais Orange: 1%. Délai: Instantané à 1h.', 1.5, 1.5, 5000, 5000000, 5000, 3000000, 'Instant-1h', 20),
  ('mobile_mtn', 'MTN Mobile Money', 'mobile', 'GNF', NULL, '+224 660 XX XX XX', 'Menu MTN Mobile Money vers Transfert argent. Numéro bénéficiaire indiqué. Référence: Votre ID. Frais MTN: 1%. Délai: Instantané à 1h.', 1.5, 1.5, 5000, 5000000, 5000, 3000000, 'Instant-1h', 21),
  ('mobile_moov', 'Moov Money (Flooz)', 'mobile', 'GNF', NULL, '+224 664 XX XX XX', 'Composez *155# vers Transfert. Numéro bénéficiaire indiqué. Référence obligatoire: Votre ID. Frais: 0.5-2%. Délai: Instantané.', 1.5, 1.5, 5000, 3000000, 5000, 2000000, 'Instantané', 22),
  ('mobile_wave', 'Wave (SN/CI)', 'mobile', 'XOF', NULL, '+221/+225 XX XXX XXXX', 'App Wave puis Envoyer. Sélectionnez le pays (SN/CI). 0% de frais Wave. Délai: Instantané.', 0, 0, 1000, 10000000, 1000, 5000000, 'Instantané', 23),
  
  ('bank_ecobank', 'Ecobank (Virement)', 'bank', 'GNF', NULL, 'IBAN: GN74 XXXX XXXX XXXX XXXX XXXX XX', 'Bénéficiaire: Alliance Web3 Africa. SWIFT: ECOCGNCX. Agence: Conakry-Centre. Référence: Votre ID utilisateur. Délai: 24-48h.', 0, 0, 100000, 999999999, 100000, 50000000, '24-48h', 30),
  ('bank_orabank', 'Orabank (Virement)', 'bank', 'GNF', NULL, 'IBAN: GN74 XXXX XXXX XXXX XXXX XXXX XX', 'Bénéficiaire: Alliance Web3 Africa. SWIFT: ORABGNCX. Référence obligatoire: Votre ID. Délai: 24-72h.', 0, 0, 100000, 999999999, 100000, 50000000, '24-72h', 31),
  ('bank_bcrg', 'BCRG (Banque Centrale)', 'bank', 'GNF', NULL, 'Compte: XXXX XXXX XXXX XX', 'Virement uniquement via banques commerciales guinéennes. Référence: Votre ID. Délai: 1-3 jours ouvrés.', 0, 0, 250000, 999999999, 250000, 100000000, '1-3 jours', 32),
  
  ('card_visa', 'Carte Visa/Mastercard', 'card', 'USD', NULL, NULL, 'Paiement sécurisé via Stripe. Cartes acceptées: Visa, Mastercard. Traitement instantané. 3D Secure requis.', 2.9, 3.5, 10, 50000, 10, 10000, 'Instant-5j', 40),
  ('paypal', 'PayPal', 'online', 'USD', NULL, 'pay@allianceweb3africa.org', 'Envoyez via PayPal à la dresse indiquée. Sélectionnez Envoyer a un ami pour réduire les frais. Référence: Votre ID.', 3.5, 3.5, 5, 100000, 10, 50000, 'Instant-24h', 41),
  ('perfect_money', 'Perfect Money', 'online', 'USD', NULL, 'U12345678', 'Compte Perfect Money. USD uniquement. Envoyez au compte indiqué avec votre ID en note. Instantané.', 0.5, 0.5, 10, 100000, 10, 100000, 'Instantané', 42),
  
  ('cash_pickup', 'Dépôt/Retrait Cash (Agents)', 'cash', 'GNF', NULL, NULL, 'Rendez-vous chez nos agents agréés en Guinée. Présentez votre ID et argent cash ou retirez vos fonds. Liste des agents disponible sur demande.', 1, 1, 20000, 50000000, 20000, 10000000, '2-24h', 50)
ON CONFLICT (method_id) DO NOTHING;
