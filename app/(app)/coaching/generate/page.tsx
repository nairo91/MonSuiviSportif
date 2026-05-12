"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Brain, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getExerciseStats } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";
import { TrainingPlan } from "@/lib/types";

const DURATION_OPTIONS = [4, 6, 8, 12, 16];
const SESSIONS_OPTIONS = [2, 3, 4, 5, 6];

const GOAL_EXAMPLES = [
  "Atteindre 100kg au développé couché en 12 semaines",
  "Squatter 140kg d'ici 3 mois en partant de 100kg",
  "Perdre du gras et gagner en force sur les tirages",
  "Préparer une compétition de force dans 8 semaines",
  "Améliorer mes tractions : passer de 8 à 15 répétitions",
];

export default function GeneratePlanPage() {
  const router = useRouter();
  const exercises = useAppStore((state) => state.exercises);
  const sessions = useAppStore((state) => state.sessions);
  const profile = useAppStore((state) => state.profile);
  const preferences = useAppStore((state) => state.preferences);
  const setTrainingPlan = useAppStore((state) => state.setTrainingPlan);

  const [goalDescription, setGoalDescription] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(profile.weeklyTarget ?? 3);
  const [showAllExercises, setShowAllExercises] = useState(false);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(
    new Set(exercises.slice(0, 8).map((e) => e.id)),
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const visibleExercises = showAllExercises ? exercises : exercises.slice(0, 8);

  function toggleExercise(id: string) {
    setSelectedExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleGenerate() {
    if (!goalDescription.trim()) {
      toast.error("Décris ton objectif avant de générer un plan.");
      return;
    }
    if (selectedExerciseIds.size < 3) {
      toast.error("Sélectionne au moins 3 exercices.");
      return;
    }

    setIsGenerating(true);

    const selectedExercises = exercises.filter((e) => selectedExerciseIds.has(e.id));
    const userStats = selectedExercises.map((e) => {
      const stats = getExerciseStats(e.id, sessions);
      return {
        exerciseId: e.id,
        name: e.name,
        category: e.category,
        bestWeight: stats.bestWeight,
        lastWeight: stats.lastWeight,
        lastReps: stats.lastReps,
        totalSessions: stats.totalSessions,
      };
    });

    try {
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalDescription,
          durationWeeks,
          sessionsPerWeek,
          selectedExerciseIds: Array.from(selectedExerciseIds),
          userStats,
          units: preferences.units,
          profile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Erreur inconnue");
      }

      setTrainingPlan(data.plan as TrainingPlan);
      toast.success("Plan généré avec succès !");
      router.push("/coaching");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(`Échec de la génération: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/coaching">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <PageHeader eyebrow="Coach IA" title="Nouveau plan" />
      </div>

      <Card className="glass-card border-accent/20 bg-[radial-gradient(circle_at_top_right,rgba(195,255,77,0.08),transparent_50%)]">
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="size-4 text-accent" />
            <p className="text-sm font-medium">Décris ton objectif</p>
          </div>
          <Textarea
            placeholder="Ex: Atteindre 100kg au développé couché en 12 semaines en partant de 75kg"
            value={goalDescription}
            onChange={(e) => setGoalDescription(e.target.value)}
            className="min-h-[100px] resize-none bg-white/5 border-white/10 focus:border-accent/50"
            disabled={isGenerating}
          />
          <div className="flex flex-wrap gap-2">
            {GOAL_EXAMPLES.slice(0, 3).map((example) => (
              <button
                key={example}
                onClick={() => setGoalDescription(example)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                disabled={isGenerating}
              >
                {example}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-[0.15em]">Durée du plan</p>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((weeks) => (
              <button
                key={weeks}
                onClick={() => setDurationWeeks(weeks)}
                disabled={isGenerating}
                className={`rounded-[16px] px-4 py-2 text-sm font-semibold transition ${
                  durationWeeks === weeks
                    ? "bg-accent text-slate-950"
                    : "border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                {weeks} sem.
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-[0.15em]">Séances / semaine</p>
          <div className="flex flex-wrap gap-2">
            {SESSIONS_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setSessionsPerWeek(n)}
                disabled={isGenerating}
                className={`rounded-[16px] px-4 py-2 text-sm font-semibold transition ${
                  sessionsPerWeek === n
                    ? "bg-accent text-slate-950"
                    : "border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                {n}×/sem
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-[0.15em]">
              Exercices inclus
            </p>
            <Badge variant="outline">{selectedExerciseIds.size} sélectionnés</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {visibleExercises.map((exercise) => {
              const selected = selectedExerciseIds.has(exercise.id);
              return (
                <button
                  key={exercise.id}
                  onClick={() => toggleExercise(exercise.id)}
                  disabled={isGenerating}
                  className={`rounded-[16px] border px-3 py-2 text-left text-sm font-medium transition ${
                    selected
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-white/8 bg-white/4 text-muted-foreground hover:bg-white/8"
                  }`}
                >
                  {exercise.name}
                </button>
              );
            })}
          </div>
          {exercises.length > 8 && (
            <button
              onClick={() => setShowAllExercises((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
            >
              {showAllExercises ? (
                <>
                  <ChevronUp className="size-3" /> Réduire
                </>
              ) : (
                <>
                  <ChevronDown className="size-3" /> Voir les {exercises.length - 8} autres
                </>
              )}
            </button>
          )}
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full"
        onClick={handleGenerate}
        disabled={isGenerating || !goalDescription.trim()}
      >
        {isGenerating ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Génération en cours...
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            Générer mon plan IA
          </>
        )}
      </Button>

      {isGenerating && (
        <p className="text-center text-xs text-muted-foreground">
          Claude analyse tes performances et construit ton plan... (~15-30s)
        </p>
      )}

      <div className="h-6" />
    </div>
  );
}
