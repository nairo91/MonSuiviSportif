import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-12 w-full rounded-2xl border bg-card/70 px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-accent/50 focus:bg-card-strong",
        className,
      )}
      {...props}
    />
  );
}
