"use client";

import { Sparkles, Target } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const loadRemoteState = useAppStore((state) => state.loadRemoteState);
  const profile = useAppStore((state) => state.profile);
  const preferences = useAppStore((state) => state.preferences);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  const [name, setName] = useState(profile.name);
  const [focus, setFocus] = useState(profile.trainingFocus);
  const [weeklyTarget, setWeeklyTarget] = useState(String(profile.weeklyTarget));

  useEffect(() => {
    void loadRemoteState();
  }, [loadRemoteState]);

  useEffect(() => {
    if (hasHydrated) {
      setTheme(preferences.theme);
    }
  }, [hasHydrated, preferences.theme, setTheme]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="glass-card flex w-full max-w-sm items-center justify-center px-6 py-10 text-sm text-muted-foreground">
          Synchronisation de votre carnet IronTrack...
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {!preferences.onboardingCompleted ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[radial-gradient(circle_at_top,_rgba(195,255,77,0.12),_transparent_32%),rgba(5,8,20,0.9)] p-4 backdrop-blur-xl">
          <div className="glass-card w-full max-w-[430px] overflow-hidden p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <Sparkles className="size-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-accent">IronTrack</p>
                <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">
                  Un suivi premium, rapide et motive.
                </h2>
              </div>
            </div>

            <div className="mb-6 rounded-[24px] border border-white/8 bg-white/4 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <Target className="size-4 text-accent" />
                Setup express
              </div>
              <p className="text-sm text-muted-foreground">
                Quelques infos suffisent. L&apos;app charge votre bibliotheque de base, sans
                aucune seance fictive, puis sauvegarde ensuite vos vraies donnees.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom affiche</Label>
                <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="focus">Focus d&apos;entrainement</Label>
                <Input
                  id="focus"
                  value={focus}
                  onChange={(event) => setFocus(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Objectif hebdomadaire</Label>
                <Input
                  id="target"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={7}
                  value={weeklyTarget}
                  onChange={(event) => setWeeklyTarget(event.target.value)}
                />
              </div>
            </div>

            <Button
              className="mt-6 w-full accent-pulse"
              size="lg"
              onClick={() =>
                completeOnboarding({
                  name: name || "Athlete",
                  trainingFocus: focus || "Progression personnelle",
                  weeklyTarget: Number(weeklyTarget) || 4,
                })
              }
            >
              Ouvrir mon espace
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
