"use client";

import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CategoryFilterChips } from "@/components/category-filter";
import { ExerciseIcon } from "@/components/exercise-icon";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/constants";
import { getFrequentExercises, getRecentExercises } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";

export default function StartWorkoutPage() {
  const router = useRouter();
  const exercises = useAppStore((state) => state.exercises);
  const sessions = useAppStore((state) => state.sessions);
  const activeWorkout = useAppStore((state) => state.activeWorkout);
  const filter = useAppStore((state) => state.preferences.lastUsedExerciseCategoryFilter);
  const setCategoryFilter = useAppStore((state) => state.setCategoryFilter);
  const startWorkout = useAppStore((state) => state.startWorkout);

  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const frequent = getFrequentExercises(
    {
      exercises,
      sessions,
      goals: [],
      preferences: { theme: "dark", lastUsedExerciseCategoryFilter: "Tous", units: "kg", onboardingCompleted: true },
      profile: { name: "", trainingFocus: "", weeklyTarget: 4 },
      activeWorkout: null,
      lastCompletedSessionId: null,
    },
    4,
  );
  const recent = getRecentExercises(
    {
      exercises,
      sessions,
      goals: [],
      preferences: { theme: "dark", lastUsedExerciseCategoryFilter: "Tous", units: "kg", onboardingCompleted: true },
      profile: { name: "", trainingFocus: "", weeklyTarget: 4 },
      activeWorkout: null,
      lastCompletedSessionId: null,
    },
    4,
  );

  const filtered = useMemo(() => {
    return exercises
      .filter((exercise) => {
        const matchesFilter = filter === "Tous" || exercise.category === filter;
        const term = query.trim().toLowerCase();
        const matchesQuery =
          term.length === 0 ||
          exercise.name.toLowerCase().includes(term) ||
          exercise.category.toLowerCase().includes(term);
        return matchesFilter && matchesQuery;
      })
      .sort((a, b) => {
        const aIndex = CATEGORY_ORDER.indexOf(a.category);
        const bIndex = CATEGORY_ORDER.indexOf(b.category);
        return aIndex === bIndex ? a.name.localeCompare(b.name, "fr") : aIndex - bIndex;
      });
  }, [exercises, filter, query]);

  const toggleSelection = (exerciseId: string) => {
    setSelectedIds((current) =>
      current.includes(exerciseId)
        ? current.filter((id) => id !== exerciseId)
        : [...current, exerciseId],
    );
  };

  const handleStart = () => {
    const id = startWorkout(selectedIds);
    if (!id) {
      toast.error("Selectionnez au moins un exercice.");
      return;
    }
    toast.success("Seance lancee.");
    router.push("/workouts/active");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workout Flow"
        title="Preparer la seance"
        description="Selection rapide par categories, suggestions frequentes et reprise instantanee."
      />

      {activeWorkout ? (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-accent">Seance en cours</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">Reprendre sans perdre le rythme</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeWorkout.exerciseEntries.length} exercices deja ouverts.
              </p>
            </div>
            <Button onClick={() => router.push("/workouts/active")}>Reprendre</Button>
          </div>
        </div>
      ) : null}

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-11"
            placeholder="Rechercher un exercice"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent" />
          <h2 className="font-display text-xl font-semibold">Suggestions rapides</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[...frequent, ...recent]
            .filter((exercise, index, array) => array.findIndex((item) => item.id === exercise.id) === index)
            .map((exercise) => {
              const selected = selectedIds.includes(exercise.id);
              return (
                <button
                  key={exercise.id}
                  onClick={() => toggleSelection(exercise.id)}
                  className={`glass-card min-w-[170px] bg-gradient-to-br ${CATEGORY_META[exercise.category].surface} p-4 text-left transition ${
                    selected ? "border-accent bg-accent-soft" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ExerciseIcon icon={exercise.icon} category={exercise.category} />
                    <div>
                      <p className="font-medium">{exercise.name}</p>
                      <p className="text-sm text-muted-foreground">{exercise.category}</p>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      <CategoryFilterChips value={filter} onChange={setCategoryFilter} />

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucun exercice disponible"
            description="Essayez un autre filtre ou ajoutez-en depuis la bibliotheque."
          />
        ) : null}

        {filtered.map((exercise) => {
          const selected = selectedIds.includes(exercise.id);
          return (
            <button
              key={exercise.id}
              onClick={() => toggleSelection(exercise.id)}
              className={`glass-card w-full bg-gradient-to-br ${CATEGORY_META[exercise.category].surface} p-4 text-left transition ${
                selected ? "border-accent bg-accent-soft" : "hover:bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ExerciseIcon icon={exercise.icon} category={exercise.category} />
                  <div>
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {exercise.subcategory || exercise.category}
                    </p>
                  </div>
                </div>
                <Badge>{selected ? "Selectionne" : exercise.category}</Badge>
              </div>
            </button>
          );
        })}
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Selection</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">{selectedIds.length} exercices</h2>
          </div>
          <Button size="lg" onClick={handleStart}>
            Commencer
          </Button>
        </div>
      </div>
    </div>
  );
}
