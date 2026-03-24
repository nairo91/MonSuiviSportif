"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PartyPopper, Trophy } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateShort, formatDurationMinutes, formatVolume } from "@/lib/format";
import { getSessionRecords, getSessionVolume, getWorkoutDurationMinutes } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";

export default function WorkoutSummaryPage() {
  const params = useParams<{ sessionId: string }>();
  const sessions = useAppStore((state) => state.sessions);
  const exercises = useAppStore((state) => state.exercises);
  const preferences = useAppStore((state) => state.preferences);

  const session = sessions.find((item) => item.id === params.sessionId);
  if (!session) {
    return (
      <EmptyState
        icon={PartyPopper}
        title="Resume introuvable"
        description="La seance demandee n'existe pas ou n'est plus disponible."
        actionLabel="Retour accueil"
        onAction={() => {
          window.location.href = "/";
        }}
      />
    );
  }

  const records = getSessionRecords(session, sessions, exercises);
  const volume = getSessionVolume(session);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workout Saved"
        title="Seance enregistree"
        description={`Resume du ${formatDateShort(session.startedAt)}`}
      />

      <Card className="glass-card overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(61,214,199,0.22),_transparent_34%),linear-gradient(135deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))]">
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <PartyPopper className="size-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-accent">Mission complete</p>
              <h2 className="font-display text-3xl font-semibold tracking-[-0.04em]">
                Seance finalisee
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[22px] border border-white/8 bg-white/4 p-4">
              <p className="text-xs text-muted-foreground">Duree</p>
              <p className="mt-1 font-semibold">
                {formatDurationMinutes(getWorkoutDurationMinutes(session))}
              </p>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/4 p-4">
              <p className="text-xs text-muted-foreground">Volume</p>
              <p className="mt-1 font-semibold">{formatVolume(volume, preferences.units)}</p>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/4 p-4">
              <p className="text-xs text-muted-foreground">Exercices</p>
              <p className="mt-1 font-semibold">{session.exerciseEntries.length}</p>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/4 p-4">
              <p className="text-xs text-muted-foreground">Feeling</p>
              <p className="mt-1 font-semibold">{session.feeling ?? "-"}/10</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-accent" />
            <h3 className="font-display text-xl font-semibold">Records battus</h3>
          </div>
          {records.length > 0 ? (
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record} className="rounded-[20px] border border-white/8 bg-white/4 p-4">
                  {record}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pas de record cette fois, mais la seance est propre et archivee.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="space-y-4">
          <h3 className="font-display text-xl font-semibold">Notes de seance</h3>
          <p className="text-sm text-muted-foreground">{session.notes || "Aucune note."}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button asChild variant="secondary">
          <Link href={`/history/${session.id}`}>Voir le detail</Link>
        </Button>
        <Button asChild>
          <Link href="/workouts/start">Nouvelle seance</Link>
        </Button>
      </div>
    </div>
  );
}
