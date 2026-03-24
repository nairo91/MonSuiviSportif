"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BarChart3, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProgressChart } from "@/components/progress-chart";
import { ExerciseIcon } from "@/components/exercise-icon";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateShort, formatGoalValue, formatRelative, formatVolume, formatWeight } from "@/lib/format";
import { GOAL_TYPE_LABELS, TIME_RANGES } from "@/lib/constants";
import { getEntryVolume, getExerciseHistory, getExerciseStats, getExerciseTimeline, getGoalProgress } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";
import { TimeRange } from "@/lib/types";

export default function ExerciseDetailPage() {
  const params = useParams<{ exerciseId: string }>();
  const router = useRouter();
  const exercises = useAppStore((state) => state.exercises);
  const sessions = useAppStore((state) => state.sessions);
  const goals = useAppStore((state) => state.goals);
  const preferences = useAppStore((state) => state.preferences);
  const deleteExercise = useAppStore((state) => state.deleteExercise);
  const upsertGoal = useAppStore((state) => state.upsertGoal);
  const deleteGoal = useAppStore((state) => state.deleteGoal);

  const exercise = exercises.find((item) => item.id === params.exerciseId);
  const [range, setRange] = useState<TimeRange>("30d");
  const [goalType, setGoalType] = useState<"weight" | "reps" | "volume" | "pr">("weight");
  const [goalValue, setGoalValue] = useState("90");

  if (!exercise) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Exercice introuvable"
        description="Cet exercice n'est plus disponible dans votre bibliotheque."
        actionLabel="Retour exercices"
        onAction={() => router.push("/exercises")}
      />
    );
  }

  const stats = getExerciseStats(exercise.id, sessions);
  const history = getExerciseHistory(exercise.id, sessions).reverse();
  const timeline = getExerciseTimeline(exercise.id, sessions, range);
  const goal = goals.find((item) => item.exerciseId === exercise.id);
  const goalProgress = goal ? getGoalProgress(goal, sessions) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={exercise.category}
        title={exercise.name}
        description={exercise.notes}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="icon">
              <Link href={`/exercises/${exercise.id}/edit`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            <Button
              variant="danger"
              size="icon"
              onClick={() => {
                deleteExercise(exercise.id);
                toast.success("Exercice supprime.");
                router.push("/exercises");
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        }
      />

      <div className="glass-card p-5">
        <div className="flex items-center gap-4">
          <ExerciseIcon icon={exercise.icon} category={exercise.category} className="size-14 rounded-[20px]" />
          <div className="grid flex-1 grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Derniere perf</p>
              <p className="font-semibold">{formatWeight(stats.lastWeight, preferences.units)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Best weight</p>
              <p className="font-semibold">{formatWeight(stats.bestWeight, preferences.units)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Best volume</p>
              <p className="font-semibold">{formatVolume(stats.bestVolume, preferences.units)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Frequence</p>
              <p className="font-semibold">{stats.practiceFrequency}/sem</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Objectif</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">Progression cible</h2>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                <Plus className="size-4" />
                {goal ? "Modifier" : "Ajouter"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Objectif sur {exercise.name}</DialogTitle>
                <DialogDescription>
                  Definissez un cap concret pour guider votre progression.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Type d&apos;objectif</Label>
                  <Select value={goalType} onValueChange={(value) => setGoalType(value as typeof goalType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GOAL_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {goalType !== "pr" ? (
                  <div className="space-y-2">
                    <Label>Valeur cible</Label>
                    <Input value={goalValue} onChange={(event) => setGoalValue(event.target.value)} />
                  </div>
                ) : null}
                <Button
                  className="w-full"
                  onClick={() => {
                    upsertGoal({
                      id: goal?.id,
                      exerciseId: exercise.id,
                      type: goalType,
                      targetWeight: goalType === "weight" ? Number(goalValue) : undefined,
                      targetReps: goalType === "reps" ? Number(goalValue) : undefined,
                      targetVolume: goalType === "volume" ? Number(goalValue) : undefined,
                    });
                    toast.success("Objectif enregistre.");
                  }}
                >
                  Enregistrer l&apos;objectif
                </Button>
                {goal ? (
                  <Button variant="outline" className="w-full" onClick={() => deleteGoal(goal.id)}>
                    Supprimer l&apos;objectif
                  </Button>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {goal && goalProgress ? (
          <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{GOAL_TYPE_LABELS[goal.type]}</p>
                <p className="text-sm text-muted-foreground">{formatGoalValue(goal.type, goal)}</p>
              </div>
              <Badge>{goalProgress.status}</Badge>
            </div>
            <div className="mt-4 space-y-2">
              <Progress value={goalProgress.progress} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{goalProgress.current}</span>
                <span>{goalProgress.target}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/10 p-4 text-sm text-muted-foreground">
            Aucun objectif defini sur cet exercice.
          </div>
        )}
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-accent" />
            <h2 className="font-display text-2xl font-semibold">Courbe de progression</h2>
          </div>
          <div className="flex gap-2">
            {TIME_RANGES.map((item) => (
              <button
                key={item.value}
                onClick={() => setRange(item.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  range === item.value ? "bg-accent text-slate-950" : "bg-white/5 text-muted-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <ProgressChart data={timeline} valueKey="weight" label="Poids" />
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Historique complet</h2>
        {history.map((session) => {
          const entry = session.exerciseEntries.find((item) => item.exerciseId === exercise.id)!;
          return (
            <Link
              key={session.id}
              href={`/history/${session.id}`}
              className="glass-card block p-4 transition hover:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{formatDateShort(session.startedAt)}</p>
                  <p className="text-sm text-muted-foreground">{formatRelative(session.startedAt)}</p>
                </div>
                <Badge variant="outline">{entry.sets.length} series</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Top set</p>
                  <p className="font-semibold">
                    {formatWeight(Math.max(...entry.sets.map((set) => set.weight)), preferences.units)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reps max</p>
                  <p className="font-semibold">{Math.max(...entry.sets.map((set) => set.reps))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Volume</p>
                  <p className="font-semibold">{formatVolume(getEntryVolume(entry), preferences.units)}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
