import { describe, expect, it } from "vitest";
import { mergeAppData } from "@/lib/merge";
import { createEmptyAppData } from "@/lib/default-data";
import { PersistedAppData, TrainingPlan } from "@/lib/types";

function base(): PersistedAppData {
  return { ...createEmptyAppData(), exercises: [] };
}

function makePlan(id: string, createdAt: string, workouts: { id: string; completedSessionId?: string }[]): TrainingPlan {
  return {
    id,
    createdAt,
    durationWeeks: 4,
    goalDescription: "",
    coachSummary: "",
    progressionStrategy: "",
    workouts: workouts.map((w, i) => ({
      id: w.id,
      weekNumber: 1,
      sessionNumber: i + 1,
      label: `W${i}`,
      focusDescription: "",
      exercises: [],
      estimatedDurationMinutes: 45,
      completedSessionId: w.completedSessionId,
    })),
  } as unknown as TrainingPlan;
}

describe("mergeAppData", () => {
  it("union par id : rien n'est perdu, le local d'abord", () => {
    const local = { ...base(), sessions: [{ id: "a", startedAt: "2026-07-06T10:00:00Z" } as never] };
    const server = { ...base(), sessions: [{ id: "b", startedAt: "2026-07-05T10:00:00Z" } as never] };
    const merged = mergeAppData(local, server);
    expect(merged.sessions.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("doublon d'id : la version locale gagne", () => {
    const local = { ...base(), goals: [{ id: "g", type: "weight", targetWeight: 100 } as never] };
    const server = { ...base(), goals: [{ id: "g", type: "weight", targetWeight: 50 } as never] };
    expect(mergeAppData(local, server).goals[0]).toMatchObject({ targetWeight: 100 });
  });

  it("sessions triées par date décroissante après merge", () => {
    const local = { ...base(), sessions: [{ id: "old", startedAt: "2026-07-01T10:00:00Z" } as never] };
    const server = { ...base(), sessions: [{ id: "new", startedAt: "2026-07-06T10:00:00Z" } as never] };
    expect(mergeAppData(local, server).sessions.map((s) => s.id)).toEqual(["new", "old"]);
  });

  it("préférences : le local (session courante) gagne", () => {
    const local = { ...base(), preferences: { ...base().preferences, theme: "light" as const } };
    const server = { ...base(), preferences: { ...base().preferences, theme: "dark" as const } };
    expect(mergeAppData(local, server).preferences.theme).toBe("light");
  });

  it("même plan : les complétions des deux côtés sont conservées", () => {
    const local = { ...base(), trainingPlan: makePlan("p", "2026-07-01", [{ id: "w1", completedSessionId: "s-1" }, { id: "w2" }]) };
    const server = { ...base(), trainingPlan: makePlan("p", "2026-07-01", [{ id: "w1" }, { id: "w2", completedSessionId: "s-2" }]) };
    const plan = mergeAppData(local, server).trainingPlan!;
    expect(plan.workouts[0].completedSessionId).toBe("s-1");
    expect(plan.workouts[1].completedSessionId).toBe("s-2");
  });

  it("plans différents : le plus récent gagne", () => {
    const local = { ...base(), trainingPlan: makePlan("p-old", "2026-06-01", [{ id: "w1" }]) };
    const server = { ...base(), trainingPlan: makePlan("p-new", "2026-07-01", [{ id: "w1" }]) };
    expect(mergeAppData(local, server).trainingPlan!.id).toBe("p-new");
  });

  it("plan absent d'un côté : l'autre est conservé", () => {
    const withPlan = { ...base(), trainingPlan: makePlan("p", "2026-07-01", [{ id: "w1" }]) };
    expect(mergeAppData(base(), withPlan).trainingPlan?.id).toBe("p");
    expect(mergeAppData(withPlan, base()).trainingPlan?.id).toBe("p");
  });

  it("activeWorkout : le local prioritaire, sinon serveur", () => {
    const aw = { id: "w", startedAt: "", exerciseEntries: [], notes: "" };
    expect(mergeAppData({ ...base(), activeWorkout: aw }, base()).activeWorkout?.id).toBe("w");
    expect(mergeAppData(base(), { ...base(), activeWorkout: aw }).activeWorkout?.id).toBe("w");
  });
});
