import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { useAppUpdater } from "@/hooks/useAppUpdater";

export function UpdateDialog({ updater }: { updater: ReturnType<typeof useAppUpdater> }) {
  const { status, update, progress, error, installUpdate, dismiss } = updater;
  const open = status !== "idle" && status !== "checking";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent showCloseButton={status !== "downloading"}>
        <DialogHeader>
          <DialogTitle>Nova versão disponível</DialogTitle>
          <DialogDescription>
            {status === "error"
              ? error
              : status === "ready"
                ? "Atualização instalada. Reiniciando..."
                : `A versão ${update?.version} está disponível (você está na ${update?.currentVersion}).`}
          </DialogDescription>
        </DialogHeader>

        {status === "downloading" && <Progress value={progress} />}

        {(status === "available" || status === "error") && (
          <DialogFooter>
            <Button variant="outline" onClick={dismiss}>
              Agora não
            </Button>
            <Button onClick={installUpdate}>Atualizar e reiniciar</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
