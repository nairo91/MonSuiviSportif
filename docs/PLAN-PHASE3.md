# IronTrack — Plan Phase 3 (features), priorisé

*Critères de priorisation : impact sur l'usage quotidien × simplicité d'usage × effort. L'app doit rester SIMPLE.*

## Vague 1 — Le cœur de séance (ce qui manque à chaque entraînement)

1. **Minuteur de repos entre séries** *(implémenté dans cette PR)* — compte à rebours
   automatique après chaque série validée, vibration + bip à la fin, +30 s / passer,
   durée par défaut réglable et surcharge par exercice. C'est LA fonctionnalité
   attendue d'une app de muscu utilisée pendant la séance.
2. **Suggestion de surcharge progressive** — pré-remplir la prochaine série avec une
   proposition intelligente (dernier poids × reps, +2,5 kg si toutes les séries cibles
   réussies la dernière fois). S'appuie sur `getExerciseStats`, déjà testé.
3. **1RM estimé (Epley/Brzycki) + calculateur de disques** — affiché sur le détail
   exercice et pendant la séance ; « quels disques charger pour 92,5 kg ? ».

## Vague 2 — Routines & confort

4. **Routines réutilisables** — sauvegarder une séance comme modèle, démarrer depuis
   un modèle (le mécanisme `startWorkoutFromPlan` de la Phase 1 est réutilisable tel quel).
5. **Réorganisation des exercices pendant la séance** + ajout rapide avec recherche.
6. **Uniformisation des accents** (« Developpe couche » → « Développé couché », textes
   seed et UI) + états vides soignés.

## Vague 3 — Motivation

7. **Célébration des nouveaux records** — confetti + haptique quand `getSessionRecords`
   détecte un PR au résumé de séance (la détection existe déjà, il ne manque que l'UI).
8. **Streaks + heatmap de fréquence** (calendrier type GitHub sur les stats).
9. **Résumé hebdomadaire** sur le dashboard.

## Vague 4 — Social (nécessite une évolution du backend)

10. **Amis, fil d'activité, kudos, défis** — ATTENTION : le modèle actuel (un blob
    JSONB par utilisateur) ne permet pas de requêtes croisées. Prérequis : tables
    dédiées (users ↔ friendships, sessions publiées). C'est un chantier backend à
    part entière — à planifier ensemble avant de coder, idéalement après la mise en
    prod des Phases 1-2 et la Phase 4 (PWA/App Store), pour que les amis puissent
    réellement installer l'app.

## Suivi du corps (transverse, optionnel)

11. Poids de corps + mensurations (nouvelle entité dans le blob, page simple + courbe).

*Chaque feature = branche + PR draft + tests. Prochaine PR après celle-ci : surcharge progressive (n°2) + 1RM/disques (n°3) qui partagent la même logique.*
