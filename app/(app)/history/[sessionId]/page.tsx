"use client";

import { useParams } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, formatDurationMinutes, formatVolume, formatWeight } from "@/lib/format";
import { getEntryVolume, getSessionRecords, getSessionVolume, getWorkoutDurationMinutes } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";

export default function SessionDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const sessions = useAppStore((state) => state.sessions);
  const exercises = useAppStore((state) => state.exercises);
  const preferences = useAppStore((state) => state.preferences);

  const session = sessions.find((item) => item.id === params.sessionId);
  if (!session) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Seance introuvable"
        description="Ce detail n'est plus disponible."
      />
    );
  }

  const records = getSessionRecords(session, sessions, exercises);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workout Detail"
        title={formatDateTime(session.startedAt)}
        description={session.notes || "Aucune note de seance."}
      />

      <Card className="glass-card">
        <CardContent className="grid grid-cols-2 gap-3">
          <div className="rounded-[20px] border border-white/8 bg-white/4 p-4">
            <p className="text-xs text-muted-foreground">Duree</p>
            <p className="mt-1 font-semibold">{formatDurationMinutes(getWorkoutDurationMinutes(session))}</p>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/4 p-4">
            <p className="text-xs text-muted-foreground">Volume</p>
            <p className="mt-1 font-semibold">{formatVolume(getSessionVolume(session), preferences.units)}</p>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/4 p-4">
            <p className="text-xs text-muted-foreground">Feeling</p>
            <p className="mt-1 font-semibold">{session.feeling ?? "-"}/10</p>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/4 p-4">
            <p className="text-xs text-muted-foreground">Records</p>
            <p className="mt-1 font-semibold">{records.length}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {session.exerciseEntries.map((entry) => {
          const exercise = exercises.find((item) => item.id === entry.exerciseId);
          return (
            <Card key={entry.id} className="glass-card">
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold">{exercise?.name ?? "Exercice"}</h2>
                    <p className="text-sm text-muted-foreground">
                      {exercise?.category ?? "Categorie inconnue"}
                    </p>
                  </div>
                  <Badge>{formatVolume(getEntryVolume(entry), preferences.units)}</Badge>
                </div>

                <div className="space-y-2">
                  {entry.sets.map((set, index) => (
                    <div
                      key={set.id}
                      className="flex items-center justify-between rounded-[18px] border border-white/8 bg-white/4 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">
                          Serie {index + 1} · {formatWeight(set.weight, preferences.units)} x {set.reps}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          RPE {set.rpe ?? "-"} · repos {set.restSeconds ?? "-"}s
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
