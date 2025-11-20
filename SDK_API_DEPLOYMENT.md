# 🚀 SDK/API DEPLOYMENT GUIDE - Alliance Web3 Africa

## 📋 OVERVIEW

Guide complet pour déployer l'application **hors de Bolt.new** sur:
- ✅ **Serveur VPS/Cloud** (Ubuntu, DigitalOcean, AWS, etc.)
- ✅ **Mobile natif** (Android Studio, Xcode)
- ✅ **Desktop** (Electron, Tauri)
- ✅ **SDK externe** pour intégration tierce

---

## 🏗️ ARCHITECTURE DÉPLOYABLE

```
┌────────────────────────────────────────────────────┐
│          APPLICATIONS CLIENTES                      │
│                                                     │
│  🌐 Web Browser    📱 Mobile App    💻 Desktop     │
│  (React Build)    (Capacitor)      (Electron)      │
└──────────────────┬─────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────┐
│              FRONTEND BUILD (dist/)                 │
│           Hébergé sur VPS/CDN/Vercel               │
└──────────────────┬─────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────┐
│         SUPABASE (Backend as a Service)            │
│  • Edge Functions (API Logic)                      │
│  • PostgreSQL Database                             │
│  • Auth System                                     │
│  • Storage                                         │
│  • Real-time                                       │
└────────────────────────────────────────────────────┘
```

---

## 🌐 PARTIE 1: DÉPLOIEMENT WEB SUR SERVEUR

### 1.1 Prérequis Serveur

**Serveur recommandé:**
- Ubuntu 22.04 LTS
- 2 CPU cores minimum
- 2GB RAM minimum
- 20GB SSD
- Domaine configuré (ex: allianceweb3africa.org)

**Services:**
- DigitalOcean ($12/mois)
- AWS Lightsail ($5/mois)
- Vultr ($6/mois)
- OVH ($5/mois)

---

### 1.2 Setup Serveur Initial

```bash
# Connexion SSH
ssh root@your_server_ip

# Update système
apt update && apt upgrade -y

# Installer Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Installer Nginx
apt install -y nginx

# Installer Certbot (SSL)
apt install -y certbot python3-certbot-nginx

# Installer PM2 (process manager)
npm install -g pm2
```

---

### 1.3 Cloner et Build le Projet

```bash
# Créer dossier app
mkdir -p /var/www/alliance-web3
cd /var/www/alliance-web3

# Clone depuis GitHub (si repo existe)
git clone https://github.com/your-org/alliance-web3-africa.git .

# OU upload via SFTP/SCP
# scp -r dist/ root@server:/var/www/alliance-web3/

# Installer dépendances
npm install

# Build production
npm run build

# Le build est dans: dist/
```

---

### 1.4 Configuration Nginx

```bash
# Créer config Nginx
nano /etc/nginx/sites-available/alliance-web3
```

**Contenu:**

```nginx
server {
    listen 80;
    server_name allianceweb3africa.org www.allianceweb3africa.org;

    root /var/www/alliance-web3/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Activer config:**

```bash
ln -s /etc/nginx/sites-available/alliance-web3 /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

### 1.5 SSL Certificate (HTTPS)

```bash
# Installer certificat Let's Encrypt
certbot --nginx -d allianceweb3africa.org -d www.allianceweb3africa.org

# Auto-renewal
certbot renew --dry-run
```

---

### 1.6 Environment Variables

```bash
# Créer .env.production
nano /var/www/alliance-web3/.env.production
```

**Contenu:**

```env
VITE_SUPABASE_URL=https://zmfjlqmtfguvnmuzoztf.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
NODE_ENV=production
```

**Rebuild avec env:**

```bash
npm run build
```

---

### 1.7 Auto-deploy avec GitHub Actions

**.github/workflows/deploy.yml:**

```yaml
name: Deploy to Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install and Build
        run: |
          npm ci
          npm run build

      - name: Deploy to Server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          source: "dist/*"
          target: "/var/www/alliance-web3/"

      - name: Reload Nginx
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: systemctl reload nginx
```

---

## 📱 PARTIE 2: BUILD MOBILE (CAPACITOR)

### 2.1 Setup Capacitor

```bash
# Dans le projet
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# Init Capacitor
npx cap init "Alliance Web3 Africa" "com.allianceweb3.app"

# Add platforms
npx cap add android
npx cap add ios
```

