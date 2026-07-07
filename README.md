# IronTrack

Application web premium de suivi de musculation, mobile-first, pensée pour un usage quotidien sur iPhone.

## Stack

- Next.js 16 (App Router) / React 19 / TypeScript
- Tailwind CSS 4, composants style shadcn/ui, Lucide, Recharts
- État client : Zustand + backup localStorage + sync serveur (`/api/state`, verrouillage optimiste par révision)
- Base : Postgres (Neon ou autre) via `DATABASE_URL`
- Auth : email + mot de passe (bcrypt), cookie de session signé HMAC
- Coach IA : API Claude (`/api/ai/plan`), réservée aux administrateurs

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseigner les variables
npm run dev
```

Ouvrir ensuite [http://localhost:3000](http://localhost:3000) et créer un compte.

## Variables d'environnement

| Variable | Rôle | Obligatoire |
| --- | --- | --- |
| `DATABASE_URL` | Postgres (auth + persistance). Tables créées automatiquement. | Oui |
| `SESSION_SECRET` | Clé HMAC des cookies de session. | **Oui en production** (l'app refuse de démarrer sans) |
| `ANTHROPIC_API_KEY` | Génération de plans par le coach IA. | Non (fonctionnalité désactivée sinon) |
| `ADMIN_EMAILS` | Emails (séparés par des virgules) autorisés à générer des plans IA. | Non (IA désactivée pour tous sinon) |

## Architecture des données

Chaque utilisateur possède un blob `PersistedAppData` (exercices, séances, objectifs,
plan d'entraînement, préférences, profil) dans la table `app_state`, versionné par une
colonne `revision` (verrouillage optimiste : un `PUT /api/state` avec une révision
périmée renvoie 409 et le client fusionne). Un backup localStorage par utilisateur
permet l'affichage instantané et le mode hors-ligne, re-synchronisé à la reconnexion.

## Fonctionnalités

- dashboard avec résumé de progression et plan coach IA
- bibliothèque d'exercices : CRUD, recherche, filtres par catégorie
- détail exercice : historique, objectifs (dont « battre son record »), courbes
- séance active : ajout rapide de séries, notes, ressenti
- séances planifiées par le coach IA, pré-remplies au démarrage
- résumé post-séance, historique détaillé, statistiques
- export / import JSON, thème sombre/clair, unités kg/lb
