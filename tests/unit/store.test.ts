import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "@/lib/store";
import { createEmptyAppData } from "@/lib/default-data";
import { PlannedWorkout } from "@/lib/types";

function resetStore() {
  useAppStore.setState({
    ...createEmptyAppData(),
    serverRevision: 0,
    hasHydrated: true,
    isRemoteLoading: false,
    isSyncing: false,
    backendConfigured: false,
    lastSyncError: null,
  });
}

const plannedWorkout: PlannedWorkout = {
  id: "pw-1",
  weekNumber: 1,
  sessionNumber: 1,
  label: "Push A",
  focusDescription: "",
  estimatedDurationMinutes: 45,
  exercises: [
    {
      exerciseId: "bench-press",
      exerciseName: "Développé couché",
      sets: [
        { reps: 8, weight: 60 },
        { reps: 8, weight: 62.5, rpe: 8 },
      ],
    },
    { exerciseId: "overhead-press", exerciseName: "Développé militaire", sets: [{ reps: 10, weight: 30 }] },
  ],
};

const plan = {
  id: "plan-1",
  createdAt: "2026-07-01T10:00:00Z",
  durationWeeks: 4,
  goalDescription: "force",
  coachSummary: "",
  progressionStrategy: "",
  workouts: [plannedWorkout],
} as never;

beforeEach(resetStore);

describe("cycle de vie d'une séance", () => {
  it("startWorkout crée une séance active vide et dédupliquée", () => {
    const id = useAppStore.getState().startWorkout(["a", "a", "b", ""]);
    const aw = useAppStore.getState().activeWorkout!;
    expect(id).toMatch(/^workout-/);
    expect(aw.exerciseEntries.map((e) => e.exerciseId)).toEqual(["a", "b"]);
  });

  it("startWorkout sans exercice → null", () => {
    expect(useAppStore.getState().startWorkout([])).toBeNull();
  });

  it("addSet/removeSet modifient la bonne entrée", () => {
    const s = useAppStore.getState();
    s.startWorkout(["a", "b"]);
    s.addSetToActiveWorkout("a", { weight: 100, reps: 5 });
    s.addSetToActiveWorkout("b", { weight: 50, reps: 10 });
    let aw = useAppStore.getState().activeWorkout!;
    expect(aw.exerciseEntries[0].sets).toHaveLength(1);
    const setId = aw.exerciseEntries[0].sets[0].id;
    useAppStore.getState().removeSetFromActiveWorkout("a", setId);
    aw = useAppStore.getState().activeWorkout!;
    expect(aw.exerciseEntries[0].sets).toHaveLength(0);
    expect(aw.exerciseEntries[1].sets).toHaveLength(1);
  });

  it("finishActiveWorkout : ne garde que les entrées avec séries, ajoute à l'historique", () => {
    const s = useAppStore.getState();
    s.startWorkout(["a", "b"]);
    s.addSetToActiveWorkout("a", { weight: 100, reps: 5 });
    const sessionId = useAppStore.getState().finishActiveWorkout({ feeling: 9 })!;
    const st = useAppStore.getState();
    expect(sessionId).toMatch(/^session-/);
    expect(st.activeWorkout).toBeNull();
    expect(st.lastCompletedSessionId).toBe(sessionId);
    const session = st.sessions.find((x) => x.id === sessionId)!;
    expect(session.exerciseEntries).toHaveLength(1);
    expect(session.feeling).toBe(9);
  });

  it("finishActiveWorkout sans séance active → null", () => {
    expect(useAppStore.getState().finishActiveWorkout()).toBeNull();
  });
});

describe("séance issue du plan coach", () => {
  it("startWorkoutFromPlan pré-remplit les séries planifiées", () => {
    useAppStore.getState().setTrainingPlan(plan);
    useAppStore.getState().startWorkoutFromPlan(plannedWorkout);
    const aw = useAppStore.getState().activeWorkout!;
    expect(aw.plannedWorkoutId).toBe("pw-1");
    expect(aw.exerciseEntries).toHaveLength(2);
    expect(aw.exerciseEntries[0].sets.map((x) => x.weight)).toEqual([60, 62.5]);
    expect(aw.exerciseEntries[0].sets[1].rpe).toBe(8);
  });

  it("terminer la séance marque la séance planifiée avec le vrai sessionId", () => {
    useAppStore.getState().setTrainingPlan(plan);
    useAppStore.getState().startWorkoutFromPlan(plannedWorkout);
    const sessionId = useAppStore.getState().finishActiveWorkout()!;
    const tp = useAppStore.getState().trainingPlan!;
    expect(tp.workouts[0].completedSessionId).toBe(sessionId);
    expect(sessionId).toMatch(/^session-/);
  });

  it("séance planifiée sans exercice → null (pas d'écrasement)", () => {
    useAppStore.getState().startWorkout(["a"]);
    const before = useAppStore.getState().activeWorkout;
    const res = useAppStore.getState().startWorkoutFromPlan({ ...plannedWorkout, exercises: [] });
    expect(res).toBeNull();
    expect(useAppStore.getState().activeWorkout).toBe(before);
  });
});

describe("exercices, objectifs, données", () => {
  it("addExercise ajoute en tête et retourne l'id", () => {
    const id = useAppStore.getState().addExercise({ name: "Curl", category: "Biceps", subcategory: "" } as never);
    expect(useAppStore.getState().exercises[0]).toMatchObject({ id, name: "Curl" });
  });

  it("deleteExercise supprime aussi les objectifs et les entrées actives liés", () => {
    const s = useAppStore.getState();
    const id = s.addExercise({ name: "Curl", category: "Biceps", subcategory: "" } as never);
    useAppStore.getState().upsertGoal({ exerciseId: id, type: "weight", targetWeight: 50 });
    useAppStore.getState().startWorkout([id, "other"]);
    useAppStore.getState().deleteExercise(id);
    const st = useAppStore.getState();
    expect(st.exercises.find((e) => e.id === id)).toBeUndefined();
    expect(st.goals.find((g) => g.exerciseId === id)).toBeUndefined();
    expect(st.activeWorkout!.exerciseEntries.map((e) => e.exerciseId)).toEqual(["other"]);
  });

  it("upsertGoal crée puis met à jour sans dupliquer", () => {
    useAppStore.getState().upsertGoal({ exerciseId: "bench", type: "weight", targetWeight: 100 });
    const goalId = useAppStore.getState().goals[0].id;
    useAppStore.getState().upsertGoal({ id: goalId, exerciseId: "bench", type: "weight", targetWeight: 110 });
    const goals = useAppStore.getState().goals;
    expect(goals).toHaveLength(1);
    expect(goals[0].targetWeight).toBe(110);
  });

  it("resetData restaure l'état initial", () => {
    useAppStore.getState().startWorkout(["a"]);
    useAppStore.getState().resetData();
    const st = useAppStore.getState();
    expect(st.activeWorkout).toBeNull();
    expect(st.sessions).toEqual([]);
  });

  it("importData normalise le contenu importé", () => {
    useAppStore.getState().importData({ sessions: "invalid" } as never);
    expect(useAppStore.getState().sessions).toEqual([]);
  });
});
