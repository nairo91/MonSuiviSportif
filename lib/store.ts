"use client";

import { create } from "zustand";
import { createEmptyAppData, normalizePersistedAppData } from "@/lib/default-data";
import { ActiveWorkout, Exercise, Goal, PersistedAppData, PlannedWorkout, TrainingPlan, UserProfile, WorkoutSet } from "@/lib/types";
import { uid } from "@/lib/utils";
import { mergeAppData } from "@/lib/merge";

type ExerciseInput = Omit<Exercise, "id" | "createdAt">;
type GoalInput = Omit<Goal, "id" | "createdAt" | "completed"> & { id?: string };
type QuickSetInput = Omit<WorkoutSet, "id" | "exerciseId">;

interface AppState extends PersistedAppData {
  serverRevision: number | null;
  hasHydrated: boolean;
  isRemoteLoading: boolean;
  isSyncing: boolean;
  backendConfigured: boolean;
  lastSyncError: string | null;
  loadRemoteState: () => Promise<void>;
  completeOnboarding: (payload: Partial<UserProfile>) => void;
  setThemePreference: (theme: PersistedAppData["preferences"]["theme"]) => void;
  setUnits: (units: PersistedAppData["preferences"]["units"]) => void;
  setRestTimerEnabled: (enabled: boolean) => void;
  setRestTimerSeconds: (seconds: number) => void;
  setCategoryFilter: (filter: PersistedAppData["preferences"]["lastUsedExerciseCategoryFilter"]) => void;
  updateProfile: (payload: Partial<UserProfile>) => void;
  addExercise: (payload: ExerciseInput) => string;
  updateExercise: (exerciseId: string, payload: Partial<ExerciseInput>) => void;
  deleteExercise: (exerciseId: string) => void;
  upsertGoal: (payload: GoalInput) => void;
  deleteGoal: (goalId: string) => void;
  startWorkout: (exerciseIds: string[]) => string | null;
  startWorkoutFromPlan: (workout: PlannedWorkout) => string | null;
  addExerciseToActiveWorkout: (exerciseId: string) => void;
  addSetToActiveWorkout: (exerciseId: string, payload: QuickSetInput) => void;
  removeSetFromActiveWorkout: (exerciseId: string, setId: string) => void;
  updateActiveWorkoutMeta: (payload: Partial<Pick<ActiveWorkout, "notes" | "feeling">>) => void;
  finishActiveWorkout: (payload?: Partial<Pick<ActiveWorkout, "notes" | "feeling">>) => string | null;
  cancelActiveWorkout: () => void;
  setTrainingPlan: (plan: TrainingPlan) => void;
  markPlannedWorkoutComplete: (workoutId: string, sessionId: string) => void;
  clearTrainingPlan: () => void;
  importData: (payload: PersistedAppData) => void;
  resetData: () => void;
  forceSync: () => Promise<void>;
}

let saveTimer: number | null = null;
const LOCAL_BACKUP_KEY = "irontrack-local-backup-v1";
const LOCAL_DIRTY_KEY = "irontrack-local-dirty-v1";
const LOCAL_REVISION_KEY = "irontrack-local-revision-v1";
const LAST_USER_KEY = "irontrack-last-user-v1";
const LOCAL_KEYS = [LOCAL_BACKUP_KEY, LOCAL_DIRTY_KEY, LOCAL_REVISION_KEY];

// Namespace des clés localStorage par utilisateur : évite qu'un compte
// affiche ou pousse le backup local d'un autre compte sur la même machine.
let activeUserId: string | null = null;

function storageKey(base: string) {
  return activeUserId ? `${base}:${activeUserId}` : base;
}

export function setActiveUser(userId: string | null) {
  activeUserId = userId;
  if (typeof window === "undefined" || !userId) return;

  try {
    const lastUser = window.localStorage.getItem(LAST_USER_KEY);
    if (lastUser !== userId) {
      for (const base of LOCAL_KEYS) {
        const legacyValue = window.localStorage.getItem(base);
        // Migration des anciennes clés globales vers le premier utilisateur connu,
        // sinon on les supprime (elles appartiennent à un autre compte).
        if (legacyValue !== null && !lastUser) {
          window.localStorage.setItem(`${base}:${userId}`, legacyValue);
        }
        window.localStorage.removeItem(base);
      }
      window.localStorage.setItem(LAST_USER_KEY, userId);
    }
  } catch (error) {
    console.error("setActiveUser failed", error);
  }
}

