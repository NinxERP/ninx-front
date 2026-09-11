import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ExportButton } from "@/components/shared/ExportButton";
import { PeriodoSelector, ultimosDias } from "@/pages/relatorio/PeriodoSelector";
import { VisaoGeralTab } from "@/pages/relatorio/VisaoGeralTab";
import { VendasTab } from "@/pages/relatorio/VendasTab";
import { FinanceiroTab } from "@/pages/relatorio/FinanceiroTab";
import { EstoqueTab } from "@/pages/relatorio/EstoqueTab";
import { ClientesTab } from "@/pages/relatorio/ClientesTab";
import { ComparativoTab } from "@/pages/relatorio/ComparativoTab";
import {
  useAgingRecebiveis,
  useClientesInativos,
  useComparativoComercios,
  useCurvaAbc,
  useDesempenhoVendedores,
  useGiroEstoque,
  useLimiteCredito,
  useMargem,
  useProdutosVencendo,
} from "@/services/relatorio";
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

  const { data: curvaAbc } = useCurvaAbc(periodo);
  const { data: vendedores } = useDesempenhoVendedores(periodo);
  const { data: margem } = useMargem(periodo);
  const { data: aging } = useAgingRecebiveis();
  const { data: limites } = useLimiteCredito();
  const { data: giro } = useGiroEstoque(periodo);
  const { data: vencendo } = useProdutosVencendo(30);
  const { data: inativos } = useClientesInativos(30);
  const { data: comparativo } = useComparativoComercios(periodo, mostrarComparativo);

  const todosOsRelatorios = [
    { name: "Curva ABC", rows: curvaAbc ?? [] },
    { name: "Desempenho Vendedores", rows: vendedores ?? [] },
    { name: "Margem por Produto", rows: margem?.produtos ?? [] },
    { name: "Aging Recebiveis", rows: aging?.vendas ?? [] },
    { name: "Limite de Credito", rows: limites ?? [] },
    { name: "Giro de Estoque", rows: giro?.produtos ?? [] },
    { name: "Produtos Parados", rows: giro?.produtosParados ?? [] },
    { name: "Produtos Vencendo", rows: vencendo ?? [] },
    { name: "Clientes Inativos", rows: inativos ?? [] },
    { name: "Comparativo Comercios", rows: comparativo?.comercios ?? [] },
  ];

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
        <div className="flex items-center gap-3">
          {aba !== "Clientes" && <PeriodoSelector periodo={periodo} onChange={setPeriodo} />}
          <ExportButton filename="relatorios.xlsx" sheets={todosOsRelatorios} label="Exportar tudo" />
        </div>
      </div>

      <div className="scroll-styled min-h-0 flex-1 overflow-y-auto p-1 pb-4">
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
