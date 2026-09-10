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
          {aging && (
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right">Margem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {margem?.produtos.map((p) => (
                <TableRow key={p.produtoID}>
                  <TableCell>{p.produtoNome}</TableCell>
                  <TableCell className="text-right">R$ {p.receitaTotal.toFixed(2)}</TableCell>
                  <TableCell className="text-right">R$ {p.lucroTotal.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{p.margemPercentual.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-medium">Limite de Crédito por Cliente</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Limite</TableHead>
                <TableHead className="text-right">Devedor</TableHead>
                <TableHead className="text-center">Uso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {limites?.map((c) => (
                <TableRow key={c.clienteID}>
                  <TableCell>{c.clienteNome}</TableCell>
                  <TableCell className="text-right">R$ {c.limiteCredito.toFixed(2)}</TableCell>
                  <TableCell className="text-right">R$ {c.saldoDevedor.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <StatusPill
                      tone={c.percentualUtilizado >= 90 ? "danger" : c.percentualUtilizado >= 60 ? "warning" : "ok"}
                      text={`${c.percentualUtilizado.toFixed(0)}%`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