export function clearActiveUserLocalData() {
  if (typeof window === "undefined") return;

  try {
    for (const base of LOCAL_KEYS) {
      window.localStorage.removeItem(storageKey(base));
      window.localStorage.removeItem(base);
    }
    window.localStorage.removeItem(LAST_USER_KEY);
  } catch (error) {
    console.error("clearActiveUserLocalData failed", error);
  }
}

function readLocalBackup() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(storageKey(LOCAL_BACKUP_KEY));
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
    window.localStorage.setItem(storageKey(LOCAL_BACKUP_KEY), JSON.stringify(data));
  } catch (error) {
    console.error("Local backup write failed", error);
  }
}

function readLocalRevision() {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(storageKey(LOCAL_REVISION_KEY));
  if (!raw) return null;

  const revision = Number(raw);
  return Number.isInteger(revision) && revision >= 0 ? revision : null;
}

function writeLocalRevision(revision: number | null) {
  if (typeof window === "undefined") return;

  try {
    if (revision === null) {
      window.localStorage.removeItem(storageKey(LOCAL_REVISION_KEY));
      return;
    }

    window.localStorage.setItem(storageKey(LOCAL_REVISION_KEY), String(revision));
  } catch (error) {
    console.error("Local revision write failed", error);
  }
}

function readLocalDirtyFlag() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(storageKey(LOCAL_DIRTY_KEY)) === "1";
}

function writeLocalDirtyFlag(isDirty: boolean) {
  if (typeof window === "undefined") return;

  try {
    if (isDirty) {
      window.localStorage.setItem(storageKey(LOCAL_DIRTY_KEY), "1");
    } else {
      window.localStorage.removeItem(storageKey(LOCAL_DIRTY_KEY));
    }
  } catch (error) {
    console.error("Local dirty flag write failed", error);
  }
}

function initialState(): PersistedAppData & {
  serverRevision: number | null;
  hasHydrated: boolean;
  isRemoteLoading: boolean;
  isSyncing: boolean;
  backendConfigured: boolean;
  lastSyncError: string | null;
} {
  return {
    ...createEmptyAppData(),
    serverRevision: null,
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
    trainingPlan: state.trainingPlan,
    preferences: state.preferences,
    profile: state.profile,
    activeWorkout: state.activeWorkout,
    lastCompletedSessionId: state.lastCompletedSessionId,
  };
}

