"use client";

import { useRef } from "react";
import { useTheme } from "next-themes";
import { Download, MoonStar, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNumber } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

export default function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { setTheme } = useTheme();
  const preferences = useAppStore((state) => state.preferences);
  const profile = useAppStore((state) => state.profile);
  const exercises = useAppStore((state) => state.exercises);
  const sessions = useAppStore((state) => state.sessions);
  const goals = useAppStore((state) => state.goals);
  const activeWorkout = useAppStore((state) => state.activeWorkout);
  const lastCompletedSessionId = useAppStore((state) => state.lastCompletedSessionId);
  const backendConfigured = useAppStore((state) => state.backendConfigured);
  const isSyncing = useAppStore((state) => state.isSyncing);
  const lastSyncError = useAppStore((state) => state.lastSyncError);
  const setThemePreference = useAppStore((state) => state.setThemePreference);
  const setUnits = useAppStore((state) => state.setUnits);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const importData = useAppStore((state) => state.importData);
  const resetData = useAppStore((state) => state.resetData);

  const exportData = () => {
    const payload = {
      exercises,
      sessions,
      goals,
      preferences,
      profile,
      activeWorkout,
      lastCompletedSessionId,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "irontrack-export.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export JSON genere.");
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      importData(parsed);
      setTheme(parsed.preferences?.theme ?? "dark");
      toast.success("Donnees importees.");
    } catch {
      toast.error("Le fichier JSON est invalide.");
    }
  };

  const storageSize = new Blob([
    JSON.stringify({
      exercises,
      sessions,
      goals,
      preferences,
      profile,
      activeWorkout,
      lastCompletedSessionId,
    }),
  ]).size;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Preferences"
        title="Parametres"
        description="Theme, profil local, backend de sauvegarde et gestion du stockage."
      />

      <Card className="glass-card">
        <CardContent className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Etat backend</h2>
          <div className="rounded-[22px] border border-white/8 bg-white/4 p-4 text-sm text-muted-foreground">
            <p>Connexion base: {backendConfigured ? "configuree" : "non configuree"}</p>
            <p>Synchronisation: {isSyncing ? "en cours" : "au repos"}</p>
            <p>Sauvegarde locale de secours: active</p>
            <p>Mode cible: sauvegarde serveur persistante des vraies seances.</p>
            {lastSyncError ? <p className="mt-2 text-amber-300">{lastSyncError}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <MoonStar className="size-4 text-accent" />
            <h2 className="font-display text-xl font-semibold">Apparence</h2>
          </div>

          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={preferences.theme}
              onValueChange={(value) => {
                setThemePreference(value as typeof preferences.theme);
                setTheme(value);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Sombre</SelectItem>
                <SelectItem value="light">Clair</SelectItem>
                <SelectItem value="system">Systeme</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Unites</Label>
            <Select value={preferences.units} onValueChange={(value) => setUnits(value as "kg" | "lb")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilogrammes</SelectItem>
                <SelectItem value="lb">Livres</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Profil local</h2>
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input value={profile.name} onChange={(event) => updateProfile({ name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Focus</Label>
            <Input
              value={profile.trainingFocus}
              onChange={(event) => updateProfile({ trainingFocus: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Objectif hebdomadaire</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={String(profile.weeklyTarget)}
              onChange={(event) => updateProfile({ weeklyTarget: Number(event.target.value) || 0 })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Donnees</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={exportData}>
              <Download className="size-4" />
              Export JSON
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" />
              Import JSON
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => handleImport(event.target.files?.[0])}
          />
          <div className="rounded-[22px] border border-white/8 bg-white/4 p-4 text-sm text-muted-foreground">
            <p>Exercices: {exercises.length}</p>
            <p>Seances: {sessions.length}</p>
            <p>Objectifs: {goals.length}</p>
            <p>Stockage estime: {formatNumber(storageSize / 1024, 1)} Ko</p>
          </div>
          <Button
            variant="danger"
            className="w-full"
            onClick={() => {
              if (window.confirm("Reinitialiser toutes les donnees locales ?")) {
                resetData();
                setTheme("dark");
                toast.success("Donnees reinitialisees et renvoyees au backend.");
              }
            }}
          >
            <RotateCcw className="size-4" />
            Reset complet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
