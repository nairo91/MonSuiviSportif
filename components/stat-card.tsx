import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  badge,
}: {
  label: string;
  value: string;
  hint?: string;
  badge?: string;
}) {
  return (
    <Card className="glass-card overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </span>
          {badge ? (
            <Badge>{badge}</Badge>
          ) : (
            <div className="flex size-9 items-center justify-center rounded-2xl bg-white/6 text-accent">
              <ArrowUpRight className="size-4" />
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="font-display text-[2rem] font-semibold tracking-[-0.05em]">{value}</p>
          {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
