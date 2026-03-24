import {
  differenceInCalendarDays,
  differenceInMinutes,
  isAfter,
  parseISO,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { GOAL_TYPE_LABELS } from "@/lib/constants";
import {
  Exercise,
  ExerciseStats,
  Goal,
  GoalProgress,
  PersistedAppData,
  TimeRange,
  WorkoutExerciseEntry,
  WorkoutSession,
} from "@/lib/types";
import { clamp } from "@/lib/utils";

export function getExerciseMap(exercises: Exercise[]) {
  return new Map(exercises.map((exercise) => [exercise.id, exercise]));
}

export function getEntryVolume(entry: WorkoutExerciseEntry) {
  return entry.sets.reduce((total, set) => total + set.weight * set.reps, 0);
}

export function getSessionVolume(session: WorkoutSession) {
  return session.exerciseEntries.reduce((total, entry) => total + getEntryVolume(entry), 0);
}

export function getWorkoutDurationMinutes(session: Pick<WorkoutSession, "startedAt" | "endedAt">) {
  return Math.max(1, differenceInMinutes(parseISO(session.endedAt), parseISO(session.startedAt)));
}

export function filterSessionsByRange(sessions: WorkoutSession[], range: TimeRange) {
  if (range === "all") return sessions;
  const now = new Date();
  const from =
    range === "7d"
      ? subDays(now, 7)
      : range === "30d"
        ? subDays(now, 30)
        : range === "3m"
          ? subMonths(now, 3)
          : subYears(now, 1);

  return sessions.filter((session) => isAfter(parseISO(session.startedAt), from));
}

export function getExerciseHistory(exerciseId: string, sessions: WorkoutSession[]) {
  return sessions
    .filter((session) =>
      session.exerciseEntries.some((entry) => entry.exerciseId === exerciseId),
    )
    .sort((a, b) => +new Date(a.startedAt) - +new Date(b.startedAt));
}

export function getExerciseStats(exerciseId: string, sessions: WorkoutSession[]): ExerciseStats {
  const history = getExerciseHistory(exerciseId, sessions);
  if (history.length === 0) {
    return {
      lastWeight: 0,
      lastReps: 0,
      bestWeight: 0,
      bestVolume: 0,
      totalSessions: 0,
      practiceFrequency: 0,
    };
  }

  const sessionMetrics = history.map((session) => {
    const entry = session.exerciseEntries.find((item) => item.exerciseId === exerciseId)!;
    const topSet = [...entry.sets].sort((a, b) => b.weight - a.weight || b.reps - a.reps)[0];
    return {
      session,
      entry,
      topSet,
      volume: getEntryVolume(entry),
    };
  });

  const latest = sessionMetrics[sessionMetrics.length - 1];
  const daysBetween =
    history.length > 1
      ? Math.max(
          1,
          differenceInCalendarDays(parseISO(history.at(-1)!.startedAt), parseISO(history[0].startedAt)),
        )
      : 7;

  return {
    lastPerformedAt: latest.session.startedAt,
    lastWeight: latest.topSet.weight,
    lastReps: latest.topSet.reps,
    bestWeight: Math.max(...sessionMetrics.map((metric) => metric.topSet.weight)),
    bestVolume: Math.max(...sessionMetrics.map((metric) => metric.volume)),
    totalSessions: history.length,
    practiceFrequency: Number(((history.length / daysBetween) * 7).toFixed(1)),
  };
}

export function getGoalProgress(goal: Goal, sessions: WorkoutSession[]): GoalProgress {
  const stats = getExerciseStats(goal.exerciseId, sessions);

  let current = 0;
  let target = 1;

  if (goal.type === "weight") {
    current = stats.bestWeight;
    target = goal.targetWeight ?? 1;
  } else if (goal.type === "reps") {
    const history = getExerciseHistory(goal.exerciseId, sessions);
    current = Math.max(
      0,
      ...history.flatMap((session) =>
        session.exerciseEntries
          .filter((entry) => entry.exerciseId === goal.exerciseId)
          .flatMap((entry) => entry.sets.map((set) => set.reps)),
      ),
    );
    target = goal.targetReps ?? 1;
  } else if (goal.type === "volume") {
    current = stats.bestVolume;
    target = goal.targetVolume ?? 1;
  } else {
    current = stats.bestWeight;
    target = stats.bestWeight + 2.5;
  }

  const progress = clamp(Math.round((current / target) * 100), 0, 100);
  const status =
    progress >= 100 ? "atteint" : progress >= 85 ? "presque atteint" : "en cours";

  return {
    progress,
    current,
    target,
    status,
  };
}

export function getFrequentExercises(data: PersistedAppData, limit = 5) {
  const counts = new Map<string, number>();
  data.sessions.forEach((session) => {
    session.exerciseEntries.forEach((entry) => {
      counts.set(entry.exerciseId, (counts.get(entry.exerciseId) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([exerciseId]) => data.exercises.find((exercise) => exercise.id === exerciseId))
    .filter(Boolean) as Exercise[];
}

export function getRecentExercises(data: PersistedAppData, limit = 5) {
  const seen = new Set<string>();
  const result: Exercise[] = [];

  [...data.sessions]
    .sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt))
    .forEach((session) => {
      session.exerciseEntries.forEach((entry) => {
        if (seen.has(entry.exerciseId)) return;
        const exercise = data.exercises.find((item) => item.id === entry.exerciseId);
        if (exercise) {
          seen.add(entry.exerciseId);
          result.push(exercise);
        }
      });
    });

  return result.slice(0, limit);
}

export function getExerciseTimeline(exerciseId: string, sessions: WorkoutSession[], range: TimeRange) {
  return filterSessionsByRange(getExerciseHistory(exerciseId, sessions), range).map((session) => {
    const entry = session.exerciseEntries.find((item) => item.exerciseId === exerciseId)!;
    const topWeight = Math.max(...entry.sets.map((set) => set.weight));
    const topReps = Math.max(...entry.sets.map((set) => set.reps));
    return {
      date: session.startedAt,
      weight: topWeight,
      reps: topReps,
      volume: getEntryVolume(entry),
    };
  });
}

export function getGlobalVolumeTimeline(sessions: WorkoutSession[], range: TimeRange) {
  return filterSessionsByRange(
    [...sessions].sort((a, b) => +new Date(a.startedAt) - +new Date(b.startedAt)),
    range,
  ).map((session) => ({
    date: session.startedAt,
    volume: getSessionVolume(session),
  }));
}

export function getCategoryBreakdown(sessions: WorkoutSession[], exercises: Exercise[]) {
  const exerciseMap = getExerciseMap(exercises);
  const map = new Map<string, number>();
  sessions.forEach((session) => {
    session.exerciseEntries.forEach((entry) => {
      const exercise = exerciseMap.get(entry.exerciseId);
      const category = exercise?.category ?? "Autres";
      map.set(category, (map.get(category) ?? 0) + getEntryVolume(entry));
    });
  });

  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getMostPracticedExercise(data: PersistedAppData) {
  return getFrequentExercises(data, 1)[0];
}

export function getRecentRecords(sessions: WorkoutSession[], exercises: Exercise[]) {
  const exerciseMap = getExerciseMap(exercises);
  const bestWeight = new Map<string, number>();
  const bestVolume = new Map<string, number>();
  const records: {
    sessionId: string;
    exerciseId: string;
    title: string;
    value: number;
    date: string;
  }[] = [];

  [...sessions]
    .sort((a, b) => +new Date(a.startedAt) - +new Date(b.startedAt))
    .forEach((session) => {
      session.exerciseEntries.forEach((entry) => {
        const topWeight = Math.max(...entry.sets.map((set) => set.weight));
        const volume = getEntryVolume(entry);
        const exerciseName = exerciseMap.get(entry.exerciseId)?.name ?? "Exercice";

        if (topWeight > (bestWeight.get(entry.exerciseId) ?? -1)) {
          bestWeight.set(entry.exerciseId, topWeight);
          records.push({
            sessionId: session.id,
            exerciseId: entry.exerciseId,
            title: `${exerciseName} - meilleur poids`,
            value: topWeight,
            date: session.startedAt,
          });
        }

        if (volume > (bestVolume.get(entry.exerciseId) ?? -1)) {
          bestVolume.set(entry.exerciseId, volume);
          records.push({
            sessionId: session.id,
            exerciseId: entry.exerciseId,
            title: `${exerciseName} - meilleur volume`,
            value: volume,
            date: session.startedAt,
          });
        }
      });
    });

  return records.sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 8);
}

export function getSessionRecords(
  session: WorkoutSession,
  allSessions: WorkoutSession[],
  exercises: Exercise[],
) {
  const previousSessions = allSessions.filter(
    (item) => item.id !== session.id && +new Date(item.startedAt) < +new Date(session.startedAt),
  );
  const previousRecords = getRecentRecords(previousSessions, exercises);
  const previousMap = new Map<string, number>();
  previousRecords.forEach((record) => {
    const key = `${record.exerciseId}-${record.title.includes("poids") ? "weight" : "volume"}`;
    previousMap.set(key, Math.max(previousMap.get(key) ?? 0, record.value));
  });

  return session.exerciseEntries.flatMap((entry) => {
    const weight = Math.max(...entry.sets.map((set) => set.weight));
    const volume = getEntryVolume(entry);
    const exerciseName =
      exercises.find((exercise) => exercise.id === entry.exerciseId)?.name ?? "Exercice";
    const rows = [];

    if (weight > (previousMap.get(`${entry.exerciseId}-weight`) ?? -1)) {
      rows.push(`${exerciseName} - nouveau PR poids`);
    }
    if (volume > (previousMap.get(`${entry.exerciseId}-volume`) ?? -1)) {
      rows.push(`${exerciseName} - nouveau PR volume`);
    }
    return rows;
  });
}

export function getGoalHeadline(goal: Goal) {
  return GOAL_TYPE_LABELS[goal.type];
}
