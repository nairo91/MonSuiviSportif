"use client";

import { create } from "zustand";
import { createEmptyAppData, normalizePersistedAppData } from "@/lib/default-data";
import { ActiveWorkout, Exercise, Goal, PersistedAppData, UserProfile, WorkoutSet } from "@/lib/types";
import { uid } from "@/lib/utils";

type ExerciseInput = Omit<Exercise, "id" | "createdAt">;
type GoalInput = Omit<Goal, "id" | "createdAt" | "completed"> & { id?: string };
type QuickSetInput = Omit<WorkoutSet, "id" | "exerciseId">;

interface AppState extends PersistedAppData {
  hasHydrated: boolean;
  isRemoteLoading: boolean;
  isSyncing: boolean;
  backendConfigured: boolean;
  lastSyncError: string | null;
  loadRemoteState: () => Promise<void>;
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

let saveTimer: number | null = null;
const LOCAL_BACKUP_KEY = "irontrack-local-backup-v1";

function readLocalBackup() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LOCAL_BACKUP_KEY);
    if (!raw) return null;
    return normalizePersistedAppData(JSON.parse(raw));
  } catch (error) {
    console.error("Local backup read failed", error);
    return null;
  }
}

function writeLocalBackup(data: PersistedAppData) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Local backup write failed", error);
  }
}

function initialState(): PersistedAppData & {
  hasHydrated: boolean;
  isRemoteLoading: boolean;
  isSyncing: boolean;
  backendConfigured: boolean;
  lastSyncError: string | null;
} {
  return {
    ...createEmptyAppData(),
    hasHydrated: false,
    isRemoteLoading: false,
    isSyncing: false,
    backendConfigured: false,
    lastSyncError: null,
  };
}

function snapshot(state: AppState): PersistedAppData {
  return {
    exercises: state.exercises,
    sessions: state.sessions,
    goals: state.goals,
    preferences: state.preferences,
    profile: state.profile,
    activeWorkout: state.activeWorkout,
    lastCompletedSessionId: state.lastCompletedSessionId,
  };
}

function scheduleRemoteSave(get: () => AppState, set: (partial: Partial<AppState>) => void) {
  if (typeof window === "undefined") return;
  writeLocalBackup(snapshot(get()));
  if (saveTimer) window.clearTimeout(saveTimer);

  saveTimer = window.setTimeout(async () => {
    set({ isSyncing: true, lastSyncError: null });
    try {
      const response = await fetch("/api/state", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(snapshot(get())),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        set({
          backendConfigured: Boolean(payload?.backendConfigured),
          lastSyncError: payload?.error ?? "Echec de la sauvegarde serveur.",
        });
        return;
      }

      set({
        backendConfigured: Boolean(payload?.backendConfigured),
        lastSyncError: null,
      });
    } catch (error) {
      console.error("Remote save failed", error);
      set({
        lastSyncError: "Connexion au serveur impossible. Sauvegarde locale conservee.",
      });
    } finally {
      set({ isSyncing: false });
    }
  }, 350);
}

export const useAppStore = create<AppState>()((set, get) => ({
  ...initialState(),
  loadRemoteState: async () => {
    const state = get();
    if (state.hasHydrated || state.isRemoteLoading) return;

    const localBackup = readLocalBackup();
    if (localBackup) {
      set({
        ...localBackup,
        hasHydrated: true,
        isRemoteLoading: true,
      });
    } else {
      set({ isRemoteLoading: true });
    }

    try {
      const response = await fetch("/api/state", {
        method: "GET",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "Echec du chargement serveur.");
      }

      const normalized = normalizePersistedAppData(payload.data);
      writeLocalBackup(normalized);

      set({
        ...normalized,
        hasHydrated: true,
        isRemoteLoading: false,
        backendConfigured: Boolean(payload.backendConfigured),
        lastSyncError: null,
      });
    } catch (error) {
      console.error("Remote load failed", error);
      const message =
        error instanceof Error
          ? error.message
          : "Connexion au serveur impossible. Sauvegarde locale utilisee si disponible.";

      if (localBackup) {
        set({
          hasHydrated: true,
          isRemoteLoading: false,
          lastSyncError: message,
        });
        return;
      }

      set({
        ...createEmptyAppData(),
        hasHydrated: true,
        isRemoteLoading: false,
        backendConfigured: false,
        lastSyncError: message,
      });
    }
  },
  completeOnboarding: (payload) => {
    set((state) => ({
      profile: { ...state.profile, ...payload },
      preferences: { ...state.preferences, onboardingCompleted: true },
    }));
    scheduleRemoteSave(get, set);
  },
  setThemePreference: (theme) => {
    set((state) => ({ preferences: { ...state.preferences, theme } }));
    scheduleRemoteSave(get, set);
  },
  setUnits: (units) => {
    set((state) => ({ preferences: { ...state.preferences, units } }));
    scheduleRemoteSave(get, set);
  },
  setCategoryFilter: (filter) => {
    set((state) => ({
      preferences: {
        ...state.preferences,
        lastUsedExerciseCategoryFilter: filter,
      },
    }));
    scheduleRemoteSave(get, set);
  },
  updateProfile: (payload) => {
    set((state) => ({
      profile: { ...state.profile, ...payload },
    }));
    scheduleRemoteSave(get, set);
  },
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
    scheduleRemoteSave(get, set);
    return exerciseId;
  },
  updateExercise: (exerciseId, payload) => {
    set((state) => ({
      exercises: state.exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, ...payload } : exercise,
      ),
    }));
    scheduleRemoteSave(get, set);
  },
  deleteExercise: (exerciseId) => {
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
    }));
    scheduleRemoteSave(get, set);
  },
  upsertGoal: (payload) => {
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
    });
    scheduleRemoteSave(get, set);
  },
  deleteGoal: (goalId) => {
    set((state) => ({
      goals: state.goals.filter((goal) => goal.id !== goalId),
    }));
    scheduleRemoteSave(get, set);
  },
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
    scheduleRemoteSave(get, set);
    return workoutId;
  },
  addExerciseToActiveWorkout: (exerciseId) => {
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
    });
    scheduleRemoteSave(get, set);
  },
  addSetToActiveWorkout: (exerciseId, payload) => {
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
    });
    scheduleRemoteSave(get, set);
  },
  removeSetFromActiveWorkout: (exerciseId, setId) => {
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
    });
    scheduleRemoteSave(get, set);
  },
  updateActiveWorkoutMeta: (payload) => {
    set((state) => ({
      activeWorkout: state.activeWorkout
        ? { ...state.activeWorkout, ...payload }
        : state.activeWorkout,
    }));
    scheduleRemoteSave(get, set);
  },
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
    scheduleRemoteSave(get, set);
    return sessionId;
  },
  cancelActiveWorkout: () => {
    set({ activeWorkout: null });
    scheduleRemoteSave(get, set);
  },
  importData: (payload) => {
    set({
      ...normalizePersistedAppData(payload),
      hasHydrated: true,
    });
    scheduleRemoteSave(get, set);
  },
  resetData: () => {
    set({
      ...createEmptyAppData(),
      hasHydrated: true,
    });
    scheduleRemoteSave(get, set);
  },
}));
