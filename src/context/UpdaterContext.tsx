import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useAppUpdater } from "@/hooks/useAppUpdater";

type Updater = ReturnType<typeof useAppUpdater>;

const UpdaterContext = createContext<Updater | null>(null);

export function UpdaterProvider({ children }: { children: ReactNode }) {
  const updater = useAppUpdater();
  const { checkForUpdate } = updater;

  useEffect(() => {
    void checkForUpdate();
  }, [checkForUpdate]);

  return <UpdaterContext.Provider value={updater}>{children}</UpdaterContext.Provider>;
}

export function useUpdater() {
  const ctx = useContext(UpdaterContext);
  if (!ctx) throw new Error("useUpdater deve ser usado dentro de UpdaterProvider.");
  return ctx;
}
