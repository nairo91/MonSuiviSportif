import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[110px] w-full rounded-[22px] border bg-card/70 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-accent/50 focus:bg-card-strong",
        className,
      )}
      {...props}
    />
  );
}
