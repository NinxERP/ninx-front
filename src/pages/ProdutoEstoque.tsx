import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Power, Package, Search, Filter, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusPill } from "@/components/shared/StatusPill";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useCurrencyInput } from "@/hooks/useCurrencyInput";
import { useAtualizarProduto, useCriarProduto, useExcluirProduto, useProdutos } from "@/services/produto";
import { useAtualizarEstoque } from "@/services/estoque";
import { useCategorias } from "@/services/categoriaProduto";
import { statusProduto } from "@/lib/produtoStatus";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/api/client";
import type { ProdutoResponse } from "@/types";

const PAGE_SIZE = 10;
const FILTROS = [
  { valor: "ok", label: "Normal" },
  { valor: "baixo", label: "Abaixo do Mínimo" },
  { valor: "zerado", label: "Sem Estoque" },
  { valor: "desativados", label: "Desativados" },
];

const UNIDADES_MEDIDA = [
  { value: "UN", label: "UN — Unidade" },
  { value: "KG", label: "KG — Quilograma" },
  { value: "L", label: "L — Litro" },
  { value: "G", label: "G — Grama" },
];

interface FormState {
  nome: string;
  codigoBarras: string;
  unidadeMedida: string;
  categoriaID: string;
  validade: string;
  estoqueInicial: string;
  quantidade: string;
  quantidadeMinima: string;
}

const FORM_VAZIO: FormState = {
  nome: "",
  codigoBarras: "",
  unidadeMedida: "UN",
  categoriaID: "0",
  validade: "",
  estoqueInicial: "0",
  quantidade: "0",
  quantidadeMinima: "0",
};

