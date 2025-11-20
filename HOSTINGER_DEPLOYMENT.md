# 🚀 GUIDE DÉPLOIEMENT HOSTINGER - ALLIANCE WEB3 AFRICA

## 📋 PRÉREQUIS

### Ce dont vous avez besoin:
```
✅ Compte Hostinger (Business Web Hosting minimum)
✅ Nom de domaine (ex: allianceweb3.africa)
✅ Accès FTP/SSH à votre hébergement
✅ Node.js installé localement
```

---

## 🎯 MÉTHODE 1: DÉPLOIEMENT VIA HOSTINGER PANEL (RECOMMANDÉ)

### Étape 1: Préparer le Build Local

```bash
# Dans le dossier du projet
cd /votre/chemin/projet

# Installer les dépendances
npm install

# Build production
npm run build

# Le dossier 'dist' contient votre app prête
```

### Étape 2: Accéder à Hostinger

1. **Aller sur:** https://hpanel.hostinger.com
2. **Se connecter** avec vos identifiants
3. **Sélectionner** votre hébergement Web

### Étape 3: Préparer le Domaine

**Si vous avez un domaine:**

1. Panel Hostinger → **Domaines**
2. Cliquer sur votre domaine (ex: allianceweb3.africa)
3. Vérifier que les DNS pointent vers Hostinger
4. Attendre propagation DNS (max 24h, souvent 1-2h)

**Si pas de domaine:**

Vous pouvez utiliser le domaine temporaire Hostinger:
```
http://votre-site.hostingersite.com
```

### Étape 4: Accès au File Manager

1. **Hostinger Panel** → **File Manager**
2. Naviguer vers: `public_html/`
3. **Supprimer** tous les fichiers par défaut (index.html, etc.)

### Étape 5: Upload des Fichiers

**Option A: Via File Manager (Interface Web)**

1. Dans `public_html/`, cliquer **Upload Files**
2. Sélectionner TOUT le contenu du dossier `dist/`:
   ```
   dist/
   ├── index.html
   ├── assets/
   ├── logo-*.png
   ├── manifest.json
   ├── sw.js
   └── workbox-*.js
   ```
3. Attendre la fin de l'upload (2-5 min selon connexion)
4. ✅ Fichiers uploadés!

**Option B: Via FTP (Plus Rapide)**

```bash
# Utiliser FileZilla ou autre client FTP
Host: ftp.votredomaine.com
Username: [Voir Hostinger Panel]
Password: [Voir Hostinger Panel]
Port: 21

# Uploader le contenu de 'dist/' vers 'public_html/'
```

### Étape 6: Configuration .htaccess (CRUCIAL)

**Créer un fichier `.htaccess` dans `public_html/`:**

1. File Manager → **New File** → `.htaccess`
2. **Éditer** et coller ce contenu:

```apache
# Alliance Web3 Africa - SPA Configuration

# Enable Rewrite Engine
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # HTTPS Redirect (Force SSL)
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Handle React Router (SPA)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-l
    RewriteRule . /index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
    # XSS Protection
    Header set X-XSS-Protection "1; mode=block"

    # Prevent MIME sniffing
    Header set X-Content-Type-Options "nosniff"

    # Clickjacking protection
    Header set X-Frame-Options "DENY"

    # Referrer Policy
    Header set Referrer-Policy "strict-origin-when-cross-origin"

    # Content Security Policy
    Header set Content-Security-Policy "default-src 'self' https://zmfjlqmtfguvnmuzoztf.supabase.co; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
</IfModule>

# Service Worker Headers
<FilesMatch "sw\.js$">
    <IfModule mod_headers.c>
        Header set Cache-Control "public, max-age=0, must-revalidate"
        Header set Service-Worker-Allowed "/"
    </IfModule>
</FilesMatch>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
    ExpiresActive On

    # Images
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"

    # CSS and JavaScript
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"

    # HTML
    ExpiresByType text/html "access plus 0 seconds"

    # Web fonts
    ExpiresByType font/woff2 "access plus 1 year"

    # JSON
    ExpiresByType application/json "access plus 0 seconds"
</IfModule>

# Disable directory browsing
Options -Indexes

# Protect .htaccess and .env
<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>
```

3. **Sauvegarder** le fichier

### Étape 7: Variables d'Environnement

**IMPORTANT:** Les variables d'environnement doivent être dans le build!

**Option A: Build avec les variables (RECOMMANDÉ)**

```bash
# Sur votre machine locale, créer .env
echo "VITE_SUPABASE_URL=https://zmfjlqmtfguvnmuzoztf.supabase.co" > .env
echo "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZmpscW10Zmd1dm5tdXpvenRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTU4MDUsImV4cCI6MjA3OTA5MTgwNX0.E-Ik83Yk_cBR8c7_3IcY4jZUjHo4Lh89wuGEM9dt6Hw" >> .env

# Rebuild avec les variables
npm run build

# Re-uploader le nouveau build
```

**Option B: Hardcoder temporairement (Pas recommandé production)**

