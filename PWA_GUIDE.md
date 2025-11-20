# 📱 Guide PWA - Alliance Web3 Africa

## Progressive Web App (PWA) Cross-Plateforme

L'application Alliance Web3 Africa est maintenant une **Progressive Web App** complète, installable sur tous les appareils!

## 🎯 Caractéristiques PWA

### ✅ Installation Native
- **Android**: Bouton "Ajouter à l'écran d'accueil"
- **iOS**: Bouton "Ajouter à l'écran d'accueil" dans Safari
- **Windows**: Bouton "Installer" dans Chrome/Edge
- **macOS**: Bouton "Installer" dans Chrome/Safari
- **Linux**: Bouton "Installer" dans Chrome/Firefox

### ✅ Mode Offline
- Cache intelligent des ressources
- Fonctionne sans connexion internet
- Synchronisation automatique au retour online
- Cache API Supabase (24h)
- Cache images (30 jours)
- Cache fonts (1 an)

### ✅ Icônes et Thème
- **Logo**: عLKabulan Coins (or)
- **Couleur thème**: Amber (#f59e0b)
- **Couleur fond**: Slate (#0f172a)
- **Icônes**: 8 tailles (72px à 512px)
- **Maskable icons**: Compatible Android 12+

### ✅ Notifications Push
- Notifications en temps réel
- Badge sur l'icône
- Vibration personnalisée
- Actions rapides

### ✅ Raccourcis Rapides
1. **Dashboard** - Accès rapide au tableau de bord
2. **Redistributions** - Voir les gains
3. **SWAP** - Échanger des tokens
4. **P2P** - Trading peer-to-peer

## 📲 Installation par Plateforme

### Android (Chrome/Samsung Internet)

1. **Navigation web**: Ouvrir https://allianceweb3africa.org
2. **Prompt automatique**: Un bouton "📱 Installer l'application" apparaît
3. **Option menu**: Menu ⋮ → "Ajouter à l'écran d'accueil"
4. **Installation**: L'app s'installe avec l'icône عLKabulan
5. **Lancement**: Icône sur l'écran d'accueil, ouverte en plein écran

### iOS (Safari uniquement)

⚠️ **Important**: Sur iOS, seul Safari supporte l'installation PWA

1. **Ouvrir Safari**: https://allianceweb3africa.org
2. **Bouton Partager**: Appuyer sur le bouton de partage
3. **Ajouter à l'écran d'accueil**: Sélectionner cette option
4. **Nom**: Vérifier le nom "عLK3 Alliance"
5. **Installation**: Appuyer sur "Ajouter"
6. **Icône**: L'app apparaît avec le logo عLKabulan

### Windows (Chrome/Edge)

1. **Ouvrir le site**: https://allianceweb3africa.org
2. **Icône d'installation**: Dans la barre d'adresse
3. **Clic sur "Installer"**: Confirmer l'installation
4. **Shortcut**: Créé sur le bureau et menu démarrer
5. **Lancement**: Application standalone avec fenêtre dédiée

### macOS (Chrome/Safari)

#### Chrome
1. **Menu Chrome**: ⋮ → "Installer Alliance Web3 Africa"
2. **Dock**: L'app apparaît dans le Dock
3. **Applications**: Accessible depuis le dossier Applications

#### Safari
1. **Menu Fichier**: "Ajouter au Dock"
2. **Option**: "Ajouter à l'écran d'accueil"

### Linux (Chrome/Firefox)

1. **Chrome**: Menu → "Installer Alliance Web3 Africa"
2. **Firefox**: Prompt automatique ou barre d'adresse
3. **Desktop**: Icône dans le lanceur d'applications

## 🔧 Fonctionnalités Techniques

### Service Worker
```javascript
// Cache stratégies:
- NetworkFirst: API Supabase (données fraîches prioritaires)
- CacheFirst: Images, fonts (performance)
- StaleWhileRevalidate: Assets statiques
```

### Workbox
- **Précache**: 29 fichiers essentiels (18.7 MB)
- **Runtime Cache**: API, images, fonts
- **Cleanup automatique**: Anciens caches supprimés
- **Skip waiting**: Mises à jour instantanées

### Manifest
```json
{
  "name": "Alliance Web3 Africa - عLKabulan Coins",
  "short_name": "عLK3 Alliance",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#f59e0b",
  "background_color": "#0f172a"
}
```

## 📊 Métriques PWA

### Lighthouse Score (Cible)
- **Performance**: 90+
- **Accessibility**: 100
- **Best Practices**: 100
- **SEO**: 100
- **PWA**: 100

### Critères PWA
✅ Fast and reliable
✅ Installable
✅ PWA optimized
✅ Offline capable
✅ Configured for a custom splash screen
✅ Sets a theme color
✅ Content sized correctly for viewport
✅ Has a <meta name="viewport"> tag
✅ Provides a valid apple-touch-icon
✅ Provides a valid manifest
✅ Redirects HTTP traffic to HTTPS

## 🎨 Personnalisation

### Splash Screen
- **Automatique**: Généré par le navigateur
- **Logo**: عLKabulan Coins (centré)
- **Fond**: Slate foncé (#0f172a)
- **Couleur**: Amber (#f59e0b)

### Thème
- **Barre de statut**: Noire translucide (iOS)
- **Couleur système**: Amber
- **Mode sombre**: Supporté
- **Bordures safe area**: Gérées (iPhone notch)

## 🔄 Mises à Jour

### Automatiques
1. **Détection**: Service worker vérifie les mises à jour
2. **Téléchargement**: En arrière-plan
3. **Prompt**: "Nouvelle version disponible"
4. **Installation**: Au prochain démarrage ou sur confirmation

### Manuelles
- Fermer et rouvrir l'app
- Vider le cache du navigateur
- Désinstaller et réinstaller

## 🌐 Compatibilité Navigateurs

### Support Complet ✅
- Chrome 67+ (Android, Windows, macOS, Linux)
- Edge 79+ (Windows, macOS)
- Samsung Internet 8.2+
- Opera 54+
- Brave (tous systèmes)

### Support Partiel ⚠️
- Safari 11.1+ (iOS, macOS) - Pas de notifications push
- Firefox 58+ - Service worker uniquement

### Non Supporté ❌
- IE 11 et antérieurs
- Opera Mini
- UC Browser ancien

## 📱 Expérience Utilisateur

### Première Visite
1. **Chargement rapide**: Assets précachés
2. **Prompt installation**: Après 30 secondes
3. **Bouton flottant**: "📱 Installer l'application"
4. **Auto-hide**: Le bouton disparaît après 30 secondes

### Visites Suivantes
- **Chargement instantané**: Cache en premier
- **Mise à jour transparente**: En arrière-plan
- **Expérience native**: Comme une vraie app

### Mode Offline
- **Détection**: Automatique
- **Message**: "Vous êtes hors ligne"
- **Fonctionnalités**: Consultation des données en cache
- **Synchronisation**: Auto au retour online

## 🔐 Sécurité

### HTTPS Obligatoire
- Service Worker nécessite HTTPS
- Certificat SSL valide
- Toutes les requêtes sécurisées

### Permissions
- **Notifications**: Sur demande utilisateur
- **Caméra**: Si KYC activé
- **Localisation**: Non utilisée
- **Stockage**: Cache local sécurisé

## 🚀 Performance

### Optimisations
- **Code splitting**: 3 chunks (React, Supabase, UI)
- **Lazy loading**: Routes chargées à la demande
- **Tree shaking**: Code inutilisé supprimé
- **Minification**: JS et CSS compressés
- **Gzip**: Compression serveur

### Tailles
- **Bundle total**: ~527 KB (136 KB gzip)
- **CSS**: 36 KB (6.3 KB gzip)
- **Précache**: 18.7 MB (avec logo)
- **Icônes**: 8 × 1.8 MB = 14.4 MB

## 📞 Support

### Problèmes Courants

**Q: L'app ne s'installe pas?**
A: Vérifiez HTTPS, videz le cache, essayez un autre navigateur

**Q: Le logo n'apparaît pas?**
A: Attendez 5 secondes, l'icône se charge

**Q: Mode offline ne fonctionne pas?**
A: Visitez une fois online, le cache se remplit

**Q: Notifications non reçues?**
A: Vérifiez les permissions du navigateur

### Contact
- 📧 Email: support@allianceweb3africa.org
- 💬 Discord: Alliance Web3 Africa Community
- 🐦 Twitter: @AllianceW3A

---

## 📚 Ressources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Workbox Guide](https://developer.chrome.com/docs/workbox/)
- [Manifest Spec](https://www.w3.org/TR/appmanifest/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Version:** 1.0.0
**Dernière mise à jour:** Novembre 2025
**Statut:** ✅ Production Ready - Cross-Platform PWA
