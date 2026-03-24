import {
  Activity,
  Dumbbell,
  Flame,
  Orbit,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react";
import {
  CategoryFilter,
  ExerciseIconKey,
  GoalType,
  MuscleCategory,
  TimeRange,
} from "@/lib/types";

export const CATEGORY_ORDER: MuscleCategory[] = [
  "Pectoraux",
  "Dos",
  "Jambes",
  "Epaules",
  "Biceps",
  "Triceps",
  "Abdos",
  "Autres",
];

export const CATEGORY_FILTERS: CategoryFilter[] = ["Tous", ...CATEGORY_ORDER];

export const CATEGORY_META: Record<
  MuscleCategory,
  { accent: string; surface: string; iconClass: string }
> = {
  Pectoraux: {
    accent: "text-rose-300",
    surface: "from-rose-500/18 via-rose-500/6 to-transparent",
    iconClass: "bg-rose-500/14 text-rose-200",
  },
  Dos: {
    accent: "text-sky-300",
    surface: "from-sky-500/18 via-sky-500/6 to-transparent",
    iconClass: "bg-sky-500/14 text-sky-200",
  },
  Jambes: {
    accent: "text-amber-300",
    surface: "from-amber-500/18 via-amber-500/6 to-transparent",
    iconClass: "bg-amber-500/14 text-amber-200",
  },
  Epaules: {
    accent: "text-violet-300",
    surface: "from-violet-500/18 via-violet-500/6 to-transparent",
    iconClass: "bg-violet-500/14 text-violet-200",
  },
  Biceps: {
    accent: "text-emerald-300",
    surface: "from-emerald-500/18 via-emerald-500/6 to-transparent",
    iconClass: "bg-emerald-500/14 text-emerald-200",
  },
  Triceps: {
    accent: "text-cyan-300",
    surface: "from-cyan-500/18 via-cyan-500/6 to-transparent",
    iconClass: "bg-cyan-500/14 text-cyan-200",
  },
  Abdos: {
    accent: "text-fuchsia-300",
    surface: "from-fuchsia-500/18 via-fuchsia-500/6 to-transparent",
    iconClass: "bg-fuchsia-500/14 text-fuchsia-200",
  },
  Autres: {
    accent: "text-zinc-300",
    surface: "from-zinc-400/18 via-zinc-400/6 to-transparent",
    iconClass: "bg-zinc-500/14 text-zinc-200",
  },
};

export const EXERCISE_ICON_COMPONENTS: Record<ExerciseIconKey, typeof Dumbbell> = {
  dumbbell: Dumbbell,
  target: Target,
  "trending-up": TrendingUp,
  flame: Flame,
  shield: Shield,
  zap: Zap,
  waves: Waves,
  orbit: Orbit,
  sparkles: Sparkles,
  activity: Activity,
};

export const ICON_OPTIONS: { value: ExerciseIconKey; label: string }[] = [
  { value: "dumbbell", label: "Dumbbell" },
  { value: "target", label: "Target" },
  { value: "trending-up", label: "Progression" },
  { value: "flame", label: "Intensity" },
  { value: "shield", label: "Power" },
  { value: "zap", label: "Explosive" },
  { value: "waves", label: "Core" },
  { value: "orbit", label: "Flow" },
  { value: "sparkles", label: "Premium" },
  { value: "activity", label: "Activity" },
];

export const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7 j" },
  { value: "30d", label: "30 j" },
  { value: "3m", label: "3 mois" },
  { value: "1y", label: "1 an" },
  { value: "all", label: "Tout" },
];

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  weight: "Poids cible",
  reps: "Repetitions cibles",
  volume: "Volume cible",
  pr: "Nouveau record",
};
