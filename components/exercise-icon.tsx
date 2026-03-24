import { CATEGORY_META, EXERCISE_ICON_COMPONENTS } from "@/lib/constants";
import { ExerciseIconKey, MuscleCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ExerciseIcon({
  icon,
  category,
  className,
}: {
  icon: ExerciseIconKey;
  category: MuscleCategory;
  className?: string;
}) {
  const Icon = EXERCISE_ICON_COMPONENTS[icon];
  const meta = CATEGORY_META[category];
  return (
    <div
      className={cn(
        "flex size-11 items-center justify-center rounded-[18px] border border-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        meta.iconClass,
        className,
      )}
    >
      <Icon className="size-5" />
    </div>
  );
}
