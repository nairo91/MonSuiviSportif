import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="space-y-2">
        {eyebrow ? (
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            <span className="inline-flex size-2 rounded-full bg-accent shadow-[0_0_0_6px_rgba(195,255,77,0.08)]" />
            {eyebrow}
          </div>
        ) : null}
        <div>
          <h1 className="font-display text-[2.15rem] font-semibold tracking-[-0.05em] text-foreground sm:text-[2.3rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-[24rem] text-[0.94rem] leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="pt-1">{actions}</div> : null}
    </div>
  );
}
