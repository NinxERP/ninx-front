import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ScanBarcode,
  ShoppingBasket,
  Check,
  User,
  HandCoins,
  Banknote,
  QrCode,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { buscarProdutoPorCodigoBarras } from "@/services/produto";
import { buscarClientesPorNome } from "@/services/cliente";
import { useCriarVenda, useEstornarVenda } from "@/services/venda";
import { useVerificarAssinatura } from "@/services/assinaturaEletronica";
import { useCurrencyInput } from "@/hooks/useCurrencyInput";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAuth } from "@/context/AuthContext";
import { formatarNumero } from "@/lib/currency";
import { FormaPagamento, TipoVenda } from "@/types";
import { ApiError } from "@/services/api/client";
import type { ClienteResponse, VendaResponse } from "@/types";

const SIGNATURE_BASE_URL = import.meta.env.VITE_SIGNATURE_BASE_URL;

interface CarrinhoItem {
  produtoID: number;
  nome: string;
  codigoBarras?: string;
  precoUnitario: number;
  quantidade: number;
  unidadeMedida: string;
  estoqueDisponivel: number;
}

export function Venda() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const criarVenda = useCriarVenda();
  const estornarVenda = useEstornarVenda();
  const verificar = useVerificarAssinatura();

  const [etapa, setEtapa] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [codigoBarras, setCodigoBarras] = useState("");
  const codigoBarrasDebounced = useDebouncedValue(codigoBarras, 500);
  const [buscandoProduto, setBuscandoProduto] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const [tipoVenda, setTipoVenda] = useState<0 | typeof TipoVenda.Normal | typeof TipoVenda.Fiado>(0);
  const [buscaCliente, setBuscaCliente] = useState("");
  const buscaClienteDebounced = useDebouncedValue(buscaCliente);
  const [resultadosCliente, setResultadosCliente] = useState<ClienteResponse[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteResponse | null>(null);
  const clienteRef = useRef<HTMLInputElement>(null);

  const [metodoPagamento, setMetodoPagamento] = useState<0 | FormaPagamento>(0);
  const valorRecebido = useCurrencyInput(0);

  const [vendaCriada, setVendaCriada] = useState<VendaResponse | null>(null);
  const [assinado, setAssinado] = useState(false);
  const [confirmSairAberto, setConfirmSairAberto] = useState(false);
  const [confirmDesistirAberto, setConfirmDesistirAberto] = useState(false);

  useEffect(() => {
    if (etapa === 1) barcodeRef.current?.focus();
  }, [etapa, carrinho.length]);

  useEffect(() => {
    if (etapa !== 1) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      const jaEmCampoDeTexto = alvo?.tagName === "INPUT" || alvo?.tagName === "TEXTAREA";
      if (jaEmCampoDeTexto || e.ctrlKey || e.metaKey || e.altKey) return;
      barcodeRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [etapa]);

  useEffect(() => {
    if (buscaClienteDebounced.trim().length < 3) {
      setResultadosCliente([]);
      return;
    }
    buscarClientesPorNome(buscaClienteDebounced).then(setResultadosCliente);
  }, [buscaClienteDebounced]);

  useEffect(() => {
    if (tipoVenda === TipoVenda.Fiado) clienteRef.current?.focus();
  }, [tipoVenda]);

  useEffect(() => {
    if (codigoBarrasDebounced.trim()) adicionarPorCodigoBarras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoBarrasDebounced]);

  const totalVenda = carrinho.reduce((acc, i) => acc + i.precoUnitario * i.quantidade, 0);
  const troco = metodoPagamento === FormaPagamento.Dinheiro ? Math.max(0, valorRecebido.value - totalVenda) : 0;
  const documentoGuid = vendaCriada?.documentos[0]?.documentoGuid;

  const adicionarPorCodigoBarras = async () => {
    const codigo = codigoBarras.trim();
    if (!codigo) return;
    setCodigoBarras("");

    setBuscandoProduto(true);
    const produto = await buscarProdutoPorCodigoBarras(codigo).finally(() => setBuscandoProduto(false));
    if (!produto) {
      toast.error("Produto não encontrado.");
      return;
    }

    setCarrinho((atual) => {
      const existente = atual.find((i) => i.produtoID === produto.produtoID);
      const quantidadeDesejada = (existente?.quantidade ?? 0) + 1;
      if (quantidadeDesejada > produto.quantidade) {
        toast.error("Estoque insuficiente.");
        return atual;
      }
      if (existente) {
        return atual.map((i) => (i.produtoID === produto.produtoID ? { ...i, quantidade: quantidadeDesejada } : i));
      }
      return [
        ...atual,
        {
          produtoID: produto.produtoID,
          nome: produto.nome,
          codigoBarras: produto.codigoBarras,
          precoUnitario: produto.precoVenda,
          quantidade: 1,
          unidadeMedida: produto.unidadeMedida,
          estoqueDisponivel: produto.quantidade,
        },
      ];
    });
  };

  const alterarQuantidade = (produtoID: number, delta: number) => {
    setCarrinho((atual) =>
      atual
        .map((i) => {
          if (i.produtoID !== produtoID) return i;
          const nova = i.quantidade + delta;
          if (nova > i.estoqueDisponivel) {
            toast.error("Estoque insuficiente.");
            return i;
          }
          return { ...i, quantidade: nova };
        })
        .filter((i) => i.quantidade > 0),
    );
  };

  const definirQuantidade = (produtoID: number, quantidade: number) => {
    setCarrinho((atual) =>
      atual
        .map((i) => {
          if (i.produtoID !== produtoID) return i;
          if (quantidade > i.estoqueDisponivel) {
            toast.error("Estoque insuficiente.");
            return i;
          }
          return { ...i, quantidade };
        })
        .filter((i) => i.quantidade > 0),
    );
  };

  const podeAvancarTipoVenda = tipoVenda === TipoVenda.Normal || (tipoVenda === TipoVenda.Fiado && clienteSelecionado !== null);

  const podeProsseguirPagamento = () => {
    if (metodoPagamento === 0) return false;
    if (tipoVenda === TipoVenda.Normal) {
      return metodoPagamento === FormaPagamento.Dinheiro ? valorRecebido.value >= totalVenda : true;
    }
    return valorRecebido.value < totalVenda;
  };

  const confirmarPagamento = async () => {
    if (!user) return;
    if (!tipoVenda) {
      toast.error("Selecione o tipo de venda.");
      return;
    }
    if (carrinho.length === 0) {
      toast.error("O carrinho está vazio.");
      return;
    }
    const valorPagamento = tipoVenda === TipoVenda.Normal ? totalVenda : valorRecebido.value;
    if (valorPagamento <= 0) {
      toast.error("Valor de pagamento inválido.");
      return;
    }

    try {
      const response = await criarVenda.mutateAsync({
        comercioID: user.comercioId,
        usuarioID: user.usuarioId,
        clienteID: clienteSelecionado?.clienteID,
        tipoVenda,
        itensVenda: carrinho.map((i) => ({
          produtoID: i.produtoID,
          quantidade: i.quantidade,
          unidadeMedida: i.unidadeMedida as never,
          comercioId: user.comercioId,
        })),
        pagamentos: [{ formaPagamento: metodoPagamento as FormaPagamento, valor: valorPagamento }],
      });
      setVendaCriada(response);
      setEtapa(tipoVenda === TipoVenda.Fiado ? 4 : 5);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao registrar venda.");
    }
  };

  const verificarAssinaturaEConcluir = async () => {
    if (!documentoGuid) return;
    const ok = await verificar.mutateAsync(documentoGuid);
    if (ok) {
      setAssinado(true);
      setEtapa(5);
    } else {
      toast.info("Ainda não assinado.");
    }
  };

  const desistirDaVenda = async () => {
    if (!vendaCriada) return;
    try {
      await estornarVenda.mutateAsync(vendaCriada.vendaID);
      reiniciar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao desistir da venda.");
    }
  };

  const sairDaVenda = () => {
    if (carrinho.length > 0) {
      setConfirmSairAberto(true);
      return;
    }
    navigate("/mainpage");
  };

  const reiniciar = () => {
    setEtapa(1);
    setCarrinho([]);
    setTipoVenda(0);
    setClienteSelecionado(null);
    setBuscaCliente("");
    setMetodoPagamento(0);
    valorRecebido.reset(0);
    setVendaCriada(null);
    setAssinado(false);
  };

  const mensagemLoading = buscandoProduto
    ? "Buscando produto..."
    : criarVenda.isPending
      ? "Finalizando venda..."
      : verificar.isPending
        ? "Verificando assinatura..."
        : estornarVenda.isPending
          ? "Desistindo da venda..."
          : null;

  return (
    <div className="relative flex h-full min-w-0 flex-col overflow-x-hidden p-6">
      {mensagemLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
          <span className="size-8 animate-spin rounded-full border-4 border-muted-foreground border-t-transparent" />
          <p className="text-sm font-medium">{mensagemLoading}</p>
        </div>
      )}
      <div className="mb-4 flex items-start justify-between">
        <div>
          {etapa === 1 && (
            <Button variant="ghost" size="sm" className="mb-1 -ml-2 w-fit" onClick={sairDaVenda}>
              <ArrowLeft /> Voltar
            </Button>
          )}
          <h1 className="text-2xl font-semibold">Realizar Venda</h1>
        </div>
        {etapa >= 2 && etapa <= 4 && carrinho.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{carrinho.reduce((acc, i) => acc + i.quantidade, 0)} itens</Badge>
            <span className="font-semibold text-foreground">R$ {formatarNumero(totalVenda)}</span>
          </div>
        )}
      </div>

      {etapa === 1 && (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="relative max-w-md">
            <ScanBarcode className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              ref={barcodeRef}
              className="pl-8"
              placeholder="Escaneie ou digite o código de barras..."
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && adicionarPorCodigoBarras()}
            />
            {buscandoProduto && (
              <span className="absolute top-2.5 right-2.5 size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            )}
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border">
            {carrinho.length === 0 ? (
              <EmptyState icon={ShoppingBasket} title="Carrinho vazio" message="Escaneie ou digite o código de barras de um produto para começar." />
            ) : (
              <div className="scroll-styled min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
                {carrinho.map((item) => (
                  <div key={item.produtoID} className="flex min-w-0 items-center justify-between gap-3 border-b p-3 text-sm last:border-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.nome}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        R$ {item.precoUnitario.toFixed(2)} / {item.unidadeMedida}
                        {item.codigoBarras && <span className="ml-2">· Cód: {item.codigoBarras}</span>}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button variant="outline" size="icon-sm" onClick={() => alterarQuantidade(item.produtoID, -1)}><Minus /></Button>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantidade}
                        onChange={(e) => definirQuantidade(item.produtoID, Number(e.target.value))}
                        className="w-16 text-center [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <Button variant="outline" size="icon-sm" onClick={() => alterarQuantidade(item.produtoID, 1)}><Plus /></Button>
                      <span className="w-20 text-right font-medium">R$ {(item.precoUnitario * item.quantidade).toFixed(2)}</span>
                      <Button variant="ghost" size="icon-sm" onClick={() => alterarQuantidade(item.produtoID, -item.quantidade)}><Trash2 /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-lg font-semibold">Total: R$ {formatarNumero(totalVenda)}</span>
            <Button disabled={carrinho.length === 0} onClick={() => setEtapa(2)}>Continuar para pagamento</Button>
          </div>
        </div>
      )}

      {etapa === 2 && (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6">
          <p className="text-center text-base text-muted-foreground">Como essa venda será registrada?</p>
          <div className="flex gap-6">
            <button
              onClick={() => setTipoVenda((t) => (t === TipoVenda.Normal ? 0 : TipoVenda.Normal))}
              className={`flex flex-1 flex-col items-center gap-3 rounded-lg border p-6 text-center transition-colors lg:p-10 ${tipoVenda === TipoVenda.Normal ? "border-primary bg-primary/10" : "hover:bg-accent"}`}
            >
              <HandCoins className="size-8 text-muted-foreground lg:size-14" />
              <span className="text-lg font-medium lg:text-xl">Venda Normal</span>
              <span className="text-sm text-muted-foreground">Pagamento à vista</span>
            </button>
            <button
              onClick={() => setTipoVenda((t) => (t === TipoVenda.Fiado ? 0 : TipoVenda.Fiado))}
              className={`flex flex-1 flex-col items-center gap-3 rounded-lg border p-6 text-center transition-colors lg:p-10 ${tipoVenda === TipoVenda.Fiado ? "border-primary bg-primary/10" : "hover:bg-accent"}`}
            >
              <User className="size-8 text-muted-foreground lg:size-14" />
              <span className="text-lg font-medium lg:text-xl">Venda Fiado</span>
              <span className="text-sm text-muted-foreground">Fica registrado na conta do cliente</span>
            </button>
          </div>

          {tipoVenda === TipoVenda.Fiado && (
            <div className="flex flex-col gap-2">
              <Input ref={clienteRef} placeholder="Buscar cliente por nome..." value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)} />
              {resultadosCliente.length > 0 && (
                <div className="rounded-md border">
                  <div className="scroll-styled max-h-40 overflow-y-auto">
                    {resultadosCliente.map((c) => (
                      <button
                        key={c.clienteID}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => {
                          setClienteSelecionado(c);
                          setBuscaCliente(c.nome);
                          setResultadosCliente([]);
                        }}
                      >
                        {c.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {clienteSelecionado && (
                <p className="flex items-center gap-1.5 text-sm text-emerald-600">
                  <Check className="size-4" /> Cliente selecionado: <span className="font-medium">{clienteSelecionado.nome}</span>
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setEtapa(1)}>Voltar</Button>
            <Button disabled={!podeAvancarTipoVenda} onClick={() => setEtapa(3)}>Continuar para pagamento</Button>
          </div>
        </div>
      )}

      {etapa === 3 && (
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-4">
          <p className="text-center text-sm text-muted-foreground">Qual a forma de pagamento?</p>
          <div className="flex gap-4">
            {[
              { forma: FormaPagamento.Dinheiro, label: "Dinheiro", Icon: Banknote },
              { forma: FormaPagamento.Pix, label: "Pix", Icon: QrCode },
              { forma: FormaPagamento.Cartao, label: "Cartão", Icon: CreditCard },
            ].map(({ forma, label, Icon }) => (
              <button
                key={forma}
                onClick={() => setMetodoPagamento(forma)}
                className={`flex flex-1 flex-col items-center gap-2 rounded-lg border p-5 text-center text-sm transition-colors ${metodoPagamento === forma ? "border-primary bg-primary/10" : "hover:bg-accent"}`}
              >
                <Icon className="size-7 text-muted-foreground" />
                {label}
              </button>
            ))}
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total da venda</span>
              <span className="text-lg font-semibold">R$ {formatarNumero(totalVenda)}</span>
            </div>

            {(metodoPagamento === FormaPagamento.Dinheiro || tipoVenda === TipoVenda.Fiado) && metodoPagamento !== 0 && (
              <div className="mt-3 flex flex-col gap-1.5 border-t pt-3">
                <label className="text-sm text-muted-foreground">Valor Recebido</label>
                <Input value={valorRecebido.formatted} onChange={(e) => valorRecebido.onInputChange(e.target.value)} />
              </div>
            )}

            {metodoPagamento === FormaPagamento.Dinheiro && tipoVenda === TipoVenda.Normal && (
              <div className="mt-3 flex justify-between border-t pt-3 text-sm">
                <span className="text-muted-foreground">Troco</span>
                <span className={`font-semibold ${troco > 0 ? "text-emerald-600" : ""}`}>R$ {formatarNumero(troco)}</span>
              </div>
            )}

            {tipoVenda === TipoVenda.Fiado && (
              <div className="mt-3 flex justify-between border-t pt-3 text-sm">
                <span className="text-muted-foreground">Saldo devedor</span>
                <span className={`font-semibold ${valorRecebido.value >= totalVenda ? "text-destructive" : "text-amber-600"}`}>
                  {valorRecebido.value >= totalVenda
                    ? "Valor Inválido"
                    : `R$ ${formatarNumero(totalVenda - valorRecebido.value)}`}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setEtapa(2)}>Voltar</Button>
            <Button disabled={!podeProsseguirPagamento() || criarVenda.isPending} onClick={confirmarPagamento}>
              <Check /> {criarVenda.isPending ? "Finalizando..." : "Finalizar Venda"}
            </Button>
          </div>
        </div>
      )}

      {etapa === 4 && documentoGuid && (
        <div className="mx-auto flex max-w-sm flex-1 flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-lg font-medium">Assinatura do Documento</h2>
          <p className="text-sm text-muted-foreground">Peça ao cliente para escanear o código abaixo para assinar a venda fiada.</p>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <QRCodeSVG value={`${SIGNATURE_BASE_URL}/?guid=${documentoGuid}`} size={220} />
          </div>
          <a href={`${SIGNATURE_BASE_URL}/?guid=${documentoGuid}`} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
            Ou clique aqui
          </a>
          <p className="text-lg font-semibold">Total: R$ {formatarNumero(totalVenda)}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setConfirmDesistirAberto(true)} disabled={estornarVenda.isPending}>Desistir da venda</Button>
            <Button onClick={verificarAssinaturaEConcluir} disabled={verificar.isPending}>
              {verificar.isPending ? "Verificando..." : "Verificar assinatura e concluir"}
            </Button>
          </div>
        </div>
      )}

      {etapa === 5 && vendaCriada && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <CheckCircle2 className="size-16 text-emerald-600" />
          <div>
            <h2 className="text-lg font-medium">Venda Concluída!</h2>
            <p className="text-sm text-muted-foreground">A venda foi registrada com sucesso.</p>
          </div>
          <p className="text-3xl font-semibold">R$ {formatarNumero(vendaCriada.total)}</p>
          {tipoVenda === TipoVenda.Fiado && assinado && (
            <p className="flex items-center gap-1.5 text-sm text-emerald-600">
              <Check className="size-4" /> Documento assinado.
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={reiniciar}>Realizar outra venda</Button>
            <Button onClick={() => navigate("/mainpage")}>Página principal</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmSairAberto}
        title="Sair da venda?"
        description="Os itens do carrinho serão perdidos."
        confirmLabel="Sair"
        onConfirm={() => {
          setConfirmSairAberto(false);
          navigate("/mainpage");
        }}
        onClose={() => setConfirmSairAberto(false)}
      />

      <ConfirmDialog
        open={confirmDesistirAberto}
        title="Desistir da venda?"
        description="A venda será cancelada e os itens ficarão disponíveis novamente."
        confirmLabel="Desistir"
        isProcessing={estornarVenda.isPending}
        onConfirm={() => {
          setConfirmDesistirAberto(false);
          desistirDaVenda();
        }}
        onClose={() => setConfirmDesistirAberto(false)}
      />
    </div>
  );
}
