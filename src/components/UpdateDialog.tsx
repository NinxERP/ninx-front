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
  // A atualização é obrigatória: só dá para fechar o diálogo quando a instalação falha,
  // para que uma versão defeituosa não impeça o uso do caixa.
  const podeFechar = status === "error";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && podeFechar && dismiss()}>
      {/* left-1/2: o DialogContent padrão desloca 8rem para compensar a sidebar, que não existe no login. */}
      <DialogContent showCloseButton={podeFechar} className="left-1/2">
        <DialogHeader>
          <DialogTitle>
            {status === "error" ? "Falha na atualização" : status === "ready" ? "Atualização instalada" : "Atualização necessária"}
          </DialogTitle>
          <DialogDescription>
            {status === "error"
              ? error
              : status === "ready"
                ? "Atualização instalada. Reiniciando..."
                : `A versão ${update?.version} precisa ser instalada para continuar (você está na ${update?.currentVersion}).`}
          </DialogDescription>
        </DialogHeader>

        {status === "downloading" && <Progress value={progress} />}

        {status === "available" && (
          <DialogFooter>
            <Button onClick={installUpdate}>Atualizar e reiniciar</Button>
          </DialogFooter>
        )}

        {status === "error" && (
          <DialogFooter>
            <Button variant="outline" onClick={dismiss}>
              Continuar sem atualizar
            </Button>
            <Button onClick={installUpdate}>Tentar novamente</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
