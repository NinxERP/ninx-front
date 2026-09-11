import { useCallback, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "ready" | "error";

export function useAppUpdater() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [update, setUpdate] = useState<Update | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdate = useCallback(async () => {
    setStatus("checking");
    try {
      const result = await check();
      setStatus(result ? "available" : "idle");
      setUpdate(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao verificar atualizações.");
      setStatus("error");
    }
  }, []);

  const installUpdate = useCallback(async () => {
    if (!update) return;
    setStatus("downloading");

    let downloaded = 0;
    let total = 0;

    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          setProgress(total > 0 ? Math.round((downloaded / total) * 100) : 0);
        } else if (event.event === "Finished") {
          setStatus("ready");
        }
      });
      await relaunch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao instalar a atualização.");
      setStatus("error");
    }
  }, [update]);

  const dismiss = useCallback(() => {
    setStatus("idle");
    setUpdate(null);
    setProgress(0);
    setError(null);
  }, []);

  return { status, update, progress, error, checkForUpdate, installUpdate, dismiss };
}
