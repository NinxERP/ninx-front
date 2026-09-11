import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Store } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUpdater } from "@/context/UpdaterContext";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
import type { ComercioSimplificado } from "@/types";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const { login, isAuthenticated } = useAuth();
  const { checkForUpdate } = useUpdater();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [comercios, setComercios] = useState<ComercioSimplificado[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (isAuthenticated) navigate("/mainpage", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      toast.success("Senha redefinida com sucesso. Faça login com sua nova senha.");
    }
  }, [searchParams]);

  const autenticar = async (email: string, senha: string, comercioID?: number) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await checkForUpdate();
      const resultado = await login(email, senha, comercioID);
      if (resultado) {
        setComercios(resultado);
      } else {
        navigate("/mainpage", { replace: true });
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Falha ao autenticar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: LoginForm) => autenticar(data.email, data.senha);

  return (
    <div className="flex h-full items-center justify-center bg-muted">
      {isSubmitting && <LoadingOverlay message="Entrando..." className="fixed inset-0" />}
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <img src="/images/nina_logo_clean.png" alt="Ninx" className="size-16 rounded-full bg-white p-0.5 object-contain" />
          <h1 className="text-2xl font-semibold text-card-foreground">Ninx</h1>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {comercios ? (
          <div className="flex flex-col gap-2">
            <p className="mb-2 text-sm text-muted-foreground">Selecione o comércio:</p>
            {comercios.map((comercio) => (
              <button
                key={comercio.comercioID}
                type="button"
                className="flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-base font-medium hover:bg-accent"
                onClick={() => autenticar(getValues("email"), getValues("senha"), comercio.comercioID)}
              >
                <Store className="size-5 shrink-0 text-muted-foreground" />
                {comercio.nome}
              </button>
            ))}
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                className="rounded-md border bg-background px-3 py-2 text-sm"
                {...register("email")}
              />
              {errors.email && <span className="text-sm text-destructive">{errors.email.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="senha" className="text-sm font-medium">
                Senha
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  className="w-full rounded-md border bg-background px-3 py-2 pr-9 text-sm"
                  {...register("senha")}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setMostrarSenha((v) => !v)}
                >
                  {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.senha && <span className="text-sm text-destructive">{errors.senha.message}</span>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>

            <button
              type="button"
              className="text-center text-sm text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/forgot-password")}
            >
              Esqueci minha senha
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
