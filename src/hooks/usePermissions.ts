import { useAuth } from "@/context/AuthContext";

const PESO_DONO = 20;
const PESO_FUNCIONARIO = 10;

export function usePermissions() {
  const { user } = useAuth();

  const hasMinPeso = (peso: number) => Boolean(user?.admin || (user?.cargoPeso ?? 0) >= peso);

  return {
    isPlatformAdmin: user?.admin ?? false,
    hasMinPeso,
    isOwnerOrHigher: hasMinPeso(PESO_DONO),
    isFuncionarioOrHigher: hasMinPeso(PESO_FUNCIONARIO),
  };
}
