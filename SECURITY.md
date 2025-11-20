# 🔒 DOCUMENTATION SÉCURITÉ - Alliance Web3 Africa

## 📋 VUE D'ENSEMBLE

Cette application implémente plusieurs couches de sécurité pour protéger les utilisateurs et leurs actifs.

---

## 🛡️ AUTHENTIFICATION

### Supabase Auth

**Méthode**: Email & Password
- Hashing: bcrypt (automatique Supabase)
- Sessions: JWT tokens
- Expiration: 60 minutes (configurable)

### Validation Mot de Passe

```typescript
Exigences:
- Minimum 8 caractères
- Au moins 1 majuscule
- Au moins 1 minuscule
- Au moins 1 chiffre
- Caractères spéciaux recommandés
```

### Rate Limiting Connexion

```
Max tentatives: 5
Fenêtre: 15 minutes
Action: Compte verrouillé
Durée lockout: 15 minutes
```

---

## 🔐 ROW LEVEL SECURITY (RLS)

### Principe

Toutes les tables Supabase utilisent RLS pour isolation des données.

### Politiques Standards

**Utilisateurs**:
```sql
- SELECT: auth.uid() = user_id
- INSERT: auth.uid() = user_id
- UPDATE: auth.uid() = user_id
- DELETE: auth.uid() = user_id
```

**Transactions**:
```sql
- SELECT: auth.uid() = user_id
- INSERT: auth.uid() = user_id (+ validations)
- UPDATE: Interdit (immutabilité)
- DELETE: Interdit (audit trail)
```

**Logs**:
```sql
- SELECT: auth.uid() = user_id
- INSERT: System only
- UPDATE: Interdit
- DELETE: Interdit
```

---

## 🚨 PROTECTION CONTRE ATTAQUES

### 1. XSS (Cross-Site Scripting)

**Mesures**:
- Sanitization automatique des inputs
- React auto-escape par défaut
- Content Security Policy headers

**Fonction**:
```typescript
sanitizeInput(input: string): string
- Supprime <script>, javascript:
- Échappe caractères dangereux
- Trim & normalisation
```

### 2. SQL Injection

**Protection**:
- Parameterized queries (Supabase)
- Pas de SQL brut côté client
- RLS empêche accès non autorisé

### 3. CSRF (Cross-Site Request Forgery)

**Protection**:
- SameSite cookies
- Origin verification
- CSRF tokens (si activé)

### 4. Brute Force

**Rate Limiting**:
```typescript
Actions protégées:
- Login: 5/15min
- Signup: 3/60min
- Withdraw: 10/60min
- Deposit: 20/60min
- P2P: 50/60min
```

### 5. Session Hijacking

**Protection**:
- HTTPS only
- Secure cookies
- Session timeout
- Token rotation

---

## 💰 SÉCURITÉ TRANSACTIONS

### Validation Montants

```typescript
validateAmount(amount, min?, max?):
- Vérifie > 0
- Vérifie >= minimum
- Vérifie <= maximum
- Vérifie solde suffisant
```

### Validation Adresses Crypto

```typescript
validateCryptoAddress(address, currency):
Patterns supportés:
- BTC: P2PKH, P2SH, Bech32
- ETH: 0x + 40 hex
- USDT TRC20: T + 33 chars
- BNB: 0x ou bnb1
```

### Double Spend Protection

**Mécanisme**:
1. Transaction lock en DB
2. Vérification solde atomique
3. Commit ou rollback
4. Logs audit trail

### Escrow P2P

**Sécurité**:
- Fonds bloqués en escrow
- Release uniquement si conditions remplies
- Dispute mechanism
- Timeout automatique

---

## 📊 LOGGING & MONITORING

### Tables de Logs

1. **security_logs**
   - Tous événements de sécurité
   - Sévérité: low, medium, high, critical
   - IP address, user agent
   - Rétention: 90 jours

2. **rate_limit_logs**
   - Tentatives rate limited
   - Action, endpoint, user
   - Rétention: 7 jours

3. **session_logs**
   - Login, logout, timeout
   - Device info, location
   - Rétention: 30 jours

4. **failed_login_attempts**
   - Email, IP, reason
   - Auto-cleanup lockout
   - Rétention: 30 jours

