import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppUpdater } from "@/hooks/useAppUpdater";
import { UpdateDialog } from "@/components/UpdateDialog";

export function AppUpdateGate() {
  const { isAuthenticated } = useAuth();
  const updater = useAppUpdater();
  const { checkForUpdate } = updater;
  const checkedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !checkedRef.current) {
      checkedRef.current = true;
      void checkForUpdate();
    }
    if (!isAuthenticated) {
      checkedRef.current = false;
    }
  }, [isAuthenticated, checkForUpdate]);

  return <UpdateDialog updater={updater} />;
}
