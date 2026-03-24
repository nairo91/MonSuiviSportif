"use client";

import { useRouter } from "next/navigation";
import { Clock3, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CategoryFilterChips } from "@/components/category-filter";
import { ExerciseIcon } from "@/components/exercise-icon";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatRelative, formatVolume, formatWeight } from "@/lib/format";
import { getEntryVolume, getExerciseStats } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";
import { CategoryFilter } from "@/lib/types";

type Draft = {
  weight: string;
  reps: string;
  rpe: string;
  rest: string;
  note: string;
};

function computeElapsedMinutes(startedAt: string) {
  return Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 60_000));
}

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const exercises = useAppStore((state) => state.exercises);
  const sessions = useAppStore((state) => state.sessions);
  const preferences = useAppStore((state) => state.preferences);
  const activeWorkout = useAppStore((state) => state.activeWorkout);
  const addSetToActiveWorkout = useAppStore((state) => state.addSetToActiveWorkout);
  const removeSetFromActiveWorkout = useAppStore((state) => state.removeSetFromActiveWorkout);
  const addExerciseToActiveWorkout = useAppStore((state) => state.addExerciseToActiveWorkout);
  const finishActiveWorkout = useAppStore((state) => state.finishActiveWorkout);
  const cancelActiveWorkout = useAppStore((state) => state.cancelActiveWorkout);

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [notes, setNotes] = useState(activeWorkout?.notes ?? "");
  const [feeling, setFeeling] = useState(String(activeWorkout?.feeling ?? 8));
  const [pickerFilter, setPickerFilter] = useState<CategoryFilter>("Tous");
  const [elapsedMinutes, setElapsedMinutes] = useState(() =>
    activeWorkout ? computeElapsedMinutes(activeWorkout.startedAt) : 1,
  );

  useEffect(() => {
    if (!activeWorkout) return;
    const startedAt = activeWorkout.startedAt;
    const timer = window.setInterval(
      () => setElapsedMinutes(computeElapsedMinutes(startedAt)),
      30_000,
    );
    return () => window.clearInterval(timer);
  }, [activeWorkout]);

  const remainingExercises = useMemo(() => {
    const usedIds = new Set((activeWorkout?.exerciseEntries ?? []).map((entry) => entry.exerciseId));
    return exercises.filter((exercise) => {
      const matchesFilter = pickerFilter === "Tous" || exercise.category === pickerFilter;
      return matchesFilter && !usedIds.has(exercise.id);
    });
  }, [activeWorkout?.exerciseEntries, exercises, pickerFilter]);

  if (!activeWorkout) {
    return (
      <EmptyState
        icon={Clock3}
        title="Aucune seance active"
        description="Lancez une seance pour commencer a enregistrer vos series."
        actionLabel="Preparer une seance"
        onAction={() => router.push("/workouts/start")}
      />
    );
  }

  const totalSets = activeWorkout.exerciseEntries.reduce((total, entry) => total + entry.sets.length, 0);

  const makeDraft = (exerciseId: string): Draft => {
    const stats = getExerciseStats(exerciseId, sessions);
    return {
      weight: stats.lastWeight ? String(stats.lastWeight) : "",
      reps: stats.lastReps ? String(stats.lastReps) : "10",
      rpe: "8",
      rest: "90",
      note: "",
    };
  };

  const getDraft = (exerciseId: string) => drafts[exerciseId] ?? makeDraft(exerciseId);
  const updateDraft = (exerciseId: string, field: keyof Draft, value: string) => {
    setDrafts((current) => ({
      ...current,
      [exerciseId]: {
        ...getDraft(exerciseId),
        [field]: value,
      },
    }));
  };

  const handleAddSet = (exerciseId: string) => {
    const draft = getDraft(exerciseId);
    const weight = Number(draft.weight || 0);
    const reps = Number(draft.reps || 0);
    if (Number.isNaN(weight) || reps <= 0) {
      toast.error("Renseignez un poids valide et des repetitions superieures a zero.");
      return;
    }

    addSetToActiveWorkout(exerciseId, {
      weight,
      reps,
      rpe: Number(draft.rpe || 0) || undefined,
      restSeconds: Number(draft.rest || 0) || undefined,
      note: draft.note || undefined,
    });

    setDrafts((current) => ({
      ...current,
      [exerciseId]: {
        ...draft,
        note: "",
      },
    }));
    toast.success("Serie ajoutee.");
  };

  const handleFinish = () => {
    if (totalSets === 0) {
      toast.error("Ajoutez au moins une serie avant de terminer.");
      return;
    }

    const sessionId = finishActiveWorkout({
      notes,
      feeling: Number(feeling),
    });

    if (!sessionId) return;
    toast.success("Seance enregistree.");
    router.push(`/workouts/summary/${sessionId}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Live Session"
        title="Seance active"
        description={`${elapsedMinutes} min deja ecoulees`}
        actions={<Badge>{totalSets} series</Badge>}
      />

      <div className="glass-card p-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Duree</p>
            <p className="mt-1 font-semibold">{elapsedMinutes} min</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Exercices</p>
            <p className="mt-1 font-semibold">{activeWorkout.exerciseEntries.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Series</p>
            <p className="mt-1 font-semibold">{totalSets}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {activeWorkout.exerciseEntries.map((entry) => {
          const exercise = exercises.find((item) => item.id === entry.exerciseId);
          if (!exercise) return null;
          const stats = getExerciseStats(exercise.id, sessions);
          const draft = getDraft(exercise.id);

          return (
            <div key={entry.id} className="glass-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ExerciseIcon icon={exercise.icon} category={exercise.category} />
                  <div>
                    <h2 className="font-display text-xl font-semibold">{exercise.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      Derniere perf {formatWeight(stats.lastWeight, preferences.units)} x {stats.lastReps}
                    </p>
                  </div>
                </div>
                <Badge>{entry.sets.length} series</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Input
                  inputMode="decimal"
                  placeholder="Poids"
                  value={draft.weight}
                  onChange={(event) => updateDraft(exercise.id, "weight", event.target.value)}
                />
                <Input
                  inputMode="numeric"
                  placeholder="Reps"
                  value={draft.reps}
                  onChange={(event) => updateDraft(exercise.id, "reps", event.target.value)}
                />
                <Input
                  inputMode="numeric"
                  placeholder="RPE"
                  value={draft.rpe}
                  onChange={(event) => updateDraft(exercise.id, "rpe", event.target.value)}
                />
                <Input
                  inputMode="numeric"
                  placeholder="Repos sec"
                  value={draft.rest}
                  onChange={(event) => updateDraft(exercise.id, "rest", event.target.value)}
                />
              </div>

              <Input
                className="mt-3"
                placeholder="Note optionnelle sur la serie"
                value={draft.note}
                onChange={(event) => updateDraft(exercise.id, "note", event.target.value)}
              />

              <Button size="lg" className="mt-4 w-full" onClick={() => handleAddSet(exercise.id)}>
                <Plus className="size-4" />
                Valider la serie
              </Button>

              <div className="mt-4 space-y-2">
                {entry.sets.map((set, index) => (
                  <div
                    key={set.id}
                    className="flex items-center justify-between rounded-[20px] border border-white/8 bg-white/4 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">
                        Serie {index + 1} · {formatWeight(set.weight, preferences.units)} x {set.reps}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        RPE {set.rpe ?? "-"} · repos {set.restSeconds ?? "-"}s
                      </p>
                    </div>
                    <button
                      onClick={() => removeSetFromActiveWorkout(exercise.id, set.id)}
                      className="rounded-full bg-white/5 p-2 text-muted-foreground transition hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[20px] border border-white/8 bg-white/4 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Volume courant</span>
                  <span className="font-semibold">
                    {formatVolume(getEntryVolume(entry), preferences.units)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-muted-foreground">Derniere pratique</span>
                  <span>{formatRelative(stats.lastPerformedAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card p-5 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ajouter un exercice</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Par categorie</h2>
        </div>
        <CategoryFilterChips value={pickerFilter} onChange={(value) => setPickerFilter(value)} />
        <div className="space-y-3">
          {remainingExercises.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => addExerciseToActiveWorkout(exercise.id)}
              className="flex w-full items-center justify-between rounded-[22px] border border-white/8 bg-white/4 px-4 py-3 text-left transition hover:bg-white/6"
            >
              <div className="flex items-center gap-3">
                <ExerciseIcon icon={exercise.icon} category={exercise.category} />
                <div>
                  <p className="font-medium">{exercise.name}</p>
                  <p className="text-sm text-muted-foreground">{exercise.category}</p>
                </div>
              </div>
              <Plus className="size-4 text-accent" />
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Cloture</p>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ressenti global, ambiance, energie, points a noter..."
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Feeling global</span>
            <span className="text-muted-foreground">{feeling}/10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={feeling}
            onChange={(event) => setFeeling(event.target.value)}
            className="w-full accent-accent"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => {
              if (window.confirm("Annuler la seance en cours ?")) {
                cancelActiveWorkout();
                router.push("/");
              }
            }}
          >
            Annuler
          </Button>
          <Button onClick={handleFinish}>Terminer</Button>
        </div>
      </div>
    </div>
  );
}