5. **audit_trail**
   - Create, update, delete
   - Old/new values
   - Rétention: 180 jours

### Alertes Automatiques

**Déclencheurs**:
- 5+ failed logins (même email)
- Withdraw > 1M عLK3
- Changement email/password
- Accès depuis nouveau device
- Rate limit atteint

---

## 🔑 GESTION CLÉS & SECRETS

### Variables d'Environnement

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

JAMAIS commiter les .env!
```

### Clés API Tierces

**Stockage**:
- Serveur only (Supabase Edge Functions)
- Encrypted en DB
- Rotation régulière

**Usage**:
- Proxy via Edge Functions
- Pas d'exposition client-side
- Rate limiting strict

---

## 🌐 SÉCURITÉ RÉSEAU

### HTTPS Only

**Configuration**:
- Force redirect HTTP → HTTPS
- HSTS header
- TLS 1.2+ minimum

### CORS

**Configuration**:
```typescript
Allowed Origins:
- http://localhost:5173 (dev)
- https://allianceweb3africa.org (prod)

Methods: GET, POST, PUT, DELETE, OPTIONS
Headers: Content-Type, Authorization, X-Client-Info
```

### Headers Sécurité

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 👤 DONNÉES PERSONNELLES (RGPD/GDPR)

### Collecte

**Données collectées**:
- Email (obligatoire)
- Téléphone (optionnel)
- Nom complet
- Pays
- Historique transactions

**Base légale**:
- Nécessité contractuelle
- Consentement explicite
- Obligation légale (KYC)

### Droits Utilisateurs

**Droits RGPD**:
- Accès (export données)
- Rectification
- Suppression (droit à l'oubli)
- Portabilité
- Opposition

### Rétention

```
Données actives: Pendant durée compte
Logs sécurité: 90 jours
Transactions: 7 ans (légal)
KYC documents: 5 ans
```

---

## 🧪 TESTS SÉCURITÉ

### Tests Automatisés

1. **Input Validation**
   - XSS payloads
   - SQL injection attempts
   - Overflow tests

2. **Authentication**
   - Brute force simulation
   - Session hijacking tests
   - Token expiration

3. **Authorization**
   - RLS bypass attempts
   - Privilege escalation
   - Cross-user access

### Tests Manuels

**Checklist**:
- [ ] Pentesting externe
- [ ] Code review sécurité
- [ ] Audit dependencies
- [ ] Scan vulnérabilités
- [ ] Load testing

---

## 🚀 DÉPLOIEMENT SÉCURISÉ

### Pre-Production

1. Update toutes dépendances
2. Scan vulnérabilités (npm audit)
3. Review code sécurité
4. Tests charge & stress
5. Backup DB complet

### Production

**Checklist**:
- [ ] HTTPS configuré
- [ ] Firewall actif
- [ ] Rate limiting production
- [ ] Monitoring actif
- [ ] Logs centralisés
- [ ] Backups automatiques
- [ ] Plan disaster recovery

---

## 🆘 INCIDENT RESPONSE

### Procédure

**Phase 1: Détection**
- Alertes automatiques
- Monitoring continu
- Reports utilisateurs

**Phase 2: Containment**
- Isoler système affecté
- Bloquer attaque en cours
- Préserver preuves

**Phase 3: Éradication**
- Identifier cause racine
- Patcher vulnérabilité
- Nettoyer système

**Phase 4: Recovery**
- Restaurer services
- Vérifier intégrité
- Communication utilisateurs

**Phase 5: Post-Incident**
- Rapport détaillé
- Lessons learned
- Update procédures

### Contact Urgence

```
Security Team: security@allianceweb3africa.org
Incident Hotline: +224 XXX XXX XXX
PGP Key: [Public key for encrypted comms]
```

---

## 📚 RESSOURCES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/auth)
- [RGPD Guide](https://www.cnil.fr/)

---

## 🔄 MISES À JOUR

**Dernière révision**: 2025-11-19
**Prochaine révision**: 2026-02-19 (tous les 3 mois)

**Changelog**:
- 2025-11-19: Document initial
- RLS policies complètes
- Rate limiting implémenté
- Logging system actif
