# 🧪 GUIDE DE TEST - Alliance Web3 Africa

## 📋 TABLE DES MATIÈRES

1. [Préparation](#préparation)
2. [Tests Utilisateurs](#tests-utilisateurs)
3. [Tests Investisseurs](#tests-investisseurs)
4. [Tests Sécurité](#tests-sécurité)
5. [Tests Performance](#tests-performance)
6. [Scénarios Critiques](#scénarios-critiques)

---

## 🎯 PRÉPARATION

### Configuration Requise

**Environnement de Test**:
- Node.js 18+
- npm ou pnpm
- Navigateur moderne (Chrome, Firefox, Safari)
- Connexion internet stable

**Variables d'Environnement** (`.env`):
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Lancement de l'Application

```bash
npm install
npm run dev
```

Ouvrir: http://localhost:5173

---

## 👥 TESTS UTILISATEURS

### 1. Inscription & Authentification

#### ✅ Test 1.1: Création de Compte
**Objectif**: Vérifier le processus d'inscription

1. Accéder à la page d'authentification
2. Cliquer sur "S'inscrire"
3. Remplir:
   - Email: `test.user@gmail.com`
   - Mot de passe: `TestUser123!`
   - Confirmation: `TestUser123!`
4. Soumettre

**Résultat Attendu**:
- ✅ Compte créé
- ✅ Redirection vers Dashboard
- ✅ Profil initialisé automatiquement

#### ✅ Test 1.2: Connexion
**Objectif**: Tester l'authentification

1. Se déconnecter
2. Entrer les identifiants
3. Cliquer "Se connecter"

**Résultat Attendu**:
- ✅ Connexion réussie
- ✅ Session créée
- ✅ Dashboard affiché

#### ✅ Test 1.3: Sécurité Mot de Passe
**Objectif**: Valider les règles de mot de passe

Tester avec:
- `short` → Erreur (trop court)
- `alllowercase123` → Erreur (pas de majuscule)
- `ALLUPPERCASE123` → Erreur (pas de minuscule)
- `NoNumbers!` → Erreur (pas de chiffre)
- `ValidPass123!` → ✅ Accepté

---

### 2. Navigation & Interface

#### ✅ Test 2.1: Menu Principal
**Objectif**: Vérifier tous les liens de navigation

Cliquer sur chaque menu:
- Dashboard → ✅ Affiche solde, stats
- Swap → ✅ Interface d'échange
- P2P → ✅ Marketplace P2P
- CROWN → ✅ Projets disponibles
- NFT Impact → ✅ NFTs environnementaux
- DeFi → ✅ Lending/Staking
- Governance → ✅ DAO & Votes
- عIndex → ✅ Commodities Index
- Entrepreneurs → ✅ Marchés publics
- Mining Pools → ✅ Pools miniers
- Redistributions → ✅ Système de rewards

#### ✅ Test 2.2: Responsive Design
**Objectif**: Vérifier l'adaptabilité

Tester sur:
- **Desktop** (1920x1080) → ✅ Layout 2 colonnes
- **Tablet** (768x1024) → ✅ Layout adaptatif
- **Mobile** (375x667) → ✅ Menu hamburger, scroll fluide

---

### 3. Dépôts

#### ✅ Test 3.1: Dépôt Crypto
**Objectif**: Tester le processus de dépôt

1. Aller sur `/deposit`
2. Cliquer sur **💰 Cryptomonnaies**
3. Sélectionner "USDT (TRC20)"
4. Entrer montant: `100`
5. Copier l'adresse
6. Confirmer

**Résultat Attendu**:
- ✅ Adresse affichée
- ✅ QR Code généré (si disponible)
- ✅ Instructions claires
- ✅ Demande enregistrée

#### ✅ Test 3.2: Dépôt Mobile Money
**Objectif**: Tester Orange Money

1. Sélectionner **📱 Mobile Money**
2. Choisir "Orange Money"
3. Entrer: `500000 GNF`
4. Entrer numéro: `628XXXXXX`
5. Soumettre

**Résultat Attendu**:
- ✅ Validation montant minimum
- ✅ Format téléphone vérifié
- ✅ Instructions USSD
- ✅ Confirmation

#### ✅ Test 3.3: Accordéons Méthodes
**Objectif**: Tester expand/collapse

1. Cliquer sur chaque header:
   - 💰 Cryptomonnaies
   - 📱 Mobile Money
   - 🏦 Virements Bancaires
   - 💳 Cartes & Online
   - 💵 Cash

**Résultat Attendu**:
- ✅ Chevron change (up/down)
- ✅ Section expand/collapse
- ✅ Animation fluide
- ✅ État conservé

---

### 4. Retraits

#### ✅ Test 4.1: Retrait Crypto
**Objectif**: Tester withdrawal process

1. Aller sur `/withdraw`
2. Vérifier solde affiché
3. Sélectionner "USDT (TRC20)"
4. Entrer:
   - Montant: `50`
   - Adresse: `TValidAddressHere...`
5. Confirmer

**Résultat Attendu**:
- ✅ Validation solde suffisant
- ✅ Validation adresse
- ✅ Frais calculés
- ✅ Montant net affiché
- ✅ Demande créée

#### ✅ Test 4.2: Limites Retrait
**Objectif**: Vérifier min/max

Tester:
- Montant < Minimum → ❌ Erreur
- Montant > Solde → ❌ Erreur
- Montant > Maximum → ❌ Erreur
- Montant valide → ✅ Accepté

---

### 5. Swap (Échange)

#### ✅ Test 5.1: Swap عLK3 → GNF
**Objectif**: Échanger des tokens

1. Aller sur `/swap`
2. Sélectionner:
   - De: `عLK3`
   - À: `GNF`
3. Entrer: `100 عLK3`
4. Vérifier taux affiché
5. Confirmer swap

**Résultat Attendu**:
- ✅ Calcul automatique montant reçu
- ✅ Frais affichés (0% en عLK3)
- ✅ Confirmation
- ✅ Soldes mis à jour

---

### 6. P2P Marketplace

#### ✅ Test 6.1: Publier une Offre
**Objectif**: Créer une annonce P2P

1. Aller sur `/p2p`
2. Cliquer "Créer Offre"
3. Remplir:
   - Type: Vente
   - Montant: `1000 عLK3`
   - Prix: `11000 GNF/عLK3`
   - Méthode: Orange Money
4. Publier

**Résultat Attendu**:
- ✅ Offre créée
- ✅ Visible dans liste
- ✅ Statut "active"
- ✅ Escrow réservé

#### ✅ Test 6.2: Accepter une Offre
**Objectif**: Acheter/vendre P2P

1. Trouver une offre
2. Cliquer "Acheter/Vendre"
3. Entrer quantité
4. Confirmer transaction
5. Suivre instructions paiement

**Résultat Attendu**:
- ✅ Escrow activé
- ✅ Instructions claires
- ✅ Délai affiché
- ✅ Dispute possible

---

## 💼 TESTS INVESTISSEURS

### 7. CROWN Financement

#### ✅ Test 7.1: Voir Projets
**Objectif**: Explorer les opportunités

1. Aller sur `/crown`
2. Parcourir projets disponibles
3. Cliquer sur un projet
4. Lire détails

**Résultat Attendu**:
- ✅ Liste des projets
- ✅ Infos complètes (montant, ROI, durée)
- ✅ Progression funding
- ✅ Documents disponibles

#### ✅ Test 7.2: Investir dans CROWN
**Objectif**: Participer au financement

1. Sélectionner un projet
2. Cliquer "Investir"
3. Entrer montant: `5000 عLK3`
4. Confirmer investissement

**Résultat Attendu**:
- ✅ Minimum respecté
- ✅ Solde vérifié
- ✅ Parts calculées
- ✅ Investissement enregistré
- ✅ ROI projeté affiché

---

### 8. Mining Pools

#### ✅ Test 8.1: Rejoindre un Pool
**Objectif**: Investir dans mining

1. Aller sur `/mining`
2. Choisir un pool (ex: Bauxite)
3. Voir APY, capacité
4. Investir: `10000 عLK3`
5. Confirmer

**Résultat Attendu**:
- ✅ Pool details affichés
- ✅ Part calculée
- ✅ Rewards estimés
- ✅ Position dans pool

---

### 9. Redistributions

#### ✅ Test 9.1: Voir Récompenses
**Objectif**: Vérifier rewards reçus

1. Aller sur `/redistributions`
2. Voir section "Mes Récompenses"
3. Vérifier les 5 catégories:
   - Power Rewards (35%)
   - CROWN Finance (25%)
   - Mining Pools (15%)
   - Governance (15%)
   - Total

**Résultat Attendu**:
- ✅ Montants affichés
- ✅ Breakdown par poche
- ✅ Historique cycles
- ✅ Tokens brûlés visible

---

### 10. Governance (DAO)

#### ✅ Test 10.1: Voter sur Proposition
**Objectif**: Participer gouvernance

1. Aller sur `/governance`
2. Voir propositions actives
3. Lire détails proposition
4. Voter (Pour/Contre/Abstention)
5. Confirmer vote

**Résultat Attendu**:
- ✅ Voting power affiché
- ✅ Vote enregistré
- ✅ Résultats mis à jour
- ✅ Rewards governance

---

## 🔒 TESTS SÉCURITÉ

### 11. Sécurité Authentication

#### ✅ Test 11.1: Rate Limiting Login
**Objectif**: Vérifier protection brute force

1. Tenter connexion avec mauvais password
2. Répéter 5 fois rapidement
3. Tenter 6ème fois

**Résultat Attendu**:
- ✅ Après 5 échecs → Compte verrouillé 15min
- ✅ Message clair
- ✅ Timer affiché

#### ✅ Test 11.2: Session Timeout
**Objectif**: Tester expiration session

1. Se connecter
2. Attendre 60 minutes (ou ajuster paramètre)
3. Tenter une action

**Résultat Attendu**:
- ✅ Session expirée
- ✅ Redirection login
- ✅ Message approprié

#### ✅ Test 11.3: XSS Protection
**Objectif**: Tester sanitization

Tenter d'injecter dans champs:
- `<script>alert('xss')</script>`
- `javascript:alert('xss')`

**Résultat Attendu**:
- ✅ Script bloqué/sanitized
- ✅ Pas d'exécution
- ✅ Données sécurisées

---

### 12. Sécurité Transactions

#### ✅ Test 12.1: Double Spend
**Objectif**: Empêcher dépense multiple

1. Initier retrait de 100 عLK3
2. Immédiatement initier 2ème retrait de 100 عLK3
3. (Solde = 150 عLK3)

**Résultat Attendu**:
- ✅ 1er retrait: Succès
- ✅ 2ème retrait: Refusé (solde insuffisant)
- ✅ Pas de race condition

---

## ⚡ TESTS PERFORMANCE

### 13. Vitesse Chargement

#### ✅ Test 13.1: First Contentful Paint
**Objectif**: Mesurer temps initial

1. Ouvrir DevTools (F12)
2. Onglet "Performance"
3. Rafraîchir page
4. Analyser timeline

**Cibles**:
- FCP < 1.5s ✅
- LCP < 2.5s ✅
- TTI < 3s ✅

#### ✅ Test 13.2: Navigation
**Objectif**: Tester rapidité changement page

Mesurer temps pour:
- Dashboard → Swap
- Swap → P2P
- P2P → CROWN

**Résultat Attendu**:
- ✅ < 200ms par navigation
- ✅ Pas de reload complet
- ✅ Smooth transition

---

### 14. Optimisation Bundle

#### ✅ Test 14.1: Taille Bundle
**Objectif**: Vérifier poids app

```bash
npm run build
```

Vérifier:
- index.js < 200 KB (gzip) ✅
- CSS < 10 KB (gzip) ✅
- Total < 600 KB ✅

---

## 🎯 SCÉNARIOS CRITIQUES

### Scénario 1: Parcours Utilisateur Complet

**Durée**: ~15 minutes

1. **Inscription** (2min)
   - Créer compte
   - Vérifier email (si activé)
   - Se connecter

2. **Premier Dépôt** (3min)
   - Choisir Mobile Money
   - Déposer 500,000 GNF
   - Attendre confirmation (simulé)

3. **Investissement CROWN** (3min)
   - Explorer projets
   - Investir 5,000 عLK3
   - Vérifier parts reçues

4. **Trading P2P** (4min)
   - Publier offre vente
   - Attendre acheteur (simuler)
   - Compléter transaction

5. **Retrait** (3min)
   - Retirer profits
   - Choisir méthode
   - Confirmer

**Résultat Attendu**:
- ✅ Parcours fluide sans erreur
- ✅ Toutes transactions confirmées
- ✅ Soldes corrects à chaque étape

---

### Scénario 2: Parcours Investisseur

**Durée**: ~20 minutes

1. **Analyse Opportunités** (5min)
   - Review tous projets CROWN
   - Comparer ROI, risques
   - Lire documents

2. **Diversification** (7min)
   - Investir dans 3 projets CROWN différents
   - Rejoindre 2 mining pools
   - Acheter NFTs Impact

3. **Gouvernance Active** (5min)
   - Lire propositions DAO
   - Voter sur 2-3 propositions
   - Vérifier voting power

4. **Suivi Performance** (3min)
   - Voir redistributions reçues
   - Analyser rendements
   - Ajuster stratégie

---

## 📊 CHECKLIST FINALE

### Fonctionnalités Critiques
- [ ] Inscription/Connexion
- [ ] Dépôts (Crypto + Mobile Money)
- [ ] Retraits (toutes méthodes)
- [ ] Swap عLK3
- [ ] P2P Trading
- [ ] CROWN Investissement
- [ ] Mining Pools
- [ ] Redistributions
- [ ] Governance Votes
- [ ] NFT Achats
- [ ] Notifications

### Sécurité
- [ ] Rate limiting actif
- [ ] RLS Supabase configuré
- [ ] Sessions sécurisées
- [ ] Validation inputs
- [ ] Sanitization XSS
- [ ] Logs sécurité actifs

### Performance
- [ ] Bundle < 600 KB
- [ ] FCP < 1.5s
- [ ] Navigation < 200ms
- [ ] Pas de memory leaks
- [ ] PWA fonctionnel

### UX
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Accordéons fonctionnels
- [ ] Messages d'erreur clairs
- [ ] Confirmations appropriées
- [ ] Loading states

---

## 🐛 REPORTING BUGS

Format de rapport:

```
**Titre**: [Description courte]

**Sévérité**: Critique / Haute / Moyenne / Basse

**Étapes**:
1. Action 1
2. Action 2
3. ...

**Résultat Attendu**:
- Ce qui devrait se passer

**Résultat Obtenu**:
- Ce qui s'est passé

**Environnement**:
- OS:
- Navigateur:
- Version App:

**Screenshots/Vidéo**:
[Attaché si possible]
```

---

## ✅ VALIDATION FINALE

L'application est **Production-Ready** si:

✅ Tous les tests passent
✅ 0 bugs critiques
✅ < 5 bugs haute priorité
✅ Performance targets atteints
✅ Sécurité validée
✅ UX fluide sur tous devices

---

**Contact Support Test**: support@allianceweb3africa.org
