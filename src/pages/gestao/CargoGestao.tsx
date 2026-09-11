import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAtualizarCargo, useCargos, useCriarCargo, useExcluirCargo } from "@/services/cargo";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/api/client";
import type { CargoResponse } from "@/types";

export function CargoGestao() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: cargos, isLoading } = useCargos(user?.comercioId);
  const criar = useCriarCargo();
  const atualizar = useAtualizarCargo();
  const excluir = useExcluirCargo();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<CargoResponse | null>(null);
  const [nome, setNome] = useState("");
  const [peso, setPeso] = useState("");
  const [cargoBase, setCargoBase] = useState(false);
  const [exclusao, setExclusao] = useState<CargoResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const abrirNovo = () => {
    setEditando(null);
    setNome("");
    setPeso("");
    setCargoBase(false);
    setErro(null);
    setModalAberto(true);
  };

  const abrirEdicao = (cargo: CargoResponse) => {
    setEditando(cargo);
    setNome(cargo.nome);
    setPeso(String(cargo.peso));
    setErro(null);
    setModalAberto(true);
  };

  const salvar = async () => {
    setErro(null);
    const pesoNum = Number(peso);

    if (pesoNum <= 0 || (!user?.admin && pesoNum >= (user?.cargoPeso ?? 0))) {
      setErro(`Peso deve ser um número positivo menor que ${user?.cargoPeso ?? 0}.`);
      return;
    }

    try {
      if (editando) {
        await atualizar.mutateAsync({ id: editando.cargoID, body: { nome, peso: pesoNum } });
        toast.success("Cargo atualizado.");
      } else {
        await criar.mutateAsync({ nome, peso: pesoNum, comercioID: cargoBase ? undefined : user?.comercioId });
        toast.success(cargoBase ? "Cargo base criado." : "Cargo criado.");
      }
      setModalAberto(false);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro ao salvar cargo.");
    }
  };

  const podeEditar = (cargo: CargoResponse) => !cargo.reservado && (cargo.comercioID != null || !!user?.admin);

  const confirmarExclusao = async () => {
    if (!exclusao) return;
    try {
      await excluir.mutateAsync(exclusao.cargoID);
      toast.success("Cargo desativado.");
      setExclusao(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao desativar cargo.");
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
          <h1 className="text-2xl font-semibold">Cargos</h1>
          {cargos && <p className="text-sm text-muted-foreground">{cargos.length} cargos cadastrados</p>}
        </div>
        <Button onClick={abrirNovo}>
          <Plus /> Novo Cargo
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-lg border">
        {isLoading ? (
          <LoadingState />
        ) : !cargos || cargos.length === 0 ? (
          <EmptyState icon={Shield} title="Nenhum cargo encontrado" message="Crie o primeiro cargo customizado deste comércio." />
        ) : (
          <div className="scroll-styled flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargos.map((cargo) => (
                  <TableRow key={cargo.cargoID}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Shield className="size-3.5" />
                        </span>
                        {cargo.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cargo.peso}
                    </TableCell>
                    <TableCell className="text-right">
                      {podeEditar(cargo) && (
                        <>
                          <Button variant="ghost" size="icon-sm" onClick={() => abrirEdicao(cargo)}>
                            <Pencil />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setExclusao(cargo)}>
                            <Trash2 />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input placeholder="Nome do cargo" value={nome} onChange={(e) => setNome(e.target.value)} />
            <Input placeholder="Peso" type="number" value={peso} onChange={(e) => setPeso(e.target.value)} />
            {!editando && user?.admin && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={cargoBase} onChange={(e) => setCargoBase(e.target.checked)} />
                Cargo base (global, compartilhado por todos os comércios)
              </label>
            )}
            {erro && <p className="text-sm text-destructive">{erro}</p>}
          </div>
          <DialogFooter>
            <Button onClick={salvar} disabled={salvando || !nome.trim() || !peso}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={exclusao !== null}
        title="Desativar Cargo"
        description={`Tem certeza que deseja desativar "${exclusao?.nome}"?`}
        isProcessing={excluir.isPending}
        onConfirm={confirmarExclusao}
        onClose={() => setExclusao(null)}
      />
    </div>
  );
}
