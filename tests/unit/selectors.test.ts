import { describe, expect, it } from "vitest";
import {
  filterSessionsByRange,
  getEntryVolume,
  getExerciseHistory,
  getExerciseStats,
  getGoalProgress,
  getRecentRecords,
  getSessionRecords,
  getSessionVolume,
  getWorkoutDurationMinutes,
} from "@/lib/selectors";
import { Exercise, Goal, WorkoutSession } from "@/lib/types";

function makeSession(
  id: string,
  startedAt: string,
  sets: { exerciseId: string; weight: number; reps: number }[],
  durationMinutes = 60,
): WorkoutSession {
  const endedAt = new Date(+new Date(startedAt) + durationMinutes * 60_000).toISOString();
  const byExercise = new Map<string, { weight: number; reps: number }[]>();
  sets.forEach((s) => {
    byExercise.set(s.exerciseId, [...(byExercise.get(s.exerciseId) ?? []), s]);
  });
  return {
    id,
    startedAt,
    endedAt,
    exerciseEntries: [...byExercise.entries()].map(([exerciseId, exSets], i) => ({
      id: `${id}-entry-${i}`,
      exerciseId,
      sets: exSets.map((s, j) => ({ id: `${id}-set-${i}-${j}`, exerciseId, weight: s.weight, reps: s.reps })),
    })),
    notes: "",
    feeling: 8,
  };
}

const bench = { exerciseId: "bench", weight: 100, reps: 5 };

describe("volumes", () => {
  it("calcule le volume d'une entrée (somme poids × reps)", () => {
    const session = makeSession("s1", "2026-07-01T10:00:00Z", [
      { exerciseId: "bench", weight: 100, reps: 5 },
      { exerciseId: "bench", weight: 80, reps: 10 },
    ]);
    expect(getEntryVolume(session.exerciseEntries[0])).toBe(100 * 5 + 80 * 10);
  });

  it("calcule le volume d'une séance (toutes entrées)", () => {
    const session = makeSession("s1", "2026-07-01T10:00:00Z", [
      { exerciseId: "bench", weight: 100, reps: 5 },
      { exerciseId: "squat", weight: 120, reps: 8 },
    ]);
    expect(getSessionVolume(session)).toBe(500 + 960);
  });

  it("volume d'une séance sans séries = 0", () => {
    const session = makeSession("s1", "2026-07-01T10:00:00Z", []);
    expect(getSessionVolume(session)).toBe(0);
  });
});

describe("getWorkoutDurationMinutes", () => {
  it("retourne la durée en minutes", () => {
    expect(
      getWorkoutDurationMinutes({ startedAt: "2026-07-01T10:00:00Z", endedAt: "2026-07-01T10:45:00Z" }),
    ).toBe(45);
  });

  it("jamais moins d'une minute (même si endedAt <= startedAt)", () => {
    expect(
      getWorkoutDurationMinutes({ startedAt: "2026-07-01T10:00:00Z", endedAt: "2026-07-01T10:00:00Z" }),
    ).toBe(1);
  });
});

describe("filterSessionsByRange", () => {
  const recent = makeSession("recent", new Date(Date.now() - 2 * 86_400_000).toISOString(), [bench]);
  const old = makeSession("old", new Date(Date.now() - 60 * 86_400_000).toISOString(), [bench]);

  it("7d ne garde que les séances récentes", () => {
    expect(filterSessionsByRange([recent, old], "7d").map((s) => s.id)).toEqual(["recent"]);
  });

  it("all garde tout", () => {
    expect(filterSessionsByRange([recent, old], "all")).toHaveLength(2);
  });
});

describe("getExerciseHistory / getExerciseStats", () => {
  const s1 = makeSession("s1", "2026-06-01T10:00:00Z", [{ exerciseId: "bench", weight: 90, reps: 8 }]);
  const s2 = makeSession("s2", "2026-06-08T10:00:00Z", [
    { exerciseId: "bench", weight: 100, reps: 5 },
    { exerciseId: "bench", weight: 100, reps: 8 },
  ]);
  const s3 = makeSession("s3", "2026-06-15T10:00:00Z", [{ exerciseId: "bench", weight: 95, reps: 10 }]);
  const unordered = [s3, s1, s2];

  it("l'historique est trié chronologiquement", () => {
    expect(getExerciseHistory("bench", unordered).map((s) => s.id)).toEqual(["s1", "s2", "s3"]);
  });

  it("stats vides sans historique", () => {
    const stats = getExerciseStats("bench", []);
    expect(stats).toMatchObject({ lastWeight: 0, bestWeight: 0, bestVolume: 0, totalSessions: 0 });
  });

  it("bestWeight = meilleur poids toutes séances, top set = poids puis reps", () => {
    const stats = getExerciseStats("bench", unordered);
    expect(stats.bestWeight).toBe(100);
    expect(stats.lastWeight).toBe(95);
    expect(stats.lastReps).toBe(10);
    expect(stats.totalSessions).toBe(3);
  });

  it("bestVolume = meilleur volume par séance", () => {
    const stats = getExerciseStats("bench", unordered);
    expect(stats.bestVolume).toBe(100 * 5 + 100 * 8);
  });

  it("ignore les entrées sans séries", () => {
    const empty = makeSession("s4", "2026-06-20T10:00:00Z", []);
    empty.exerciseEntries = [{ id: "e", exerciseId: "bench", sets: [] }];
    const stats = getExerciseStats("bench", [empty]);
    expect(stats.bestWeight).toBe(0);
    expect(stats.totalSessions).toBe(1);
  });
});

