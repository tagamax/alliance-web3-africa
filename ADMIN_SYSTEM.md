# 🛡️ SYSTÈME D'ADMINISTRATION - Alliance Web3 Africa

## 📋 OVERVIEW

Système d'administration complet avec backend unifié sur Supabase.

**Architecture:** Single Backend (Supabase uniquement)

---

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────┐
│         ADMIN INTERFACE                  │
│         (React /admin)                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     EDGE FUNCTION: admin-backend        │
│     (Authentification + Permissions)    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│        SUPABASE DATABASE                │
│  • admin_roles                          │
│  • admin_users                          │
│  • admin_permissions                    │
│  • admin_audit_logs                     │
│  • admin_settings                       │
│  • + Toutes les tables existantes       │
└─────────────────────────────────────────┘
```

---

## 🗄️ SCHÉMA BASE DE DONNÉES

### Tables Créées

#### 1. **admin_roles**
Rôles administrateurs avec permissions

```sql
- id (UUID)
- role_name (TEXT UNIQUE) - Clé du rôle
- display_name (TEXT) - Nom affiché
- description (TEXT)
- permissions (JSONB) - {"module": ["action"]}
- level (INTEGER) - Niveau hiérarchique
- is_active (BOOLEAN)
- created_at, updated_at
```

**Rôles par défaut:**
```
1. super_admin (niveau 100) - Accès complet
2. admin (niveau 80) - Gestion complète sauf config système
3. moderator (niveau 50) - Gestion utilisateurs et contenu
4. support (niveau 30) - Support client
5. analyst (niveau 20) - Lecture seule + rapports
```

#### 2. **admin_users**
Liaison utilisateurs → rôles admin

```sql
- id (UUID)
- user_id (UUID → users.id)
- role_id (UUID → admin_roles.id)
- is_active (BOOLEAN)
- last_login (TIMESTAMPTZ)
- created_by (UUID)
- created_at, updated_at
```

#### 3. **admin_permissions**
Permissions granulaires disponibles

```sql
- id (UUID)
- permission_key (TEXT UNIQUE) - "module.action"
- display_name (TEXT)
- description (TEXT)
- module (TEXT)
- action (TEXT)
- created_at
```

**Exemples:**
```
- users.read
- users.create
- users.update
- users.delete
- transactions.read
- transactions.update
- settings.update
```

#### 4. **admin_audit_logs**
Logs de toutes les actions admin

```sql
- id (UUID)
- admin_user_id (UUID → admin_users.id)
- action (TEXT) - update_user, suspend_user, etc.
- module (TEXT) - users, transactions, etc.
- entity_type (TEXT)
- entity_id (UUID)
- old_values (JSONB)
- new_values (JSONB)
- ip_address (TEXT)
- user_agent (TEXT)
- status (TEXT) - success, error
- error_message (TEXT)
- created_at
```

#### 5. **admin_settings**
Configuration plateforme

```sql
- id (UUID)
- setting_key (TEXT UNIQUE)
- setting_value (JSONB)
- category (TEXT)
- description (TEXT)
- is_public (BOOLEAN)
- updated_by (UUID → admin_users.id)
- created_at, updated_at
```

**Catégories:**
```
- general: Configuration générale
- kyc: Paramètres KYC
- transactions: Limites, seuils
- fees: Frais
- redistribution: Config redistribution
- notifications: Config notifications
```

---

## 🔐 SÉCURITÉ

### Row Level Security (RLS)

**Activé sur toutes les tables admin.**

**Policies:**

```sql
-- Admins peuvent lire les rôles
admin_roles: SELECT → is admin

-- Super admins peuvent gérer rôles
admin_roles: ALL → check_admin_permission('settings.update')

-- Admins peuvent lire admin_users
admin_users: SELECT → is admin

-- Super admins gèrent admin_users
admin_users: ALL → check_admin_permission('settings.update')

-- Admins lisent audit logs
admin_audit_logs: SELECT → check_admin_permission('audit.read')

