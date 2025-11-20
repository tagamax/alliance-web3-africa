const fs = require('fs');
const path = require('path');

const pages = [
  'MineGame.tsx',
  'NFTImpact.tsx',
  'DeFi.tsx',
  'Entrepreneurs.tsx',
  'CommodityIndex.tsx',
  'Redistributions.tsx',
  'Swap.tsx',
  'P2P.tsx',
  'Crown.tsx',
  'MiningPools.tsx',
  'Governance.tsx'
];

const basePath = './src/pages';

pages.forEach(page => {
  const filePath = path.join(basePath, page);
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${page} (not found)`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Add useLanguage import if not present
  if (!content.includes("useLanguage")) {
    content = content.replace(
      /import.*useAuth.*from.*AuthContext.*;/,
      `import { useAuth } from '../contexts/AuthContext';\nimport { useLanguage } from '../contexts/LanguageContext';`
    );
  }
  
  // Add t variable if not present
  if (!content.includes("const { t }")) {
    content = content.replace(
      /const { user } = useAuth\(\);/,
      `const { user } = useAuth();\n  const { t } = useLanguage();`
    );
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Processed ${page}`);
});

console.log('\n✅ All pages processed!');