---

### 2.2 Configuration Capacitor

**capacitor.config.ts:**

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.allianceweb3.app',
  appName: 'Alliance Web3 Africa',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1e293b",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
```

---

### 2.3 Build Android

```bash
# Build web first
npm run build

# Sync with Capacitor
npx cap sync android

# Open Android Studio
npx cap open android
```

**Dans Android Studio:**

1. **Configurer Keystore:**
   - Build → Generate Signed Bundle/APK
   - Create new keystore
   - Sauvegarder infos keystore!

2. **Build APK:**
   - Build → Build Bundle(s)/APK(s) → Build APK(s)
   - Fichier: `android/app/build/outputs/apk/release/app-release.apk`

3. **Build AAB (Play Store):**
   - Build → Build Bundle(s)/APK(s) → Build Bundle(s)
   - Fichier: `android/app/build/outputs/bundle/release/app-release.aab`

**Configuration build.gradle:**

```gradle
android {
    defaultConfig {
        minSdkVersion 22
        targetSdkVersion 33
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

### 2.4 Build iOS

```bash
# Build web first
npm run build

# Sync with Capacitor
npx cap sync ios

# Open Xcode
npx cap open ios
```

**Dans Xcode:**

1. **Configurer Bundle ID:**
   - `com.allianceweb3.app`

2. **Signing & Capabilities:**
   - Team: Votre Apple Developer Account
   - Signing Certificate: Distribution

3. **Build IPA:**
   - Product → Archive
   - Distribute App → App Store Connect

---

## 💻 PARTIE 3: BUILD DESKTOP (ELECTRON)

### 3.1 Setup Electron

```bash
npm install --save-dev electron electron-builder

# Create electron main file
```

**electron/main.js:**

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load production build
  win.loadFile(path.join(__dirname, '../dist/index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

**package.json (add):**

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron": "electron .",
    "electron:build": "electron-builder"
  },
  "build": {
    "appId": "com.allianceweb3.app",
    "productName": "Alliance Web3 Africa",
    "directories": {
      "output": "electron-dist"
    },
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
    "win": {
      "target": "nsis"
    },
    "mac": {
      "target": "dmg"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

**Build:**

```bash
npm run build
npm run electron:build

# Outputs:
# Windows: electron-dist/Alliance Web3 Africa Setup.exe
# Mac: electron-dist/Alliance Web3 Africa.dmg
# Linux: electron-dist/Alliance Web3 Africa.AppImage
```

---

## 🔌 PARTIE 4: SDK EXTERNE

### 4.1 Créer SDK JavaScript

**sdk/alliance-web3-sdk.js:**

```javascript
class AllianceWeb3SDK {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://zmfjlqmtfguvnmuzoztf.supabase.co';
  }

  async call(endpoint, method = 'POST', body = null) {
    const response = await fetch(`${this.baseUrl}/functions/v1/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : null,
    });

    return await response.json();
  }

  // Swap tokens
  async swap(tokenFrom, tokenTo, amount) {
    return await this.call('swap-token', 'POST', {
      token_from: tokenFrom,
      token_to: tokenTo,
      amount_from: amount,
    });
  }

  // Stake tokens
  async stake(poolId, amount, durationDays) {
    return await this.call('stake-token', 'POST', {
      pool_id: poolId,
      amount,
      duration_days: durationDays,
    });
  }

  // Create P2P offer
  async createP2POffer(offer) {
    return await this.call('p2p-create-offer', 'POST', offer);
  }

  // Get wallet balance
  async getBalance(userId) {
    return await this.call('wallet-balance', 'GET', { user_id: userId });
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AllianceWeb3SDK;
}
```

---

### 4.2 Usage SDK

**Node.js:**

```javascript
const AllianceWeb3SDK = require('./alliance-web3-sdk');

const sdk = new AllianceWeb3SDK('your_api_key');

// Swap
const result = await sdk.swap('GNF', 'عLK3', 10000);
console.log(result);

// Stake
const stake = await sdk.stake('pool-id', 1000, 30);
console.log(stake);
```

**Browser:**

```html
<script src="alliance-web3-sdk.js"></script>
<script>
  const sdk = new AllianceWeb3SDK('your_api_key');

  async function swapTokens() {
    const result = await sdk.swap('GNF', 'عLK3', 10000);
    console.log(result);
  }
</script>
```

**React:**

```typescript
import AllianceWeb3SDK from 'alliance-web3-sdk';

const sdk = new AllianceWeb3SDK(process.env.REACT_APP_API_KEY);

function SwapComponent() {
  const handleSwap = async () => {
    const result = await sdk.swap('GNF', 'عLK3', 10000);
    console.log(result);
  };

  return <button onClick={handleSwap}>Swap</button>;
}
```

---

### 4.3 SDK Package (NPM)

**package.json:**

```json
{
  "name": "alliance-web3-sdk",
  "version": "1.0.0",
  "description": "SDK for Alliance Web3 Africa API",
  "main": "index.js",
  "types": "index.d.ts",
  "scripts": {
    "build": "tsc"
  },
  "keywords": ["web3", "africa", "blockchain", "alk3"],
  "license": "MIT"
}
```

**Publish:**

```bash
npm login
npm publish
```

**Usage after publish:**

```bash
npm install alliance-web3-sdk
```

---

## 🔧 PARTIE 5: API REST DOCUMENTATION

### 5.1 Endpoints Disponibles

**Base URL:** `https://zmfjlqmtfguvnmuzoztf.supabase.co/functions/v1`

#### Swap Token

```http
POST /swap-token
Authorization: Bearer <token>
Content-Type: application/json

{
  "token_from": "GNF",
  "token_to": "عLK3",
  "amount_from": 10000
}

Response:
{
  "success": true,
  "data": {
    "transaction_id": "uuid",
    "amount_to": 1000,
    "rate": 0.1,
    "fee": 5
  }
}
```

#### Stake Token

```http
POST /stake-token
Authorization: Bearer <token>

{
  "pool_id": "uuid",
  "amount": 1000,
  "duration_days": 30
}

Response:
{
  "success": true,
  "data": {
    "stake_id": "uuid",
    "apy": 12.5,
    "end_date": "2025-12-19T00:00:00Z"
  }
}
```

#### Create P2P Offer

```http
POST /p2p-create-offer
Authorization: Bearer <token>

{
  "type": "sell",
  "token_symbol": "عLK3",
  "amount": 100,
  "price_per_unit": 10,
  "payment_method": "mobile_money"
}
```

---

### 5.2 API Testing avec Postman

**Collection Postman:**

```json
{
  "info": {
    "name": "Alliance Web3 Africa API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Swap Token",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"token_from\": \"GNF\",\n  \"token_to\": \"عLK3\",\n  \"amount_from\": 10000\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/swap-token",
          "host": ["{{baseUrl}}"],
          "path": ["swap-token"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://zmfjlqmtfguvnmuzoztf.supabase.co/functions/v1"
    },
    {
      "key": "token",
      "value": "your_token_here"
    }
  ]
}
```

---

## ✅ CHECKLIST DÉPLOIEMENT

### Web Server
```
✅ Serveur VPS configuré
✅ Node.js installé
✅ Nginx configuré
✅ SSL certificate installé
✅ Domain configuré
✅ Build déployé
✅ Environment variables configurées
✅ Auto-deploy CI/CD configuré
```

### Mobile
```
✅ Capacitor configuré
✅ Android Studio setup
✅ Xcode setup (iOS)
✅ Keystore créé et sauvegardé
✅ APK build testé
✅ AAB build pour Play Store
✅ IPA build pour App Store
```

### Desktop
```
✅ Electron configuré
✅ Build Windows testé
✅ Build Mac testé
✅ Build Linux testé
```

### SDK
```
✅ SDK JavaScript créé
✅ Documentation API complète
✅ Tests SDK effectués
✅ Package NPM publié
```

---

## 🚀 COMMANDES RAPIDES

```bash
# Web deploy
npm run build
scp -r dist/* user@server:/var/www/alliance-web3/

# Mobile Android
npm run build && npx cap sync android && npx cap open android

# Mobile iOS
npm run build && npx cap sync ios && npx cap open ios

# Desktop
npm run build && npm run electron:build

# Test local
npm run build && npm run preview
```

---

**🎉 APPLICATION DÉPLOYABLE SUR TOUS LES ENVIRONNEMENTS! 🎉**

*SDK/API Deployment Guide v1.0 - 2025-11-19*
