import { useState } from "react";
import { Check, Store } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/api/client";

export function TrocarComercioDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user, availableComercios, trocarComercio } = useAuth();
  const [trocando, setTrocando] = useState<number | null>(null);

  const selecionar = async (comercioId: number) => {
    if (comercioId === user?.comercioId) {
      onOpenChange(false);
      return;
    }

    setTrocando(comercioId);
    onOpenChange(false);
    try {
      await trocarComercio(comercioId);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao trocar de comércio.");
    } finally {
      setTrocando(null);
    }
  };

  return (
    <>
      {trocando !== null && <LoadingOverlay message="Trocando de comércio..." className="fixed inset-0 left-64 z-50" />}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionar Unidade</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {availableComercios.map((comercio) => {
              const ativo = comercio.comercioID === user?.comercioId;
              return (
                <button
                  key={comercio.comercioID}
                  type="button"
                  onClick={() => selecionar(comercio.comercioID)}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-base font-medium transition-colors hover:bg-accent",
                    ativo ? "border-primary bg-primary/10" : "border-border",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Store className="size-5 shrink-0 text-muted-foreground" />
                    {comercio.nomeComercio}
                  </span>
                  {ativo && <Check className="size-5 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