-- Système peut créer logs
admin_audit_logs: INSERT → true

-- Tous lisent settings publiques
admin_settings: SELECT → is_public = true

-- Admins lisent tous settings
admin_settings: SELECT → check_admin_permission('settings.read')
```

### Fonction: check_admin_permission()

```sql
check_admin_permission(user_id UUID, permission TEXT) → BOOLEAN

-- Vérifie si user a la permission
-- Format: "module.action"
-- Super admin: {"all": true} = toutes permissions
```

### Fonction: log_admin_action()

```sql
log_admin_action(
  admin_user_id UUID,
  action TEXT,
  module TEXT,
  entity_type TEXT,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  status TEXT,
  error_message TEXT
) → UUID

-- Crée un log audit automatiquement
```

---

## 🔌 API BACKEND (Edge Function)

### URL Base

```
https://zmfjlqmtfguvnmuzoztf.supabase.co/functions/v1/admin-backend
```

### Authentification

**Header requis:**
```http
Authorization: Bearer <supabase_access_token>
```

**Vérifications:**
1. Token valide
2. User est admin (dans admin_users)
3. Admin actif (is_active = true)

### Endpoints

#### 1. Health Check

**GET** `/health`

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-11-19T...",
    "admin": true
  }
}
```

#### 2. Dashboard Stats

**GET** `/stats`

```json
{
  "success": true,
  "data": {
    "total_users": 1000,
    "new_users_24h": 25,
    "total_transactions": 5000,
    "total_elk3_balance": 50000000,
    "admin_info": {
      "role": "admin",
      "level": 80
    }
  }
}
```

#### 3. List Users

**GET** `/users?limit=50&offset=0`

```json
{
  "success": true,
  "data": {
    "users": [...],
    "total": 1000,
    "limit": 50,
    "offset": 0
  }
}
```

#### 4. Get Single User

**GET** `/users/{userId}`

```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "...",
    "full_name": "...",
    "wallets": [...],
    "transactions": [...]
  }
}
```

#### 5. Update User

**PUT** `/users/{userId}`

Body:
```json
{
  "full_name": "New Name",
  "kyc_status": "verified"
}
```

Response:
```json
{
  "success": true,
  "data": {...},
  "message": "User updated successfully"
}
```

**Auto-logged** dans audit_logs.

#### 6. Suspend User

**DELETE** `/users/{userId}`

```json
{
  "success": true,
  "data": {...},
  "message": "User suspended"
}
```

#### 7. List Transactions

**GET** `/transactions?limit=50&offset=0&status=pending`

```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "total": 500
  }
}
```

#### 8. Update Transaction

**PUT** `/transactions/{txId}`

Body:
```json
{
  "status": "completed"
}
```

#### 9. Get Settings

**GET** `/settings`

```json
{
  "success": true,
  "data": [
    {
      "setting_key": "platform.name",
      "setting_value": "Alliance Web3 Africa",
      "category": "general",
      "is_public": true
    },
    ...
  ]
}
```

#### 10. Update Setting

**PUT** `/settings`

Body:
```json
{
  "setting_key": "fees.withdrawal",
  "setting_value": 1.5
}
```

#### 11. Audit Logs

