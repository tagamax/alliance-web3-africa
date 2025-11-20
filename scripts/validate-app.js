#!/usr/bin/env node

/**
 * Script de Validation Automatique
 * Vérifie la configuration, sécurité et performance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const log = {
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  info: (msg) => console.log(`ℹ️  ${msg}`),
  section: (msg) => console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`),
};

function test(name, fn) {
  totalTests++;
  try {
    const result = fn();
    if (result) {
      passedTests++;
      log.success(name);
    } else {
      failedTests++;
      log.error(name);
    }
  } catch (error) {
    failedTests++;
    log.error(`${name} - ${error.message}`);
  }
}

// ========================================
// 1. VÉRIFICATION CONFIGURATION
// ========================================
log.section('1️⃣  VÉRIFICATION CONFIGURATION');

test('Fichier .env existe', () => {
  return fs.existsSync(path.join(rootDir, '.env'));
});

test('package.json valide', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  return pkg.dependencies && pkg.devDependencies;
});

test('Dépendances Supabase installées', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  return pkg.dependencies['@supabase/supabase-js'];
});

test('React Router installé', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  return pkg.dependencies['react-router-dom'];
});

test('Lucide React installé', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  return pkg.dependencies['lucide-react'];
});

// ========================================
// 2. VÉRIFICATION STRUCTURE
// ========================================
log.section('2️⃣  VÉRIFICATION STRUCTURE');

const requiredFiles = [
  'src/main.tsx',
  'src/App.tsx',
  'src/lib/supabase.ts',
  'src/lib/security.ts',
  'src/lib/errorHandling.ts',
  'src/contexts/AuthContext.tsx',
  'src/routes/index.tsx',
];

requiredFiles.forEach(file => {
  test(`Fichier ${file} existe`, () => {
    return fs.existsSync(path.join(rootDir, file));
  });
});

// ========================================
// 3. VÉRIFICATION PAGES
// ========================================
log.section('3️⃣  VÉRIFICATION PAGES');

const requiredPages = [
  'Dashboard',
  'Swap',
  'P2P',
  'Crown',
  'NFTImpact',
  'DeFi',
  'Governance',
  'CommodityIndex',
  'Entrepreneurs',
  'MiningPools',
  'Notifications',
  'Redistributions',
  'Deposit',
  'Withdraw',
];

requiredPages.forEach(page => {
  test(`Page ${page} existe`, () => {
    return fs.existsSync(path.join(rootDir, `src/pages/${page}.tsx`));
  });
});

// ========================================
// 4. VÉRIFICATION SÉCURITÉ
// ========================================
log.section('4️⃣  VÉRIFICATION SÉCURITÉ');

test('Module de sécurité existe', () => {
  return fs.existsSync(path.join(rootDir, 'src/lib/security.ts'));
});

test('Gestion d\'erreurs implémentée', () => {
  return fs.existsSync(path.join(rootDir, 'src/lib/errorHandling.ts'));
});

test('AuthContext configuré', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/contexts/AuthContext.tsx'), 'utf-8');
  return content.includes('signIn') && content.includes('signOut');
});

test('Validation email implémentée', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/lib/security.ts'), 'utf-8');
  return content.includes('validateEmail');
});

test('Validation password implémentée', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/lib/security.ts'), 'utf-8');
  return content.includes('validatePassword');
});

test('Rate limiting configuré', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/lib/security.ts'), 'utf-8');
  return content.includes('checkRateLimit');
});

test('Sanitization inputs implémentée', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/lib/security.ts'), 'utf-8');
  return content.includes('sanitizeInput');
});

// ========================================
// 5. VÉRIFICATION ROUTES
// ========================================
log.section('5️⃣  VÉRIFICATION ROUTES');

test('Fichier routes configuré', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/routes/index.tsx'), 'utf-8');
  return content.includes('RouteObject');
});

test('Route Dashboard configurée', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/routes/index.tsx'), 'utf-8');
  return content.includes('/dashboard');
});

test('Route Deposit configurée', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/routes/index.tsx'), 'utf-8');
  return content.includes('/deposit');
});

test('Route Withdraw configurée', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/routes/index.tsx'), 'utf-8');
  return content.includes('/withdraw');
});

test('Route Redistributions configurée', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/routes/index.tsx'), 'utf-8');
  return content.includes('/redistributions');
});

// ========================================
// 6. VÉRIFICATION BUILD
// ========================================
log.section('6️⃣  VÉRIFICATION BUILD');

test('Vite config existe', () => {
  return fs.existsSync(path.join(rootDir, 'vite.config.ts'));
});

test('Tailwind config existe', () => {
  return fs.existsSync(path.join(rootDir, 'tailwind.config.js'));
});

test('TypeScript config existe', () => {
  return fs.existsSync(path.join(rootDir, 'tsconfig.json'));
});

test('PWA config existe', () => {
  const viteConfig = fs.readFileSync(path.join(rootDir, 'vite.config.ts'), 'utf-8');
  return viteConfig.includes('vite-plugin-pwa') || viteConfig.includes('VitePWA');
});

// ========================================
// 7. VÉRIFICATION MIGRATIONS
// ========================================
log.section('7️⃣  VÉRIFICATION MIGRATIONS');

test('Dossier migrations existe', () => {
  return fs.existsSync(path.join(rootDir, 'supabase/migrations'));
});

test('Migration core schema existe', () => {
  const files = fs.readdirSync(path.join(rootDir, 'supabase/migrations'));
  return files.some(f => f.includes('core_schema'));
});

test('Migration redistribution existe', () => {
  const files = fs.readdirSync(path.join(rootDir, 'supabase/migrations'));
  return files.some(f => f.includes('redistribution'));
});

test('Migration security existe', () => {
  const files = fs.readdirSync(path.join(rootDir, 'supabase/migrations'));
  return files.some(f => f.includes('security'));
});

// ========================================
// RÉSULTATS
// ========================================
log.section('📊 RÉSULTATS');

console.log(`\nTotal Tests: ${totalTests}`);
console.log(`✅ Réussis: ${passedTests}`);
console.log(`❌ Échoués: ${failedTests}`);

const successRate = ((passedTests / totalTests) * 100).toFixed(1);
console.log(`\n📈 Taux de Réussite: ${successRate}%\n`);

if (failedTests === 0) {
  log.success('🎉 TOUTES LES VALIDATIONS SONT PASSÉES!');
  log.info('Application prête pour les tests utilisateurs');
  process.exit(0);
} else {
  log.error(`${failedTests} test(s) échoué(s)`);
  log.info('Veuillez corriger les erreurs avant de continuer');
  process.exit(1);
}
