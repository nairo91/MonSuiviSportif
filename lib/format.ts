import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { GoalType } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export function formatDateTime(value?: string) {
  if (!value) return "Jamais";
  return format(parseISO(value), "d MMM yyyy, HH:mm", { locale: fr });
}

export function formatDateShort(value?: string) {
  if (!value) return "-";
  return format(parseISO(value), "EEE d MMM", { locale: fr });
}

export function formatRelative(value?: string) {
  if (!value) return "Jamais";
  return `${formatDistanceToNowStrict(parseISO(value), {
    addSuffix: true,
    locale: fr,
  })}`;
}

export function formatDurationMinutes(minutes: number) {
  const safe = Math.max(0, Math.round(minutes));
  const hrs = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hrs === 0) return `${mins} min`;
  return `${hrs} h ${mins.toString().padStart(2, "0")}`;
}

export function formatWeight(value: number, units: "kg" | "lb" = "kg") {
  return `${formatNumber(value, value % 1 === 0 ? 0 : 1)} ${units}`;
}

export function formatVolume(value: number, units: "kg" | "lb" = "kg") {
  return `${formatNumber(value)} ${units}`;
}

export function formatGoalValue(
  type: GoalType,
  goal: {
    targetWeight?: number;
    targetReps?: number;
    targetVolume?: number;
  },
) {
  if (type === "weight") return `${goal.targetWeight ?? 0} kg`;
  if (type === "reps") return `${goal.targetReps ?? 0} reps`;
  if (type === "volume") return `${goal.targetVolume ?? 0} kg`;
  return "Battre le PR";
}