describe("getGoalProgress", () => {
  const sessions = [makeSession("s1", "2026-06-01T10:00:00Z", [{ exerciseId: "bench", weight: 90, reps: 8 }])];
  const base = { id: "g", exerciseId: "bench", completed: false, createdAt: "" };

  it("weight : progression = poids/cible", () => {
    const goal: Goal = { ...base, type: "weight", targetWeight: 100 };
    expect(getGoalProgress(goal, sessions)).toMatchObject({ progress: 90, status: "presque atteint" });
  });

  it("weight : cible atteinte → 100 %", () => {
    const goal: Goal = { ...base, type: "weight", targetWeight: 90 };
    expect(getGoalProgress(goal, sessions)).toMatchObject({ progress: 100, status: "atteint" });
  });

  it("reps : basé sur le max de reps", () => {
    const goal: Goal = { ...base, type: "reps", targetReps: 10 };
    expect(getGoalProgress(goal, sessions).progress).toBe(80);
  });

  it("volume : basé sur le meilleur volume de séance", () => {
    const goal: Goal = { ...base, type: "volume", targetVolume: 1440 };
    expect(getGoalProgress(goal, sessions).progress).toBe(50);
  });

  it("cible mal formée (0) → 0 % et pas 100 %", () => {
    const goal: Goal = { ...base, type: "weight", targetWeight: 0 };
    expect(getGoalProgress(goal, sessions).progress).toBe(0);
  });

  it("pr : 0 % à la création, 100 % quand le record est battu (baseline figée)", () => {
    const goal: Goal = { ...base, type: "pr", baselineWeight: 90, targetWeight: 92.5 };
    expect(getGoalProgress(goal, sessions)).toMatchObject({ progress: 0, status: "en cours" });

    const beaten = [...sessions, makeSession("s2", "2026-06-10T10:00:00Z", [{ exerciseId: "bench", weight: 92.5, reps: 3 }])];
    expect(getGoalProgress(goal, beaten)).toMatchObject({ progress: 100, status: "atteint" });
  });

  it("pr legacy sans baseline : 0 % en cours (jamais ~98 %)", () => {
    const goal: Goal = { ...base, type: "pr" };
    const p = getGoalProgress(goal, sessions);
    expect(p.progress).toBe(0);
    expect(p.status).toBe("en cours");
  });
});

describe("records", () => {
  const exercises: Exercise[] = [
    { id: "bench", name: "Développé couché", category: "Pectoraux", subcategory: "", createdAt: "" } as Exercise,
  ];

  it("getRecentRecords détecte les PRs de poids et de volume dans l'ordre chronologique", () => {
    const s1 = makeSession("s1", "2026-06-01T10:00:00Z", [{ exerciseId: "bench", weight: 90, reps: 8 }]);
    const s2 = makeSession("s2", "2026-06-08T10:00:00Z", [{ exerciseId: "bench", weight: 100, reps: 5 }]);
    const records = getRecentRecords([s2, s1], exercises);
    const weightRecords = records.filter((r) => r.title.includes("poids"));
    expect(weightRecords.map((r) => r.value).sort((a, b) => a - b)).toEqual([90, 100]);
  });

  it("pas de record si le poids n'augmente pas", () => {
    const s1 = makeSession("s1", "2026-06-01T10:00:00Z", [{ exerciseId: "bench", weight: 100, reps: 5 }]);
    const s2 = makeSession("s2", "2026-06-08T10:00:00Z", [{ exerciseId: "bench", weight: 95, reps: 5 }]);
    const records = getRecentRecords([s1, s2], exercises);
    expect(records.filter((r) => r.title.includes("poids"))).toHaveLength(1);
  });

  it("getSessionRecords signale les nouveaux PRs d'une séance", () => {
    const s1 = makeSession("s1", "2026-06-01T10:00:00Z", [{ exerciseId: "bench", weight: 90, reps: 8 }]);
    const s2 = makeSession("s2", "2026-06-08T10:00:00Z", [{ exerciseId: "bench", weight: 100, reps: 5 }]);
    const rows = getSessionRecords(s2, [s1, s2], exercises);
    expect(rows.some((r) => r.includes("PR poids"))).toBe(true);
  });
});
