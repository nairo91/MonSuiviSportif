"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/page-header";
import { ProgressChart } from "@/components/progress-chart";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateShort, formatVolume } from "@/lib/format";
import { getCategoryBreakdown, getGlobalVolumeTimeline, getMostPracticedExercise, getRecentRecords, getSessionVolume } from "@/lib/selectors";
import { useAppStore } from "@/lib/store";

export default function StatisticsPage() {
  const exercises = useAppStore((state) => state.exercises);
  const sessions = useAppStore((state) => state.sessions);
  const preferences = useAppStore((state) => state.preferences);
  const profile = useAppStore((state) => state.profile);

  const totalVolume = sessions.reduce((total, session) => total + getSessionVolume(session), 0);
  const mostPracticed = getMostPracticedExercise({
    exercises,
    sessions,
    goals: [],
    preferences,
    profile,
    activeWorkout: null,
    lastCompletedSessionId: null,
  });
  const categoryBreakdown = getCategoryBreakdown(sessions, exercises).slice(0, 5);
  const volumeTimeline = getGlobalVolumeTimeline(sessions, "3m");
  const recentRecords = getRecentRecords(sessions, exercises).slice(0, 5);
  const topCategory = categoryBreakdown[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Global Analytics"
        title="Statistiques"
        description="Volume, frequence, categories dominantes et progression globale."
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Volume total" value={formatVolume(totalVolume, preferences.units)} />
        <StatCard label="Seances" value={String(sessions.length)} />
        <StatCard label="Top exercice" value={mostPracticed?.name ?? "-"} />
        <StatCard label="Top categorie" value={topCategory?.name ?? "-"} />
      </div>

      <Card className="glass-card">
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Evolution generale
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold">Volume souleve</h2>
            </div>
            <Badge variant="outline">3 mois</Badge>
          </div>
          <ProgressChart data={volumeTimeline} valueKey="volume" label="Volume" />
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Repartition musculaire
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold">Volume par categorie</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBreakdown} margin={{ left: -20, right: 8, top: 10, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => formatVolume(Number(value), preferences.units)}
                  labelFormatter={(value) => String(value)}
                  contentStyle={{
                    background: "rgba(10,16,30,0.96)",
                    borderColor: "rgba(255,255,255,0.08)",
                    borderRadius: 18,
                  }}
                />
                <Bar dataKey="value" fill="var(--accent-secondary)" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="space-y-4">
          <h2 className="font-display text-2xl font-semibold">Records recents</h2>
          <div className="space-y-3">
            {recentRecords.map((record) => (
              <div
                key={`${record.sessionId}-${record.title}`}
                className="rounded-[20px] border border-white/8 bg-white/4 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{record.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDateShort(record.date)}</p>
                  </div>
                  <Badge>{record.value}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
