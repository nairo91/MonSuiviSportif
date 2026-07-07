# IronTrack — État des lieux (Phase 0)

*Audit du 7 juillet 2026 — installation, lancement réel de l'app avec Postgres local, tour des API, lecture complète du code.*

## 1. Verdict global

L'app est bien construite : architecture propre (App Router + Zustand + selectors purs), auth solide (bcrypt, cookie HMAC timing-safe), verrouillage optimiste par révision correct côté SQL. `tsc` passe sans erreur, `npm install` et le dev server démarrent sans problème.

**Mais j'ai découvert un bug critique non signalé : la persistance serveur ne fonctionne pas du tout.** Toutes les données ne survivent que grâce au backup localStorage. Détails en §3 — c'est la priorité absolue de la Phase 1.

Vos 4 pistes de bugs sont toutes **confirmées** (§4).

## 2. Ce que j'ai fait et comment

- `npm install` (483 paquets), `tsc --noEmit` → **0 erreur**, `eslint` → **3 erreurs, 2 warnings** (§5).
- Postgres 17 local jetable (SSL auto-signé, compatible avec le `ssl: "require"` du code), `npm run dev`, puis **15 tests HTTP de bout en bout** : register, login/logout, session, mauvais mot de passe, email dupliqué, GET/PUT `/api/state`, conflit 409, `/api/ai/plan` sans clé. **14/15 PASS** — l'échec du 15ᵉ (« l'état persiste après re-login ») a révélé le bug critique.
- Cartographie complète du code (routes, store, sync, DB, auth) par lecture exhaustive.

Contrainte d'environnement : mon bac à sable Linux exécute l'app, mais votre Chrome ne peut pas atteindre son `localhost`. Je teste donc en HTTP/E2E dans le bac à sable (et en Phase 2, Playwright y tournera aussi). Si l'app est déployée quelque part (Vercel ?), je peux en plus la tester dans votre Chrome.

## 3. 🔴 BUG CRITIQUE : double encodage JSONB → aucune persistance serveur

**Fichier : `lib/server/app-state.ts` (lignes 31-38 et 96-107).**

Le code fait `JSON.stringify(normalized)` puis passe cette *chaîne* en paramètre avec un cast `::jsonb`. postgres.js voit que Postgres attend du jsonb et re-sérialise la chaîne → la colonne `state` contient une **chaîne JSON encodée deux fois**, pas un objet.

Preuve mesurée sur ma base locale après un PUT réussi :

```
SELECT jsonb_typeof(state) FROM app_state;  →  "string"   (attendu : "object")
SELECT state->'preferences' FROM app_state; →  NULL
```

Conséquences en chaîne :

1. `loadAppState` fait `normalizePersistedAppData(rows[0].state)` sur une **chaîne** → tous les champs sont `undefined` → retour aux **données par défaut**. GET `/api/state` renvoie donc toujours un état vide, quelle que soit la sauvegarde.
2. Au rechargement de la page, `loadRemoteState` (`lib/store.ts:308-328`) prend la réponse serveur comme vérité (dès que le flag dirty local est retombé après une sync « réussie ») et **écrase le backup localStorage avec cet état vide**. Seul `preferences.onboardingCompleted` est protégé.
3. Donc : perte de toutes les séances/exercices/objectifs au refresh dès que la base est configurée, et aucune synchronisation réelle entre appareils. Le PUT renvoie 200 et la révision s'incrémente, donc tout *semble* fonctionner.

**Bonne nouvelle** : les données déjà en base (Neon en prod ?) ne sont pas perdues — la chaîne stockée contient le vrai JSON. Le correctif inclura un chemin de **récupération** : si `state` est de type string, la parser (`JSON.parse`) au chargement, puis réécrire proprement. Fix principal : passer l'objet directement à postgres.js (`sql.json(...)` ou le paramètre objet sans stringify).

## 4. Vos 5 pistes — verdicts

**4.1 `components/session-gate.tsx` = code mort — CONFIRMÉ.** Importé nulle part (le layout utilise `AuthGate`). Il lit un champ `configured` que GET `/api/session` ne renvoie jamais et POSTe vers `/api/session` qui n'accepte que GET/DELETE (→ 405). Vestige de l'ancien mécanisme `APP_ACCESS_CODE`. → À supprimer.

**4.2 Coaching `confirmMarkDone` — CONFIRMÉ** (`app/(app)/coaching/page.tsx:247-260`). `startWorkout(exerciseIds)` crée une séance active avec `sets: []` (rien de pré-rempli), retourne un id `workout-…` qui n'est pas un `sessionId` (les vrais ids `session-…` naissent dans `finishActiveWorkout`), et cet id est stocké dans `completedSessionId`. Effets de bord aggravants : écrase sans prévenir une séance active en cours, laisse une séance fantôme dans `/workouts/active`, et n'ajoute **rien** à l'historique alors que le dialogue le promet. → À repenser comme vous le proposez : démarrer une vraie séance pré-remplie avec les séries planifiées, et ne marquer « complété » qu'à la fin.

**4.3 README obsolète — CONFIRMÉ.** Documente `APP_ACCESS_CODE` et une « session » via `/api/session` qui n'existent plus, référence un `.env.example` absent du repo, ne mentionne ni `ANTHROPIC_API_KEY` ni le fait que `SESSION_SECRET` est obligatoire en production (`lib/server/auth.ts:9-11` lève une erreur sinon).

