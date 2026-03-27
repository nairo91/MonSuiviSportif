import { PersistedAppData } from "@/lib/types";

const exerciseSeed = [
  ["bench-press", "Developpe couche", "Pectoraux", "Force horizontale", "shield", "Pilier de progression. Priorite sur la technique et le tempo."],
  ["incline-bench", "Developpe incline", "Pectoraux", "Haut de pecs", "trending-up", "Excellent pour suivre la progression du haut des pectoraux."],
  ["cable-fly", "Ecarte poulie", "Pectoraux", "Isolation", "sparkles", "Contraction maximale en fin d'amplitude."],
  ["seated-row", "Tirage horizontal", "Dos", "Epaisseur", "target", "Chercher un tirage controle et stable."],
  ["pull-up", "Tractions", "Dos", "Poids du corps", "activity", "Noter la forme et l'amplitude."],
  ["barbell-row", "Rowing barre", "Dos", "Puissance", "dumbbell", "Volume solide, attention au gainage."],
  ["back-squat", "Squat", "Jambes", "Force", "flame", "Focus profondeur et gainage."],
  ["leg-press", "Presse a cuisses", "Jambes", "Volume", "target", "Monter le volume sans sacrifier l'amplitude."],
  ["leg-extension", "Leg extension", "Jambes", "Quadriceps", "zap", "Finisher propre et controle."],
  ["ohp", "Developpe militaire", "Epaules", "Force verticale", "shield", "Priorite au gainage et a la trajectoire."],
  ["lateral-raise", "Elevations laterales", "Epaules", "Isolation", "sparkles", "Series longues pour la congestion."],
  ["rear-delt-fly", "Oiseau", "Epaules", "Arriere d'epaule", "orbit", "Ideal en fin de seance pull."],
  ["barbell-curl", "Curl barre", "Biceps", "Force", "zap", "Mouvement de reference pour les biceps."],
  ["incline-curl", "Curl incline", "Biceps", "Etirement", "trending-up", "Amplitude complete et tempo lent."],
  ["hammer-curl", "Curl marteau", "Biceps", "Brachial", "dumbbell", "Bonne option en superset."],
  ["skull-crusher", "Barre au front", "Triceps", "Longue portion", "target", "Descente controlee et coudes fixes."],
  ["pushdown", "Extension poulie", "Triceps", "Isolation", "activity", "Facile a surcharger progressivement."],
  ["triceps-dips", "Dips triceps", "Triceps", "Poids du corps", "flame", "Gardez une amplitude confortable."],
  ["crunch", "Crunch", "Abdos", "Flexion", "waves", "Exercice simple a garder propre."],
  ["plank", "Gainage", "Abdos", "Stabilisation", "shield", "Respiration et alignement avant tout."],
  ["leg-raise", "Releves de jambes", "Abdos", "Bas des abdos", "orbit", "Ne pas perdre le controle du bassin."],
] as const;

function daysAgo(days: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

export function createDefaultExercises(): PersistedAppData["exercises"] {
  return exerciseSeed.map(([id, name, category, subcategory, icon, notes], index) => ({
    id,
    name,
    category,
    subcategory,
    icon,
    notes,
    createdAt: daysAgo(120 - index * 2, 18).toISOString(),
  }));
}

export function createEmptyAppData(): PersistedAppData {
  return {
    exercises: createDefaultExercises(),
    sessions: [],
    goals: [],
    preferences: {
      theme: "dark",
      lastUsedExerciseCategoryFilter: "Tous",
      units: "kg",
      onboardingCompleted: false,
    },
    profile: {
      name: "",
      trainingFocus: "",
      weeklyTarget: 4,
    },
    activeWorkout: null,
    lastCompletedSessionId: null,
  };
}

export function normalizePersistedAppData(input: Partial<PersistedAppData> | null | undefined): PersistedAppData {
  const base = createEmptyAppData();

  return {
    exercises: Array.isArray(input?.exercises) ? input.exercises : base.exercises,
    sessions: Array.isArray(input?.sessions) ? input.sessions : base.sessions,
    goals: Array.isArray(input?.goals) ? input.goals : base.goals,
    preferences: {
      ...base.preferences,
      ...(input?.preferences ?? {}),
    },
    profile: {
      ...base.profile,
      ...(input?.profile ?? {}),
    },
    activeWorkout: input?.activeWorkout ?? base.activeWorkout,
    lastCompletedSessionId:
      typeof input?.lastCompletedSessionId === "string" || input?.lastCompletedSessionId === null
        ? input.lastCompletedSessionId
        : base.lastCompletedSessionId,
  };
}
