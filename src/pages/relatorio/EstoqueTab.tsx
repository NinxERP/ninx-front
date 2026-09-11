import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/shared/StatusPill";
import { Pagination } from "@/components/shared/Pagination";
import { ExportButton } from "@/components/shared/ExportButton";
import { usePagedList } from "@/hooks/usePagedList";
import { useGiroEstoque, useProdutosVencendo } from "@/services/relatorio";
import type { Periodo } from "@/services/relatorio";
import { ordenarProdutosParados } from "@/types/relatorio";

export function EstoqueTab({ periodo }: { periodo: Periodo }) {
  const { data: giro, isLoading: isLoadingGiro } = useGiroEstoque(periodo);
  const [diasLimite, setDiasLimite] = useState(30);
  const { data: vencendo, isLoading: isLoadingVencendo } = useProdutosVencendo(diasLimite);

  const giroPag = usePagedList(giro?.produtos);
  const produtosParados = useMemo(
    () => ordenarProdutosParados(giro?.produtosParados ?? []),
    [giro?.produtosParados],
  );
  const paradosPag = usePagedList(produtosParados);

  if (isLoadingGiro || isLoadingVencendo) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Giro de Estoque</p>
            <ExportButton filename="giro-estoque" sheets={[{ name: "Giro", rows: giro?.produtos ?? [] }]} />
          </div>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Produto</TableHead>
                <TableHead className="w-[20%] text-right">Vendido</TableHead>
                <TableHead className="w-[20%] text-right">Estoque Atual</TableHead>
                <TableHead className="w-[20%] text-right">Giro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {giroPag.paginados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">Sem dados no período.</TableCell>
                </TableRow>
              ) : (
                giroPag.paginados.map((p) => (
                  <TableRow key={p.produtoID}>
                    <TableCell className="truncate">{p.produtoNome}</TableCell>
                    <TableCell className="text-right">{p.quantidadeVendida}</TableCell>
                    <TableCell className="text-right">{p.estoqueAtual}</TableCell>
                    <TableCell className="text-right">{p.giro.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            paginaAtual={giroPag.pagina}
            totalPaginas={giroPag.totalPaginas}
            totalItens={giroPag.totalItens}
            itemLabel="produtos"
            onPageChange={giroPag.setPagina}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Produtos Parados</p>
            <ExportButton filename="produtos-parados" sheets={[{ name: "Parados", rows: produtosParados }]} />
          </div>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Produto</TableHead>
                <TableHead className="w-[20%] text-right">Em Estoque</TableHead>
                <TableHead className="w-[20%] text-right">Última Venda</TableHead>
                <TableHead className="w-[20%] text-center">Parado há</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paradosPag.paginados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum produto parado no período.</TableCell>
                </TableRow>
              ) : (
                paradosPag.paginados.map((p) => (
                  <TableRow key={p.produtoID}>
                    <TableCell className="truncate">{p.produtoNome}</TableCell>
                    <TableCell className="text-right">{p.estoqueAtual}</TableCell>
                    <TableCell className="text-right">
                      {p.ultimaVenda ? new Date(p.ultimaVenda).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {p.diasSemVender == null ? (
                        <StatusPill tone="danger" text="Nunca vendido" />
                      ) : (
                        <StatusPill
                          tone={p.diasSemVender >= 90 ? "danger" : p.diasSemVender >= 60 ? "warning" : "ok"}
                          text={`${p.diasSemVender}d`}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            paginaAtual={paradosPag.pagina}
            totalPaginas={paradosPag.totalPaginas}
            totalItens={paradosPag.totalItens}
            itemLabel="produtos"
            onPageChange={paradosPag.setPagina}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Produtos Vencendo</p>
            <div className="flex items-center gap-2">
              <label htmlFor="dias-limite-vencimento" className="text-sm text-muted-foreground">
                Vence em até (dias):
              </label>
              <Input
                id="dias-limite-vencimento"
                type="number"
                className="w-24"
                value={diasLimite}
                onChange={(e) => setDiasLimite(Number(e.target.value) || 30)}
              />
            </div>
          </div>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%]">Produto</TableHead>
                <TableHead className="w-[25%]">Validade</TableHead>
                <TableHead className="w-[20%] text-right">Em Estoque</TableHead>
                <TableHead className="w-[20%] text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!vencendo || vencendo.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">Sem dados no período.</TableCell>
                </TableRow>
              ) : (
                vencendo.map((p) => (
                  <TableRow key={p.produtoID}>
                    <TableCell className="truncate">{p.produtoNome}</TableCell>
                    <TableCell className="truncate">{new Date(p.validade).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{p.quantidadeEmEstoque}</TableCell>
                    <TableCell className="text-center">
                      {p.vencido ? <StatusPill tone="danger" text="Vencido" /> : <StatusPill tone="warning" text={`${p.diasParaVencer}d`} />}
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
