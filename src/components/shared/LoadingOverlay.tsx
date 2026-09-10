import { Loader2 } from "lucide-react";

export function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
      <Loader2 className="size-10 animate-spin text-primary" />
      <p className="text-lg font-medium">{message}</p>
    </div>
  );
}
