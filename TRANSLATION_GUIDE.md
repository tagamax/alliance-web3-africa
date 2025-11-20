# 🌐 GUIDE DE TRADUCTION - Alliance Web3 Africa

## ✅ ÉTAT ACTUEL

### Pages Traduites
```
✅ Dashboard - 100% traduit (FR/EN)
✅ Mine Game - 100% traduit (FR/EN)
✅ Layout - Sélecteur de langue actif
```

### Clés Disponibles
```
Total: 80+ clés
Langues: FR (Français), EN (English)
```

---

## 🔧 UTILISATION

### Dans un Composant

```typescript
import { useLanguage } from '../contexts/LanguageContext';

export default function MyComponent() {
  const { t, language, changeLanguage } = useLanguage();

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button onClick={() => changeLanguage('en')}>English</button>
      <button onClick={() => changeLanguage('fr')}>Français</button>
    </div>
  );
}
```

---

## 📝 CLÉS PRINCIPALES

### Dashboard
- `t('welcome')` → Bienvenue / Welcome
- `t('totalValue')` → Valeur Totale / Total Value
- `t('recentTransactions')` → Transactions récentes
- `t('quickActions')` → Actions rapides

### Common
- `t('balance')` → Solde / Balance
- `t('loading')` → Chargement / Loading
- `t('save')` → Enregistrer / Save
- `t('confirm')` → Confirmer / Confirm

### Navigation
- `t('dashboard')` → Tableau de Bord / Dashboard
- `t('deposit')` → Déposer / Deposit
- `t('withdraw')` → Retirer / Withdraw

---

## ➕ AJOUTER TRADUCTION

1. Ouvrir `src/lib/i18n.ts`
2. Ajouter clé dans `fr` ET `en`
3. Utiliser `t('newKey')` dans composant

---

## 🧪 TESTER

1. Ouvrir app
2. Cliquer bouton langue (Layout)
3. Vérifier que tout change

---

**🌐 SYSTÈME DE TRADUCTION ACTIF!**
