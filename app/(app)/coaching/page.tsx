"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  Dumbbell,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store";
import { PlannedWorkout } from "@/lib/types";

function getWeeksSinceStart(createdAt: string): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / msPerWeek);
}

function WorkoutCard({
  workout,
  onMarkDone,
}: {
  workout: PlannedWorkout;
  onMarkDone: (workout: PlannedWorkout) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const done = Boolean(workout.completedSessionId);

  return (
    <div
      className={`rounded-[22px] border p-4 transition ${
        done
          ? "border-accent/20 bg-accent/5"
          : "border-white/8 bg-white/4"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => !done && onMarkDone(workout)}
          className={`mt-0.5 shrink-0 transition ${done ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
          disabled={done}
        >
          {done ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`font-semibold ${done ? "line-through text-muted-foreground" : ""}`}>
                {workout.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{workout.focusDescription}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Clock className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{workout.estimatedDurationMinutes}min</span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {workout.exercises.slice(0, 3).map((ex) => (
              <Badge key={ex.exerciseId} variant="outline" className="text-[10px]">
                {ex.exerciseName}
              </Badge>
            ))}
            {workout.exercises.length > 3 && (
              <Badge variant="outline" className="text-[10px]">
                +{workout.exercises.length - 3}
              </Badge>
            )}
          </div>

          {!done && (
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => onMarkDone(workout)}
              >
                <CheckCircle2 className="size-3" />
                Marquer fait
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-2"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                Détails
              </Button>
            </div>
          )}

          {expanded && (
            <div className="mt-3 space-y-3">
              {workout.exercises.map((ex) => (
                <div key={ex.exerciseId} className="rounded-[16px] border border-white/8 bg-white/3 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{ex.exerciseName}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {ex.sets.length} séries
                    </Badge>
                  </div>
                  {ex.notes && (
                    <p className="mt-1 text-xs text-muted-foreground italic">{ex.notes}</p>
                  )}
                  <div className="mt-2 space-y-1">
                    {ex.sets.map((set, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="w-4 text-center font-medium text-foreground">{i + 1}</span>
                        <span className="font-semibold text-foreground">
                          {set.weight}kg × {set.reps} reps
                        </span>
                        {set.rpe !== undefined && (
                          <span className="text-[10px]">RPE {set.rpe}</span>
                        )}
                        {set.notes && <span className="italic">{set.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CoachingPage() {
  const trainingPlan = useAppStore((state) => state.trainingPlan);
  const sessions = useAppStore((state) => state.sessions);
  const markPlannedWorkoutComplete = useAppStore((state) => state.markPlannedWorkoutComplete);
  const clearTrainingPlan = useAppStore((state) => state.clearTrainingPlan);
  const startWorkout = useAppStore((state) => state.startWorkout);

  const [confirmClear, setConfirmClear] = useState(false);
  const [pendingMarkDone, setPendingMarkDone] = useState<PlannedWorkout | null>(null);
  const [activeWeek, setActiveWeek] = useState<number | null>(null);

  if (!trainingPlan) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Coach IA" title="Mon coach" description="Génère un plan personnalisé basé sur tes performances réelles." />

        <Card className="glass-card overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(195,255,77,0.2),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(80,227,209,0.15),transparent_30%)]">
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Brain className="size-6" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold">Pas encore de plan</h2>
                <p className="text-sm text-muted-foreground">Crée ton premier programme IA</p>
              </div>
            </div>

            <div className="space-y-3 rounded-[22px] border border-white/8 bg-white/4 p-4">
              <p className="text-sm font-medium">Comment ça marche ?</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">1</span>
                  <span>Décris ton objectif en quelques mots</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">2</span>
                  <span>Claude analyse tes perfs actuelles et génère un plan progressif</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">3</span>
                  <span>Suis tes séances semaine par semaine avec poids et reps suggérés</span>
                </div>
              </div>
            </div>

            <Button asChild size="lg" className="w-full">
              <Link href="/coaching/generate">
                <Sparkles className="size-4" />
                Créer mon plan IA
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ce que Claude va planifier</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Target, label: "Objectif personnalisé", desc: "Plan centré sur ton but" },
              { icon: CalendarDays, label: "Semaines progressives", desc: "Charge qui monte graduellement" },
              { icon: Dumbbell, label: "Poids suggérés", desc: "Basés sur tes vrais records" },
              { icon: Sparkles, label: "Décharge intégrée", desc: "Récupération planifiée" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-[20px] border border-white/8 bg-white/4 p-3">
                <Icon className="size-4 text-accent mb-2" />
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="h-6" />
      </div>
    );
  }

  const totalWorkouts = trainingPlan.workouts.length;
  const completedWorkouts = trainingPlan.workouts.filter((w) => w.completedSessionId).length;
  const completionPercent = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

  const weeksSinceStart = getWeeksSinceStart(trainingPlan.createdAt);
  const currentWeek = Math.min(weeksSinceStart + 1, trainingPlan.durationWeeks);

  const weeks = Array.from({ length: trainingPlan.durationWeeks }, (_, i) => i + 1);

  const displayWeek = activeWeek ?? currentWeek;
  const weekWorkouts = trainingPlan.workouts
    .filter((w) => w.weekNumber === displayWeek)
    .sort((a, b) => a.sessionNumber - b.sessionNumber);

  const weekCompletedCount = weekWorkouts.filter((w) => w.completedSessionId).length;
  const isDeloadWeek = displayWeek % 4 === 0;

  function handleMarkDone(workout: PlannedWorkout) {
    setPendingMarkDone(workout);
  }

  function confirmMarkDone() {
    if (!pendingMarkDone) return;

    const exerciseIds = pendingMarkDone.exercises.map((e) => e.exerciseId);
    const workoutId = startWorkout(exerciseIds);
    const latestSession = [...sessions].sort(
      (a, b) => +new Date(b.startedAt) - +new Date(a.startedAt),
    )[0];

    const sessionId = workoutId ?? latestSession?.id ?? "manual";
    markPlannedWorkoutComplete(pendingMarkDone.id, sessionId);
    setPendingMarkDone(null);
    toast.success("Séance marquée comme effectuée !");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <PageHeader eyebrow="Coach IA" title="Mon plan" />
        <div className="flex gap-2 mt-1">
          <Button asChild variant="secondary" size="sm">
            <Link href="/coaching/generate">
              <Plus className="size-3" />
              Nouveau
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmClear(true)}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>

      <Card className="glass-card border-accent/20 bg-[radial-gradient(circle_at_top_right,rgba(195,255,77,0.1),transparent_50%)]">
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Target className="size-4 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Objectif</p>
              <p className="mt-1 font-medium">{trainingPlan.goalDescription}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression globale</span>
              <span className="font-semibold text-accent">{completionPercent}%</span>
            </div>
            <Progress value={completionPercent} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{completedWorkouts} séances réalisées</span>
              <span>{totalWorkouts - completedWorkouts} restantes</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-[20px] border border-white/8 bg-white/4 p-3 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Durée</p>
              <p className="mt-1 font-semibold">{trainingPlan.durationWeeks} sem.</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Semaine</p>
              <p className="mt-1 font-semibold">{currentWeek}/{trainingPlan.durationWeeks}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Séances</p>
              <p className="mt-1 font-semibold">{completedWorkouts}/{totalWorkouts}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="space-y-3">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Stratégie du coach</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{trainingPlan.coachSummary}</p>
          <div className="rounded-[16px] border border-accent/20 bg-accent/5 px-3 py-2">
            <p className="text-xs text-accent">{trainingPlan.progressionStrategy}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Semaines</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {weeks.map((week) => {
            const wWorkouts = trainingPlan.workouts.filter((w) => w.weekNumber === week);
            const wDone = wWorkouts.filter((w) => w.completedSessionId).length;
            const isActive = week === displayWeek;
            const isCurrentWeek = week === currentWeek;
            const wDeload = week % 4 === 0;

            return (
              <button
                key={week}
                onClick={() => setActiveWeek(week)}
                className={`flex shrink-0 flex-col items-center rounded-[18px] border px-3 py-2 transition ${
                  isActive
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-white/8 bg-white/4 text-muted-foreground hover:bg-white/8"
                }`}
              >
                <span className="text-[10px] font-bold">S{week}</span>
                <span className="text-[9px] mt-0.5">
                  {wDone}/{wWorkouts.length}
                </span>
                {isCurrentWeek && (
                  <span className="mt-1 size-1.5 rounded-full bg-accent" />
                )}
                {wDeload && !isCurrentWeek && (
                  <span className="text-[8px] text-blue-400">⚡</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-xl font-semibold">
              Semaine {displayWeek}
              {isDeloadWeek && <span className="ml-2 text-sm font-normal text-blue-400">— Décharge</span>}
              {displayWeek === currentWeek && <span className="ml-2 text-sm font-normal text-accent">— Cette semaine</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {weekCompletedCount}/{weekWorkouts.length} séances réalisées
            </p>
          </div>
        </div>

        {weekWorkouts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune séance pour cette semaine
          </p>
        ) : (
          <div className="space-y-3">
            {weekWorkouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} onMarkDone={handleMarkDone} />
            ))}
          </div>
        )}
      </div>

      <div className="h-6" />

      <Dialog open={pendingMarkDone !== null} onOpenChange={(open) => !open && setPendingMarkDone(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Séance réalisée ?</DialogTitle>
            <DialogDescription>
              Confirme que tu as effectué "{pendingMarkDone?.label}". Cela démarrera aussi une séance
              dans ton historique.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setPendingMarkDone(null)}>
              Annuler
            </Button>
            <Button className="flex-1" onClick={confirmMarkDone}>
              <CheckCircle2 className="size-4" />
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le plan ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Ton plan et ta progression seront définitivement perdus.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmClear(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                clearTrainingPlan();
                setConfirmClear(false);
                toast.success("Plan supprimé.");
              }}
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