Dans `src/lib/supabase.ts`, remplacer:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

Par:
```typescript
const supabaseUrl = 'https://zmfjlqmtfguvnmuzoztf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

Puis rebuild et upload.

### Étape 8: Configurer SSL (HTTPS)

1. **Hostinger Panel** → **SSL**
2. Sélectionner votre domaine
3. **Activer SSL gratuit** (Let's Encrypt)
4. Attendre 5-10 minutes pour activation
5. ✅ HTTPS activé!

### Étape 9: Tester le Déploiement

1. Ouvrir: `https://votre-domaine.com`
2. **Vérifier:**
   ```
   ✅ Page charge correctement
   ✅ Navigation fonctionne (/dashboard, /nft, etc.)
   ✅ HTTPS actif (cadenas vert)
   ✅ Logo et images chargent
   ✅ Console Chrome sans erreurs
   ```

---

## 🎯 MÉTHODE 2: DÉPLOIEMENT VIA FTP/SFTP

### Utiliser FileZilla

**Télécharger FileZilla:**
```
https://filezilla-project.org/
```

**Configuration:**
```
Protocole: SFTP (plus sécurisé) ou FTP
Host: votredomaine.com ou IP serveur
Username: [Hostinger Panel → FTP Accounts]
Password: [Votre mot de passe FTP]
Port: 22 (SFTP) ou 21 (FTP)
```

**Upload:**
1. **Connecter** à votre serveur
2. **Naviguer** vers `/public_html/`
3. **Drag & Drop** tout le contenu de `dist/`
4. Attendre fin transfert
5. ✅ Fait!

---

## 🎯 MÉTHODE 3: DÉPLOIEMENT VIA SSH (AVANCÉ)

### Prérequis:
```
✅ Hostinger Business/Cloud plan (SSH access)
✅ Terminal/PuTTY
```

### Connexion SSH:

```bash
# Obtenir les credentials SSH depuis Hostinger Panel
# Section: Advanced → SSH Access

# Se connecter
ssh username@votredomaine.com
# Ou
ssh username@123.456.789.0

# Entrer le mot de passe
```

### Déploiement:

```bash
# Une fois connecté via SSH

# Naviguer vers public_html
cd public_html/

# Supprimer anciens fichiers (si existants)
rm -rf *

# Option 1: Upload via SCP depuis votre machine
# (Sur votre machine locale, dans un autre terminal)
scp -r dist/* username@votredomaine.com:public_html/

# Option 2: Clone repo et build sur serveur (si Node.js dispo)
# Note: Hostinger shared hosting n'a pas Node.js
# Utilisez plutôt l'option build local + upload
```

---

## 🔧 CONFIGURATION AVANCÉE

### Optimisation Performance

**Activer Gzip dans .htaccess:**

```apache
# Déjà inclus dans le .htaccess ci-dessus
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>
```

**Browser Caching:**

```apache
# Déjà inclus dans le .htaccess ci-dessus
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
</IfModule>
```

### Redirection WWW → Non-WWW (ou inverse)

**Non-WWW vers WWW:**
```apache
# Ajouter dans .htaccess
RewriteCond %{HTTP_HOST} !^www\.
RewriteRule ^(.*)$ https://www.%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

**WWW vers Non-WWW:**
```apache
# Ajouter dans .htaccess
RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [R=301,L]
```

---

## 📧 CONFIGURATION EMAIL (OPTIONNEL)

### Pour notifications email via votre domaine:

1. **Hostinger Panel** → **Email Accounts**
2. **Créer** email: `noreply@votredomaine.com`
3. Noter les paramètres SMTP:
   ```
   SMTP Host: smtp.hostinger.com
   SMTP Port: 587 (TLS) ou 465 (SSL)
   Username: noreply@votredomaine.com
   Password: [votre mot de passe]
   ```

4. **Configurer dans Edge Function** `send-notification`:
   ```typescript
   // Variables d'env Supabase
   SMTP_HOST=smtp.hostinger.com
   SMTP_PORT=587
   SMTP_USER=noreply@votredomaine.com
   SMTP_PASS=votre_mot_de_passe
   ```

---

## 🐛 TROUBLESHOOTING

### Problème: Page blanche

**Solution:**
```bash
# Vérifier que index.html est bien à la racine de public_html/
# Vérifier console Chrome (F12) pour erreurs JavaScript
# Vérifier que les chemins des assets sont corrects
```

### Problème: Routes 404 (ex: /dashboard → 404)

**Solution:**
```apache
# Vérifier que .htaccess existe et contient:
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Problème: Erreur Supabase "Failed to fetch"

**Solution:**
```bash
# Vérifier que les variables d'env sont dans le build
# Vérifier en console:
console.log(import.meta.env.VITE_SUPABASE_URL)

# Si undefined, rebuild avec .env correctement configuré
```

### Problème: Service Worker ne se charge pas

**Solution:**
```apache
# Vérifier .htaccess contient:
<FilesMatch "sw\.js$">
    Header set Cache-Control "public, max-age=0"
    Header set Service-Worker-Allowed "/"
</FilesMatch>
```

