import { useState } from "react";
import { toast } from "sonner";
import { Download, FileSignature, UserMinus, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusPill } from "@/components/shared/StatusPill";
import { useCurrencyInput } from "@/hooks/useCurrencyInput";
import { useAuth } from "@/context/AuthContext";
import { formatarNumero } from "@/lib/currency";
import { maskCpf } from "@/lib/masks";
import { validarCpf } from "@/lib/validators";
import { ApiError } from "@/services/api/client";
import { useBaixarDocumentoPdf } from "@/services/assinaturaEletronica";
import { useAdicionarAutorizado, useContaFiado, useGerarTermoAbertura, useRevogarAutorizado } from "@/services/contaFiado";
import { AssinaturaQR } from "@/pages/cliente/ClienteFiadoModal";
import { PARENTESCO_LABEL, Parentesco } from "@/types";
import type { ClienteResponse, PessoaAutorizadaResponse } from "@/types";

const PARENTESCO_ITEMS = Object.entries(PARENTESCO_LABEL).map(([value, label]) => ({ value, label }));

const TONE_SITUACAO = { Autorizada: "ok", Pendente: "warning", "Revogação pendente": "warning", Revogada: "neutral" } as const;

const reais = (valor: number) => `R$ ${formatarNumero(valor)}`;

const TERMO_STATUS = {
  Ativo: { tone: "ok", texto: "Vigente" },
  Aguardando: { tone: "warning", texto: "Aguardando assinatura" },
  Substituido: { tone: "neutral", texto: "Substituída" },
  Cancelado: { tone: "neutral", texto: "Não assinada" },
} as const;

function formatarData(iso?: string) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "";
}

