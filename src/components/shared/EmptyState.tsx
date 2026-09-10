import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
}

export function EmptyState({ icon: Icon, title, message }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
      <Icon className="size-12 opacity-50" />
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="text-base">{message}</p>
    </div>
  );
}
