"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Dumbbell, History, Home, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/exercises", label: "Exercices", icon: Dumbbell },
  { href: "/history", label: "Historique", icon: History },
  { href: "/statistics", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Reglages", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 md:pb-6">
      <nav className="pointer-events-auto flex w-full max-w-[430px] items-center justify-between rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,40,0.92),rgba(8,12,24,0.9))] px-3 py-3 shadow-[0_30px_70px_-38px_rgba(0,0,0,0.92)] backdrop-blur-2xl safe-bottom">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-[62px] flex-col items-center gap-1 rounded-[22px] px-3 py-2 text-[11px] font-semibold transition",
                active
                  ? "bg-[linear-gradient(180deg,rgba(235,255,180,0.98),rgba(195,255,77,0.94))] text-slate-950 shadow-[0_20px_38px_-22px_rgba(195,255,77,0.72)]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-2xl transition",
                  active ? "bg-slate-950/10" : "bg-transparent",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
