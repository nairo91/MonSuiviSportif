"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, TimerReset, X } from "lucide-react";
import { computeProgress, computeRemainingSeconds, formatCountdown } from "@/lib/rest-timer";

interface RestTimerProps {
  /** Horodatage (ms) de fin du repos ; null = pas de minuteur affiché. */
  endsAt: number | null;
  totalSeconds: number;
  onExtend: (extraSeconds: number) => void;
  onDismiss: () => void;
}

function notifyRestOver() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch {
    // vibration non supportée : tant pis
  }

  try {
    type AudioContextCtor = typeof AudioContext;
    const win = window as Window & { webkitAudioContext?: AudioContextCtor };
    const Ctor: AudioContextCtor | undefined = window.AudioContext ?? win.webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.6);
    oscillator.onended = () => void ctx.close();
  } catch {
    // audio bloqué : la vibration/l'UI suffisent
  }
}

export function RestTimer({ endsAt, totalSeconds, onExtend, onDismiss }: RestTimerProps) {
  const [now, setNow] = useState(() => Date.now());
  const notifiedForRef = useRef<number | null>(null);

  useEffect(() => {
    if (endsAt === null) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [endsAt]);

  const remaining = endsAt === null ? 0 : computeRemainingSeconds(endsAt, now);

  useEffect(() => {
    if (endsAt === null) return;
    if (remaining <= 0 && notifiedForRef.current !== endsAt) {
      notifiedForRef.current = endsAt;
      notifyRestOver();
    }
  }, [remaining, endsAt]);

  if (endsAt === null) return null;

  const isOver = remaining <= 0;
  const progress = computeProgress(remaining, totalSeconds);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div
        className={`mx-auto max-w-md rounded-[22px] border p-3 shadow-2xl backdrop-blur-xl transition-colors ${
          isOver
            ? "border-accent/60 bg-accent/15"
            : "border-white/10 bg-black/70"
        }`}
        role="timer"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <TimerReset className={`size-5 shrink-0 ${isOver ? "text-accent" : "text-muted-foreground"}`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
              {isOver ? "Repos terminé !" : "Repos"}
            </p>
            <p className={`font-display text-2xl font-semibold tabular-nums ${isOver ? "text-accent" : ""}`}>
              {isOver ? "C'est reparti 💪" : formatCountdown(remaining)}
            </p>
          </div>
          {!isOver && (
            <button
              onClick={() => onExtend(30)}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium hover:bg-white/10"
            >
              <Plus className="size-3" />
              30s
            </button>
          )}
          <button
            onClick={onDismiss}
            aria-label={isOver ? "Fermer le minuteur" : "Passer le repos"}
            className="rounded-full border border-white/10 bg-white/5 p-1.5 hover:bg-white/10"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${isOver ? "bg-accent" : "bg-accent/60"}`}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
