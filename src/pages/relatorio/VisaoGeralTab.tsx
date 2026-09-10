import "@/lib/chartSetup";
import { Bar, Pie } from "react-chartjs-2";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboard } from "@/services/relatorio";
import type { Periodo } from "@/services/relatorio";

const CORES = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"];

export function VisaoGeralTab({ periodo }: { periodo: Periodo }) {
  const { data, isLoading } = useDashboard(periodo);

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card size="sm"><CardContent><p className="text-2xl font-semibold">R$ {data.faturamento.total.toFixed(2)}</p><p className="text-sm text-muted-foreground">Faturamento</p></CardContent></Card>
        <Card size="sm"><CardContent><p className="text-2xl font-semibold">{data.faturamento.quantidadeVendas}</p><p className="text-sm text-muted-foreground">Vendas</p></CardContent></Card>
        <Card size="sm"><CardContent><p className="text-2xl font-semibold">R$ {data.faturamento.ticketMedio.toFixed(2)}</p><p className="text-sm text-muted-foreground">Ticket Médio</p></CardContent></Card>
        <Card size="sm"><CardContent><p className="text-2xl font-semibold">R$ {data.fiado.saldoDevedorTotal.toFixed(2)}</p><p className="text-sm text-muted-foreground">Fiado em Aberto</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <p className="mb-3 text-sm font-medium">Formas de Pagamento</p>
            {data.formasPagamento.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados no período.</p>
            ) : (
              <Pie
                data={{
                  labels: data.formasPagamento.map((f) => f.formaPagamento),
                  datasets: [{ data: data.formasPagamento.map((f) => f.valor), backgroundColor: CORES }],
                }}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="mb-3 text-sm font-medium">Produtos Mais Vendidos</p>
            {data.produtosMaisVendidos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados no período.</p>
            ) : (
              <Bar
                data={{
                  labels: data.produtosMaisVendidos.map((p) => p.produtoNome),
                  datasets: [{ label: "Quantidade", data: data.produtosMaisVendidos.map((p) => p.quantidadeVendida), backgroundColor: CORES[0] }],
                }}
                options={{ indexAxis: "y" as const }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <p className="mb-3 text-sm font-medium">Estoque Baixo</p>
          {data.estoqueBaixo.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum produto abaixo do mínimo.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {data.estoqueBaixo.map((p) => (
                <div key={p.produtoID} className="flex justify-between text-sm">
                  <span>{p.produtoNome}</span>
                  <span className="text-muted-foreground">{p.quantidadeAtual} / mín. {p.quantidadeMinima}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
