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

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function set(exerciseId: string, weight: number, reps: number, rpe?: number, restSeconds?: number, note?: string) {
  return {
    id: `${exerciseId}-${weight}-${reps}-${Math.random().toString(36).slice(2, 7)}`,
    exerciseId,
    weight,
    reps,
    rpe,
    restSeconds,
    note,
  };
}

function entry(exerciseId: string, sets: ReturnType<typeof set>[]) {
  return {
    id: `${exerciseId}-${Math.random().toString(36).slice(2, 7)}`,
    exerciseId,
    sets,
  };
}

export function createInitialAppData(): PersistedAppData {
  const exercises = exerciseSeed.map(([id, name, category, subcategory, icon, notes], index) => ({
    id,
    name,
    category,
    subcategory,
    icon,
    notes,
    createdAt: daysAgo(120 - index * 2, 18).toISOString(),
  }));

  const sessions = [
    {
      id: "session-1",
      startedAt: daysAgo(18, 18, 10).toISOString(),
      endedAt: addMinutes(daysAgo(18, 18, 10), 64).toISOString(),
      notes: "Bonne sensation generale, energie stable toute la seance.",
      feeling: 8,
      exerciseEntries: [
        entry("bench-press", [set("bench-press", 72.5, 8, 8, 120), set("bench-press", 72.5, 8, 8, 120), set("bench-press", 75, 6, 9, 150)]),
        entry("incline-bench", [set("incline-bench", 26, 10, 8, 90), set("incline-bench", 28, 8, 8, 90), set("incline-bench", 28, 8, 9, 90)]),
        entry("cable-fly", [set("cable-fly", 16, 15, 7, 60), set("cable-fly", 18, 12, 8, 60), set("cable-fly", 18, 12, 8, 60)]),
      ],
    },
    {
      id: "session-2",
      startedAt: daysAgo(16, 19, 20).toISOString(),
      endedAt: addMinutes(daysAgo(16, 19, 20), 71).toISOString(),
      notes: "Pull focus. Rowing tres propre.",
      feeling: 8,
      exerciseEntries: [
        entry("pull-up", [set("pull-up", 0, 10, 8, 120), set("pull-up", 0, 9, 8, 120), set("pull-up", 0, 8, 9, 120)]),
        entry("seated-row", [set("seated-row", 55, 12, 7, 90), set("seated-row", 60, 10, 8, 90), set("seated-row", 60, 10, 8, 90)]),
        entry("barbell-row", [set("barbell-row", 60, 10, 8, 120), set("barbell-row", 65, 8, 8, 120), set("barbell-row", 65, 8, 9, 120)]),
        entry("hammer-curl", [set("hammer-curl", 18, 12, 8, 60), set("hammer-curl", 18, 12, 8, 60), set("hammer-curl", 20, 10, 9, 60)]),
      ],
    },
    {
      id: "session-3",
      startedAt: daysAgo(14, 18, 40).toISOString(),
      endedAt: addMinutes(daysAgo(14, 18, 40), 78).toISOString(),
      notes: "Leg day dense. Squat en progression.",
      feeling: 7,
      exerciseEntries: [
        entry("back-squat", [set("back-squat", 90, 8, 8, 150), set("back-squat", 95, 7, 8, 150), set("back-squat", 95, 6, 9, 180)]),
        entry("leg-press", [set("leg-press", 180, 12, 8, 90), set("leg-press", 190, 10, 8, 90), set("leg-press", 200, 10, 9, 90)]),
        entry("leg-extension", [set("leg-extension", 45, 15, 8, 60), set("leg-extension", 50, 12, 9, 60), set("leg-extension", 50, 12, 9, 60)]),
        entry("plank", [set("plank", 0, 60, 7, 45), set("plank", 0, 60, 7, 45), set("plank", 0, 75, 8, 45)]),
      ],
    },
    {
      id: "session-4",
      startedAt: daysAgo(11, 19, 0).toISOString(),
      endedAt: addMinutes(daysAgo(11, 19, 0), 62).toISOString(),
      notes: "Shoulders and arms. Bonne congestion.",
      feeling: 8,
      exerciseEntries: [
        entry("ohp", [set("ohp", 40, 8, 8, 120), set("ohp", 42.5, 6, 8, 120), set("ohp", 42.5, 6, 9, 120)]),
        entry("lateral-raise", [set("lateral-raise", 10, 15, 8, 45), set("lateral-raise", 10, 15, 8, 45), set("lateral-raise", 12, 12, 9, 45)]),
        entry("barbell-curl", [set("barbell-curl", 30, 12, 8, 60), set("barbell-curl", 32.5, 10, 8, 60), set("barbell-curl", 32.5, 10, 9, 60)]),
        entry("pushdown", [set("pushdown", 30, 14, 8, 45), set("pushdown", 32.5, 12, 8, 45), set("pushdown", 35, 10, 9, 45)]),
      ],
    },
    {
      id: "session-5",
      startedAt: daysAgo(9, 18, 15).toISOString(),
      endedAt: addMinutes(daysAgo(9, 18, 15), 65).toISOString(),
      notes: "Push rapide mais efficace.",
      feeling: 8,
      exerciseEntries: [
        entry("bench-press", [set("bench-press", 75, 8, 8, 120), set("bench-press", 77.5, 6, 9, 150), set("bench-press", 77.5, 6, 9, 150)]),
        entry("incline-bench", [set("incline-bench", 28, 10, 8, 90), set("incline-bench", 30, 8, 8, 90), set("incline-bench", 30, 8, 9, 90)]),
        entry("skull-crusher", [set("skull-crusher", 25, 12, 8, 60), set("skull-crusher", 27.5, 10, 8, 60), set("skull-crusher", 27.5, 10, 9, 60)]),
      ],
    },
    {
      id: "session-6",
      startedAt: daysAgo(7, 19, 10).toISOString(),
      endedAt: addMinutes(daysAgo(7, 19, 10), 73).toISOString(),
      notes: "Dos et biceps. Tractions propres.",
      feeling: 9,
      exerciseEntries: [
        entry("pull-up", [set("pull-up", 0, 11, 8, 120), set("pull-up", 0, 10, 8, 120), set("pull-up", 0, 9, 9, 120)]),
        entry("seated-row", [set("seated-row", 60, 12, 8, 90), set("seated-row", 65, 10, 8, 90), set("seated-row", 65, 10, 9, 90)]),
        entry("barbell-row", [set("barbell-row", 65, 10, 8, 120), set("barbell-row", 67.5, 8, 8, 120), set("barbell-row", 67.5, 8, 9, 120)]),
        entry("incline-curl", [set("incline-curl", 14, 12, 8, 60), set("incline-curl", 14, 12, 8, 60), set("incline-curl", 16, 10, 9, 60)]),
      ],
    },
    {
      id: "session-7",
      startedAt: daysAgo(5, 18, 35).toISOString(),
      endedAt: addMinutes(daysAgo(5, 18, 35), 82).toISOString(),
      notes: "Leg day intense. PR a la presse.",
      feeling: 7,
      exerciseEntries: [
        entry("back-squat", [set("back-squat", 95, 8, 8, 150), set("back-squat", 100, 6, 9, 180), set("back-squat", 100, 6, 9, 180)]),
        entry("leg-press", [set("leg-press", 200, 12, 8, 90), set("leg-press", 210, 10, 8, 90), set("leg-press", 220, 10, 9, 90)]),
        entry("leg-extension", [set("leg-extension", 50, 15, 8, 60), set("leg-extension", 55, 12, 9, 60), set("leg-extension", 55, 12, 9, 60)]),
        entry("leg-raise", [set("leg-raise", 0, 15, 8, 45), set("leg-raise", 0, 15, 8, 45), set("leg-raise", 0, 18, 9, 45)]),
      ],
    },
    {
      id: "session-8",
      startedAt: daysAgo(3, 18, 5).toISOString(),
      endedAt: addMinutes(daysAgo(3, 18, 5), 66).toISOString(),
      notes: "Push solide. Bench stable, pecs bien recrutes.",
      feeling: 9,
      exerciseEntries: [
        entry("bench-press", [set("bench-press", 77.5, 8, 8, 120), set("bench-press", 80, 6, 9, 150), set("bench-press", 80, 5, 9, 150)]),
        entry("cable-fly", [set("cable-fly", 18, 15, 8, 60), set("cable-fly", 20, 12, 8, 60), set("cable-fly", 20, 12, 9, 60)]),
        entry("triceps-dips", [set("triceps-dips", 0, 14, 8, 75), set("triceps-dips", 0, 12, 8, 75), set("triceps-dips", 0, 12, 9, 75)]),
      ],
    },
    {
      id: "session-9",
      startedAt: daysAgo(1, 19, 30).toISOString(),
      endedAt: addMinutes(daysAgo(1, 19, 30), 70).toISOString(),
      notes: "Upper mix rapide. Epaules puis finisher abdos.",
      feeling: 8,
      exerciseEntries: [
        entry("ohp", [set("ohp", 42.5, 8, 8, 120), set("ohp", 45, 6, 9, 120), set("ohp", 45, 5, 9, 120)]),
        entry("rear-delt-fly", [set("rear-delt-fly", 9, 16, 8, 45), set("rear-delt-fly", 10, 15, 8, 45), set("rear-delt-fly", 10, 15, 9, 45)]),
        entry("barbell-curl", [set("barbell-curl", 32.5, 12, 8, 60), set("barbell-curl", 35, 10, 9, 60), set("barbell-curl", 35, 9, 9, 60)]),
        entry("crunch", [set("crunch", 0, 25, 7, 30), set("crunch", 0, 25, 7, 30), set("crunch", 0, 30, 8, 30)]),
      ],
    },
  ];

  const goals: PersistedAppData["goals"] = [
    {
      id: "goal-bench",
      exerciseId: "bench-press",
      type: "weight",
      targetWeight: 85,
      completed: false,
      createdAt: daysAgo(20, 20).toISOString(),
      deadline: daysAgo(-18, 20).toISOString(),
    },
    {
      id: "goal-squat",
      exerciseId: "back-squat",
      type: "weight",
      targetWeight: 105,
      completed: false,
      createdAt: daysAgo(20, 20).toISOString(),
      deadline: daysAgo(-12, 20).toISOString(),
    },
    {
      id: "goal-pullup",
      exerciseId: "pull-up",
      type: "reps",
      targetReps: 12,
      completed: false,
      createdAt: daysAgo(14, 20).toISOString(),
      deadline: daysAgo(-25, 20).toISOString(),
    },
    {
      id: "goal-press",
      exerciseId: "leg-press",
      type: "volume",
      targetVolume: 6500,
      completed: false,
      createdAt: daysAgo(12, 20).toISOString(),
      deadline: daysAgo(-8, 20).toISOString(),
    },
  ];

  return {
    exercises,
    sessions,
    goals,
    preferences: {
      theme: "dark",
      lastUsedExerciseCategoryFilter: "Tous",
      units: "kg",
      onboardingCompleted: false,
    },
    profile: {
      name: "Athlete",
      trainingFocus: "Progression force + hypertrophie",
      weeklyTarget: 4,
    },
    activeWorkout: null,
    lastCompletedSessionId: "session-9",
  };
}
