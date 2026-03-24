export type MuscleCategory =
  | "Pectoraux"
  | "Dos"
  | "Jambes"
  | "Epaules"
  | "Biceps"
  | "Triceps"
  | "Abdos"
  | "Autres";

export type CategoryFilter = "Tous" | MuscleCategory;

export type GoalType = "weight" | "reps" | "volume" | "pr";

export type ThemeMode = "dark" | "light" | "system";

export type Units = "kg" | "lb";

export type ExerciseIconKey =
  | "dumbbell"
  | "target"
  | "trending-up"
  | "flame"
  | "shield"
  | "zap"
  | "waves"
  | "orbit"
  | "sparkles"
  | "activity";

export interface Exercise {
  id: string;
  name: string;
  category: MuscleCategory;
  subcategory?: string;
  icon: ExerciseIconKey;
  notes: string;
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  weight: number;
  reps: number;
  rpe?: number;
  restSeconds?: number;
  note?: string;
}

export interface WorkoutExerciseEntry {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  startedAt: string;
  endedAt: string;
  exerciseEntries: WorkoutExerciseEntry[];
  notes: string;
  feeling?: number;
}

export interface Goal {
  id: string;
  exerciseId: string;
  type: GoalType;
  targetWeight?: number;
  targetReps?: number;
  targetVolume?: number;
  deadline?: string;
  completed: boolean;
  createdAt: string;
}

export interface UserPreferences {
  theme: ThemeMode;
  lastUsedExerciseCategoryFilter: CategoryFilter;
  units: Units;
  onboardingCompleted: boolean;
}

export interface UserProfile {
  name: string;
  trainingFocus: string;
  weeklyTarget: number;
}

export interface ActiveWorkout {
  id: string;
  startedAt: string;
  exerciseEntries: WorkoutExerciseEntry[];
  notes: string;
  feeling?: number;
}

export interface PersistedAppData {
  exercises: Exercise[];
  sessions: WorkoutSession[];
  goals: Goal[];
  preferences: UserPreferences;
  profile: UserProfile;
  activeWorkout: ActiveWorkout | null;
  lastCompletedSessionId: string | null;
}

export type TimeRange = "7d" | "30d" | "3m" | "1y" | "all";

export interface ExerciseStats {
  lastPerformedAt?: string;
  lastWeight: number;
  lastReps: number;
  bestWeight: number;
  bestVolume: number;
  totalSessions: number;
  practiceFrequency: number;
}

export interface GoalProgress {
  progress: number;
  current: number;
  target: number;
  status: "en cours" | "presque atteint" | "atteint";
}
