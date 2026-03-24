"use client";

import Link from "next/link";
import { Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CategoryFilterChips } from "@/components/category-filter";
import { ExerciseIcon } from "@/components/exercise-icon";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRelative } from "@/lib/format";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/constants";
import { getExerciseStats } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";

export default function ExercisesPage() {
  const exercises = useAppStore((state) => state.exercises);
  const sessions = useAppStore((state) => state.sessions);
  const filter = useAppStore((state) => state.preferences.lastUsedExerciseCategoryFilter);
  const setCategoryFilter = useAppStore((state) => state.setCategoryFilter);
  const deleteExercise = useAppStore((state) => state.deleteExercise);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const base = exercises.filter((exercise) => {
      const matchesFilter = filter === "Tous" || exercise.category === filter;
      const term = query.trim().toLowerCase();
      const matchesQuery =
        term.length === 0 ||
        exercise.name.toLowerCase().includes(term) ||
        exercise.category.toLowerCase().includes(term) ||
        exercise.subcategory?.toLowerCase().includes(term);
      return matchesFilter && matchesQuery;
    });

    return base.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [exercises, filter, query]);

  const grouped = useMemo(() => {
    if (filter !== "Tous") return [[filter, filtered] as const];
    return CATEGORY_ORDER.map((category) => [
      category,
      filtered.filter((exercise) => exercise.category === category),
    ] as const).filter(([, items]) => items.length > 0);
  }, [filter, filtered]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exercise Library"
        title="Exercices"
        description="Tri par categories, recherche instantanee et notes personnalisees."
        actions={
          <Button asChild size="icon">
            <Link href="/exercises/new">
              <Plus className="size-5" />
            </Link>
          </Button>
        }
      />

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-11"
            placeholder="Rechercher un exercice ou une categorie"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <CategoryFilterChips value={filter} onChange={setCategoryFilter} />

      <div className="space-y-5">
        {grouped.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucun exercice"
            description="Essayez un autre filtre ou ajoutez un exercice personnalise."
            actionLabel="Ajouter un exercice"
            onAction={() => {
              window.location.href = "/exercises/new";
            }}
          />
        ) : null}

        {grouped.map(([category, items]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">{category}</h2>
              <Badge variant="outline">{items.length}</Badge>
            </div>

            <div className="space-y-3">
              {items.map((exercise) => {
                const stats = getExerciseStats(exercise.id, sessions);
                return (
                  <div
                    key={exercise.id}
                    className={`glass-card bg-gradient-to-br ${CATEGORY_META[exercise.category].surface} p-4`}
                  >
                    <div className="flex items-start gap-3">
                      <ExerciseIcon icon={exercise.icon} category={exercise.category} />
                      <Link href={`/exercises/${exercise.id}`} className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">{exercise.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {exercise.subcategory || exercise.category}
                            </p>
                          </div>
                          <Badge>{exercise.category}</Badge>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{stats.totalSessions} seances</span>
                          <span>PR {stats.bestWeight} kg</span>
                          <span>{formatRelative(stats.lastPerformedAt)}</span>
                        </div>
                      </Link>
                      <button
                        onClick={() => {
                          deleteExercise(exercise.id);
                          toast.success("Exercice supprime de la bibliotheque.");
                        }}
                        className="rounded-full bg-white/5 p-2 text-muted-foreground transition hover:text-danger"
                        aria-label={`Supprimer ${exercise.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
