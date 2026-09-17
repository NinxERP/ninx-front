import { FormaPagamento, TipoVenda } from "../types/enums.ts";
import type { ContaFiadoResponse, PessoaAutorizadaResponse } from "../types/contaFiado.ts";
import type { ProdutoResponse } from "../types/produto.ts";

/**
 * Regras do fluxo de venda do PDV, fora do componente para poderem ser testadas.
 * Os erros voltam como mensagem; quem chama decide como mostrar.
 */

export interface CarrinhoItem {
  produtoID: number;
  nome: string;
  codigoBarras?: string;
  precoUnitario: number;
  quantidade: number;
  unidadeMedida: string;
  estoqueDisponivel: number;
}

export interface ResultadoCarrinho {
  carrinho: CarrinhoItem[];
  erro?: string;
}

const ESTOQUE_INSUFICIENTE = "Estoque insuficiente.";

export function totalCarrinho(carrinho: CarrinhoItem[]): number {
  return carrinho.reduce((acc, i) => acc + i.precoUnitario * i.quantidade, 0);
}

export function adicionarProduto(carrinho: CarrinhoItem[], produto: ProdutoResponse): ResultadoCarrinho {
  const existente = carrinho.find((i) => i.produtoID === produto.produtoID);
  const quantidadeDesejada = (existente?.quantidade ?? 0) + 1;

  if (quantidadeDesejada > produto.quantidade) return { carrinho, erro: ESTOQUE_INSUFICIENTE };

  if (existente) {
    return {
      carrinho: carrinho.map((i) => (i.produtoID === produto.produtoID ? { ...i, quantidade: quantidadeDesejada } : i)),
    };
  }

  return {
    carrinho: [
      ...carrinho,
      {
        produtoID: produto.produtoID,
        nome: produto.nome,
        codigoBarras: produto.codigoBarras,
        precoUnitario: produto.precoVenda,
        quantidade: 1,
        unidadeMedida: produto.unidadeMedida,
        estoqueDisponivel: produto.quantidade,
      },
    ],
  };
}

export function alterarQuantidade(carrinho: CarrinhoItem[], produtoID: number, delta: number): ResultadoCarrinho {
  let erro: string | undefined;
  const novo = carrinho.map((i) => {
    if (i.produtoID !== produtoID) return i;
    const nova = Math.max(1, i.quantidade + delta);
    if (nova > i.estoqueDisponivel) {
      erro = ESTOQUE_INSUFICIENTE;
      return i;
    }
    return { ...i, quantidade: nova };
  });
  return { carrinho: novo, erro };
}

/** Quantidade digitada; zero remove o item do carrinho. */
export function definirQuantidade(carrinho: CarrinhoItem[], produtoID: number, quantidade: number): ResultadoCarrinho {
  let erro: string | undefined;
  const novo = carrinho
    .map((i) => {
      if (i.produtoID !== produtoID) return i;
      if (quantidade > i.estoqueDisponivel) {
        erro = ESTOQUE_INSUFICIENTE;
        return i;
      }
      return { ...i, quantidade };
    })
    .filter((i) => i.quantidade > 0);
  return { carrinho: novo, erro };
}

export function removerItem(carrinho: CarrinhoItem[], produtoID: number): CarrinhoItem[] {
  return carrinho.filter((i) => i.produtoID !== produtoID);
}

export function calcularTroco(metodoPagamento: 0 | FormaPagamento, valorRecebido: number, total: number): number {
  return metodoPagamento === FormaPagamento.Dinheiro ? Math.max(0, valorRecebido - total) : 0;
}

/**
 * Quem pode comprar na conta. Revogação pendente continua na lista: só deixa de valer
 * quando o titular assina a nova versão do termo.
 */
export function compradoresDaConta(conta?: ContaFiadoResponse): PessoaAutorizadaResponse[] {
  return conta?.autorizados.filter((p) => p.situacao === "Autorizada" || p.situacao === "Revogação pendente") ?? [];
}

/**
 * Quanto do valor a prazo passa do que a pessoa autorizada ainda pode dever. Zero quando
 * cabe ou quando a pessoa não tem limite próprio (vale só o limite da conta).
 */
export function excessoLimiteAutorizado(comprador: PessoaAutorizadaResponse | undefined, valorAPrazo: number): number {
  if (comprador?.saldoDisponivel === undefined || comprador.saldoDisponivel === null) return 0;
  return Math.max(0, valorAPrazo - comprador.saldoDisponivel);
}

/**
 * O limite da pessoa autorizada não bloqueia aqui: uma entrada, informada na etapa
 * seguinte, pode trazer o valor a prazo para dentro dele.
 */
export function podeAvancarTipoVenda(args: {
  tipoVenda: 0 | TipoVenda;
  clienteSelecionado: boolean;
  conta?: ContaFiadoResponse;
}): boolean {
  const { tipoVenda, clienteSelecionado, conta } = args;
  if (tipoVenda === TipoVenda.Normal) return true;
  if (tipoVenda !== TipoVenda.Fiado) return false;
  return clienteSelecionado && !!conta?.termoAtivo;
}

export function podeProsseguirPagamento(args: {
  tipoVenda: 0 | TipoVenda;
  metodoPagamento: 0 | FormaPagamento;
  valorRecebido: number;
  total: number;
  comprador?: PessoaAutorizadaResponse;
}): boolean {
  const { tipoVenda, metodoPagamento, valorRecebido, total, comprador } = args;
  if (metodoPagamento === 0) return false;
  if (tipoVenda === TipoVenda.Normal) {
    return metodoPagamento === FormaPagamento.Dinheiro ? valorRecebido >= total : true;
  }
  // Fiado: a entrada é opcional, mas não pode quitar a venda inteira, e o que fica a prazo
  // precisa caber no limite da pessoa autorizada, se ela tiver um.
  return valorRecebido < total && excessoLimiteAutorizado(comprador, total - valorRecebido) === 0;
}

/** Valor que vai no pagamento: à vista cobra o total, no fiado cobra a entrada digitada. */
export function valorDoPagamento(tipoVenda: 0 | TipoVenda, valorRecebido: number, total: number): number {
  return tipoVenda === TipoVenda.Normal ? total : valorRecebido;
}
