import type { ProdutoResponse } from "@/types";

export type ProdutoStatusTone = "ok" | "warning" | "danger" | "neutral";

export function statusProduto(produto: Pick<ProdutoResponse, "ativo" | "quantidade" | "quantidadeMinima">): {
  tone: ProdutoStatusTone;
  texto: string;
} {
  if (!produto.ativo) return { tone: "neutral", texto: "Desativado" };
  if (produto.quantidade === 0) return { tone: "danger", texto: "Sem Estoque" };
  if (produto.quantidade < produto.quantidadeMinima) return { tone: "warning", texto: "Abaixo do Mín" };
  return { tone: "ok", texto: "Normal" };
}
