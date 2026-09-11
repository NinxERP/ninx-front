import { cn } from "@/lib/utils";

type StatusTone = "ok" | "warning" | "danger" | "neutral";

const TONE_CLASSES: Record<StatusTone, string> = {
  ok: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  neutral: "bg-muted text-muted-foreground",
};

export function StatusPill({ tone, text }: { tone: StatusTone; text: string }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-sm font-medium", TONE_CLASSES[tone])}>
      {text}
    </span>
  );
}
