import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, UserX, UserCog, Key, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusPill } from "@/components/shared/StatusPill";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  buscarUsuarioPorEmail,
  useAtualizarUsuario,
  useAtualizarUsuarioGlobal,
  useCriarUsuario,
  useDesativarGlobal,
  useResetarSenha,
  useRevogarAcesso,
  useUsuariosComercio,
  useUsuariosPlataforma,
  useVincularUsuarioComercio,
} from "@/services/usuario";
import { useCargos } from "@/services/cargo";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/api/client";
import type { UsuarioListaResponse, UsuarioResponse } from "@/types";

const PAGE_SIZE = 10;

export function UsuariosGestao() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState("");
  const [verTodos, setVerTodos] = useState(false);
  const buscaDebounced = useDebouncedValue(busca);

  const { data: dataComercio, isLoading: loadingComercio } = useUsuariosComercio(pagina, PAGE_SIZE, buscaDebounced, !verTodos);
  const { data: dataPlataforma, isLoading: loadingPlataforma } = useUsuariosPlataforma(pagina, PAGE_SIZE, buscaDebounced, verTodos);
  const data = verTodos ? dataPlataforma : dataComercio;
  const isLoading = verTodos ? loadingPlataforma : loadingComercio;
  const { data: cargos } = useCargos(user?.comercioId);
  const cargosDisponiveis = (cargos ?? []).filter((c) => c.ativo && (user?.admin || c.peso < (user?.cargoPeso ?? 0)));

  const alternarEscopo = (todos: boolean) => {
    setVerTodos(todos);
    setPagina(1);
  };
  const criar = useCriarUsuario();
  const vincular = useVincularUsuarioComercio();
  const atualizar = useAtualizarUsuario();
  const atualizarGlobal = useAtualizarUsuarioGlobal();
  const revogar = useRevogarAcesso();
  const resetarSenha = useResetarSenha();
  const desativarGlobal = useDesativarGlobal();

  const [modalAberto, setModalAberto] = useState(false);
  const [etapa, setEtapa] = useState<"email" | "vincular" | "criar" | "editar">("email");
  const [emailBusca, setEmailBusca] = useState("");
  const [encontrado, setEncontrado] = useState<UsuarioResponse | null>(null);
  const [editando, setEditando] = useState<UsuarioListaResponse | null>(null);
  const [buscando, setBuscando] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cargoID, setCargoID] = useState<string>("");
  const [erro, setErro] = useState<string | null>(null);
  const [revogando, setRevogando] = useState<UsuarioListaResponse | null>(null);
  const [desativando, setDesativando] = useState<UsuarioListaResponse | null>(null);
  const [resetandoSenha, setResetandoSenha] = useState<UsuarioListaResponse | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [erroSenha, setErroSenha] = useState<string | null>(null);

  const abrirNovo = () => {
    setEtapa("email");
    setEmailBusca("");
    setEncontrado(null);
    setNome("");
    setEmail("");
    setSenha("");
    setCargoID("");
    setErro(null);
    setModalAberto(true);
  };

  const abrirEdicao = (u: UsuarioListaResponse) => {
    setEditando(u);
    setNome(u.nome);
    setEmail(u.email);
    setCargoID(cargos?.find((c) => c.nome === u.cargoNome)?.cargoID.toString() ?? "");
    setErro(null);
    setEtapa("editar");
    setModalAberto(true);
  };

  const abrirResetSenha = (u: UsuarioListaResponse) => {
    setResetandoSenha(u);
    setNovaSenha("");
    setErroSenha(null);
  };

  const buscarPorEmail = async () => {
    setErro(null);
    setBuscando(true);
    try {
      const resultado = await buscarUsuarioPorEmail(emailBusca);
      if (resultado) {
        setEncontrado(resultado);
        setEtapa("vincular");
      } else {
        setEmail(emailBusca);
        setEtapa("criar");
      }
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro ao buscar usuário.");
    } finally {
      setBuscando(false);
    }
  };

  const salvar = async () => {
    setErro(null);
    if (etapa !== "editar" && (!user?.comercioId || !cargoID)) return;

    try {
      if (etapa === "vincular" && encontrado && user?.comercioId) {
        await vincular.mutateAsync({ usuarioID: encontrado.usuarioID, comercioID: user.comercioId, cargoID: Number(cargoID) });
        toast.success("Usuário vinculado ao comércio.");
      } else if (etapa === "criar" && user?.comercioId) {
        await criar.mutateAsync({ nome, email, senha, cargoID: Number(cargoID), comercioId: user.comercioId });
        toast.success("Usuário criado e vinculado.");
      } else if (etapa === "editar" && editando) {
        if (verTodos) {
          await atualizarGlobal.mutateAsync({ id: editando.usuarioID, body: { nome, email } });
        } else {
          await atualizar.mutateAsync({
            id: editando.usuarioID,
            body: { nome, email, cargoID: cargoID ? Number(cargoID) : undefined },
          });
        }
        toast.success("Usuário atualizado.");
      }
      setModalAberto(false);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro ao salvar usuário.");
    }
  };

  const confirmarRevogacao = async () => {
    if (!revogando) return;
    try {
      await revogar.mutateAsync(revogando.usuarioID);
      toast.success("Acesso revogado.");
      setRevogando(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao revogar acesso.");
    }
  };

  const confirmarDesativacaoGlobal = async () => {
    if (!desativando) return;
    try {
      await desativarGlobal.mutateAsync(desativando.usuarioID);
      toast.success("Usuário desativado.");
      setDesativando(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao desativar usuário.");
    }
  };

  const confirmarResetSenha = async () => {
    if (!resetandoSenha) return;
    setErroSenha(null);
    if (!novaSenha.trim()) {
      setErroSenha("Informe a nova senha.");
      return;
    }
    try {
      await resetarSenha.mutateAsync({ id: resetandoSenha.usuarioID, body: { novaSenha } });
      toast.success(`Senha de "${resetandoSenha.nome}" redefinida.`);
      setResetandoSenha(null);
    } catch (err) {
      setErroSenha(err instanceof ApiError ? err.message : "Erro ao redefinir senha.");
    }
  };

  const salvando = criar.isPending || vincular.isPending || atualizar.isPending || atualizarGlobal.isPending;

  return (
    <div className="flex h-full flex-col p-6">
      <Button variant="ghost" size="sm" className="mb-4 w-fit" onClick={() => navigate("/mainpage/gestao")}>
        <ArrowLeft /> Voltar
      </Button>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            {verTodos ? "Todos os usuários cadastrados na plataforma" : "Gerencie usuários, acessos e cargos da equipe"}
            {data && ` · ${data.totalRecords} ${verTodos ? "usuários" : "membros"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user?.admin && (
            <div className="flex rounded-lg border p-1">
              <button
                type="button"
                onClick={() => alternarEscopo(false)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  !verTodos ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Equipe deste comércio
              </button>
              <button
                type="button"
                onClick={() => alternarEscopo(true)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  verTodos ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos os usuários
              </button>
            </div>
          )}
          <Button onClick={abrirNovo} disabled={verTodos}>
            <Plus /> Adicionar Membro
          </Button>
        </div>
      </div>

      <Input
        placeholder="Buscar por nome ou e-mail..."
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
          <EmptyState
            icon={UserCog}
            title="Nenhum usuário encontrado"
            message={verTodos ? "Nenhum usuário cadastrado na plataforma ainda." : "Adicione o primeiro membro da equipe."}
          />
        ) : (
          <div className="scroll-styled flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  {verTodos && <TableHead>Comércio</TableHead>}
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((u) => (
                  <TableRow key={u.usuarioID}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {u.nome.charAt(0).toUpperCase()}
                        </span>
                        {u.nome}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    {verTodos && <TableCell className="text-muted-foreground">{u.comercioNome}</TableCell>}
                    <TableCell>{u.cargoNome}</TableCell>
                    <TableCell>
                      <StatusPill tone={u.ativo ? "ok" : "danger"} text={u.ativo ? "Ativo" : "Inativo"} />
                    </TableCell>
                    <TableCell className="text-right">
                      {verTodos ? (
                        <>
                          <Button variant="ghost" size="icon-sm" onClick={() => abrirEdicao(u)} title="Editar">
                            <Pencil />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => abrirResetSenha(u)} title="Resetar senha">
                            <Key />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setDesativando(u)} title="Desativar globalmente">
                            <Trash2 />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon-sm" onClick={() => abrirEdicao(u)} title="Editar">
                            <Pencil />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setRevogando(u)} title="Revogar acesso">
                            <UserX />
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

        {data && (
          <Pagination
            paginaAtual={pagina}
            totalPaginas={data.totalPages}
            totalItens={data.totalRecords}
            itemLabel="usuários"
            onPageChange={setPagina}
          />
        )}
      </div>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {etapa === "email" && "Adicionar Membro"}
              {etapa === "vincular" && "Vincular Usuário Existente"}
              {etapa === "criar" && "Criar Novo Usuário"}
              {etapa === "editar" && "Editar Usuário"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {etapa === "email" && (
              <div className="flex flex-col gap-1.5">
                <Label>E-mail</Label>
                <Input type="email" value={emailBusca} onChange={(e) => setEmailBusca(e.target.value)} />
              </div>
            )}

            {(etapa === "vincular" || etapa === "criar" || etapa === "editar") && (
              <>
                {etapa === "criar" && (
                  <div className="flex flex-col gap-1.5">
                    <Label>Nome</Label>
                    <Input value={nome} onChange={(e) => setNome(e.target.value)} />
                  </div>
                )}
                {etapa === "editar" && (
                  <div className="flex flex-col gap-1.5">
                    <Label>Nome</Label>
                    <Input value={nome} onChange={(e) => setNome(e.target.value)} />
                  </div>
                )}
                {etapa === "vincular" && encontrado && (
                  <p className="text-sm text-muted-foreground">
                    {encontrado.nome} — {encontrado.email}
                  </p>
                )}
                {etapa === "criar" && (
                  <div className="flex flex-col gap-1.5">
                    <Label>E-mail</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                )}
                {etapa === "editar" && (
                  <div className="flex flex-col gap-1.5">
                    <Label>E-mail</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                )}
                {etapa === "criar" && (
                  <div className="flex flex-col gap-1.5">
                    <Label>Senha</Label>
                    <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
                  </div>
                )}
                {!(etapa === "editar" && verTodos) && (
                  <div className="flex flex-col gap-1.5">
                    <Label>Cargo</Label>
                    <Select
                      items={cargosDisponiveis.map((c) => ({ value: c.cargoID.toString(), label: c.nome }))}
                      value={cargoID}
                      onValueChange={(v) => setCargoID(v ?? "")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        {cargosDisponiveis.map((c) => (
                          <SelectItem key={c.cargoID} value={c.cargoID.toString()}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {erro && <p className="text-sm text-destructive">{erro}</p>}
          </div>

          <DialogFooter>
            {etapa === "email" ? (
              <Button onClick={buscarPorEmail} disabled={buscando || !emailBusca.trim()}>
                {buscando ? "Buscando..." : "Buscar"}
              </Button>
            ) : (
              <Button onClick={salvar} disabled={salvando || (etapa !== "editar" && !cargoID)}>
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={revogando !== null}
        title="Revogar Acesso"
        description={`Tem certeza que deseja revogar o acesso de "${revogando?.nome}" a este comércio?`}
        isProcessing={revogar.isPending}
        onConfirm={confirmarRevogacao}
        onClose={() => setRevogando(null)}
      />

      <ConfirmDialog
        open={desativando !== null}
        title="Desativar Usuário"
        description={`Tem certeza que deseja desativar "${desativando?.nome}"? Desativa o usuário em toda a plataforma, independente dos comércios vinculados.`}
        isProcessing={desativarGlobal.isPending}
        onConfirm={confirmarDesativacaoGlobal}
        onClose={() => setDesativando(null)}
      />

      <Dialog open={resetandoSenha !== null} onOpenChange={(next) => !next && setResetandoSenha(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar Senha</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Nova senha para <strong>{resetandoSenha?.nome}</strong>.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label>Nova senha</Label>
              <Input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
            </div>
            {erroSenha && <p className="text-sm text-destructive">{erroSenha}</p>}
          </div>
          <DialogFooter>
            <Button onClick={confirmarResetSenha} disabled={resetarSenha.isPending}>
              {resetarSenha.isPending ? "Redefinindo..." : "Redefinir Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
