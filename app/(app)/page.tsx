"use client";

import Link from "next/link";
import { Activity, ArrowRight, Brain, ChevronRight, Pencil, Sparkles, Trophy } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateShort, formatDurationMinutes, formatRelative, formatVolume } from "@/lib/format";
import { getGoalProgress, getGlobalVolumeTimeline, getRecentRecords, getSessionVolume, getWorkoutDurationMinutes } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";
import { TrainingPlan } from "@/lib/types";

function CoachPlanCard({ plan }: { plan: TrainingPlan }) {
  const totalWorkouts = plan.workouts.length;
  const completedWorkouts = plan.workouts.filter((w) => w.completedSessionId).length;
  const completionPercent = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

  const weeksSinceStart = Math.floor((Date.now() - new Date(plan.createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000));
  const currentWeek = Math.min(weeksSinceStart + 1, plan.durationWeeks);

  const thisWeekWorkouts = plan.workouts.filter((w) => w.weekNumber === currentWeek);
  const thisWeekDone = thisWeekWorkouts.filter((w) => w.completedSessionId).length;
  const nextWorkout = thisWeekWorkouts.find((w) => !w.completedSessionId);

  return (
    <Link href="/coaching">
      <Card className="glass-card border-accent/20 bg-[radial-gradient(circle_at_top_right,rgba(195,255,77,0.1),transparent_50%)] hover:border-accent/40 transition-colors cursor-pointer">
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="size-4 text-accent" />
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Coach IA</p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Sem. {currentWeek}/{plan.durationWeeks}
            </Badge>
          </div>

          <div>
            <p className="font-medium text-sm line-clamp-1">{plan.goalDescription}</p>
            <div className="mt-2 space-y-1">
              <Progress value={completionPercent} className="h-1.5" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{completedWorkouts}/{totalWorkouts} séances</span>
                <span className="text-accent font-medium">{completionPercent}%</span>
              </div>
            </div>
          </div>

          {nextWorkout ? (
            <div className="flex items-center justify-between rounded-[16px] border border-white/8 bg-white/4 px-3 py-2">
              <div>
                <p className="text-xs text-muted-foreground">Prochaine séance</p>
                <p className="text-sm font-medium">{nextWorkout.label}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{thisWeekDone}/{thisWeekWorkouts.length} cette sem.</span>
                <ChevronRight className="size-3" />
              </div>
            </div>
          ) : (
            <div className="rounded-[16px] border border-accent/20 bg-accent/8 px-3 py-2 text-center text-xs font-medium text-accent">
              Semaine {currentWeek} complète !
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const profile = useAppStore((state) => state.profile);
  const sessions = useAppStore((state) => state.sessions);
  const exercises = useAppStore((state) => state.exercises);
  const goals = useAppStore((state) => state.goals);
  const preferences = useAppStore((state) => state.preferences);
  const activeWorkout = useAppStore((state) => state.activeWorkout);
  const trainingPlan = useAppStore((state) => state.trainingPlan);

  const sortedSessions = [...sessions].sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));
  const previousSession = sortedSessions[0];
  const recentRecords = getRecentRecords(sortedSessions, exercises).slice(0, 3);
  const openGoals = goals.slice(0, 3);
  const recentTimeline = getGlobalVolumeTimeline(sortedSessions, "30d");
  const previousVolume = previousSession ? getSessionVolume(previousSession) : 0;
  const headlineGoal = openGoals[0];
  const headlineProgress = headlineGoal ? getGoalProgress(headlineGoal, sessions) : null;
  const headlineExercise = headlineGoal
    ? exercises.find((item) => item.id === headlineGoal.exerciseId)
    : null;

  const greeting = profile.name ? `Salut ${profile.name}` : "Salut !";
  const hasIncompleteProfile = !profile.name;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily Muscle Log"
        title={greeting}
        description={profile.trainingFocus || "Bienvenue sur ton carnet d'entraînement."}
      />

      {hasIncompleteProfile && (
        <Link href="/settings">
          <div className="flex items-center gap-3 rounded-[20px] border border-accent/30 bg-accent/8 px-4 py-3 text-sm">
            <Pencil className="size-4 shrink-0 text-accent" />
            <p className="flex-1 text-muted-foreground">
              Ajoute ton nom dans les réglages pour personnaliser ton expérience.
            </p>
            <ChevronRight className="size-4 shrink-0 text-accent" />
          </div>
        </Link>
      )}

      <Card className="glass-card overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(195,255,77,0.24),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(80,227,209,0.18),_transparent_28%),linear-gradient(135deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))]">
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <Badge>Mode premium</Badge>
            <span className="text-xs text-muted-foreground">
              {activeWorkout ? "Seance en cours" : "Pret pour la prochaine seance"}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1.55fr_1fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="font-display text-3xl font-semibold tracking-[-0.04em]">
                  {activeWorkout ? "Continuez votre seance" : "Commencer une seance"}
                </h2>
                <p className="max-w-[20rem] text-sm text-muted-foreground">
                  Interface rapide, categories memorisees, dernieres performances visibles entre les
                  series.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-[20px] border border-white/8 bg-white/5 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Exos
                  </p>
                  <p className="mt-1 font-display text-xl font-semibold">{exercises.length}</p>
                </div>
                <div className="rounded-[20px] border border-white/8 bg-white/5 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Goals
                  </p>
                  <p className="mt-1 font-display text-xl font-semibold">{goals.length}</p>
                </div>
                <div className="rounded-[20px] border border-white/8 bg-white/5 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    PR
                  </p>
                  <p className="mt-1 font-display text-xl font-semibold">{recentRecords.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-accent">Focus cible</p>
              {headlineGoal && headlineProgress ? (
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="font-medium">{headlineExercise?.name ?? "Objectif"}</p>
                    <p className="text-sm text-muted-foreground">{headlineProgress.status}</p>
                  </div>
                  <div className="space-y-2">
                    <Progress value={headlineProgress.progress} />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{headlineProgress.current}</span>
                      <span>{headlineProgress.target}</span>
                    </div>
                  </div>
                  <div className="rounded-[18px] bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
                    {headlineProgress.progress}% vers la cible
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-[18px] border border-dashed border-white/10 px-3 py-4 text-sm text-muted-foreground">
                  Ajoutez un objectif pour afficher une carte de focus.
                </div>
              )}
            </div>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link href={activeWorkout ? "/workouts/active" : "/workouts/start"}>
              {activeWorkout ? "Reprendre maintenant" : "Commencer une seance"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {trainingPlan ? (
        <CoachPlanCard plan={trainingPlan} />
      ) : (
        <Link href="/coaching/generate">
          <Card className="glass-card border-dashed border-accent/20 hover:border-accent/40 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <Brain className="size-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Coach IA disponible</p>
                <p className="text-xs text-muted-foreground">Génère un plan basé sur tes perfs</p>
              </div>
              <Sparkles className="size-4 text-accent shrink-0" />
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Seances" value={String(sessions.length)} hint="total cumule" />
        <StatCard label="Exercices" value={String(exercises.length)} hint="bibliotheque suivie" />
        <StatCard label="Records" value={String(recentRecords.length)} hint="records recents" />
        <StatCard label="Objectifs" value={String(goals.length)} hint="actifs" />
      </div>

      {previousSession ? (
        <Card className="glass-card bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]">
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Derniere seance
                </p>
                <h3 className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em]">
                  {formatDateShort(previousSession.startedAt)}
                </h3>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link href={`/history/${previousSession.id}`}>Voir</Link>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-[24px] border border-white/8 bg-white/4 p-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Duree</p>
                <p className="mt-1 font-semibold">
                  {formatDurationMinutes(getWorkoutDurationMinutes(previousSession))}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Exercices</p>
                <p className="mt-1 font-semibold">{previousSession.exerciseEntries.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Volume</p>
                <p className="mt-1 font-semibold">{formatVolume(previousVolume, preferences.units)}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{previousSession.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="glass-card">
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Progression recente
              </p>
              <h3 className="mt-1 font-display text-2xl font-semibold">Charge sur 30 jours</h3>
            </div>
            <Badge variant="outline">{recentTimeline.length} points</Badge>
          </div>

          <div className="space-y-3">
            {recentTimeline.slice(-4).map((item) => (
              <div key={item.date} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{formatDateShort(item.date)}</span>
                  <span className="text-muted-foreground">
                    {formatVolume(item.volume, preferences.units)}
                  </span>
                </div>
                <Progress value={Math.min(100, Math.round((item.volume / 7000) * 100))} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="glass-card bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]">
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-accent" />
              <h3 className="font-display text-xl font-semibold">Records recents</h3>
            </div>
            <div className="space-y-3">
              {recentRecords.map((record) => (
                <Link
                  key={`${record.sessionId}-${record.title}`}
                  href={`/history/${record.sessionId}`}
                  className="flex items-center justify-between rounded-[20px] border border-white/8 bg-white/4 p-4 transition hover:bg-white/6"
                >
                  <div>
                    <p className="font-medium">{record.title}</p>
                    <p className="text-xs text-muted-foreground">{formatRelative(record.date)}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-accent-secondary" />
              <h3 className="font-display text-xl font-semibold">Objectifs en cours</h3>
            </div>
            <div className="space-y-4">
              {openGoals.map((goal) => {
                const exercise = exercises.find((item) => item.id === goal.exerciseId);
                const progress = getGoalProgress(goal, sessions);
                return (
                  <div key={goal.id} className="rounded-[22px] border border-white/8 bg-white/4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{exercise?.name ?? "Exercice"}</p>
                        <p className="text-sm text-muted-foreground">{progress.status}</p>
                      </div>
                      <Badge>{progress.progress}%</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      <Progress value={progress.progress} />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Actuel {progress.current}</span>
                        <span>Cible {progress.target}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
