import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignaturePad, type SignaturePadHandle } from "@/components/shared/SignaturePad";
import { useAtualizarComercio, useComercio } from "@/services/comercio";
import { useAuth } from "@/context/AuthContext";
import { useCurrencyInput } from "@/hooks/useCurrencyInput";
import { validarCep, validarCnpj } from "@/lib/validators";
import { maskCep, maskCnpj, maskNumerico, UF_ITEMS } from "@/lib/masks";
import { ApiError } from "@/services/api/client";

export function ComercioGestao() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: comercio, isLoading } = useComercio(user?.comercioId);
  const atualizar = useAtualizarComercio();

  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [cep, setCep] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [erroCnpj, setErroCnpj] = useState<string | null>(null);
  const [erroCep, setErroCep] = useState<string | null>(null);
  const limiteCredito = useCurrencyInput(0);
  const assinaturaRef = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    if (!comercio) return;
    setNome(comercio.nomeComercio ?? "");
    setCnpj(maskCnpj(comercio.cnpj ?? ""));
    setLogradouro(comercio.enderecoLogradouro ?? "");
    setNumero(maskNumerico(comercio.enderecoNumero ?? ""));
    setComplemento(comercio.enderecoComplemento ?? "");
    setBairro(comercio.enderecoBairro ?? "");
    setCidade(comercio.enderecoCidade ?? "");
    setUf(comercio.enderecoUF ?? "");
    setCep(maskCep(comercio.enderecoCEP ?? ""));
    limiteCredito.reset(comercio.limiteCreditoPadrao ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comercio]);

  const salvar = async () => {
    setErro(null);
    setErroCnpj(null);
    setErroCep(null);

    let temErro = false;
    if (cnpj && !validarCnpj(cnpj)) {
      setErroCnpj("CNPJ inválido.");
      temErro = true;
    }
    if (cep && !validarCep(cep)) {
      setErroCep("CEP inválido.");
      temErro = true;
    }
    if (temErro || !user?.comercioId) return;

    const assinaturaDataUrl = assinaturaRef.current?.isEmpty() ? null : assinaturaRef.current?.toDataUrl();
    const assinaturaBase64 = assinaturaDataUrl?.split(",")[1];

    try {
      await atualizar.mutateAsync({
        id: user.comercioId,
        body: {
          nome,
          cnpj: cnpj || undefined,
          enderecoLogradouro: logradouro || undefined,
          enderecoNumero: numero || undefined,
          enderecoComplemento: complemento || undefined,
          enderecoBairro: bairro || undefined,
          enderecoCidade: cidade || undefined,
          enderecoUF: uf || undefined,
          enderecoCEP: cep || undefined,
          limiteCreditoPadrao: limiteCredito.value || undefined,
          assinaturaResponsavelBase64: assinaturaBase64 ?? comercio?.assinaturaResponsavelBase64,
        },
      });
      toast.success("Comércio atualizado.");
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro ao salvar comércio.");
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="flex h-full flex-col p-6">
      <Button variant="ghost" size="sm" className="mb-4 w-fit" onClick={() => navigate("/mainpage/gestao")}>
        <ArrowLeft /> Voltar
      </Button>
      <h1 className="mb-6 text-2xl font-semibold">Comércio</h1>

      <div className="scroll-styled mx-auto flex w-full min-h-0 flex-1 flex-col overflow-y-auto max-w-2xl">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>CNPJ</Label>
              <Input
                placeholder="00.000.000/0000-00"
                value={cnpj}
                aria-invalid={!!erroCnpj}
                onChange={(e) => setCnpj(maskCnpj(e.target.value))}
              />
              {erroCnpj && <span className="text-sm text-destructive">{erroCnpj}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Limite de Crédito Padrão</Label>
              <Input value={limiteCredito.formatted} onChange={(e) => limiteCredito.onInputChange(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>CEP</Label>
              <Input
                placeholder="00000-000"
                value={cep}
                aria-invalid={!!erroCep}
                onChange={(e) => setCep(maskCep(e.target.value))}
              />
              {erroCep && <span className="text-sm text-destructive">{erroCep}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>UF</Label>
              <Select items={UF_ITEMS} value={uf} onValueChange={(v) => setUf(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {UF_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Logradouro</Label>
              <Input placeholder="Ex: Rua das Flores" value={logradouro} onChange={(e) => setLogradouro(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Número</Label>
              <Input placeholder="Ex: 123" value={numero} onChange={(e) => setNumero(maskNumerico(e.target.value))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Complemento</Label>
              <Input placeholder="Ex: Sala 2" value={complemento} onChange={(e) => setComplemento(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Bairro</Label>
              <Input placeholder="Ex: Centro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Cidade</Label>
              <Input placeholder="Ex: São Paulo" value={cidade} onChange={(e) => setCidade(e.target.value)} />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Assinatura do Responsável</Label>
              <SignaturePad
                key={comercio?.comercioID}
                ref={assinaturaRef}
                initialDataUrl={
                  comercio?.assinaturaResponsavelBase64
                    ? `data:image/png;base64,${comercio.assinaturaResponsavelBase64}`
                    : undefined
                }
              />
            </div>
          </div>

          {erro && <p className="mt-3 text-sm text-destructive">{erro}</p>}

          <Button className="mt-4" onClick={salvar} disabled={atualizar.isPending || !nome.trim()}>
            {atualizar.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
