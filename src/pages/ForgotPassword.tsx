import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirmarRedefinicao, useSolicitarRedefinicao } from "@/services/redefinicaoSenha";
import { ApiError } from "@/services/api/client";

const COOLDOWN_SECONDS = 60;

export function ForgotPassword() {
  const navigate = useNavigate();
  const solicitar = useSolicitarRedefinicao();
  const confirmar = useConfirmarRedefinicao();

  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [etapa, setEtapa] = useState<"email" | "codigo">("email");
  const [cooldown, setCooldown] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const solicitarCodigo = async () => {
    setErro(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErro("E-mail inválido.");
      return;
    }
    try {
      await solicitar.mutateAsync({ email });
      setEtapa("codigo");
      setCooldown(COOLDOWN_SECONDS);
      toast.success("Se o e-mail existir, um código foi enviado.");
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Falha ao solicitar redefinição.");
    }
  };

  const confirmarRedefinicao = async () => {
    setErro(null);
    if (!/^\d{6}$/.test(codigo)) {
      setErro("Código deve ter 6 dígitos.");
      return;
    }
    if (novaSenha.length < 6) {
      setErro("Senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmaSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    try {
      await confirmar.mutateAsync({ email, codigo, novaSenha });
      navigate("/login?reset=success");
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Falha ao redefinir senha.");
    }
  };

  return (
    <div className="flex h-full items-center justify-center bg-muted">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <img src="/images/nina_logo_clean.png" alt="Ninx" className="size-16 rounded-full bg-white p-0.5 object-contain" />
          <h1 className="text-2xl font-semibold text-card-foreground">Esqueci minha senha</h1>
        </div>

        {erro && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {erro}
          </div>
        )}

        {etapa === "email" ? (
          <div className="flex flex-col gap-4">
            <Input placeholder="seu@email.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button onClick={solicitarCodigo} disabled={solicitar.isPending}>
              {solicitar.isPending ? "Enviando..." : "Enviar código"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Input placeholder="Código de 6 dígitos" value={codigo} onChange={(e) => setCodigo(e.target.value)} maxLength={6} />
            <Input placeholder="Nova senha" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
            <Input
              placeholder="Confirmar nova senha"
              type="password"
              value={confirmaSenha}
              onChange={(e) => setConfirmaSenha(e.target.value)}
            />
            <Button onClick={confirmarRedefinicao} disabled={confirmar.isPending}>
              {confirmar.isPending ? "Confirmando..." : "Redefinir senha"}
            </Button>
            <Button variant="ghost" size="sm" disabled={cooldown > 0} onClick={solicitarCodigo}>
              {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar código"}
            </Button>
          </div>
        )}

        <Button variant="link" className="mt-4 w-full" onClick={() => navigate("/login")}>
          Voltar para o login
        </Button>
      </div>
    </div>
  );
}
