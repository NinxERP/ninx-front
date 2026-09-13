import { Navigate, Outlet } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSOES_GESTAO } from "@/lib/permissoes";

export function RequireOwner() {
  const { hasAnyPermission } = usePermissions();

  if (!hasAnyPermission(PERMISSOES_GESTAO)) {
    return <Navigate to="/mainpage" replace />;
  }

  return <Outlet />;
}
