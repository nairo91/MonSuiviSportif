// Logique pure du minuteur de repos (testable sans DOM).

export const DEFAULT_REST_SECONDS = 90;
export const REST_DURATION_OPTIONS = [60, 90, 120, 150, 180] as const;

/** Secondes restantes (entier >= 0) à partir d'un horodatage de fin. */
export function computeRemainingSeconds(endsAtMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((endsAtMs - nowMs) / 1000));
}

/** "1:30", "0:07"... */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Durée de repos à appliquer pour une série : valeur saisie > défaut global. */
export function resolveRestDuration(
  setRestSeconds: number | undefined,
  preferenceSeconds: number | undefined,
): number {
  if (setRestSeconds && setRestSeconds > 0) return Math.min(setRestSeconds, 600);
  if (preferenceSeconds && preferenceSeconds > 0) return Math.min(preferenceSeconds, 600);
  return DEFAULT_REST_SECONDS;
}

/** Progression 0..1 pour la barre (1 = temps écoulé). */
export function computeProgress(remainingSeconds: number, totalSeconds: number): number {
  if (totalSeconds <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds));
}
