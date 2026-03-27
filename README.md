# IronTrack

Application web premium de suivi de musculation, mobile-first, pensee pour un usage quotidien sur iPhone.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- composants style shadcn/ui
- Lucide React
- Recharts
- backend Next.js via route API `/api/state`
- stockage persistant Postgres via `DATABASE_URL`

## Demarrage

```bash
npm install
copy .env.example .env.local
npm run dev
```

Ouvrir ensuite [http://localhost:3000](http://localhost:3000).

## Backend

L'application sauvegarde maintenant l'etat complet dans une base Postgres via `DATABASE_URL`.

Exemple `.env.local` :

```bash
DATABASE_URL="postgresql://..."
```

La table est creee automatiquement au premier appel sur `/api/state`.

## Fonctionnalites

- dashboard premium avec resume de progression
- bibliotheque d'exercices avec CRUD, recherche et filtres par categories
- detail exercice avec historique, objectifs et courbes
- mode seance active avec ajout rapide de series
- resume post-seance et historique detaille
- statistiques globales
- parametres avec theme, profil local, export/import JSON, reset et etat backend
