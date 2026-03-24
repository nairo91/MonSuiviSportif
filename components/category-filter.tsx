"use client";

import { CATEGORY_FILTERS, CATEGORY_META } from "@/lib/constants";
import { CategoryFilter } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryFilterChips({
  value,
  onChange,
}: {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-2 pb-1">
        {CATEGORY_FILTERS.map((category) => {
          const active = value === category;
          const isAll = category === "Tous";
          const meta = !isAll ? CATEGORY_META[category] : null;

          return (
            <button
              key={category}
              onClick={() => onChange(category)}
              className={cn(
                "rounded-full border px-4 py-2.5 text-sm font-semibold transition whitespace-nowrap",
                active
                  ? "border-transparent bg-[linear-gradient(180deg,rgba(235,255,180,0.98),rgba(195,255,77,0.94))] text-slate-950 shadow-[0_18px_34px_-22px_rgba(195,255,77,0.72)]"
                  : "border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] text-muted-foreground hover:bg-card-strong/80",
                !isAll && !active && meta?.accent,
              )}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