async function persistSnapshot(
  data: PersistedAppData,
  set: (partial: Partial<AppState>) => void,
  expectedRevision: number | null,
  hasRetriedAfterConflict = false,
) {
  writeLocalBackup(data);
  writeLocalDirtyFlag(true);
  set({ isSyncing: true, lastSyncError: null });

  if (expectedRevision === null) {
    set({
      isSyncing: false,
      lastSyncError: "Révision serveur introuvable. Rechargez l'application.",
    });
    return;
  }

  try {
    const response = await fetch("/api/state", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      keepalive: true,
      body: JSON.stringify({
        data,
        revision: expectedRevision,
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 409 && payload?.data) {
        const latest = normalizePersistedAppData(payload.data);
        const latestRevision =
          typeof payload?.revision === "number" ? payload.revision : expectedRevision;

        if (!hasRetriedAfterConflict && latestRevision !== null) {
          // Conflit de révision : on fusionne les modifications locales avec
          // l'état serveur puis on retente une fois, au lieu de jeter le local.
          const merged = mergeAppData(data, latest);
          writeLocalBackup(merged);
          writeLocalRevision(latestRevision);
          set({
            ...merged,
            serverRevision: latestRevision,
            backendConfigured: Boolean(payload?.backendConfigured),
          });
          await persistSnapshot(merged, set, latestRevision, true);
          return;
        }

        // Deuxième conflit d'affilée : l'état serveur fait autorité.
        writeLocalBackup(latest);
        writeLocalRevision(latestRevision);
        writeLocalDirtyFlag(false);
        set({
          ...latest,
          serverRevision: latestRevision,
          backendConfigured: Boolean(payload?.backendConfigured),
          lastSyncError:
            payload?.error ??
            "Une version plus récente a été détectée. Les données serveur ont été rechargées.",
        });
        return;
      }

      set({
        backendConfigured: Boolean(payload?.backendConfigured),
        lastSyncError: payload?.error ?? "Échec de la sauvegarde serveur.",
      });
      return;
    }

    const nextRevision =
      typeof payload?.revision === "number" ? payload.revision : expectedRevision + 1;

    writeLocalDirtyFlag(false);
    writeLocalRevision(nextRevision);
    if (payload?.data) {
      writeLocalBackup(normalizePersistedAppData(payload.data));
    }
    set({
      serverRevision: nextRevision,
      backendConfigured: Boolean(payload?.backendConfigured),
      lastSyncError: null,
    });
  } catch (error) {
    console.error("Remote save failed", error);
    set({
      lastSyncError: "Connexion au serveur impossible. Sauvegarde locale conservée.",
    });
  } finally {
    set({ isSyncing: false });
  }
}

let onlineListenerRegistered = false;

// À la reconnexion réseau, re-pousse automatiquement le backup local
// s'il reste des modifications non synchronisées.
function registerOnlineRetry(get: () => AppState, set: (partial: Partial<AppState>) => void) {
  if (typeof window === "undefined" || onlineListenerRegistered) return;
  onlineListenerRegistered = true;

  window.addEventListener("online", () => {
    const state = get();
    if (readLocalDirtyFlag() && !state.isSyncing) {
      void persistSnapshot(snapshot(state), set, state.serverRevision);
    }
  });
}

function scheduleRemoteSave(get: () => AppState, set: (partial: Partial<AppState>) => void) {
  if (typeof window === "undefined") return;

  const state = get();
  const data = snapshot(state);
  writeLocalBackup(data);
  writeLocalDirtyFlag(true);
  writeLocalRevision(state.serverRevision);

  if (saveTimer) window.clearTimeout(saveTimer);

  saveTimer = window.setTimeout(() => {
    const currentState = get();
    void persistSnapshot(snapshot(currentState), set, currentState.serverRevision);
  }, 350);
}

export const useAppStore = create<AppState>()((set, get) => ({
  ...initialState(),
  loadRemoteState: async () => {
    const state = get();
    if (state.hasHydrated || state.isRemoteLoading) return;
    registerOnlineRetry(get, set);

    const localBackup = readLocalBackup();
    const localDirty = readLocalDirtyFlag();
    const localRevision = readLocalRevision();

    if (localBackup) {
      set({
        ...localBackup,
        serverRevision: localRevision,
        hasHydrated: true,
        isRemoteLoading: !localDirty,
      });
    }

    if (localBackup && localDirty && localRevision !== null) {
      await persistSnapshot(localBackup, set, localRevision);
      set({
        hasHydrated: true,
        isRemoteLoading: false,
      });
      return;
    }

    if (!localBackup) {
      set({ isRemoteLoading: true });
    }

    try {
      const response = await fetch("/api/state", {
        method: "GET",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "Échec du chargement serveur.");
      }

      const serverBackendConfigured = Boolean(payload.backendConfigured);
      const freshLocalBackup = readLocalBackup();

      // If the server has no persistent backend, local storage is the source of
      // truth — don't overwrite the user's data with the server's empty default.
      if (!serverBackendConfigured && freshLocalBackup) {
        set({
          serverRevision: 0,
          hasHydrated: true,
          isRemoteLoading: false,
          backendConfigured: false,
          lastSyncError: null,
        });
        return;
      }

      let normalized = normalizePersistedAppData(payload.data);

      // Relecture du localStorage à la réception pour attraper les races
      // (modification pendant le GET en vol) : si des changements locaux non
      // synchronisés existent, on fusionne au lieu d'écraser.
      if (freshLocalBackup && readLocalDirtyFlag()) {
        normalized = mergeAppData(freshLocalBackup, normalized);
      } else if (freshLocalBackup?.preferences?.onboardingCompleted) {
        normalized.preferences.onboardingCompleted = true;
      }

      writeLocalBackup(normalized);
      writeLocalRevision(typeof payload?.revision === "number" ? payload.revision : 0);
      writeLocalDirtyFlag(false);

      set({
        ...normalized,
        serverRevision: typeof payload?.revision === "number" ? payload.revision : 0,
        hasHydrated: true,
        isRemoteLoading: false,
        backendConfigured: serverBackendConfigured,
        lastSyncError: null,
      });
    } catch (error) {
      console.error("Remote load failed", error);
      const message =
        error instanceof Error
          ? error.message
          : "Connexion au serveur impossible. Sauvegarde locale utilisée si disponible.";

      if (localBackup) {
        set({
          serverRevision: localRevision,
          hasHydrated: true,
          isRemoteLoading: false,
          lastSyncError: message,
        });
        return;
      }

      set({
        ...createEmptyAppData(),
        serverRevision: null,
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
  setRestTimerEnabled: (enabled) => {
    set((state) => ({ preferences: { ...state.preferences, restTimerEnabled: enabled } }));
    scheduleRemoteSave(get, set);
  },
  setRestTimerSeconds: (seconds) => {
    set((state) => ({
      preferences: { ...state.preferences, restTimerSeconds: Math.min(Math.max(seconds, 15), 600) },
    }));
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
  startWorkoutFromPlan: (workout) => {
    const exercises = workout.exercises.filter((planned) => Boolean(planned.exerciseId));
    if (exercises.length === 0) return null;

    const workoutId = uid("workout");
    set({
      activeWorkout: {
        id: workoutId,
        startedAt: new Date().toISOString(),
        plannedWorkoutId: workout.id,
        exerciseEntries: exercises.map((planned) => ({
          id: uid("entry"),
          exerciseId: planned.exerciseId,
          // Pré-remplit les séries planifiées (poids/reps du coach) ;
          // l'utilisateur les ajuste pendant la séance.
          sets: planned.sets.map((plannedSet) => ({
            id: uid("set"),
            exerciseId: planned.exerciseId,
            weight: plannedSet.weight,
            reps: plannedSet.reps,
            ...(plannedSet.rpe !== undefined ? { rpe: plannedSet.rpe } : {}),
          })),
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

    const plannedWorkoutId = state.activeWorkout.plannedWorkoutId;
    set({
      sessions: [session, ...state.sessions],
      activeWorkout: null,
      lastCompletedSessionId: sessionId,
      // Si la séance venait du plan coach, on la marque « faite » avec le
      // vrai sessionId — c'est ici (et seulement ici) que le plan avance.
      trainingPlan:
        plannedWorkoutId && state.trainingPlan
          ? {
              ...state.trainingPlan,
              workouts: state.trainingPlan.workouts.map((w) =>
                w.id === plannedWorkoutId ? { ...w, completedSessionId: sessionId } : w,
              ),
            }
          : state.trainingPlan,
    });
    scheduleRemoteSave(get, set);
    return sessionId;
  },
  cancelActiveWorkout: () => {
    set({ activeWorkout: null });
    scheduleRemoteSave(get, set);
  },
  setTrainingPlan: (plan) => {
    set({ trainingPlan: plan });
    scheduleRemoteSave(get, set);
  },
  markPlannedWorkoutComplete: (workoutId, sessionId) => {
    set((state) => {
      if (!state.trainingPlan) return state;
      return {
        trainingPlan: {
          ...state.trainingPlan,
          workouts: state.trainingPlan.workouts.map((w) =>
            w.id === workoutId ? { ...w, completedSessionId: sessionId } : w,
          ),
        },
      };
    });
    scheduleRemoteSave(get, set);
  },
  clearTrainingPlan: () => {
    set({ trainingPlan: null });
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
  forceSync: async () => {
    const state = get();
    if (state.isSyncing) return;
    set({ lastSyncError: null });
    await persistSnapshot(snapshot(state), set, state.serverRevision);
  },
}));