export function ProdutoEstoque() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState<string[]>([]);
  const buscaDebounced = useDebouncedValue(busca);

  const { data, isLoading, isFetching } = useProdutos(pagina, PAGE_SIZE, filtros, buscaDebounced);
  const { data: categorias } = useCategorias(1, 100, "");
  const categoriaItems = [
    { value: "0", label: "Sem categoria" },
    ...(categorias?.data.map((c) => ({ value: String(c.categoriaID), label: c.nome })) ?? []),
  ];
  const criar = useCriarProduto();
  const atualizar = useAtualizarProduto();
  const atualizarEstoque = useAtualizarEstoque();
  const excluir = useExcluirProduto();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<ProdutoResponse | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [exclusao, setExclusao] = useState<ProdutoResponse | null>(null);
  const precoVenda = useCurrencyInput(0);
  const precoCusto = useCurrencyInput(0);

  const toggleFiltro = (valor: string) => {
    setFiltros((f) => (f.includes(valor) ? f.filter((v) => v !== valor) : [...f, valor]));
    setPagina(1);
  };

  const abrirNovo = () => {
    setEditando(null);
    setForm(FORM_VAZIO);
    precoVenda.reset(0);
    precoCusto.reset(0);
    setErro(null);
    setModalAberto(true);
  };

  const abrirEdicao = (produto: ProdutoResponse) => {
    setEditando(produto);
    setForm({
      nome: produto.nome,
      codigoBarras: produto.codigoBarras ?? "",
      unidadeMedida: produto.unidadeMedida,
      categoriaID: String(produto.categoriaID ?? 0),
      validade: produto.validade?.slice(0, 10) ?? "",
      estoqueInicial: "0",
      quantidade: String(produto.quantidade),
      quantidadeMinima: String(produto.quantidadeMinima),
    });
    precoVenda.reset(produto.precoVenda);
    precoCusto.reset(produto.precoCusto ?? 0);
    setErro(null);
    setModalAberto(true);
  };

  const salvar = async () => {
    setErro(null);
    const nome = form.nome.trim();

    if (nome.length < 3 || nome.length > 150) {
      setErro("Nome deve ter entre 3 e 150 caracteres.");
      return;
    }
    if (precoVenda.value <= 0) {
      setErro("Preço de venda deve ser maior que zero.");
      return;
    }

    const categoriaID = Number(form.categoriaID) > 0 ? Number(form.categoriaID) : undefined;

    try {
      if (editando) {
        await atualizar.mutateAsync({
          id: editando.produtoID,
          body: {
            nome,
            codigoBarras: form.codigoBarras || undefined,
            unidadeMedida: form.unidadeMedida as never,
            categoriaID,
            precoVenda: precoVenda.value,
            precoCusto: precoCusto.value || undefined,
            validade: form.validade || undefined,
            ativo: editando.ativo,
          },
        });
        await atualizarEstoque.mutateAsync({
          id: editando.estoqueID,
          body: {
            produtoID: editando.produtoID,
            quantidade: Number(form.quantidade),
            quantidadeMinima: Number(form.quantidadeMinima),
          },
        });
        toast.success(`Produto "${nome}" atualizado.`);
      } else {
        await criar.mutateAsync({
          comercioID: user!.comercioId,
          nome,
          codigoBarras: form.codigoBarras || undefined,
          unidadeMedida: form.unidadeMedida as never,
          categoriaID,
          precoVenda: precoVenda.value,
          precoCusto: precoCusto.value || undefined,
          validade: form.validade || undefined,
          estoqueInicial: Number(form.estoqueInicial),
          quantidadeMinima: Number(form.quantidadeMinima),
        });
        toast.success(`Produto "${nome}" criado.`);
      }
      setModalAberto(false);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro ao salvar produto.");
    }
  };

  const ativarProduto = async (produto: ProdutoResponse) => {
    try {
      await atualizar.mutateAsync({
        id: produto.produtoID,
        body: {
          nome: produto.nome,
          codigoBarras: produto.codigoBarras,
          unidadeMedida: produto.unidadeMedida,
          categoriaID: produto.categoriaID,
          precoVenda: produto.precoVenda,
          precoCusto: produto.precoCusto,
          validade: produto.validade,
          ativo: true,
        },
      });
      toast.success(`Produto "${produto.nome}" ativado.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao ativar produto.");
    }
  };

  const confirmarExclusao = async () => {
    if (!exclusao) return;
    try {
      await excluir.mutateAsync(exclusao.produtoID);
      toast.success(`Produto "${exclusao.nome}" excluído.`);
      setExclusao(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir produto.");
    }
  };

  const salvando = criar.isPending || atualizar.isPending || atualizarEstoque.isPending;

  return (
    <div className="flex h-full flex-col p-6">
      <Button variant="ghost" size="sm" className="mb-4 w-fit" onClick={() => navigate("/mainpage")}>
        <ArrowLeft /> Voltar
      </Button>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Estoque & Produtos</h1>
          <p className="text-sm text-muted-foreground">Gerencie produtos e quantidades em estoque</p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus /> Novo Produto
        </Button>
      </div>

      {data?.summary && (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card size="sm" className="bg-emerald-500/10 ring-emerald-500/20">
            <CardContent>
              <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{data.summary.totalNormal}</p>
              <p className="text-sm text-muted-foreground">Normal</p>
            </CardContent>
          </Card>
          <Card size="sm" className="bg-amber-500/10 ring-amber-500/20">
            <CardContent>
              <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{data.summary.totalBaixo}</p>
              <p className="text-sm text-muted-foreground">Abaixo do Mínimo</p>
            </CardContent>
          </Card>
          <Card size="sm" className="bg-red-500/10 ring-red-500/20">
            <CardContent>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{data.summary.totalZerado}</p>
              <p className="text-sm text-muted-foreground">Sem Estoque</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar por nome ou código de barras..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
          />
        </div>
        <Popover>
          <PopoverTrigger
            render={<Button type="button" size="icon" variant={filtros.length > 0 ? "default" : "outline"} />}
          >
            <Filter />
          </PopoverTrigger>
          <PopoverContent>
            {FILTROS.map((f) => {
              const ativo = filtros.includes(f.valor);
              return (
                <button
                  key={f.valor}
                  type="button"
                  onClick={() => toggleFiltro(f.valor)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                >
                  <Checkbox checked={ativo} />
                  {f.label}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col rounded-lg border" style={{ minHeight: 560 }}>
        {isFetching && !isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {isLoading ? (
          <LoadingState />
        ) : !data || data.data.length === 0 ? (
          <EmptyState icon={Package} title="Nenhum produto encontrado" message='Adicione o primeiro produto clicando em "Novo Produto".' />
        ) : (
          <div className="scroll-styled flex-1 overflow-y-auto">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Produto</TableHead>
                  <TableHead className="w-28">Código</TableHead>
                  <TableHead className="w-20 text-center">Qtd</TableHead>
                  <TableHead className="w-28 text-right">Venda</TableHead>
                  <TableHead className="w-32 text-center">Status</TableHead>
                  <TableHead className="w-28 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody keepLastBorder={pagina < (data.totalPages ?? 1)}>
                {data.data.map((produto) => {
                  const status = statusProduto(produto);
                  return (
                    <TableRow key={produto.produtoID}>
                      <TableCell className="text-left">
                        <div className="truncate font-medium">{produto.nome}</div>
                        <div className="truncate text-sm text-muted-foreground">
                          {produto.unidadeMedida} · {produto.categoriaNome ?? "Sem categoria"}
                        </div>
                      </TableCell>
                      <TableCell className="truncate">{produto.codigoBarras || "—"}</TableCell>
                      <TableCell className="text-center">{produto.quantidade}</TableCell>
                      <TableCell className="text-right font-medium">R$ {produto.precoVenda.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <StatusPill tone={status.tone} text={status.texto} />
                      </TableCell>
                      <TableCell className="text-right">
                        {produto.ativo ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="hover:bg-primary/10 hover:text-primary"
                              onClick={() => abrirEdicao(produto)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setExclusao(produto)}
                            >
                              <Trash2 />
                            </Button>
                          </>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => ativarProduto(produto)}>
                            <Power />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {data && (
          <Pagination paginaAtual={pagina} totalPaginas={data.totalPages} totalItens={data.totalRecords} itemLabel="produtos" onPageChange={setPagina} />
        )}
      </div>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Nome do Produto</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Código de Barras</Label>
              <Input value={form.codigoBarras} onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Unidade de Medida</Label>
              <Select
                items={UNIDADES_MEDIDA}
                value={form.unidadeMedida}
                onValueChange={(v) => setForm({ ...form, unidadeMedida: v ?? "UN" })}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIDADES_MEDIDA.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Categoria</Label>
              <Select
                items={categoriaItems}
                value={form.categoriaID}
                onValueChange={(v) => setForm({ ...form, categoriaID: v ?? "0" })}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sem categoria</SelectItem>
                  {categorias?.data.map((c) => (
                    <SelectItem key={c.categoriaID} value={String(c.categoriaID)}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Preço de Venda</Label>
              <Input value={precoVenda.formatted} onChange={(e) => precoVenda.onInputChange(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Preço de Custo</Label>
              <Input value={precoCusto.formatted} onChange={(e) => precoCusto.onInputChange(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Validade</Label>
              <Input type="date" value={form.validade} onChange={(e) => setForm({ ...form, validade: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Quantidade Mínima</Label>
              <Input type="number" min={0} value={form.quantidadeMinima} onChange={(e) => setForm({ ...form, quantidadeMinima: e.target.value })} />
            </div>
            {editando ? (
              <div className="flex flex-col gap-1.5">
                <Label>Quantidade em Estoque</Label>
                <Input type="number" min={0} value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label>Estoque Inicial</Label>
                <Input type="number" min={0} value={form.estoqueInicial} onChange={(e) => setForm({ ...form, estoqueInicial: e.target.value })} />
              </div>
            )}
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}

          <DialogFooter>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : editando ? "Salvar Alterações" : "Criar Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={exclusao !== null}
        title="Excluir Produto"
        description={`Tem certeza que deseja excluir "${exclusao?.nome}"?`}
        isProcessing={excluir.isPending}
        onConfirm={confirmarExclusao}
        onClose={() => setExclusao(null)}
      />
    </div>
  );
}
