import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAtualizarCategoria, useCategorias, useCriarCategoria, useExcluirCategoria } from "@/services/categoriaProduto";
import { ApiError } from "@/services/api/client";
import type { CategoriaProdutoResponse } from "@/types";

const PAGE_SIZE = 10;

export function CategoriaProdutoGestao() {
  const navigate = useNavigate();
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebouncedValue(busca);

  const { data, isLoading } = useCategorias(pagina, PAGE_SIZE, buscaDebounced);
  const criar = useCriarCategoria();
  const atualizar = useAtualizarCategoria();
  const excluir = useExcluirCategoria();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<CategoriaProdutoResponse | null>(null);
  const [nome, setNome] = useState("");
  const [exclusao, setExclusao] = useState<CategoriaProdutoResponse | null>(null);

  const abrirNova = () => {
    setEditando(null);
    setNome("");
    setModalAberto(true);
  };

  const abrirEdicao = (categoria: CategoriaProdutoResponse) => {
    setEditando(categoria);
    setNome(categoria.nome);
    setModalAberto(true);
  };

  const salvar = async () => {
    try {
      if (editando) {
        await atualizar.mutateAsync({ id: editando.categoriaID, body: { nome } });
        toast.success("Categoria atualizada.");
      } else {
        await criar.mutateAsync({ nome });
        toast.success("Categoria criada.");
      }
      setModalAberto(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar categoria.");
    }
  };

  const confirmarExclusao = async () => {
    if (!exclusao) return;
    try {
      await excluir.mutateAsync(exclusao.categoriaID);
      toast.success("Categoria excluída.");
      setExclusao(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir categoria.");
    }
  };

  const salvando = criar.isPending || atualizar.isPending;

  return (
    <div className="flex h-full flex-col p-6">
      <Button variant="ghost" size="sm" className="mb-4 w-fit" onClick={() => navigate("/mainpage/gestao")}>
        <ArrowLeft /> Voltar
      </Button>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categorias de Produto</h1>
          {data && <p className="text-sm text-muted-foreground">{data.totalRecords} categorias cadastradas</p>}
        </div>
        <Button onClick={abrirNova}>
          <Plus /> Nova Categoria
        </Button>
      </div>

      <Input
        placeholder="Buscar por nome..."
        value={busca}
        onChange={(e) => {
          setBusca(e.target.value);
          setPagina(1);
        }}
        className="mb-4 max-w-sm"
      />

      <div className="flex min-h-0 flex-1 flex-col rounded-lg border">
        {isLoading ? (
          <LoadingState />
        ) : !data || data.data.length === 0 ? (
          <EmptyState icon={Tag} title="Nenhuma categoria encontrada" message="Crie a primeira categoria para organizar seus produtos." />
        ) : (
          <div className="scroll-styled flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((categoria) => (
                  <TableRow key={categoria.categoriaID}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Tag className="size-3.5" />
                        </span>
                        {categoria.nome}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" onClick={() => abrirEdicao(categoria)}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setExclusao(categoria)}>
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {data && (
          <Pagination
            paginaAtual={pagina}
            totalPaginas={data.totalPages}
            totalItens={data.totalRecords}
            itemLabel="categorias"
            onPageChange={setPagina}
          />
        )}
      </div>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <Input placeholder="Nome da categoria" value={nome} onChange={(e) => setNome(e.target.value)} />
          <DialogFooter>
            <Button onClick={salvar} disabled={salvando || nome.trim().length === 0}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={exclusao !== null}
        title="Excluir Categoria"
        description={`Tem certeza que deseja excluir "${exclusao?.nome}"?`}
        isProcessing={excluir.isPending}
        onConfirm={confirmarExclusao}
        onClose={() => setExclusao(null)}
      />
    </div>
  );
}
