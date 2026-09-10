# Tab Launcher

Extension Chrome (Manifest V3) qui ouvre un ensemble d'onglets pré-configurés en un
clic, organisés par catégorie et sous-catégorie (ex : "Recherche d'emploi",
"Veille tech > Actualités & Docs"). Chaque sous-catégorie ouvre tous ses liens
d'un coup et les regroupe automatiquement dans un vrai groupe d'onglets Chrome,
nommé et coloré.

Projet réalisé pour apprendre le développement d'extensions Chrome et démontrer
une première expérience concrète sur le sujet.

## Fonctionnalités

- **Popup** : liste des catégories → sous-catégories → clic sur une sous-catégorie
  ouvre tous ses liens et les regroupe (couleur + titre du groupe = ceux définis
  pour la sous-catégorie).
- **Page d'options** : gestion complète (ajout/édition/suppression) des catégories,
  sous-catégories et liens, dans une interface deux colonnes (liste à gauche,
  détail éditable à droite).
- **Export / Import JSON** : sauvegarde la configuration dans un fichier, ou la
  restaure (remplace intégralement la configuration existante).
- Aucune donnée sensible stockée — pas de credentials, pas de connexion
  automatique aux comptes (voir la spec pour la justification de ce choix).

À la première installation, deux catégories d'exemple sont créées ("Recherche
d'emploi", "Veille tech") pour montrer l'extension en action immédiatement.
Ce ne sont que des données de démonstration : **tout est entièrement
configurable** depuis la page d'options (ajout/édition/suppression de
catégories, sous-catégories et liens) — rien n'est codé en dur côté
utilisateur final.

## Installation (sans compiler)

Pour simplement essayer l'extension, sans toucher au code :

1. Télécharge le zip de la [dernière release](https://github.com/Falkort91/tab-launcher/releases/latest).
2. Décompresse-le dans un dossier (pas besoin d'installer Node ni de lancer de commande).
3. `chrome://extensions` dans la barre d'adresse.
4. Active le **"Mode développeur"** (interrupteur en haut à droite).
5. Clique sur **"Charger l'extension non empaquetée"** → sélectionne le dossier décompressé.

L'extension apparaît dans la barre d'outils Chrome, prête à l'emploi avec les
catégories de démo.

> Installation en un clic impossible en dehors du Chrome Web Store — c'est une
> restriction de Chrome, pas une limite de cette extension.

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
- `npm run typecheck` — vérification des types (`tsc --noEmit`)
- `node scripts/generate-icons.mjs` — régénère les icônes PNG (16/32/48/128px)
  à partir de `assets/icon-source.png` (nécessite la dépendance `sharp`)

## Workflow Git

Ce repo suit gitflow : `main` (releases), `develop` (intégration),
`feature/*` / `release/*` / `hotfix/*` pour le travail en cours. `main` et
`develop` sont protégées (PR obligatoire, pas de force-push).
