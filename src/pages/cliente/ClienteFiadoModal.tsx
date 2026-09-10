import { Fragment, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Check, ChevronDown, ChevronUp, Download, ExternalLink, FileCheck, FileText, PenLine } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsiblePanel } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusPill } from "@/components/shared/StatusPill";
import { useCurrencyInput } from "@/hooks/useCurrencyInput";
import { useVendasCliente, useReceberPagamentoFiado, useReceberPagamentoGeralFiado } from "@/services/venda";
import { useBaixarDocumentoPdf, useVerificarAssinatura } from "@/services/assinaturaEletronica";
import { FormaPagamento } from "@/types";
import { ApiError } from "@/services/api/client";
import type { ClienteResponse, VendaResponse } from "@/types";

const SIGNATURE_BASE_URL = import.meta.env.VITE_SIGNATURE_BASE_URL;

const FORMA_PAGAMENTO_ITEMS = [
  { value: String(FormaPagamento.Dinheiro), label: "Dinheiro" },
  { value: String(FormaPagamento.Pix), label: "Pix" },
  { value: String(FormaPagamento.Cartao), label: "Cartão" },
];

function statusVendaFiado(venda: VendaResponse) {
  const documentoPendente = venda.documentos.some((d) => !d.assinado);
  if (documentoPendente) return { tone: "warning" as const, texto: "Assinatura Pendente" };
  if (venda.saldoDevedor > 0) return { tone: "danger" as const, texto: "Pendente Pagamento" };
  return { tone: "ok" as const, texto: "Quitada" };
}

function AssinaturaQR({ guid, onAssinado }: { guid: string; onAssinado: () => void }) {
  const verificar = useVerificarAssinatura();
  const [assinado, setAssinado] = useState(false);
  const link = `${SIGNATURE_BASE_URL}/?guid=${guid}`;

  const verificarAssinatura = async () => {
    const ok = await verificar.mutateAsync(guid);
    if (ok) setAssinado(true);
    else toast.info("Aguardando assinatura. O cliente precisa escanear o código e assinar.");
  };

  if (assinado) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
          <Check className="size-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-base font-semibold">Assinatura confirmada!</p>
          <p className="text-sm text-muted-foreground">O recibo foi assinado com sucesso.</p>
        </div>
        <Button onClick={onAssinado}>Concluir</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-base font-semibold">Assinatura do Recibo</p>
        <p className="text-sm text-muted-foreground">Peça ao cliente para escanear o código e assinar</p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-foreground/10">
        <QRCodeSVG value={link} size={200} />
      </div>

      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <ExternalLink className="size-3.5" /> Ou abra o link manualmente
      </a>

      <Button onClick={verificarAssinatura} disabled={verificar.isPending} className="w-full sm:w-auto">
        {verificar.isPending ? "Verificando..." : "Verificar Assinatura"}
      </Button>
    </div>
  );
}

