import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CreditCard, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusPill } from "@/components/shared/StatusPill";
import { useAssinaturaPlano, useCancelarAssinatura, useHistoricoPagamentos } from "@/services/assinaturaPlano";
import { ApiError } from "@/services/api/client";

const PAGE_SIZE = 10;

const STATUS_TONE: Record<string, "ok" | "warning" | "danger"> = {
  Ativa: "ok",
  Vencida: "warning",
  Cancelada: "danger",
};

const fmtData = (data: string) => new Date(data).toLocaleDateString("pt-BR");

export function MinhaAssinatura() {
  const navigate = useNavigate();
  const { data: assinatura, isLoading } = useAssinaturaPlano();
  const [pagina, setPagina] = useState(1);
  const { data: historico } = useHistoricoPagamentos(pagina, PAGE_SIZE);
  const cancelar = useCancelarAssinatura();
  const [confirmando, setConfirmando] = useState(false);

  const confirmarCancelamento = async () => {
    try {
      await cancelar.mutateAsync();
      toast.success("Cancelamento agendado. O acesso segue ativo até o fim da vigência.");
      setConfirmando(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao cancelar assinatura.");
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="flex h-full flex-col p-6">
      <Button variant="ghost" size="sm" className="mb-4 w-fit" onClick={() => navigate("/mainpage")}>
        <ArrowLeft /> Voltar
      </Button>
      <h1 className="mb-6 text-2xl font-semibold">Minha Assinatura</h1>

      <div className="scroll-styled mx-auto flex w-full min-h-0 flex-1 flex-col justify-center overflow-y-auto max-w-4xl">
        <div className="flex flex-col gap-4">
          {assinatura && (
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CreditCard className="size-4" />
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground">Seu plano</p>
                      <p className="font-semibold">{assinatura.plano}</p>
                    </div>
                  </div>
                  <StatusPill tone={STATUS_TONE[assinatura.status] ?? "neutral"} text={assinatura.status} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Início</p>
                    <p className="text-sm font-medium">{fmtData(assinatura.dataInicio)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Vencimento</p>
                    <p className="text-sm font-medium">{fmtData(assinatura.dataFim)}</p>
                  </div>
                </div>

                {assinatura.cancelamentoSolicitadoEm && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <span>Cancelamento agendado — acesso ativo até o fim da vigência.</span>
                  </div>
                )}

                {assinatura.status === "Ativa" && !assinatura.cancelamentoSolicitadoEm && (
                  <Button variant="destructive" size="sm" className="w-fit" onClick={() => setConfirmando(true)}>
                    Cancelar assinatura
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex h-72 flex-col rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex flex-1 flex-col gap-3">
              <p className="text-sm font-medium">Histórico de pagamentos</p>

              {historico && historico.data.length === 0 ? (
                <div className="flex flex-1 items-center justify-center py-6">
                  <EmptyState icon={Receipt} title="Nenhum pagamento encontrado" message="Os pagamentos da sua assinatura aparecerão aqui." />
                </div>
              ) : (
                <div className="flex flex-1 flex-col justify-between gap-3">
                  <div className="scroll-styled max-h-56 overflow-y-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Valor</TableHead>
                          <TableHead>Pago em</TableHead>
                          <TableHead>Vencimento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody keepLastBorder={pagina < (historico?.totalPages ?? 1)}>
                        {historico?.data.map((p) => (
                          <TableRow key={p.pagamentoAssinaturaID}>
                            <TableCell>R$ {p.valor.toFixed(2)}</TableCell>
                            <TableCell>{fmtData(p.dataPagamento)}</TableCell>
                            <TableCell>{fmtData(p.dataVencimento)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {historico && (
                    <Pagination
                      paginaAtual={pagina}
                      totalPaginas={historico.totalPages}
                      totalItens={historico.totalRecords}
                      itemLabel="pagamentos"
                      onPageChange={setPagina}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={confirmando}
          title="Cancelar Assinatura"
          description="O cancelamento será agendado e o acesso continua ativo até o fim da vigência atual. Deseja continuar?"
          isProcessing={cancelar.isPending}
          onConfirm={confirmarCancelamento}
          onClose={() => setConfirmando(false)}
        />
      </div>
    </div>
  );
}
