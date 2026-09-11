import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportWorkbook, type ExportSheet } from "@/lib/exportXlsx";

interface ExportButtonProps {
  filename: string;
  sheets: ExportSheet[];
  label?: string;
}

export function ExportButton({ filename, sheets, label = "Exportar" }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const exported = await exportWorkbook(filename, sheets);
      if (exported) toast.success("Relatório exportado com sucesso.");
      else toast.info("Nenhum dado para exportar.");
    } catch {
      toast.error("Não foi possível exportar o relatório.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" loading={loading} onClick={handleExport}>
      <Download /> {label}
    </Button>
  );
}
