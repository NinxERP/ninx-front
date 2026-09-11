import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/shared/Pagination";
import { ExportButton } from "@/components/shared/ExportButton";
import { usePagedList } from "@/hooks/usePagedList";
import { useClientesInativos } from "@/services/relatorio";

export function ClientesTab() {
  const [diasSemComprar, setDiasSemComprar] = useState(30);
  const { data: inativos, isLoading } = useClientesInativos(diasSemComprar);
  const inativosPag = usePagedList(inativos);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <Card>
      <CardContent>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Clientes Inativos</p>
          <div className="flex items-center gap-2">
            <label htmlFor="dias-sem-comprar" className="text-sm text-muted-foreground">
              Dias sem comprar:
            </label>
            <Input
              id="dias-sem-comprar"
              type="number"
              className="w-24"
              value={diasSemComprar}
              onChange={(e) => setDiasSemComprar(Number(e.target.value) || 30)}
            />
            <ExportButton filename="clientes-inativos" sheets={[{ name: "Inativos", rows: inativos ?? [] }]} />
          </div>
        </div>
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Cliente</TableHead>
              <TableHead className="w-[30%]">Telefone</TableHead>
              <TableHead className="w-[30%] text-right">Última Compra</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inativosPag.paginados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">Sem dados no período.</TableCell>
              </TableRow>
            ) : (
              inativosPag.paginados.map((c) => (
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
        <Pagination
          paginaAtual={inativosPag.pagina}
          totalPaginas={inativosPag.totalPaginas}
          totalItens={inativosPag.totalItens}
          itemLabel="clientes"
          onPageChange={inativosPag.setPagina}
        />
      </CardContent>
    </Card>
  );
}