**GET** `/audit-logs?limit=100&offset=0`

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "action": "update_user",
        "module": "users",
        "entity_id": "...",
        "admin_users": {
          "users": {
            "full_name": "Admin Name"
          }
        },
        "created_at": "..."
      }
    ],
    "total": 1500
  }
}
```

---

## 🎨 INTERFACE ADMIN

### Route

```
/admin
```

### Accès

**Vérifie automatiquement:**
1. User connecté
2. User est admin
3. Redirige vers dashboard si non-admin

### Sections

#### 1. **Dashboard**
- Stats plateforme
- Nouveaux utilisateurs
- Transactions récentes
- عLK3 circulation
- Actions rapides
- Activité récente

#### 2. **Utilisateurs** (À venir)
- Liste utilisateurs
- Recherche/Filtres
- Modifier utilisateur
- Suspendre/Activer
- Voir détails complets

#### 3. **Transactions** (À venir)
- Liste transactions
- Filtrer par statut
- Modifier statut
- Annuler/Rembourser
- Export

#### 4. **Paramètres** (À venir)
- Configuration générale
- Paramètres KYC
- Limites transactions
- Frais
- Mode maintenance

#### 5. **Audit Logs** (À venir)
- Historique complet
- Filtres par admin/module/action
- Export logs
- Recherche

---

## 👥 GESTION DES ADMINS

### Créer un Admin

**SQL direct (Supabase SQL Editor):**

```sql
-- 1. Trouver l'user_id
SELECT id, email FROM users WHERE email = 'admin@example.com';

-- 2. Trouver le role_id (ex: admin)
SELECT id, role_name FROM admin_roles WHERE role_name = 'admin';

-- 3. Créer l'admin
INSERT INTO admin_users (user_id, role_id, is_active)
VALUES (
  '<user_id>',
  '<role_id>',
  true
);
```

**Exemple complet:**

```sql
-- Promouvoir user en Super Admin
WITH
  target_user AS (
    SELECT id FROM users WHERE email = 'admin@allianceweb3.africa' LIMIT 1
  ),
  super_role AS (
    SELECT id FROM admin_roles WHERE role_name = 'super_admin' LIMIT 1
  )
INSERT INTO admin_users (user_id, role_id, is_active)
SELECT target_user.id, super_role.id, true
FROM target_user, super_role
ON CONFLICT (user_id) DO UPDATE
  SET role_id = EXCLUDED.role_id,
      is_active = true;
```

### Vérifier Admins

```sql
SELECT
  u.email,
  u.full_name,
  ar.display_name as role,
  ar.level,
  au.is_active,
  au.last_login
FROM admin_users au
JOIN users u ON au.user_id = u.id
JOIN admin_roles ar ON au.role_id = ar.id
ORDER BY ar.level DESC;
```

### Révoquer Admin

```sql
UPDATE admin_users
SET is_active = false
WHERE user_id = '<user_id>';
```

---

## 🧪 TESTER LE SYSTÈME

### 1. Créer Premier Admin

```sql
-- Dans Supabase SQL Editor
INSERT INTO admin_users (user_id, role_id, is_active)
SELECT
  (SELECT id FROM users LIMIT 1),
  (SELECT id FROM admin_roles WHERE role_name = 'super_admin'),
  true;
```

### 2. Accéder Interface

```
1. Login avec compte admin
2. Naviguer vers /admin
3. ✅ Dashboard admin s'affiche
```

### 3. Tester Backend

```bash
# Get token from Supabase auth
TOKEN="<your_supabase_token>"

# Test health
curl https://...supabase.co/functions/v1/admin-backend/health \
  -H "Authorization: Bearer $TOKEN"

# Test stats
curl https://...supabase.co/functions/v1/admin-backend/stats \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 PERMISSIONS PAR RÔLE

### Super Admin (100)
```json
{
  "all": true
}
```
**Accès:** Tout

### Admin (80)
```json
{
  "users": ["read", "create", "update", "delete"],
  "transactions": ["read", "update", "cancel"],
  "wallets": ["read", "adjust"],
  "kyc": ["read", "approve", "reject"],
  "nft": ["read", "create", "update", "delete"],
  "defi": ["read", "manage"],
  "settings": ["read", "update"],
  "reports": ["read", "export"]
}
```

### Moderator (50)
```json
{
  "users": ["read", "update", "suspend"],
  "transactions": ["read"],
  "kyc": ["read", "review"],
  "nft": ["read", "update"],
  "reports": ["read"]
}
```

### Support (30)
```json
{
  "users": ["read"],
  "transactions": ["read"],
  "wallets": ["read"],
  "tickets": ["read", "create", "update"]
}
```