export function ClienteContaModal({
  cliente,
  guidInicial,
  onClose,
}: {
  cliente: ClienteResponse;
  guidInicial?: string;
  onClose: () => void;
}) {
  const { data: conta, isLoading, refetch } = useContaFiado(cliente.clienteID);
  const adicionar = useAdicionarAutorizado();
  const revogar = useRevogarAutorizado();
  const gerarTermo = useGerarTermoAbertura();
  const baixar = useBaixarDocumentoPdf();
  const { user } = useAuth();

  const [guidAssinatura, setGuidAssinatura] = useState<string | null>(guidInicial ?? null);
  const [revogando, setRevogando] = useState<PessoaAutorizadaResponse | null>(null);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [parentesco, setParentesco] = useState(String(Parentesco.Conjuge));
  const [menorDeIdade, setMenorDeIdade] = useState(false);
  const limite = useCurrencyInput(0);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const incluir = async () => {
    setErroForm(null);
    if (nome.trim().length < 3) return setErroForm("Informe o nome, com pelo menos 3 caracteres.");
    if (cpf && !validarCpf(cpf)) return setErroForm("CPF inválido.");
    try {
      await adicionar.mutateAsync({
        clienteId: cliente.clienteID,
        body: {
          nome: nome.trim(),
          cpf: cpf || undefined,
          parentesco: Number(parentesco),
          menorDeIdade,
          limiteCredito: limite.value > 0 ? limite.value : undefined,
        },
      });
      setNome("");
      setCpf("");
      setMenorDeIdade(false);
      limite.reset(0);
      toast.success("Pessoa incluída. Gere um novo termo de abertura para que ela possa comprar.");
    } catch (err) {
      setErroForm(err instanceof ApiError ? err.message : "Erro ao incluir pessoa autorizada.");
    }
  };

  const confirmarRevogacao = async () => {
    if (!revogando) return;
    try {
      await revogar.mutateAsync({ clienteId: cliente.clienteID, autorizadoId: revogando.pessoaAutorizadaID });
      toast.success(`Revogação de ${revogando.nome} registrada. Gere a nova versão do termo para o titular assinar.`);
      setRevogando(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao revogar autorização.");
    }
  };

  const gerar = async () => {
    try {
      const { documentoGuid } = await gerarTermo.mutateAsync(cliente.clienteID);
      setGuidAssinatura(documentoGuid);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao gerar o termo de abertura.");
    }
  };

  const termoAssinado = () => {
    setGuidAssinatura(null);
    refetch();
  };

  return (
    <Dialog open onOpenChange={(next) => !next && (guidAssinatura ? setGuidAssinatura(null) : onClose())}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Conta de fiado — {cliente.nome}</DialogTitle>
        </DialogHeader>

        {guidAssinatura ? (
          <AssinaturaQR
            guid={guidAssinatura}
            onAssinado={termoAssinado}
            titulo="Assinatura do Termo de Abertura"
            documento="O termo de abertura"
          />
        ) : isLoading || !conta ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : (
          // shrink-0: sem ele os cartões encolhem dentro da coluna rolável e cortam o conteúdo.
          // px-1: dá espaço para a borda (ring) dos cartões, que fica fora da caixa e era cortada.
          <div className="scroll-styled -mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-1 *:shrink-0">
            <Card>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Termo de abertura de conta</span>
                    <span className="text-sm text-muted-foreground">
                      {conta.termoAtivo
                        ? `Assinado em ${formatarData(conta.termoAssinadoEm)}.`
                        : "Sem termo assinado: este cliente ainda não pode comprar fiado."}
                    </span>
                  </div>
                  <StatusPill tone={conta.termoAtivo ? "ok" : "danger"} text={conta.termoAtivo ? "Conta ativa" : "Sem termo"} />
                </div>

                <p className="text-sm">
                  Limite de crédito: <span className="font-medium">{reais(conta.limiteCredito)}</span>
                  {conta.limitePendente !== undefined && conta.limitePendente !== null && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {" "}· novo limite de {reais(conta.limitePendente)} aguardando a assinatura do titular
                    </span>
                  )}
                </p>

                {conta.termoAtivo && conta.precisaNovoTermo && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Há inclusões ou revogações que só valem depois que o titular assinar uma nova versão do termo.
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {conta.documentoGuidTermoPendente && (
                    <Button variant="outline" onClick={() => setGuidAssinatura(conta.documentoGuidTermoPendente!)}>
                      <FileSignature /> Continuar assinatura pendente
                    </Button>
                  )}
                  <Button variant={conta.precisaNovoTermo ? "default" : "outline"} onClick={gerar} disabled={gerarTermo.isPending}>
                    <FileSignature /> {gerarTermo.isPending ? "Gerando..." : conta.termos.length > 0 ? "Gerar nova versão" : "Gerar termo de abertura"}
                  </Button>
                  {conta.documentoGuidTermoAtivo && (
                    <Button
                      variant="ghost"
                      disabled={baixar.isPending}
                      onClick={() =>
                        baixar.mutate({
                          guid: conta.documentoGuidTermoAtivo!,
                          assinado: true,
                          nomeArquivo: "TermoAberturaConta",
                          comercioNome: user?.nomeComercio,
                          clienteNome: cliente.nome,
                        })
                      }
                    >
                      <Download /> Baixar termo assinado
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Pessoas autorizadas a comprar nesta conta</span>
              {conta.autorizados.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma pessoa autorizada. Só o titular pode comprar.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Parentesco</TableHead>
                      <TableHead className="text-right">Limite</TableHead>
                      <TableHead className="text-right">Deve</TableHead>
                      <TableHead className="text-right">Disponível</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conta.autorizados.map((p) => (
                      <TableRow key={p.pessoaAutorizadaID}>
                        <TableCell className="truncate">{p.nome}</TableCell>
                        <TableCell>
                          {PARENTESCO_LABEL[p.parentesco]}
                          {p.menorDeIdade ? " (menor)" : ""}
                        </TableCell>
                        <TableCell className="text-right">{p.limiteCredito ? reais(p.limiteCredito) : "Da conta"}</TableCell>
                        <TableCell className="text-right">{reais(p.saldoDevedor)}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${p.saldoDisponivel !== undefined && p.saldoDisponivel !== null && p.saldoDisponivel <= 0 ? "text-destructive" : ""}`}
                        >
                          {p.saldoDisponivel !== undefined && p.saldoDisponivel !== null ? reais(p.saldoDisponivel) : "—"}
                        </TableCell>
                        <TableCell>
                          <StatusPill tone={TONE_SITUACAO[p.situacao]} text={p.situacao} />
                        </TableCell>
                        <TableCell className="text-right">
                          {(p.situacao === "Autorizada" || p.situacao === "Pendente") && (
                            <Button variant="ghost" size="icon-sm" title="Revogar autorização" onClick={() => setRevogando(p)}>
                              <UserMinus />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {conta.termos.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Versões do termo</span>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Versão</TableHead>
                      <TableHead className="text-right">Limite</TableHead>
                      <TableHead>Gerada em</TableHead>
                      <TableHead>Assinada em</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conta.termos.map((t) => (
                      <TableRow key={t.versao}>
                        <TableCell>{t.versao}</TableCell>
                        <TableCell className="text-right">{reais(t.limiteCredito)}</TableCell>
                        <TableCell>{formatarData(t.criadoEm)}</TableCell>
                        <TableCell>{formatarData(t.assinadoEm) || "—"}</TableCell>
                        <TableCell>
                          <StatusPill tone={TERMO_STATUS[t.status].tone} text={TERMO_STATUS[t.status].texto} />
                        </TableCell>
                        <TableCell className="text-right">
                          {t.documentoGuid && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Baixar esta versão"
                              disabled={baixar.isPending}
                              onClick={() =>
                                baixar.mutate({
                                  guid: t.documentoGuid!,
                                  assinado: !!t.assinadoEm,
                                  nomeArquivo: `TermoAberturaConta-v${t.versao}`,
                                  comercioNome: user?.nomeComercio,
                                  clienteNome: cliente.nome,
                                })
                              }
                            >
                              <Download />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <Card>
              <CardContent className="flex flex-col gap-3">
                <span className="text-sm font-medium">Incluir pessoa autorizada</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label>Nome</Label>
                    <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>CPF (opcional)</Label>
                    <Input value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} placeholder="000.000.000-00" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Parentesco</Label>
                    <Select items={PARENTESCO_ITEMS} value={parentesco} onValueChange={(v) => setParentesco(v ?? String(Parentesco.Outro))}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PARENTESCO_ITEMS.map((i) => (
                          <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Limite de crédito próprio (opcional)</Label>
                    <Input value={limite.formatted} onChange={(e) => limite.onInputChange(e.target.value)} />
                  </div>
                  <label className="flex items-center gap-2 self-end pb-2 text-sm">
                    <Checkbox checked={menorDeIdade} onCheckedChange={(v) => setMenorDeIdade(Boolean(v))} />
                    Menor de idade
                  </label>
                </div>
                {erroForm && <p className="text-sm text-destructive">{erroForm}</p>}
                <Button className="w-fit" onClick={incluir} disabled={adicionar.isPending}>
                  <UserPlus /> {adicionar.isPending ? "Incluindo..." : "Incluir"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <ConfirmDialog
          open={revogando !== null}
          title="Revogar autorização"
          description={`A revogação de ${revogando?.nome ?? ""} só vale depois que o titular assinar a nova versão do termo; até lá a pessoa continua autorizada. As compras já feitas continuam válidas.`}
          confirmLabel="Revogar"
          isProcessing={revogar.isPending}
          onConfirm={confirmarRevogacao}
          onClose={() => setRevogando(null)}
        />
      </DialogContent>
    </Dialog>
  );
}
