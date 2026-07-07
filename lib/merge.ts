import { PersistedAppData, TrainingPlan } from "@/lib/types";

// Fusion d'états local/serveur utilisée lors d'un conflit de révision (409)
// ou d'une hydratation avec modifications locales non synchronisées.
// Principe : ne jamais perdre silencieusement une entité ; en cas de doublon
// d'id, la version locale (celle que l'utilisateur voit) gagne.

function unionById<T extends { id: string }>(local: T[], server: T[]): T[] {
  const localIds = new Set(local.map((item) => item.id));
  return [...local, ...server.filter((item) => !localIds.has(item.id))];
}

function mergeTrainingPlan(
  local: TrainingPlan | null,
  server: TrainingPlan | null,
): TrainingPlan | null {
  if (!local) return server;
  if (!server) return local;

  if (local.id !== server.id) {
    // Deux plans différents : garder le plus récent.
    const localTime = Date.parse(local.createdAt ?? "") || 0;
    const serverTime = Date.parse(server.createdAt ?? "") || 0;
    return serverTime > localTime ? server : local;
  }

  // Même plan : une séance marquée « faite » d'un côté le reste.
  const serverCompleted = new Map(
    server.workouts.map((workout) => [workout.id, workout.completedSessionId]),
  );

  return {
    ...local,
    workouts: local.workouts.map((workout) => ({
      ...workout,
      completedSessionId:
        workout.completedSessionId ?? serverCompleted.get(workout.id) ?? undefined,
    })),
  };
}

export function mergeAppData(
  local: PersistedAppData,
  server: PersistedAppData,
): PersistedAppData {
  return {
    exercises: unionById(local.exercises, server.exercises),
    sessions: unionById(local.sessions, server.sessions).sort(
      (a, b) => (Date.parse(b.startedAt ?? "") || 0) - (Date.parse(a.startedAt ?? "") || 0),
    ),
    goals: unionById(local.goals, server.goals),
    trainingPlan: mergeTrainingPlan(local.trainingPlan, server.trainingPlan),
    // Préférences/profil : la session locale reflète l'intention la plus récente.
    preferences: { ...server.preferences, ...local.preferences },
    profile: { ...server.profile, ...local.profile },
    activeWorkout: local.activeWorkout ?? server.activeWorkout,
    lastCompletedSessionId: local.lastCompletedSessionId ?? server.lastCompletedSessionId,
  };
}
