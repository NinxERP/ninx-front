import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Users, Search, Wallet, Filter, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useCurrencyInput } from "@/hooks/useCurrencyInput";
import { useAtualizarCliente, useClientes, useCriarCliente, useDesativarCliente } from "@/services/cliente";
import { useComercio } from "@/services/comercio";
import { useAuth } from "@/context/AuthContext";
import { validarCep, validarCpf } from "@/lib/validators";
import { maskCep, maskCpf, maskNumerico, maskTelefone, UF_ITEMS } from "@/lib/masks";
import { ApiError } from "@/services/api/client";
import { ClienteFiadoModal } from "@/pages/cliente/ClienteFiadoModal";
import type { ClienteResponse } from "@/types";

const PAGE_SIZE = 10;
const FILTROS = [
  { valor: "ativos", label: "Ativo" },
  { valor: "inativos", label: "Inativo" },
];

interface FormState {
  nome: string;
  telefone: string;
  cpf: string;
  email: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

const FORM_VAZIO: FormState = {
  nome: "",
  telefone: "",
  cpf: "",
  email: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  cep: "",
};

export function Cliente() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: comercio } = useComercio(user?.comercioId);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState<string[]>([]);
  const buscaDebounced = useDebouncedValue(busca);

  const { data, isLoading, isFetching } = useClientes(pagina, PAGE_SIZE, filtros, buscaDebounced);

  const toggleFiltro = (valor: string) => {
    setFiltros((f) => (f.includes(valor) ? f.filter((v) => v !== valor) : [...f, valor]));
    setPagina(1);
  };
  const criar = useCriarCliente();
  const atualizar = useAtualizarCliente();
  const desativar = useDesativarCliente();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<ClienteResponse | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [erros, setErros] = useState<Partial<Record<keyof FormState, string>>>({});
  const [exclusao, setExclusao] = useState<ClienteResponse | null>(null);
  const [fiadoAberto, setFiadoAberto] = useState<ClienteResponse | null>(null);
  const limiteCredito = useCurrencyInput(0);

  const abrirNovo = () => {
    setEditando(null);
    setForm(FORM_VAZIO);
    limiteCredito.reset(comercio?.limiteCreditoPadrao ?? 0);
    setErro(null);
    setErros({});
    setModalAberto(true);
  };

  const abrirEdicao = (cliente: ClienteResponse) => {
    setEditando(cliente);
    setForm({
      nome: cliente.nome,
      telefone: cliente.telefone ?? "",
      cpf: cliente.cpf,
      email: cliente.email ?? "",
      logradouro: cliente.enderecoLogradouro,
      numero: cliente.enderecoNumero,
      complemento: cliente.enderecoComplemento ?? "",
      bairro: cliente.enderecoBairro,
      cidade: cliente.enderecoCidade,
      uf: cliente.enderecoUF,
      cep: cliente.enderecoCEP,
    });
    limiteCredito.reset(cliente.limiteCredito ?? 0);
    setErro(null);
    setErros({});
    setModalAberto(true);
  };

  const REQUIRED_FIELDS: { campo: keyof FormState; label: string }[] = [
    { campo: "logradouro", label: "Logradouro é obrigatório." },
    { campo: "numero", label: "Número é obrigatório." },
    { campo: "bairro", label: "Bairro é obrigatório." },
    { campo: "cidade", label: "Cidade é obrigatória." },
    { campo: "uf", label: "UF é obrigatória." },
  ];

  const salvar = async () => {
    setErro(null);
    const novosErros: Partial<Record<keyof FormState, string>> = {};

    if (form.nome.trim().length < 3) novosErros.nome = "Nome deve ter no mínimo 3 caracteres.";
    if (!validarCpf(form.cpf)) novosErros.cpf = "CPF inválido.";
    if (!validarCep(form.cep)) novosErros.cep = "CEP inválido.";
    for (const { campo, label } of REQUIRED_FIELDS) {
      if (!form[campo].trim()) novosErros[campo] = label;
    }

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    const body = {
      nome: form.nome.trim(),
      telefone: form.telefone || undefined,
      cpf: form.cpf,
      email: form.email || undefined,
      enderecoLogradouro: form.logradouro,
      enderecoNumero: form.numero,
      enderecoComplemento: form.complemento || undefined,
      enderecoBairro: form.bairro,
      enderecoCidade: form.cidade,
      enderecoUF: form.uf.toUpperCase(),
      enderecoCEP: form.cep,
      limiteCredito: limiteCredito.value || undefined,
    };

    try {
      if (editando) {
        await atualizar.mutateAsync({ id: editando.clienteID, body });
        toast.success("Cliente atualizado.");
      } else {
        await criar.mutateAsync(body);
        toast.success("Cliente criado.");
      }
      setModalAberto(false);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro ao salvar cliente.");
    }
  };

  const confirmarExclusao = async () => {
    if (!exclusao) return;
    try {
      await desativar.mutateAsync(exclusao.clienteID);
      toast.success("Cliente desativado.");
      setExclusao(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao desativar cliente.");
    }
  };

  const salvando = criar.isPending || atualizar.isPending;

  return (
    <div className="flex h-full flex-col p-6">
      <Button variant="ghost" size="sm" className="mb-4 w-fit" onClick={() => navigate("/mainpage")}>
        <ArrowLeft /> Voltar
      </Button>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meus Clientes</h1>
        <Button onClick={abrirNovo}>
          <Plus /> Novo Cliente
        </Button>
      </div>

      {data?.summary && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Card className="bg-emerald-500/10 ring-emerald-500/20">
            <CardContent className="flex h-full flex-col items-center justify-center gap-1 py-8">
              <p className="text-4xl font-semibold text-emerald-600 dark:text-emerald-400">{data.summary.totalAtivos}</p>
              <p className="text-sm text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>
          <Card className="bg-red-500/10 ring-red-500/20">
            <CardContent className="flex h-full flex-col items-center justify-center gap-1 py-8">
              <p className="text-4xl font-semibold text-red-600 dark:text-red-400">{data.summary.totalInativos}</p>
              <p className="text-sm text-muted-foreground">Inativos</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
          />
        </div>
        <Popover>
          <PopoverTrigger render={<Button type="button" size="icon" variant={filtros.length > 0 ? "default" : "outline"} />}>
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
          <EmptyState icon={Users} title="Nenhum cliente encontrado" message="Cadastre o primeiro cliente." />
        ) : (
          <div className="scroll-styled flex-1 overflow-y-auto">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Nome</TableHead>
                  <TableHead className="w-40">CPF</TableHead>
                  <TableHead className="w-40 text-right">Saldo Devedor</TableHead>
                  <TableHead className="w-40 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody keepLastBorder={pagina < (data.totalPages ?? 1)}>
                {data.data.map((cliente) => (
                  <TableRow key={cliente.clienteID}>
                    <TableCell className="truncate text-left">{cliente.nome}</TableCell>
                    <TableCell>{cliente.cpf}</TableCell>
                    <TableCell className="text-right">
                      <span className={cliente.saldoDevedor > 0 ? "font-medium text-destructive" : ""}>
                        R$ {cliente.saldoDevedor.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" onClick={() => setFiadoAberto(cliente)} title="Fiado">
                        <Wallet />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="hover:bg-primary/10 hover:text-primary"
                        onClick={() => abrirEdicao(cliente)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setExclusao(cliente)}
                      >
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
          <Pagination paginaAtual={pagina} totalPaginas={data.totalPages} totalItens={data.totalRecords} itemLabel="clientes" onPageChange={setPagina} />
        )}
      </div>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>

          <div className="scroll-styled grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto pr-1">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: João da Silva"
                value={form.nome}
                aria-invalid={!!erros.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
              {erros.nome && <span className="text-sm text-destructive">{erros.nome}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>CPF</Label>
              <Input
                placeholder="000.000.000-00"
                value={form.cpf}
                disabled={!!editando}
                aria-invalid={!!erros.cpf}
                onChange={(e) => setForm({ ...form, cpf: maskCpf(e.target.value) })}
              />
              {erros.cpf && <span className="text-sm text-destructive">{erros.cpf}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Telefone</Label>
              <Input
                placeholder="(11) 91234-5678"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: maskTelefone(e.target.value) })}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>E-mail</Label>
              <Input
                type="email"
                placeholder="nome@exemplo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>CEP</Label>
              <Input
                placeholder="00000-000"
                value={form.cep}
                aria-invalid={!!erros.cep}
                onChange={(e) => setForm({ ...form, cep: maskCep(e.target.value) })}
              />
              {erros.cep && <span className="text-sm text-destructive">{erros.cep}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>UF</Label>
              <Select items={UF_ITEMS} value={form.uf} onValueChange={(v) => setForm({ ...form, uf: v ?? "" })}>
                <SelectTrigger className="w-full" aria-invalid={!!erros.uf}><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {UF_ITEMS.map((uf) => (
                    <SelectItem key={uf.value} value={uf.value}>{uf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {erros.uf && <span className="text-sm text-destructive">{erros.uf}</span>}
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Logradouro</Label>
              <Input
                placeholder="Ex: Rua das Flores"
                value={form.logradouro}
                aria-invalid={!!erros.logradouro}
                onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
              />
              {erros.logradouro && <span className="text-sm text-destructive">{erros.logradouro}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Número</Label>
              <Input
                placeholder="Ex: 123"
                value={form.numero}
                aria-invalid={!!erros.numero}
                onChange={(e) => setForm({ ...form, numero: maskNumerico(e.target.value) })}
              />
              {erros.numero && <span className="text-sm text-destructive">{erros.numero}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Complemento</Label>
              <Input placeholder="Ex: Apto 45" value={form.complemento} onChange={(e) => setForm({ ...form, complemento: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Bairro</Label>
              <Input
                placeholder="Ex: Centro"
                value={form.bairro}
                aria-invalid={!!erros.bairro}
                onChange={(e) => setForm({ ...form, bairro: e.target.value })}
              />
              {erros.bairro && <span className="text-sm text-destructive">{erros.bairro}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Cidade</Label>
              <Input
                placeholder="Ex: São Paulo"
                value={form.cidade}
                aria-invalid={!!erros.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
              />
              {erros.cidade && <span className="text-sm text-destructive">{erros.cidade}</span>}
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Limite de Crédito</Label>
              <Input value={limiteCredito.formatted} onChange={(e) => limiteCredito.onInputChange(e.target.value)} />
            </div>
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}

          <DialogFooter>
            <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {fiadoAberto && <ClienteFiadoModal cliente={fiadoAberto} onClose={() => setFiadoAberto(null)} />}

      <ConfirmDialog
        open={exclusao !== null}
        title="Desativar Cliente"
        description={`Tem certeza que deseja desativar "${exclusao?.nome}"?`}
        isProcessing={desativar.isPending}
        onConfirm={confirmarExclusao}
        onClose={() => setExclusao(null)}
      />
    </div>
  );
}
