import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useComparativoComercios } from "@/services/relatorio";
import type { Periodo } from "@/services/relatorio";

export function ComparativoTab({ periodo }: { periodo: Periodo }) {
  const { data, isLoading } = useComparativoComercios(periodo, true);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <Card>
      <CardContent>
        <p className="mb-3 text-sm font-medium">Comparativo entre Comércios</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Comércio</TableHead>
              <TableHead className="text-right">Vendas</TableHead>
              <TableHead className="text-right">Faturamento</TableHead>
              <TableHead className="text-right">Ticket Médio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.comercios.map((c) => (
              <TableRow key={c.comercioID}>
                <TableCell>{c.comercioNome}</TableCell>
                <TableCell className="text-right">{c.quantidadeVendas}</TableCell>
                <TableCell className="text-right">R$ {c.faturamentoTotal.toFixed(2)}</TableCell>
                <TableCell className="text-right">R$ {c.ticketMedio.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
