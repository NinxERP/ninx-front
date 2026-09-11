import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClientesInativos } from "@/services/relatorio";

export function ClientesTab() {
  const [diasSemComprar, setDiasSemComprar] = useState(30);
  const { data: inativos, isLoading } = useClientesInativos(diasSemComprar);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <Card>
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">Clientes Inativos</p>
          <Input
            type="number"
            className="w-24"
            value={diasSemComprar}
            onChange={(e) => setDiasSemComprar(Number(e.target.value) || 30)}
          />
        </div>
        <div className="max-h-96 overflow-y-auto">
          <Table className="table-fixed">
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead className="w-[40%]">Cliente</TableHead>
                <TableHead className="w-[30%]">Telefone</TableHead>
                <TableHead className="w-[30%] text-right">Última Compra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!inativos || inativos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">Sem dados no período.</TableCell>
                </TableRow>
              ) : (
                inativos.map((c) => (
                  <TableRow key={c.clienteID}>
                    <TableCell className="truncate">{c.clienteNome}</TableCell>
                    <TableCell className="truncate">{c.telefone || "—"}</TableCell>
                    <TableCell className="text-right">
                      {c.nuncaComprou ? "Nunca comprou" : c.ultimaCompra ? new Date(c.ultimaCompra).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