**4.4 Objectif « pr » — CONFIRMÉ** (`lib/selectors.ts:138-145`). `target = bestWeight + 2.5` → progression = `record/(record+2.5)` : 95 % à 50 kg, 98 % à 100 kg, 99 % à 200 kg. Jamais 100 %, donc jamais « atteint », et une barre quasi pleine trompeuse en permanence. → À redéfinir (ex. : cible = PR au moment de la création de l'objectif + incrément choisi, atteinte quand un nouveau PR est établi).

**4.5 Robustesse sync — faiblesses confirmées** (`lib/store.ts`) :
- Sur 409, le client **remplace tout son état par celui du serveur** et remet dirty=false : les modifications locales non synchronisées sont perdues silencieusement. Aucun merge réel malgré le message affiché.
- Aucun retry automatique après erreur réseau (pas de listener `online`), resync seulement au prochain mutate, au `forceSync` manuel ou au reload.
- Multi-onglets : pas de `storage` event / BroadcastChannel ; chaque onglet garde sa `serverRevision` en mémoire → l'onglet en retard prend un 409 et perd ses éditions.
- Backup localStorage non namespacé par utilisateur : si la session expire ou qu'un autre compte se connecte sur la même machine sans logout explicite, risque d'afficher/pousser les données du compte précédent.
- Race à l'hydratation : une modification faite pendant le GET initial est écrasée à la réponse (seul `onboardingCompleted` est protégé).

## 5. Autres constats notables

- **Lint (3 erreurs)** : `Date.now()` appelé pendant le rendu du Dashboard (`app/(app)/page.tsx:21`, violation react-compiler → semaine courante potentiellement figée/instable) ; 2 guillemets non échappés dans `coaching/page.tsx:405`.
- `/api/ai/plan` utilise le modèle `claude-sonnet-4-6` — identifiant à vérifier ; s'il est invalide, la génération échoue en 500. (Vous évoquiez de toute façon un passage à un modèle plus récent.)
- `startWorkout` écrase toute séance active sans confirmation (aussi depuis `/workouts/start`).
- `sessionsPerWeek` du formulaire IA est initialisé depuis `weeklyTarget` (max 7 à l'onboarding) mais les options s'arrêtent à 6 → valeur 7 non sélectionnable affichable.
- `getGoalProgress` : target par défaut `?? 1` pour weight/volume → un objectif mal formé affiche 100 %.
- Accents incohérents dans des messages (« recente », « detectee », données seed « Developpe couche ») — vous l'aviez noté pour la Phase 3.
- Pas de rate-limiting sur login/register, pas de reset de mot de passe (prévu Phase 4).
- Deux tables seulement (`users`, `app_state`), créées paresseusement par `CREATE TABLE IF NOT EXISTS` — pas de migrations. Suffisant pour l'instant, à revoir quand le social arrivera (les données par utilisateur en un seul blob JSONB ne permettent pas d'amis/classements).

## 6. Carte de l'app (résumé)

**Pages** (`app/(app)/`, toutes client, protégées par AuthGate → OnboardingGate) : Dashboard `/` · Exercices `/exercises` (+ `new`, `[id]`, `[id]/edit`) · Séance `/workouts/start`, `/workouts/active`, `/workouts/summary/[id]` · Historique `/history` (+ `[id]`) · Stats `/statistics` · Objectifs (dans détail exercice) · Coaching `/coaching` (+ `generate`) · Réglages `/settings`.

**API** : `/api/auth/{register,login,logout}` · `/api/session` (GET/DELETE) · `/api/state` (GET/PUT, révision + 409) · `/api/ai/plan` (Claude, tool use forcé, sortie structurée).

**Données** : un blob `PersistedAppData` par utilisateur (exercises, sessions, goals, trainingPlan, preferences, profile, activeWorkout) dans `app_state.state` (JSONB) avec `revision`. Client : Zustand + backup localStorage (3 clés `irontrack-local-*`) + debounce 350 ms vers PUT `/api/state`.

**Env réellement utilisées** : `DATABASE_URL`, `SESSION_SECRET` (obligatoire en prod), `ANTHROPIC_API_KEY`. `APP_ACCESS_CODE` n'est lu nulle part.

## 7. Plan Phase 1 proposé (ordre de priorité)

1. **Fix persistance JSONB** + récupération des lignes double-encodées existantes + test de non-régression. *(critique)*
2. **Sync** : merge raisonnable sur 409 (au minimum ne pas jeter les modifs locales), retry sur reconnexion (`online`), namespace du backup local par userId. *(fiabilité)*
3. **Coaching « Marquer fait »** : vraie séance pré-remplie depuis le plan, complétion à la fin de séance, garde-fou si une séance est déjà active. *(fonctionnel)*
4. **Objectif « pr »** : nouvelle logique de cible/atteinte. *(fonctionnel)*
5. Suppression `session-gate.tsx`, correction des 3 erreurs lint, README réécrit + `.env.example`. *(hygiène)*

Ensuite Phase 2 (tests unitaires sur selectors/store/normalize + Playwright + CI) sur cette base assainie.

## 8. Points à décider (je vous ai posé les questions dans le chat)

1. Le dossier fourni est un export zip **sans `.git`** : pour créer branches + PRs draft sur `nairo91/MonSuiviSportif`, il me faut un moyen de pousser (token GitHub), sinon je livre les modifications directement dans ce dossier et vous poussez.
2. L'app est-elle **déployée avec une base Neon contenant de vraies données** ? Si oui, le fix §3 inclura le chemin de récupération (aucune donnée à perdre).
3. `ANTHROPIC_API_KEY` pour tester la génération de plan en réel (sinon je mocke).
