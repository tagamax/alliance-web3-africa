# 🚀 QUICK START - DÉPLOIEMENT HOSTINGER (5 MINUTES)

## ⚡ DÉPLOIEMENT ULTRA-RAPIDE

### 🎯 Méthode A: Script Automatique (RECOMMANDÉ)

```bash
# 1. Ouvrir terminal dans le dossier du projet

# 2. Lancer le script
./deploy-hostinger.sh

# 3. Entrer vos credentials FTP quand demandé
#    (trouvez-les sur Hostinger Panel → File Manager → FTP)

# 4. Attendre 2-3 minutes
# ✅ FAIT! Votre site est LIVE!
```

---

### 🎯 Méthode B: Manuel (10 MINUTES)

#### Étape 1: Build (2 min)

```bash
# Dans le terminal
npm install
npm run build
```

#### Étape 2: Login Hostinger (1 min)

```
1. Aller sur: https://hpanel.hostinger.com
2. Se connecter
3. Sélectionner votre hébergement
```

#### Étape 3: Upload (5 min)

```
1. Cliquer "File Manager"
2. Naviguer vers "public_html/"
3. Supprimer tous les fichiers existants
4. Cliquer "Upload Files"
5. Sélectionner TOUT dans le dossier 'dist/'
6. Attendre fin upload
```

#### Étape 4: .htaccess (1 min)

```
1. Dans public_html/, cliquer "New File"
2. Nommer: .htaccess
3. Copier le contenu de 'htaccess-hostinger.txt'
4. Coller et Sauvegarder
```

#### Étape 5: SSL (1 min)

```
1. Retour au Panel principal
2. Cliquer "SSL"
3. Activer SSL gratuit pour votre domaine
4. Attendre 5-10 min
```

**✅ TERMINÉ! Votre site est sur:**
```
https://votre-domaine.com
```

---

## 🔍 VÉRIFICATION RAPIDE

### Tester votre déploiement:

```
✅ Ouvrir: https://votre-domaine.com
✅ Login/Signup fonctionne
✅ Navigation /dashboard, /nft, etc.
✅ Images chargent
✅ HTTPS actif (cadenas vert)
✅ Console Chrome (F12) sans erreurs
```

---

## 🐛 PROBLÈMES COURANTS

### 1. Page blanche

**Cause:** index.html pas à la racine

**Solution:**
```
Vérifier que dans public_html/ il y a:
- index.html (à la racine)
- assets/ (dossier)
- logo-*.png (fichiers)
```

### 2. Routes 404

**Cause:** .htaccess manquant ou incorrect

**Solution:**
```
1. Vérifier .htaccess existe dans public_html/
2. Vérifier qu'il contient RewriteEngine On
3. Recopier depuis htaccess-hostinger.txt
```

### 3. Erreur Supabase

**Cause:** Variables d'environnement pas dans le build

**Solution:**
```bash
# Créer .env localement
echo "VITE_SUPABASE_URL=https://zmfjlqmtfguvnmuzoztf.supabase.co" > .env
echo "VITE_SUPABASE_ANON_KEY=eyJhbGc..." >> .env

# Rebuild
npm run build

# Re-upload
```

### 4. Images manquantes

**Cause:** Fichiers pas tous uploadés

**Solution:**
```
Vérifier dans public_html/:
✅ logo-72.png
✅ logo-96.png
✅ logo-128.png
✅ logo-144.png
✅ logo-152.png
✅ logo-192.png
✅ logo-384.png
✅ logo-512.png
```

---

## 📞 BESOIN D'AIDE?

### Documentation complète:
```
📄 HOSTINGER_DEPLOYMENT.md - Guide détaillé
🔧 deploy-hostinger.sh      - Script automatique
⚙️  htaccess-hostinger.txt  - Config Apache
```

### Support Hostinger:
```
🌐 https://www.hostinger.com/contact
💬 Live Chat 24/7
📧 Ticket support
```

---

## 🎉 DÉMO INVESTISSEURS

### Une fois déployé:

1. **Créer 3 comptes test**
   ```
   demo1@allianceweb3.com
   demo2@allianceweb3.com
   investor@allianceweb3.com
   ```

2. **Tester tous les flows**
   - Login/Signup
   - Dépôt avec QR code
   - NFT Mine Game
   - Navigation complète

3. **Préparer la démo**
   - Script 15 min (voir DEPLOYMENT_GUIDE.md)
   - Screenshots backup
   - Stats dashboard

4. **🚀 PRÉSENTER!**

---

## ⚡ COMMANDES UTILES

```bash
# Build production
npm run build

# Deploy automatique
./deploy-hostinger.sh

# Test local avant deploy
npm run preview

# Vérifier TypeScript
npm run typecheck
```

---

## 📊 CHECKLIST FINALE

```
✅ Build réussi (npm run build)
✅ Fichiers uploadés sur Hostinger
✅ .htaccess configuré
✅ SSL activé (HTTPS)
✅ Site accessible
✅ Login fonctionne
✅ Routes fonctionnent
✅ Images chargent
✅ Console sans erreurs
✅ Mobile testé
✅ Comptes démo créés
✅ Prêt pour investisseurs!
```

---

**🎉 VOTRE APP EST LIVE EN 5 MINUTES! 🎉**

**Support:** Pour toute question, consulter HOSTINGER_DEPLOYMENT.md

*Quick Start créé le: 2025-11-19*