### Problème: Images ne chargent pas

**Solution:**
```bash
# Vérifier que toutes les images sont uploadées
# Vérifier les chemins (sensible à la casse sur Linux)
# public_html/logo-192.png (pas Logo-192.png)
```

---

## 📊 VÉRIFICATION POST-DÉPLOIEMENT

### Checklist:

```
✅ Site accessible via https://votredomaine.com
✅ Toutes les pages chargent (/dashboard, /nft, etc.)
✅ HTTPS actif (cadenas vert)
✅ Images et logos visibles
✅ Connexion Supabase OK
✅ Login/Signup fonctionnel
✅ Navigation entre pages fluide
✅ Console Chrome sans erreurs critiques
✅ Mobile responsive
✅ PWA installable (tester sur mobile)
```

### Test Performance:

**Google PageSpeed Insights:**
```
https://pagespeed.web.dev/
```

**Cible:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 80

---

## 🔄 MISE À JOUR (REDÉPLOIEMENT)

### Quand vous modifiez le code:

```bash
# 1. Développer les nouvelles features localement
# 2. Tester en local
npm run dev

# 3. Build production
npm run build

# 4. Upload le nouveau dist/ sur Hostinger
# Via File Manager ou FTP

# 5. Vider le cache navigateur pour tester
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

**Script automatique de redéploiement:**

```bash
#!/bin/bash
# save as: redeploy-hostinger.sh

echo "🔄 Redéploiement Alliance Web3 Africa..."

# Build
npm run build

# Upload via FTP (nécessite lftp)
lftp -e "
    set ssl:verify-certificate no;
    open ftp://votresite.com;
    user username password;
    mirror -R dist/ public_html/ --delete;
    bye
"

echo "✅ Redéploiement terminé!"
```

---

## 💾 BACKUP

### Sauvegarder régulièrement:

**Via Hostinger Panel:**
1. **Backups** → **Create Backup**
2. Télécharger backup localement

**Via FTP:**
```bash
# Télécharger tout public_html/ sur votre machine
```

---

## 📈 MONITORING & ANALYTICS

### Google Analytics (Optionnel):

1. Créer compte GA4
2. Obtenir tracking ID
3. Ajouter dans `index.html` (dans build):

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Hostinger Analytics:

- Disponible dans Panel → **Analytics**
- Voir visiteurs, pages vues, etc.

---

## 🚀 OPTIMISATION PRODUCTION

### CDN Cloudflare (Gratuit):

1. Créer compte: https://cloudflare.com
2. Ajouter votre domaine
3. Modifier DNS chez registrar → Cloudflare nameservers
4. Activer:
   - ✅ Cache automatique
   - ✅ Minification JS/CSS
   - ✅ Brotli compression
   - ✅ DDoS protection

---

## 📞 SUPPORT HOSTINGER

**Si problème:**
- Live Chat: https://www.hostinger.com/contact
- Base de connaissances: https://support.hostinger.com
- Ticket support (24/7)

---

## 🎉 RÉSUMÉ DÉPLOIEMENT RAPIDE

### En 5 étapes:

```bash
# 1. Build local
npm run build

# 2. Login Hostinger Panel
https://hpanel.hostinger.com

# 3. Upload dist/ vers public_html/
Via File Manager ou FTP

# 4. Créer .htaccess
Copier le contenu fourni ci-dessus

# 5. Activer SSL
Panel → SSL → Enable

# ✅ LIVE!
https://votredomaine.com
```

---

## 📋 CHECKLIST FINALE

```
✅ Compte Hostinger créé
✅ Domaine configuré (ou sous-domaine temporaire)
✅ Build local créé (npm run build)
✅ Fichiers uploadés dans public_html/
✅ .htaccess créé et configuré
✅ SSL activé (HTTPS)
✅ Variables d'env dans le build
✅ Site testé et fonctionnel
✅ Backup créé
✅ Analytics configuré (optionnel)
```

---

## 🎯 TEMPS ESTIMÉ

```
Déploiement initial:  30-60 minutes
Redéploiement:        5-10 minutes
Configuration DNS:    1-24 heures (propagation)
Activation SSL:       5-15 minutes
```

---

## 🏆 AVANTAGES HOSTINGER

```
✅ Prix abordable (2-5€/mois)
✅ Panel simple (hPanel)
✅ SSL gratuit inclus
✅ Support 24/7
✅ Backups automatiques
✅ 99.9% uptime
✅ Serveurs rapides
```

---

**VOTRE APPLICATION EST MAINTENANT SUR HOSTINGER! 🚀**

**Prochaines étapes:**
1. ✅ Tester toutes les fonctionnalités
2. ✅ Créer comptes démo investisseurs
3. ✅ Optimiser performance (Cloudflare)
4. 🎉 **PRÉSENTER AUX INVESTISSEURS!**

---

*Guide créé le: 2025-11-19*
*Version: 1.0*
*Support: support@hostinger.com*
