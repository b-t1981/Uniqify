# Uniqify

Application web et mobile de tri et suppression de doublons photo. Traitement 100 % local.

## Fonctionnalités

- Import photos (dossier desktop / galerie iPhone)
- Doublons exacts (SHA-256)
- Doublons proches (pHash)
- Photos inutiles (flou, sombre, miniatures)
- Suppression disque (Chrome/Edge) ou **galerie iPhone** (app native)

## Développement web

```bash
npm install
npm run dev
```

Ouvrir http://localhost:5173

## Build PWA

```bash
npm run build
npm run preview
```

## Application iPhone — suppression galerie

L’app native Capacitor permet de **supprimer réellement** les photos de la galerie iPhone (impossible dans Safari).

### Prérequis

- **macOS** avec [Xcode](https://developer.apple.com/xcode/) (15+)
- [CocoaPods](https://cocoapods.org/) : `sudo gem install cocoapods`
- Compte Apple (gratuit pour simulateur, payant pour installer sur iPhone)

### Build et lancement

```bash
npm install
npm run build:ios    # compile le web + sync Capacitor + permissions iOS
npm run ios          # ouvre ios/App/App.xcworkspace dans Xcode
```

Dans Xcode :

1. Sélectionner la cible **App**
2. Onglet **Signing & Capabilities** → choisir votre **Team**
3. Choisir un **simulateur** ou votre **iPhone** branché
4. Cliquer **Run** (▶)

### Utilisation sur iPhone

1. **Indexer toute ma galerie** — catalogue léger (métadonnées + miniatures, sans charger les originaux)
2. Ou **Choisir dans la galerie** — sélection manuelle
3. **Analyser** → **Tout analyser** ou scans individuels
4. **Supprimer** → les photos disparaissent de la galerie (double confirmation)

Les analyses chargent chaque photo **à la demande** (hash / miniature) et mettent en cache les résultats dans IndexedDB.

### Session persistante et notifications

- **Catalogue + résultats** sauvegardés localement (IndexedDB) — reprendre après fermeture de l’app
- **Garder l’écran actif** pendant l’analyse (option sur la page Analyser)
- **Notification locale** à la fin de « Tout analyser » (avec permission)

### Permissions iOS

Le script `scripts/patch-ios-plist.mjs` configure automatiquement :

- `NSPhotoLibraryUsageDescription` — lecture
- `NSPhotoLibraryAddUsageDescription` — modification / suppression
- `NSPhotoLibraryFullLibraryUsageDescription` — accès complet (iOS 14+)

### Dépannage

| Problème | Solution |
|----------|----------|
| `pod install` échoue | `cd ios/App && pod install` |
| Suppression refusée | Réglages → Confidentialité → Photothèque → Uniqify → **Accès complet** |
| Photos non supprimables | Réimporter via **Ouvrir la galerie** (pas via Safari) |
| Plugin non trouvé | `npm run build:ios` puis Clean Build Folder dans Xcode |

### Plugin suppression (`capacitor-uniqify-photos`)

Plugin local PhotoKit qui expose `deleteAssets` via les identifiants `PHAsset` retournés par l’import galerie.

## Structure

```
src/
  core/          # Logique métier (hash, qualité, suppression)
  platforms/     # Adaptateurs web / iOS
  components/    # UI React
  pages/         # Écrans
plugins/
  uniqify-photos/  # Plugin Capacitor (suppression PhotoKit)
ios/               # Projet Xcode (généré par Capacitor)
```

## Convention de commits

Format : `v0.N - description en français`
