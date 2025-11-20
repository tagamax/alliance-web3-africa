#!/bin/bash

# 🚀 Script de Déploiement Automatique - Hostinger
# Alliance Web3 Africa

echo "═══════════════════════════════════════════════════"
echo "  🚀 DÉPLOIEMENT HOSTINGER - Alliance Web3 Africa"
echo "═══════════════════════════════════════════════════"
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
FTP_HOST=""
FTP_USER=""
FTP_PASS=""
REMOTE_DIR="public_html"

# Fonction pour demander les credentials
ask_credentials() {
    echo "${YELLOW}📝 Configuration FTP nécessaire${NC}"
    echo ""
    echo "Vous pouvez trouver ces informations dans:"
    echo "Hostinger Panel → File Manager → FTP Accounts"
    echo ""

    read -p "Host FTP (ex: ftp.votredomaine.com): " FTP_HOST
    read -p "Username FTP: " FTP_USER
    read -s -p "Password FTP: " FTP_PASS
    echo ""
    echo ""

    # Sauvegarder pour usage futur (optionnel)
    read -p "Sauvegarder ces credentials? (y/n): " SAVE
    if [ "$SAVE" = "y" ]; then
        echo "FTP_HOST=$FTP_HOST" > .ftp-config
        echo "FTP_USER=$FTP_USER" >> .ftp-config
        echo "FTP_PASS=$FTP_PASS" >> .ftp-config
        chmod 600 .ftp-config
        echo "${GREEN}✅ Credentials sauvegardés dans .ftp-config${NC}"
    fi
}

# Charger credentials si fichier existe
if [ -f ".ftp-config" ]; then
    source .ftp-config
    echo "${GREEN}✅ Credentials chargés depuis .ftp-config${NC}"
    echo ""
else
    ask_credentials
fi

# Vérifier que les credentials sont définis
if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASS" ]; then
    echo "${RED}❌ Erreur: Credentials FTP manquants${NC}"
    exit 1
fi

# 1. Vérifier Node.js
echo "${BLUE}[1/7]${NC} Vérification Node.js..."
if ! command -v node &> /dev/null; then
    echo "${RED}❌ Node.js non trouvé${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "${GREEN}✅ Node.js $NODE_VERSION${NC}"
echo ""

# 2. Vérifier .env
echo "${BLUE}[2/7]${NC} Vérification variables d'environnement..."
if [ ! -f ".env" ]; then
    echo "${YELLOW}⚠️  Fichier .env manquant${NC}"
    echo "Création du fichier .env..."
    cat > .env << 'EOF'
VITE_SUPABASE_URL=https://zmfjlqmtfguvnmuzoztf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZmpscW10Zmd1dm5tdXpvenRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTU4MDUsImV4cCI6MjA3OTA5MTgwNX0.E-Ik83Yk_cBR8c7_3IcY4jZUjHo4Lh89wuGEM9dt6Hw
EOF
    echo "${GREEN}✅ .env créé${NC}"
fi
echo "${GREEN}✅ Variables OK${NC}"
echo ""

# 3. Installer dépendances
echo "${BLUE}[3/7]${NC} Installation des dépendances..."
npm install --silent
if [ $? -ne 0 ]; then
    echo "${RED}❌ Erreur lors de l'installation${NC}"
    exit 1
fi
echo "${GREEN}✅ Dépendances installées${NC}"
echo ""

# 4. Build production
echo "${BLUE}[4/7]${NC} Build production..."
npm run build
if [ $? -ne 0 ]; then
    echo "${RED}❌ Erreur lors du build${NC}"
    exit 1
fi
echo "${GREEN}✅ Build réussi${NC}"
echo ""

# 5. Créer .htaccess dans dist/
echo "${BLUE}[5/7]${NC} Création du fichier .htaccess..."
cat > dist/.htaccess << 'HTACCESS_EOF'
# Alliance Web3 Africa - SPA Configuration

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # HTTPS Redirect
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Handle React Router
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-l
    RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_headers.c>
    Header set X-XSS-Protection "1; mode=block"
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "DENY"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

<FilesMatch "sw\.js$">
    <IfModule mod_headers.c>
        Header set Cache-Control "public, max-age=0, must-revalidate"
        Header set Service-Worker-Allowed "/"
    </IfModule>
</FilesMatch>

<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>

Options -Indexes

<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>
HTACCESS_EOF

echo "${GREEN}✅ .htaccess créé${NC}"
echo ""

# 6. Vérifier lftp
echo "${BLUE}[6/7]${NC} Préparation upload FTP..."
if ! command -v lftp &> /dev/null; then
    echo "${YELLOW}⚠️  lftp non trouvé${NC}"
    echo ""
    echo "Options:"
    echo "1. Installer manuellement les fichiers via Hostinger File Manager"
    echo "2. Utiliser un client FTP (FileZilla)"
    echo "3. Installer lftp:"
    echo "   - Ubuntu/Debian: sudo apt-get install lftp"
    echo "   - macOS: brew install lftp"
    echo ""
    echo "${BLUE}Fichiers prêts dans le dossier 'dist/'${NC}"
    echo ""
    echo "Instructions upload manuel:"
    echo "1. Aller sur Hostinger Panel → File Manager"
    echo "2. Naviguer vers public_html/"
    echo "3. Supprimer tous les anciens fichiers"
    echo "4. Uploader tout le contenu de 'dist/'"
    echo ""
    exit 0
fi

# 7. Upload via FTP
echo "${BLUE}[7/7]${NC} Upload des fichiers vers Hostinger..."
echo ""
echo "Host: $FTP_HOST"
echo "User: $FTP_USER"
echo "Dir:  $REMOTE_DIR"
echo ""

lftp -c "
set ftp:ssl-allow no;
set net:timeout 10;
set net:max-retries 2;
set net:reconnect-interval-base 5;
open -u $FTP_USER,$FTP_PASS $FTP_HOST;
lcd dist;
cd $REMOTE_DIR;
mirror --reverse --delete --verbose --exclude-glob .git* --exclude-glob .DS_Store;
bye
"

if [ $? -eq 0 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════"
    echo "${GREEN}  ✅ ✅ ✅ DÉPLOIEMENT RÉUSSI! ✅ ✅ ✅${NC}"
    echo "═══════════════════════════════════════════════════"
    echo ""
    echo "${GREEN}🎉 Votre application est maintenant LIVE sur Hostinger!${NC}"
    echo ""
    echo "${BLUE}Prochaines étapes:${NC}"
    echo "  1. Tester votre site: https://$FTP_HOST"
    echo "  2. Vérifier SSL (HTTPS actif)"
    echo "  3. Créer des comptes test"
    echo "  4. Préparer la démo investisseurs"
    echo ""
    echo "${YELLOW}Important:${NC}"
    echo "  - Vider le cache navigateur (Ctrl+Shift+R)"
    echo "  - Tester sur mobile"
    echo "  - Vérifier console Chrome (F12)"
    echo ""
else
    echo ""
    echo "${RED}❌ Erreur lors de l'upload FTP${NC}"
    echo ""
    echo "Solutions:"
    echo "1. Vérifier les credentials FTP"
    echo "2. Vérifier la connexion internet"
    echo "3. Upload manuel via File Manager:"
    echo "   https://hpanel.hostinger.com"
    echo ""
    exit 1
fi
