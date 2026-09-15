import { useAuth } from "@/context/AuthContext";

export function usePermissions() {
  const { user } = useAuth();
  const isOwner = Boolean(user?.admin || user?.cargoEhProprietario);

  const hasPermission = (chave: string) => Boolean(isOwner || user?.cargoPermissoes.includes(chave));
  const hasAnyPermission = (chaves: string[]) => Boolean(isOwner || chaves.some((c) => user?.cargoPermissoes.includes(c)));

  return {
    isPlatformAdmin: user?.admin ?? false,
    isOwner,
    hasPermission,
    hasAnyPermission,
  };
}
