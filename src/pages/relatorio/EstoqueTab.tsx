import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/shared/StatusPill";
import { useGiroEstoque, useProdutosVencendo } from "@/services/relatorio";
import type { Periodo } from "@/services/relatorio";

export function EstoqueTab({ periodo }: { periodo: Periodo }) {
  const { data: giro, isLoading: isLoadingGiro } = useGiroEstoque(periodo);
  const [diasLimite, setDiasLimite] = useState(30);
  const { data: vencendo, isLoading: isLoadingVencendo } = useProdutosVencendo(diasLimite);

  if (isLoadingGiro || isLoadingVencendo) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-medium">Giro de Estoque</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Vendido</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
                <TableHead className="text-right">Giro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {giro?.produtos.map((p) => (
                <TableRow key={p.produtoID}>
                  <TableCell>{p.produtoNome}</TableCell>
                  <TableCell className="text-right">{p.quantidadeVendida}</TableCell>
                  <TableCell className="text-right">{p.estoqueAtual}</TableCell>
                  <TableCell className="text-right">{p.giro.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-medium">Produtos Parados</p>
          {giro?.produtosParados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum produto parado no período.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {giro?.produtosParados.map((p) => (
                <div key={p.produtoID} className="flex justify-between text-sm">
                  <span>{p.produtoNome}</span>
                  <span className="text-muted-foreground">{p.estoqueAtual} em estoque</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Produtos Vencendo</p>
            <Input type="number" className="w-24" value={diasLimite} onChange={(e) => setDiasLimite(Number(e.target.value) || 30)} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Em Estoque</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vencendo?.map((p) => (
                <TableRow key={p.produtoID}>
                  <TableCell>{p.produtoNome}</TableCell>
                  <TableCell>{new Date(p.validade).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right">{p.quantidadeEmEstoque}</TableCell>
                  <TableCell className="text-center">
                    {p.vencido ? <StatusPill tone="danger" text="Vencido" /> : <StatusPill tone="warning" text={`${p.diasParaVencer}d`} />}
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
