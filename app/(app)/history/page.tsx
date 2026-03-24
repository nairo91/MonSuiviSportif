"use client";

import Link from "next/link";
import { History } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDateShort, formatDurationMinutes, formatVolume } from "@/lib/format";
import { getSessionRecords, getSessionVolume, getWorkoutDurationMinutes } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";

export default function HistoryPage() {
  const sessions = useAppStore((state) => state.sessions);
  const exercises = useAppStore((state) => state.exercises);
  const preferences = useAppStore((state) => state.preferences);

  const sortedSessions = [...sessions].sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workout Archive"
        title="Historique"
        description="Toutes vos seances passees, avec duree, volume et records."
      />

      {sortedSessions.length === 0 ? (
        <EmptyState
          icon={History}
          title="Aucune seance"
          description="Vos prochaines seances apparaitront ici automatiquement."
        />
      ) : null}

      <div className="space-y-3">
        {sortedSessions.map((session) => {
          const records = getSessionRecords(session, sessions, exercises);
          return (
            <Link
              key={session.id}
              href={`/history/${session.id}`}
              className="glass-card block p-4 transition hover:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-semibold">{formatDateShort(session.startedAt)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDurationMinutes(getWorkoutDurationMinutes(session))}
                  </p>
                </div>
                <Badge>{session.exerciseEntries.length} exos</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Volume total</p>
                  <p className="font-semibold">
                    {formatVolume(getSessionVolume(session), preferences.units)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Records</p>
                  <p className="font-semibold">{records.length}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {session.exerciseEntries.slice(0, 4).map((entry) => {
                  const exercise = exercises.find((item) => item.id === entry.exerciseId);
                  return (
                    <Badge key={entry.id} variant="outline">
                      {exercise?.name ?? "Exercice"}
                    </Badge>
                  );
                })}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