### Analyst (20)
```json
{
  "users": ["read"],
  "transactions": ["read"],
  "wallets": ["read"],
  "analytics": ["read"],
  "reports": ["read", "export"]
}
```

---

## 🔧 CONFIGURATION

### Settings Disponibles

```sql
-- General
platform.name
platform.maintenance_mode
platform.signup_enabled

-- KYC
kyc.auto_approve
kyc.required_level

-- Transactions
transactions.min_withdrawal
transactions.max_withdrawal
transactions.daily_limit

-- Fees
fees.deposit (%)
fees.withdrawal (%)
fees.swap (%)
fees.p2p (%)

-- Redistribution
redistribution.enabled
redistribution.frequency

-- Notifications
notifications.email_enabled
notifications.sms_enabled
```

### Modifier un Setting

```sql
UPDATE admin_settings
SET setting_value = '2'
WHERE setting_key = 'kyc.required_level';
```

---

## 📝 AUDIT LOGS

### Actions Loggées

**Automatiquement:**
- update_user
- suspend_user
- update_transaction
- update_setting
- approve_kyc
- reject_kyc
- adjust_wallet

**Format:**
```json
{
  "admin_user_id": "...",
  "action": "update_user",
  "module": "users",
  "entity_type": "user",
  "entity_id": "...",
  "old_values": {...},
  "new_values": {...},
  "status": "success",
  "created_at": "..."
}
```

### Consulter Logs

```sql
SELECT
  al.*,
  u.full_name as admin_name,
  u.email as admin_email
FROM admin_audit_logs al
JOIN admin_users au ON al.admin_user_id = au.id
JOIN users u ON au.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 100;
```

---

## 🚀 DÉPLOIEMENT

### Backend Edge Function

**Via Supabase Dashboard:**
```
1. Aller sur Edge Functions
2. Deploy new function
3. Nom: admin-backend
4. Copier: supabase/functions/admin-backend/index.ts
5. Deploy
✅ Backend live
```

### Frontend

**Déjà inclus:**
```
✅ /admin route configurée
✅ Admin.tsx créé
✅ Routes ajoutées
✅ Build inclut admin
```

---

## ✅ CHECKLIST

### Backend
```
✅ Migration admin_system appliquée
✅ 5 rôles créés par défaut
✅ Permissions définies
✅ Settings initialisés
✅ RLS activé partout
✅ Functions créées
✅ Edge Function admin-backend créée
```

### Frontend
```
✅ Page /admin créée
✅ Route configurée
✅ Auth verification
✅ Dashboard stats
✅ Tabs structure
```

### Sécurité
```
✅ Token verification
✅ Admin role check
✅ Permission system
✅ Audit logging
✅ RLS policies
```

---

## 🎯 PROCHAINES ÉTAPES

### Compléter Interface Admin

**Sections à développer:**
1. **Users Management** - CRUD complet
2. **Transactions** - Gestion/Monitoring
3. **Settings** - Interface config
4. **Audit Logs** - Visualisation logs
5. **Analytics** - Graphiques avancés

### Features Avancées

```
- Export données CSV/Excel
- Notifications admin real-time
- Dashboard customizable
- Rapports automatiques
- API keys management
- Two-factor auth admin
- IP whitelist
```

---

## 📞 SUPPORT

**Pour créer un admin:**
```sql
-- Dans Supabase SQL Editor
INSERT INTO admin_users (user_id, role_id, is_active)
VALUES ('<user_id>', '<role_id>', true);
```

**Vérifier accès:**
```
1. Login
2. Go to /admin
3. Check dashboard loads
```

---

**🎉 SYSTÈME ADMIN OPÉRATIONNEL! 🎉**

**Backend:** ✅ Unifié Supabase
**Interface:** ✅ /admin route
**Sécurité:** ✅ RLS + Permissions
**Audit:** ✅ Logs automatiques

*Admin System v1.0 - 2025-11-19*
