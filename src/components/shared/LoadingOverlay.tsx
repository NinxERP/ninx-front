import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingOverlay({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn("z-50 flex flex-col items-center justify-center gap-3 rounded-[inherit] bg-background/80 backdrop-blur-sm", className ?? "absolute inset-0")}>
      <Loader2 className="size-10 animate-spin text-primary" />
      <p className="text-lg font-medium">{message}</p>
    </div>
  );
}
