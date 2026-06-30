# Uniqify

Application web et mobile (PWA) de tri et suppression de doublons photo.

## Fonctionnalités prévues

- Import photos (dossier desktop / sélecteur mobile)
- Doublons exacts (SHA-256)
- Doublons proches (pHash)
- Photos inutiles (flou, sombre, miniatures)
- Mode revue swipe
- Phase 2 : app native Capacitor (suppression galerie iPhone)

## Développement

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

## Structure

```
src/
  core/          # Logique métier partagée (hash, qualité, types)
  platforms/     # Adaptateurs web / natif
  components/    # UI React
  pages/         # Écrans
  hooks/         # État global
```

## Convention de commits

Format : `v0.N - description en français`

- Premier commit : `v0.1`
- Incrément de 1 à chaque commit (`v0.9`, puis `v0.10`, etc.)
