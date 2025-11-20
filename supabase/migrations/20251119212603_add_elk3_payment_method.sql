/*
  # Ajout de عLK3 comme Méthode de Paiement Crypto
  
  1. Nouvelle Méthode
    - عLK3 Token - Token natif de l'Alliance Web3 Africa
    - Type: crypto
    - Devise: عLK3
    - Réseau: Alliance Web3 Africa
    - Frais: 0% (transferts internes gratuits)
    - Min: 1 عLK3
    - Max: 999,999,999 عLK3
    - Traitement: Instantané
    - Priorité: 9 (affiché en premier dans les cryptos)
  
  2. Caractéristiques
    - Dépôt ET retrait activés
    - 0% de frais pour encourager l'utilisation
    - Transferts instantanés entre membres
    - Pas de limites maximum (haute confiance)
*/

-- Insérer عLK3 comme méthode de paiement crypto
INSERT INTO payment_methods (
  method_id, 
  name, 
  type, 
  currency, 
  network, 
  address, 
  instructions, 
  deposit_enabled, 
  withdraw_enabled, 
  deposit_fee_percent, 
  withdraw_fee_percent, 
  min_deposit, 
  max_deposit, 
  min_withdraw, 
  max_withdraw, 
  processing_time, 
  active, 
  priority
) VALUES (
  'crypto_elk3',
  'عLK3 Token',
  'crypto',
  'عLK3',
  'Alliance Web3 Africa',
  'عLK3ContractAddressHere',
  'Token natif de l''Alliance Web3 Africa. Utilisez uniquement le réseau officiel. Transferts instantanés entre membres. 0% de frais pour les transferts internes.',
  true,
  true,
  0,
  0,
  1,
  999999999,
  1,
  999999999,
  'Instantané',
  true,
  9
)
ON CONFLICT (method_id) DO UPDATE SET
  name = EXCLUDED.name,
  network = EXCLUDED.network,
  instructions = EXCLUDED.instructions,
  active = EXCLUDED.active,
  priority = EXCLUDED.priority,
  deposit_fee_percent = EXCLUDED.deposit_fee_percent,
  withdraw_fee_percent = EXCLUDED.withdraw_fee_percent;
