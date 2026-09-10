# Tab Launcher

Extension Chrome (Manifest V3) pour ouvrir un ensemble d'onglets pré-configurés,
groupés par catégorie / sous-catégorie, en un clic.

Projet réalisé pour apprendre le développement d'extensions Chrome et démontrer
une première expérience concrète sur le sujet.

## Stack

TypeScript · Vite · [`@crxjs/vite-plugin`](https://crxjs.dev/vite-plugin) · Vitest · ESLint

## Développement

```powershell
npm install
npm run dev
```

`npm run dev` build l'extension en mode watch dans `dist/`. Pour la charger dans Chrome :

1. `chrome://extensions`
2. Activer le "Mode développeur"
3. "Charger l'extension non empaquetée" → sélectionner le dossier `dist/`

## Scripts

- `npm run dev` — build en mode watch (HMR)
- `npm run build` — build de production dans `dist/`
- `npm run test` — tests unitaires (Vitest)
- `npm run lint` — lint (ESLint)

## Workflow Git

Ce repo suit gitflow : `main` (releases), `develop` (intégration),
`feature/*` / `release/*` / `hotfix/*` pour le travail en cours. `main` et
`develop` sont protégées (PR obligatoire, pas de force-push).
