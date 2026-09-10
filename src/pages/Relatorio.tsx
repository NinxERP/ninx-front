import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { PeriodoSelector, ultimosDias } from "@/pages/relatorio/PeriodoSelector";
import { VisaoGeralTab } from "@/pages/relatorio/VisaoGeralTab";
import { VendasTab } from "@/pages/relatorio/VendasTab";
import { FinanceiroTab } from "@/pages/relatorio/FinanceiroTab";
import { EstoqueTab } from "@/pages/relatorio/EstoqueTab";
import { ClientesTab } from "@/pages/relatorio/ClientesTab";
import { ComparativoTab } from "@/pages/relatorio/ComparativoTab";
import type { Periodo } from "@/services/relatorio";

const ABAS_BASE = ["Visão Geral", "Vendas", "Financeiro", "Estoque", "Clientes"] as const;
type Aba = (typeof ABAS_BASE)[number] | "Comparativo";

export function Relatorio() {
  const navigate = useNavigate();
  const { availableComercios } = useAuth();
  const mostrarComparativo = availableComercios.length > 1;
  const abas: Aba[] = mostrarComparativo ? [...ABAS_BASE, "Comparativo"] : [...ABAS_BASE];

  const [aba, setAba] = useState<Aba>("Visão Geral");
  const [periodo, setPeriodo] = useState<Periodo>(ultimosDias(30));

  return (
    <div className="flex h-full flex-col p-6">
      <Button variant="ghost" size="sm" className="mb-4 w-fit" onClick={() => navigate("/mainpage")}>
        <ArrowLeft /> Voltar
      </Button>
      <h1 className="mb-4 text-2xl font-semibold">Relatórios</h1>

      <div className="mx-auto flex w-full min-h-0 flex-1 flex-col max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border p-1">
          {abas.map((item) => (
            <button
              key={item}
              onClick={() => setAba(item)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                aba === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
              )}
            >
              {item}
            </button>
          ))}
        </div>
        {aba !== "Clientes" && <PeriodoSelector periodo={periodo} onChange={setPeriodo} />}
      </div>

      <div className="scroll-styled min-h-0 flex-1 overflow-y-auto px-1">
        {aba === "Visão Geral" && <VisaoGeralTab periodo={periodo} />}
        {aba === "Vendas" && <VendasTab periodo={periodo} />}
        {aba === "Financeiro" && <FinanceiroTab periodo={periodo} />}
        {aba === "Estoque" && <EstoqueTab periodo={periodo} />}
        {aba === "Clientes" && <ClientesTab />}
        {aba === "Comparativo" && <ComparativoTab periodo={periodo} />}
      </div>
      </div>
    </div>
  );
}
