# IronTrack — Changelog Phase 1 (corrections de bugs)

*Branche `fix/phase1-bugs` — 7 juillet 2026. Chaque lot a été testé sur l'app réellement lancée (Postgres local jetable + tests HTTP/logiques).*

## 🔴 Lot 1 — Persistance serveur réparée (`lib/server/app-state.ts`)

Le bug le plus grave de l'app : le state était stocké **double-encodé** dans la colonne
JSONB (`JSON.stringify` + re-sérialisation par postgres.js → `jsonb_typeof = 'string'`).
Chaque lecture serveur retombait sur les données par défaut : perte de données au
rechargement de la page et aucune synchronisation entre appareils, avec des PUT qui
renvoyaient pourtant 200.

Fix : `sql.json()` pour l'INSERT et l'UPDATE, plus `parseStoredState()` qui répare
à la volée les lignes historiques corrompues (aucune donnée existante perdue).
Vérifié : `jsonb_typeof='object'`, état persistant après re-login, ligne corrompue relue.

## Lot 2 — Sync durcie (`lib/store.ts`, nouveau `lib/merge.ts`)

- **Conflit 409** : fusion par entité (union par id des séances/exercices/objectifs,
  complétions de plan conservées des deux côtés, préférences/profil locaux prioritaires)
  puis nouvel essai avec la révision serveur. Avant : l'état local était écrasé
  silencieusement. Double conflit d'affilée → le serveur fait autorité.
- **Reconnexion** : listener `online` qui re-pousse automatiquement le backup local sale.
- **Multi-comptes** : clés localStorage namespacées par `userId` (+ migration des
  anciennes clés, purge au logout via `clearActiveUserLocalData`). Un compte ne peut
  plus afficher ni pousser les données d'un autre sur la même machine.
- **Hydratation** : si des modifications locales non synchronisées existent pendant le
  GET initial, elles sont fusionnées au lieu d'être écrasées.

## Lot 3 — Coaching : « Marquer fait » repensé (`coaching/page.tsx`, store, types)

- `startWorkoutFromPlan()` : démarre une **vraie séance pré-remplie** avec les séries
  planifiées (poids/reps/RPE du coach) et trace `plannedWorkoutId`.
- La séance planifiée n'est marquée « faite » (avec le **vrai** `sessionId`) qu'à la
  fin de la séance, dans `finishActiveWorkout`. Avant : séance active vide, id fantôme
  `workout-…`, rien dans l'historique malgré la promesse du dialogue.
- Garde-fou : si une séance est déjà en cours, proposition de la reprendre ou de la
  remplacer (avant : écrasement silencieux).
- Option « Déjà faite, marquer sans séance » conservée pour les séances faites hors app.

## Lot 4 — Objectif « battre son record » réparé (`lib/selectors.ts`, types, UI)

- `Goal.baselineWeight` : record figé à la création de l'objectif ; cible = baseline + 2,5 kg.
- Progression = chemin parcouru entre baseline et cible : 0 % à la création, 100 %
  (statut « atteint ») quand le record est battu. Avant : la cible suivait le record
  → ~95-99 % en permanence, jamais atteint.
- Objectifs weight/volume mal formés (cible ≤ 0) : 0 % au lieu de 100 %.

## Lot 5 — Hygiène & rôle admin

- `components/session-gate.tsx` supprimé (code mort, vestige `APP_ACCESS_CODE`).
- `eslint` : 0 erreur / 0 warning (pureté `Date.now()` au dashboard, guillemets, imports).
- README réécrit (vraies variables, vrai flux d'auth), `.env.example` ajouté.
- **Coach IA réservé aux admins** : `ADMIN_EMAILS` (liste d'emails), `/api/ai/plan`
  renvoie 403 sinon, `/api/session` expose `isAdmin` pour l'UI.

## Vérifications globales

- `tsc --noEmit` 0 erreur ; `eslint .` 0 problème.
- 15/15 smoke tests HTTP (register/login/logout, session, GET/PUT state, 409, persistance).
- 15/15 tests logiques store + merge ; 7/7 tests `getGoalProgress` ; 4/4 tests admin.

## Reste fragile (pistes Phase 2)

- Le merge 409 ne gère pas les suppressions (une entité supprimée d'un côté peut
  réapparaître) — acceptable en v1, à couvrir par des tests.
- Pas encore de tests UI automatisés (Playwright prévu en Phase 2) ni de CI.
- Rate-limiting login/register et reset de mot de passe : prévus Phase 4.
