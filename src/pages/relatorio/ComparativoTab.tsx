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
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Comércio</TableHead>
              <TableHead className="w-[20%] text-right">Vendas</TableHead>
              <TableHead className="w-[20%] text-right">Faturamento</TableHead>
              <TableHead className="w-[20%] text-right">Ticket Médio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.comercios.map((c) => (
              <TableRow key={c.comercioID}>
                <TableCell className="truncate">{c.comercioNome}</TableCell>
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
