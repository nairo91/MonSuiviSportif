"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createInitialAppData } from "@/lib/mock-data";
import { ActiveWorkout, Exercise, Goal, PersistedAppData, UserProfile, WorkoutSet } from "@/lib/types";
import { uid } from "@/lib/utils";

type ExerciseInput = Omit<Exercise, "id" | "createdAt">;
type GoalInput = Omit<Goal, "id" | "createdAt" | "completed"> & { id?: string };
type QuickSetInput = Omit<WorkoutSet, "id" | "exerciseId">;

interface AppState extends PersistedAppData {
  hasHydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  completeOnboarding: (payload: Partial<UserProfile>) => void;
  setThemePreference: (theme: PersistedAppData["preferences"]["theme"]) => void;
  setUnits: (units: PersistedAppData["preferences"]["units"]) => void;
  setCategoryFilter: (filter: PersistedAppData["preferences"]["lastUsedExerciseCategoryFilter"]) => void;
  updateProfile: (payload: Partial<UserProfile>) => void;
  addExercise: (payload: ExerciseInput) => string;
  updateExercise: (exerciseId: string, payload: Partial<ExerciseInput>) => void;
  deleteExercise: (exerciseId: string) => void;
  upsertGoal: (payload: GoalInput) => void;
  deleteGoal: (goalId: string) => void;
  startWorkout: (exerciseIds: string[]) => string | null;
  addExerciseToActiveWorkout: (exerciseId: string) => void;
  addSetToActiveWorkout: (exerciseId: string, payload: QuickSetInput) => void;
  removeSetFromActiveWorkout: (exerciseId: string, setId: string) => void;
  updateActiveWorkoutMeta: (payload: Partial<Pick<ActiveWorkout, "notes" | "feeling">>) => void;
  finishActiveWorkout: (payload?: Partial<Pick<ActiveWorkout, "notes" | "feeling">>) => string | null;
  cancelActiveWorkout: () => void;
  importData: (payload: PersistedAppData) => void;
  resetData: () => void;
}

function initialState(): PersistedAppData & { hasHydrated: boolean } {
  return {
    ...createInitialAppData(),
    hasHydrated: false,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState(),
      setHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      completeOnboarding: (payload) =>
        set((state) => ({
          profile: { ...state.profile, ...payload },
          preferences: { ...state.preferences, onboardingCompleted: true },
        })),
      setThemePreference: (theme) =>
        set((state) => ({ preferences: { ...state.preferences, theme } })),
      setUnits: (units) =>
        set((state) => ({ preferences: { ...state.preferences, units } })),
      setCategoryFilter: (filter) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            lastUsedExerciseCategoryFilter: filter,
          },
        })),
      updateProfile: (payload) =>
        set((state) => ({
          profile: { ...state.profile, ...payload },
        })),
      addExercise: (payload) => {
        const exerciseId = uid("exercise");
        set((state) => ({
          exercises: [
            {
              id: exerciseId,
              createdAt: new Date().toISOString(),
              ...payload,
            },
            ...state.exercises,
          ],
        }));
        return exerciseId;
      },
      updateExercise: (exerciseId, payload) =>
        set((state) => ({
          exercises: state.exercises.map((exercise) =>
            exercise.id === exerciseId ? { ...exercise, ...payload } : exercise,
          ),
        })),
      deleteExercise: (exerciseId) =>
        set((state) => ({
          exercises: state.exercises.filter((exercise) => exercise.id !== exerciseId),
          goals: state.goals.filter((goal) => goal.exerciseId !== exerciseId),
          activeWorkout: state.activeWorkout
            ? {
                ...state.activeWorkout,
                exerciseEntries: state.activeWorkout.exerciseEntries.filter(
                  (entry) => entry.exerciseId !== exerciseId,
                ),
              }
            : null,
        })),
      upsertGoal: (payload) =>
        set((state) => {
          const goalId = payload.id ?? uid("goal");
          const nextGoal = {
            id: goalId,
            createdAt: payload.id
              ? state.goals.find((goal) => goal.id === payload.id)?.createdAt ?? new Date().toISOString()
              : new Date().toISOString(),
            completed: false,
            ...payload,
          };

          const exists = state.goals.some((goal) => goal.id === goalId);
          return {
            goals: exists
              ? state.goals.map((goal) => (goal.id === goalId ? { ...goal, ...nextGoal } : goal))
              : [nextGoal, ...state.goals],
          };
        }),
      deleteGoal: (goalId) =>
        set((state) => ({
          goals: state.goals.filter((goal) => goal.id !== goalId),
        })),
      startWorkout: (exerciseIds) => {
        const selected = [...new Set(exerciseIds)].filter(Boolean);
        if (selected.length === 0) return null;
        const workoutId = uid("workout");
        set({
          activeWorkout: {
            id: workoutId,
            startedAt: new Date().toISOString(),
            exerciseEntries: selected.map((exerciseId) => ({
              id: uid("entry"),
              exerciseId,
              sets: [],
            })),
            notes: "",
            feeling: 8,
          },
        });
        return workoutId;
      },
      addExerciseToActiveWorkout: (exerciseId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const exists = state.activeWorkout.exerciseEntries.some(
            (entry) => entry.exerciseId === exerciseId,
          );
          if (exists) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exerciseEntries: [
                ...state.activeWorkout.exerciseEntries,
                { id: uid("entry"), exerciseId, sets: [] },
              ],
            },
          };
        }),
      addSetToActiveWorkout: (exerciseId, payload) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exerciseEntries: state.activeWorkout.exerciseEntries.map((entry) =>
                entry.exerciseId === exerciseId
                  ? {
                      ...entry,
                      sets: [
                        ...entry.sets,
                        {
                          id: uid("set"),
                          exerciseId,
                          ...payload,
                        },
                      ],
                    }
                  : entry,
              ),
            },
          };
        }),
      removeSetFromActiveWorkout: (exerciseId, setId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exerciseEntries: state.activeWorkout.exerciseEntries.map((entry) =>
                entry.exerciseId === exerciseId
                  ? {
                      ...entry,
                      sets: entry.sets.filter((set) => set.id !== setId),
                    }
                  : entry,
              ),
            },
          };
        }),
      updateActiveWorkoutMeta: (payload) =>
        set((state) => ({
          activeWorkout: state.activeWorkout
            ? { ...state.activeWorkout, ...payload }
            : state.activeWorkout,
        })),
      finishActiveWorkout: (payload) => {
        const state = get();
        if (!state.activeWorkout) return null;

        const sessionId = uid("session");
        const endedAt = new Date().toISOString();
        const session = {
          id: sessionId,
          startedAt: state.activeWorkout.startedAt,
          endedAt,
          exerciseEntries: state.activeWorkout.exerciseEntries.filter((entry) => entry.sets.length > 0),
          notes: payload?.notes ?? state.activeWorkout.notes,
          feeling: payload?.feeling ?? state.activeWorkout.feeling,
        };

        set({
          sessions: [session, ...state.sessions],
          activeWorkout: null,
          lastCompletedSessionId: sessionId,
        });
        return sessionId;
      },
      cancelActiveWorkout: () => set({ activeWorkout: null }),
      importData: (payload) =>
        set({
          ...payload,
          hasHydrated: true,
        }),
      resetData: () =>
        set({
          ...createInitialAppData(),
          hasHydrated: true,
        }),
    }),
    {
      name: "irontrack-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        exercises: state.exercises,
        sessions: state.sessions,
        goals: state.goals,
        preferences: state.preferences,
        profile: state.profile,
        activeWorkout: state.activeWorkout,
        lastCompletedSessionId: state.lastCompletedSessionId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
