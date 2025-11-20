# 📱 Guide de Build Mobile - Alliance Web3 Africa

## ✅ Configuration Terminée

Votre application est maintenant prête pour être compilée en APK Android et app iOS native !

---

## 🤖 **BUILD ANDROID (APK)**

### **Prérequis**
- [Android Studio](https://developer.android.com/studio) installé
- JDK 17 ou supérieur
- SDK Android 24 ou supérieur

### **Étapes pour générer l'APK**

1. **Ouvrir le projet dans Android Studio** :
   ```bash
   npx cap open android
   ```
   Ou manuellement : ouvrez le dossier `android/` dans Android Studio

2. **Synchroniser Gradle** :
   - Android Studio devrait synchroniser automatiquement
   - Si non, cliquez sur "Sync Project with Gradle Files"

3. **Générer l'APK de debug** :
   - Menu : **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - L'APK sera dans : `android/app/build/outputs/apk/debug/app-debug.apk`

4. **Installer sur votre téléphone** :
   - Connectez votre téléphone en USB (avec mode développeur activé)
   - Ou copiez l'APK sur votre téléphone et installez-le

### **Build en ligne de commande** (alternative)
```bash
cd android
./gradlew assembleDebug
```
L'APK sera dans `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🍎 **BUILD iOS (IPA)**

### **Prérequis**
- Mac avec macOS 13 ou supérieur
- [Xcode 15+](https://developer.apple.com/xcode/) installé
- Compte Apple Developer (gratuit pour tester sur votre propre appareil)
- CocoaPods installé : `sudo gem install cocoapods`

### **Étapes pour générer l'app iOS**

1. **Installer les dépendances iOS** :
   ```bash
   cd ios/App
   pod install
   cd ../..
   ```

2. **Ouvrir le projet dans Xcode** :
   ```bash
   npx cap open ios
   ```
   Ou manuellement : ouvrez `ios/App/App.xcworkspace` dans Xcode

3. **Configurer le signing** :
   - Sélectionnez le projet "App" dans le navigateur
   - Allez dans "Signing & Capabilities"
   - Sélectionnez votre Apple ID dans "Team"
   - Changez le Bundle Identifier si nécessaire

4. **Connecter votre iPhone** :
   - Connectez votre iPhone en USB
   - Déverrouillez-le et acceptez "Faire confiance à cet ordinateur"
   - Sélectionnez votre iPhone comme destination dans Xcode

5. **Build et Run** :
   - Cliquez sur le bouton Play (▶️) dans Xcode
   - L'app sera installée sur votre iPhone

---

## 🔄 **Workflow de Développement**

### **Mettre à jour l'app après des changements**

1. **Build le projet web** :
   ```bash
   npm run build
   ```

2. **Copier les fichiers dans les projets natifs** :
   ```bash
   npx cap copy
   ```

3. **Synchroniser les plugins natifs** (si vous avez ajouté des plugins) :
   ```bash
   npx cap sync
   ```

4. **Ouvrir et compiler** :
   - Android : `npx cap open android`
   - iOS : `npx cap open ios`

### **Commande rapide pour tout mettre à jour** :
```bash
npm run build && npx cap sync
```

---

## 📦 **Structure des Dossiers**

```
project/
├── android/              # Projet Android natif
│   └── app/
│       └── build/
│           └── outputs/
│               └── apk/  # APK générés ici
├── ios/                  # Projet iOS natif
│   └── App/
│       └── App.xcworkspace  # Ouvrir ce fichier dans Xcode
├── dist/                 # Build web (source pour mobile)
└── capacitor.config.json # Configuration Capacitor
```

---

## 🚀 **Build pour Production**

### **Android (Release APK/AAB)**

1. **Créer un keystore** :
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore \
     -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configurer le signing dans Android Studio** :
   - Build → Generate Signed Bundle / APK
   - Suivez les instructions

3. **Ou en ligne de commande** :
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

### **iOS (Release pour App Store)**

1. **Archive dans Xcode** :
   - Product → Archive
   - Suivez le processus de distribution

2. **Upload vers App Store Connect**
   - Nécessite un compte Apple Developer payant ($99/an)

---

## 🐛 **Dépannage**

### **Erreur Gradle (Android)**
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### **Erreur Pod (iOS)**
```bash
cd ios/App
pod repo update
pod install
cd ../..
```

### **L'app ne se met pas à jour**
```bash
npm run build
npx cap sync
```
Puis recompilez dans Android Studio / Xcode

---

## 📝 **Informations de l'App**

- **Nom** : Alliance Web3 Africa
- **Package ID** : com.allianceweb3.africa
- **Version** : 0.0.0 (à modifier dans package.json)

Pour changer ces informations, éditez `capacitor.config.json`

---

## 🎯 **Prochaines Étapes**

1. **Pour Android** : Installez Android Studio et suivez les étapes ci-dessus
2. **Pour iOS** : Si vous avez un Mac, installez Xcode et suivez les étapes ci-dessus
3. **Pour tester rapidement** : Utilisez la PWA (voir instructions ci-dessous)

---

## 🌐 **Alternative Rapide : PWA (Recommandé pour tester)**

Si vous voulez tester rapidement sans installer Android Studio/Xcode :

1. **Démarrez le serveur avec accès réseau** :
   ```bash
   npm run dev -- --host
   ```

2. **Notez l'adresse IP affichée** (ex: http://192.168.1.100:5173)

3. **Sur votre téléphone** (même WiFi), ouvrez cette adresse

4. **Installez la PWA** :
   - **Android** : Menu (⋮) → "Installer l'application"
   - **iOS** : Partager → "Sur l'écran d'accueil"

**Avantages de la PWA** :
- ✅ Installation en 30 secondes
- ✅ Pas besoin d'Android Studio / Xcode
- ✅ Fonctionne hors ligne
- ✅ Notifications supportées
- ✅ Mises à jour automatiques

---

## 📞 **Support**

Pour plus d'informations :
- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Guide Android](https://capacitorjs.com/docs/android)
- [Guide iOS](https://capacitorjs.com/docs/ios)