export function ClienteFiadoModal({ cliente, onClose }: { cliente: ClienteResponse; onClose: () => void }) {
  const { data: vendas, isLoading } = useVendasCliente(cliente.clienteID, true);
  const receberIndividual = useReceberPagamentoFiado();
  const receberGeral = useReceberPagamentoGeralFiado();
  const baixar = useBaixarDocumentoPdf();

  const [vendaExpandidaId, setVendaExpandidaId] = useState<number | null>(null);
  const [pagamento, setPagamento] = useState<{ vendaId: number | null; geral: boolean } | null>(null);
  const [formaPagamento, setFormaPagamento] = useState<string>(String(FormaPagamento.Dinheiro));
  const valor = useCurrencyInput(0);
  const [documentoGuid, setDocumentoGuid] = useState<string | null>(null);
  const [reciboAssinatura, setReciboAssinatura] = useState<string | null>(null);

  const totalVendido = vendas?.reduce((acc, v) => acc + v.total, 0) ?? 0;
  const totalPago = vendas?.reduce((acc, v) => acc + v.valorPago, 0) ?? 0;
  const saldoDevedor = vendas?.reduce((acc, v) => acc + v.saldoDevedor, 0) ?? 0;

  const abrirPagamento = (venda: VendaResponse | null, geral: boolean) => {
    setPagamento({ vendaId: venda?.vendaID ?? null, geral });
    valor.reset(geral ? saldoDevedor : (venda?.saldoDevedor ?? 0));
    setFormaPagamento(String(FormaPagamento.Dinheiro));
    setDocumentoGuid(null);
  };

  const confirmarPagamento = async () => {
    if (!pagamento) return;
    try {
      const guid = pagamento.geral
        ? await receberGeral.mutateAsync({
            clienteId: cliente.clienteID,
            body: { valorPago: valor.value, formaPagamento: Number(formaPagamento) },
          })
        : await receberIndividual.mutateAsync({
            vendaId: pagamento.vendaId!,
            body: { valorPago: valor.value, formaPagamento: Number(formaPagamento) },
          });
      setDocumentoGuid(guid);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao registrar pagamento.");
    }
  };

  const pagamentoAssinado = () => {
    if (documentoGuid) baixar.mutate({ guid: documentoGuid, assinado: true });
    setPagamento(null);
    setDocumentoGuid(null);
  };

  const registrando = receberIndividual.isPending || receberGeral.isPending;

  const fecharOuVoltar = () => {
    if (pagamento) {
      setPagamento(null);
      setDocumentoGuid(null);
    } else if (reciboAssinatura) {
      setReciboAssinatura(null);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && fecharOuVoltar()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Fiado — {cliente.nome}</DialogTitle>
        </DialogHeader>

        {pagamento ? (
          documentoGuid ? (
            <AssinaturaQR guid={documentoGuid} onAssinado={pagamentoAssinado} />
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                {pagamento.geral ? `Pagamento geral — saldo total R$ ${saldoDevedor.toFixed(2)}` : "Pagamento desta venda"}
              </p>
              <div className="flex flex-col gap-1.5">
                <Label>Valor a ser pago</Label>
                <input
                  className="h-10 rounded-lg border border-input bg-transparent px-3.5 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={valor.formatted}
                  onChange={(e) => valor.onInputChange(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Forma de Pagamento</Label>
                <Select
                  items={FORMA_PAGAMENTO_ITEMS}
                  value={formaPagamento}
                  onValueChange={(v) => setFormaPagamento(v ?? String(FormaPagamento.Dinheiro))}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMA_PAGAMENTO_ITEMS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={confirmarPagamento} disabled={registrando || valor.value <= 0} className="w-full sm:w-auto">
                  {registrando ? "Registrando..." : "Pagar"}
                </Button>
              </DialogFooter>
            </div>
          )
        ) : reciboAssinatura ? (
          <AssinaturaQR guid={reciboAssinatura} onAssinado={() => setReciboAssinatura(null)} />
        ) : (
          <div className="flex min-w-0 flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <Card size="sm">
                <CardContent>
                  <p className="text-xl font-semibold">R$ {totalVendido.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Total a Fiado</p>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardContent>
                  <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">R$ {totalPago.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Total Pago</p>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardContent>
                  <p className={`text-xl font-semibold ${saldoDevedor > 0 ? "text-destructive" : ""}`}>
                    R$ {saldoDevedor.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Saldo Devedor</p>
                </CardContent>
              </Card>
            </div>

            {saldoDevedor > 0 && <Button onClick={() => abrirPagamento(null, true)}>Pagar Todas as Vendas</Button>}

            <div className="scroll-styled min-w-0 max-h-80 overflow-y-auto rounded-lg border">
              {isLoading ? (
                <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
              ) : !vendas || vendas.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Nenhuma venda fiada registrada para este cliente.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Data</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Deve</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendas.map((v) => {
                      const status = statusVendaFiado(v);
                      const expandida = vendaExpandidaId === v.vendaID;
                      return (
                        <Fragment key={v.vendaID}>
                          <TableRow>
                            <TableCell className="text-center text-sm">
                              {v.criadoEm ? new Date(v.criadoEm).toLocaleDateString("pt-BR") : "—"}
                            </TableCell>
                            <TableCell className="text-center">
                              <StatusPill tone={status.tone} text={status.texto} />
                            </TableCell>
                            <TableCell className="text-center">R$ {v.total.toFixed(2)}</TableCell>
                            <TableCell className={`text-center font-medium ${v.saldoDevedor > 0 ? "text-destructive" : ""}`}>
                              R$ {v.saldoDevedor.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-1">
                                {v.saldoDevedor > 0 && (
                                  <Button size="sm" variant="outline" onClick={() => abrirPagamento(v, false)}>
                                    Pagar
                                  </Button>
                                )}
                                <Tooltip>
                                  <TooltipTrigger
                                    render={<Button size="icon-sm" variant="ghost" />}
                                    onClick={() => setVendaExpandidaId(expandida ? null : v.vendaID)}
                                  >
                                    {expandida ? <ChevronUp /> : <ChevronDown />}
                                  </TooltipTrigger>
                                  <TooltipContent>Recibos</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={5} className="p-0">
                              <Collapsible
                                open={expandida}
                                onOpenChange={(open) => setVendaExpandidaId(open ? v.vendaID : null)}
                              >
                                <CollapsiblePanel>
                                  <div className="flex flex-col gap-2 bg-muted/30 p-3">
                                    {v.documentos.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">Nenhum documento gerado para esta venda.</p>
                                    ) : (
                                      v.documentos.map((doc, idx) => (
                                        <div
                                          key={doc.documentoGuid}
                                          className="flex items-center justify-between rounded-md border bg-background p-2 text-sm"
                                        >
                                          <div className="flex items-center gap-2">
                                            {idx === 0 ? (
                                              <FileText className="size-4 text-primary" />
                                            ) : (
                                              <FileCheck className="size-4 text-emerald-600" />
                                            )}
                                            <span>{idx === 0 ? "Venda Original" : `Recibo de Pagamento #${idx}`}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            {!doc.assinado && (
                                              <Button size="sm" variant="outline" onClick={() => setReciboAssinatura(doc.documentoGuid)}>
                                                <PenLine /> Assinar
                                              </Button>
                                            )}
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              disabled={baixar.isPending}
                                              onClick={() => baixar.mutate({ guid: doc.documentoGuid, assinado: doc.assinado })}
                                            >
                                              <Download /> PDF
                                            </Button>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </CollapsiblePanel>
                              </Collapsible>
                            </TableCell>
                          </TableRow>
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
