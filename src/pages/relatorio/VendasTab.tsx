import "@/lib/chartSetup";
import { Bar } from "react-chartjs-2";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurvaAbc, useDesempenhoVendedores, usePicoVendas } from "@/services/relatorio";
import type { Periodo } from "@/services/relatorio";

export function VendasTab({ periodo }: { periodo: Periodo }) {
  const { data: curvaAbc, isLoading: isLoadingCurvaAbc } = useCurvaAbc(periodo);
  const { data: pico, isLoading: isLoadingPico } = usePicoVendas(periodo);
  const { data: vendedores, isLoading: isLoadingVendedores } = useDesempenhoVendedores(periodo);

  if (isLoadingCurvaAbc || isLoadingPico || isLoadingVendedores) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-medium">Pico de Vendas por Hora</p>
          {!pico || pico.porHora.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados no período.</p>
          ) : (
            <Bar
              data={{
                labels: pico.porHora.map((h) => `${h.hora}h`),
                datasets: [{ label: "Vendas", data: pico.porHora.map((h) => h.quantidadeVendas), backgroundColor: "#6366f1" }],
              }}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-medium">Curva ABC de Produtos</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd Vendida</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-center">Classe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {curvaAbc?.map((p) => (
                <TableRow key={p.produtoID}>
                  <TableCell>{p.produtoNome}</TableCell>
                  <TableCell className="text-right">{p.quantidadeVendida}</TableCell>
                  <TableCell className="text-right">R$ {p.valorTotal.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{p.classificacao}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-medium">Desempenho por Vendedor</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendedores?.map((v) => (
                <TableRow key={v.usuarioID}>
                  <TableCell>{v.usuarioNome}</TableCell>
                  <TableCell className="text-right">{v.quantidadeVendas}</TableCell>
                  <TableCell className="text-right">R$ {v.valorTotal.toFixed(2)}</TableCell>
                  <TableCell className="text-right">R$ {v.ticketMedio.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
