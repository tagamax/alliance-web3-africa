#!/bin/bash

# 🚀 Script de Déploiement Rapide - Alliance Web3 Africa
# Ce script automatise le déploiement sur Vercel

echo "🚀 Démarrage du déploiement Alliance Web3 Africa..."
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Vérifier Node.js
echo "${BLUE}[1/6]${NC} Vérification Node.js..."
if ! command -v node &> /dev/null; then
    echo "${RED}❌ Node.js non trouvé. Installez Node.js >= 18${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "${GREEN}✅ Node.js $NODE_VERSION${NC}"
echo ""

# 2. Installer dépendances
echo "${BLUE}[2/6]${NC} Installation des dépendances..."
npm install
if [ $? -ne 0 ]; then
    echo "${RED}❌ Erreur lors de l'installation${NC}"
    exit 1
fi
echo "${GREEN}✅ Dépendances installées${NC}"
echo ""

# 3. Vérifier TypeScript
echo "${BLUE}[3/6]${NC} Vérification TypeScript..."
npm run typecheck
if [ $? -ne 0 ]; then
    echo "${RED}❌ Erreurs TypeScript détectées${NC}"
    exit 1
fi
echo "${GREEN}✅ TypeScript OK${NC}"
echo ""

# 4. Build production
echo "${BLUE}[4/6]${NC} Build production..."
npm run build
if [ $? -ne 0 ]; then
    echo "${RED}❌ Erreur lors du build${NC}"
    exit 1
fi
echo "${GREEN}✅ Build réussi${NC}"
echo ""

# 5. Vérifier Vercel CLI
echo "${BLUE}[5/6]${NC} Vérification Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo "${BLUE}Installation de Vercel CLI...${NC}"
    npm install -g vercel
fi
echo "${GREEN}✅ Vercel CLI prêt${NC}"
echo ""

# 6. Déployer
echo "${BLUE}[6/6]${NC} Déploiement sur Vercel..."
echo ""
echo "${BLUE}Configuration requise:${NC}"
echo "  • Project Name: alliance-web3-africa"
echo "  • Framework: Vite"
echo "  • Build Command: npm run build"
echo "  • Output Directory: dist"
echo ""
echo "${BLUE}Variables d'environnement à configurer:${NC}"
echo "  • VITE_SUPABASE_URL"
echo "  • VITE_SUPABASE_ANON_KEY"
echo ""

vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "${GREEN}✅ ✅ ✅ DÉPLOIEMENT RÉUSSI! ✅ ✅ ✅${NC}"
    echo ""
    echo "${BLUE}Prochaines étapes:${NC}"
    echo "  1. Configurer les variables d'environnement sur Vercel Dashboard"
    echo "  2. Tester l'URL générée"
    echo "  3. Créer des comptes test"
    echo "  4. Préparer la démo investisseurs"
    echo ""
    echo "${GREEN}🎉 Votre application est LIVE! 🎉${NC}"
else
    echo ""
    echo "${RED}❌ Erreur lors du déploiement${NC}"
    echo "Vérifiez les logs ci-dessus pour plus de détails"
    exit 1
fi
