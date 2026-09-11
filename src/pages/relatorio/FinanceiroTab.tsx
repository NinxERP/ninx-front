import "@/lib/chartSetup";
import { Bar } from "react-chartjs-2";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/shared/StatusPill";
import { useAgingRecebiveis, useLimiteCredito, useMargem } from "@/services/relatorio";
import type { Periodo } from "@/services/relatorio";

export function FinanceiroTab({ periodo }: { periodo: Periodo }) {
  const { data: margem, isLoading: isLoadingMargem } = useMargem(periodo);
  const { data: aging, isLoading: isLoadingAging } = useAgingRecebiveis();
  const { data: limites, isLoading: isLoadingLimites } = useLimiteCredito();

  if (isLoadingMargem || isLoadingAging || isLoadingLimites) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-medium">Aging de Recebíveis</p>
          {!aging || (aging.ate30Dias.valor === 0 && aging.de31a60Dias.valor === 0 && aging.acima60Dias.valor === 0) ? (
            <p className="text-sm text-muted-foreground">Sem dados no período.</p>
          ) : (
            <Bar
              data={{
                labels: ["0-30 dias", "31-60 dias", "60+ dias"],
                datasets: [
                  {
                    label: "Saldo devedor",
                    data: [aging.ate30Dias.valor, aging.de31a60Dias.valor, aging.acima60Dias.valor],
                    backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
                  },
                ],
              }}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-medium">Margem por Produto</p>
          <div className="max-h-96 overflow-y-auto">
            <Table className="table-fixed">
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-[40%]">Produto</TableHead>
                  <TableHead className="w-[20%] text-right">Receita</TableHead>
                  <TableHead className="w-[20%] text-right">Lucro</TableHead>
                  <TableHead className="w-[20%] text-right">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!margem || margem.produtos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">Sem dados no período.</TableCell>
                  </TableRow>
                ) : (
                  margem.produtos.map((p) => (
                    <TableRow key={p.produtoID}>
                      <TableCell className="truncate">{p.produtoNome}</TableCell>
                      <TableCell className="text-right">R$ {p.receitaTotal.toFixed(2)}</TableCell>
                      <TableCell className="text-right">R$ {p.lucroTotal.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{p.margemPercentual.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-medium">Limite de Crédito por Cliente</p>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Cliente</TableHead>
                <TableHead className="w-[20%] text-right">Limite</TableHead>
                <TableHead className="w-[20%] text-right">Devedor</TableHead>
                <TableHead className="w-[20%] text-center">Uso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!limites || limites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">Sem dados no período.</TableCell>
                </TableRow>
              ) : (
                limites.map((c) => (
                  <TableRow key={c.clienteID}>
                    <TableCell className="truncate">{c.clienteNome}</TableCell>
                    <TableCell className="text-right">R$ {c.limiteCredito.toFixed(2)}</TableCell>
                    <TableCell className="text-right">R$ {c.saldoDevedor.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <StatusPill
                        tone={c.percentualUtilizado >= 90 ? "danger" : c.percentualUtilizado >= 60 ? "warning" : "ok"}
                        text={`${c.percentualUtilizado.toFixed(0)}%`}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
