import { Navigate, Outlet } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";

export function RequireOwner() {
  const { isOwnerOrHigher } = usePermissions();

  if (!isOwnerOrHigher) {
    return <Navigate to="/mainpage" replace />;
  }

  return <Outlet />;
}
