import { useUpdater } from "@/context/UpdaterContext";
import { UpdateDialog } from "@/components/UpdateDialog";

export function AppUpdateGate() {
  const updater = useUpdater();
  return <UpdateDialog updater={updater} />;
}
