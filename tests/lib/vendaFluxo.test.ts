import { test } from "node:test";
import assert from "node:assert/strict";
import {
  adicionarProduto,
  alterarQuantidade,
  calcularTroco,
  compradoresDaConta,
  definirQuantidade,
  excessoLimiteAutorizado,
  podeAvancarTipoVenda,
  podeProsseguirPagamento,
  removerItem,
  totalCarrinho,
  valorDoPagamento,
} from "../../src/lib/vendaFluxo.ts";
import type { CarrinhoItem } from "../../src/lib/vendaFluxo.ts";
import { FormaPagamento, TipoVenda } from "../../src/types/enums.ts";
import type { ContaFiadoResponse, PessoaAutorizadaResponse } from "../../src/types/contaFiado.ts";
import type { ProdutoResponse } from "../../src/types/produto.ts";

function produto(over: Partial<ProdutoResponse> = {}): ProdutoResponse {
  return {
    produtoID: 1,
    comercioID: 1,
    nome: "Pão francês",
    codigoBarras: "789",
    precoVenda: 2.5,
    unidadeMedida: "UN",
    ativo: true,
    criadoEm: "2026-09-01",
    estoqueID: 1,
    quantidade: 3,
    quantidadeMinima: 1,
    ...over,
  };
}

function item(over: Partial<CarrinhoItem> = {}): CarrinhoItem {
  return {
    produtoID: 1,
    nome: "Pão francês",
    precoUnitario: 2.5,
    quantidade: 1,
    unidadeMedida: "UN",
    estoqueDisponivel: 3,
    ...over,
  };
}

function autorizado(over: Partial<PessoaAutorizadaResponse> = {}): PessoaAutorizadaResponse {
  return {
    pessoaAutorizadaID: 10,
    nome: "Maria",
    parentesco: 1,
    menorDeIdade: false,
    criadoEm: "2026-09-01",
    saldoDevedor: 0,
    situacao: "Autorizada",
    ...over,
  };
}

function conta(over: Partial<ContaFiadoResponse> = {}): ContaFiadoResponse {
  return {
    clienteID: 1,
    termoAtivo: true,
    limiteCredito: 500,
    precisaNovoTermo: false,
    autorizados: [],
    termos: [],
    ...over,
  };
}

test("total do carrinho soma preço por quantidade", () => {
  assert.equal(totalCarrinho([]), 0);
  assert.equal(
    totalCarrinho([item({ quantidade: 3 }), item({ produtoID: 2, precoUnitario: 10, quantidade: 2 })]),
    27.5,
  );
});

test("leitura repetida do mesmo código soma quantidade em vez de duplicar item", () => {
  const primeira = adicionarProduto([], produto());
  const segunda = adicionarProduto(primeira.carrinho, produto());

  assert.equal(segunda.carrinho.length, 1);
  assert.equal(segunda.carrinho[0].quantidade, 2);
  assert.equal(segunda.erro, undefined);
});

test("leitura além do estoque é recusada e não muda o carrinho", () => {
  const carrinho = [item({ quantidade: 2, estoqueDisponivel: 2 })];

  const resultado = adicionarProduto(carrinho, produto({ quantidade: 2 }));

  assert.equal(resultado.erro, "Estoque insuficiente.");
  assert.deepEqual(resultado.carrinho, carrinho);
});

test("produto sem estoque não entra no carrinho", () => {
  const resultado = adicionarProduto([], produto({ quantidade: 0 }));

  assert.equal(resultado.erro, "Estoque insuficiente.");
  assert.equal(resultado.carrinho.length, 0);
});

test("botões de quantidade não passam do estoque nem descem abaixo de um", () => {
  const carrinho = [item({ quantidade: 3, estoqueDisponivel: 3 })];

  const aumentando = alterarQuantidade(carrinho, 1, 1);
  assert.equal(aumentando.erro, "Estoque insuficiente.");
  assert.equal(aumentando.carrinho[0].quantidade, 3);

  const diminuindoAteOLimite = alterarQuantidade([item({ quantidade: 1 })], 1, -1);
  assert.equal(diminuindoAteOLimite.erro, undefined);
  assert.equal(diminuindoAteOLimite.carrinho[0].quantidade, 1);
});

test("quantidade digitada zero remove o item; acima do estoque é recusada", () => {
  const carrinho = [item(), item({ produtoID: 2 })];

  const zerado = definirQuantidade(carrinho, 2, 0);
  assert.deepEqual(
    zerado.carrinho.map((i) => i.produtoID),
    [1],
  );

  const acima = definirQuantidade(carrinho, 1, 4);
  assert.equal(acima.erro, "Estoque insuficiente.");
  assert.equal(acima.carrinho[0].quantidade, 1);
});

test("remover item tira só o produto pedido", () => {
  const carrinho = [item(), item({ produtoID: 2 })];

  assert.deepEqual(
    removerItem(carrinho, 1).map((i) => i.produtoID),
    [2],
  );
});

test("troco só existe em dinheiro e nunca é negativo", () => {
  assert.equal(calcularTroco(FormaPagamento.Dinheiro, 50, 32.5), 17.5);
  assert.equal(calcularTroco(FormaPagamento.Dinheiro, 20, 32.5), 0);
  assert.equal(calcularTroco(FormaPagamento.Pix, 50, 32.5), 0);
  assert.equal(calcularTroco(0, 50, 32.5), 0);
});

test("venda à vista avança sem cliente; fiado exige cliente com termo assinado", () => {
  assert.equal(
    podeAvancarTipoVenda({ tipoVenda: TipoVenda.Normal, clienteSelecionado: false }),
    true,
  );
  assert.equal(podeAvancarTipoVenda({ tipoVenda: 0, clienteSelecionado: false }), false);
  assert.equal(
    podeAvancarTipoVenda({ tipoVenda: TipoVenda.Fiado, clienteSelecionado: false, conta: conta() }),
    false,
  );
  assert.equal(
    podeAvancarTipoVenda({
      tipoVenda: TipoVenda.Fiado,
      clienteSelecionado: true,
      conta: conta({ termoAtivo: false }),
    }),
    false,
  );
  assert.equal(
    podeAvancarTipoVenda({ tipoVenda: TipoVenda.Fiado, clienteSelecionado: true, conta: conta() }),
    true,
  );
});

test("fiado sem a conta carregada ainda não avança", () => {
  assert.equal(podeAvancarTipoVenda({ tipoVenda: TipoVenda.Fiado, clienteSelecionado: true }), false);
});

test("limite do autorizado é acumulado: conta o que ele já deve", () => {
  // limite 50, já deve 30: sobram 20
  const comprador = autorizado({ limiteCredito: 50, saldoDevedor: 30, saldoDisponivel: 20 });

  assert.equal(excessoLimiteAutorizado(comprador, 20), 0);
  assert.equal(excessoLimiteAutorizado(comprador, 25), 5);
  assert.equal(excessoLimiteAutorizado(autorizado(), 9999), 0); // sem limite próprio
  assert.equal(excessoLimiteAutorizado(undefined, 9999), 0); // titular
});

test("limite do autorizado não trava a escolha do comprador, só o pagamento", () => {
  const comprador = autorizado({ limiteCredito: 50, saldoDevedor: 30, saldoDisponivel: 20 });
  const base = { tipoVenda: TipoVenda.Fiado, metodoPagamento: FormaPagamento.Dinheiro, total: 32, comprador } as const;

  assert.equal(
    podeAvancarTipoVenda({ tipoVenda: TipoVenda.Fiado, clienteSelecionado: true, conta: conta({ autorizados: [comprador] }) }),
    true,
  );
  assert.equal(podeProsseguirPagamento({ ...base, valorRecebido: 0 }), false); // 32 a prazo, cabem 20
  assert.equal(podeProsseguirPagamento({ ...base, valorRecebido: 12 }), true); // entrada traz para 20
  assert.equal(podeProsseguirPagamento({ ...base, valorRecebido: 11.99 }), false);
});

test("autorizado que já esgotou o limite só compra à vista", () => {
  const comprador = autorizado({ limiteCredito: 50, saldoDevedor: 60, saldoDisponivel: -10 });

  assert.equal(excessoLimiteAutorizado(comprador, 1), 11);
  assert.equal(
    podeProsseguirPagamento({
      tipoVenda: TipoVenda.Fiado,
      metodoPagamento: FormaPagamento.Dinheiro,
      total: 5,
      valorRecebido: 4.99,
      comprador,
    }),
    false,
  );
});

test("lista de compradores mantém revogação pendente e descarta pendente e revogada", () => {
  const autorizados = [
    autorizado({ pessoaAutorizadaID: 1, nome: "Autorizada" }),
    autorizado({ pessoaAutorizadaID: 2, nome: "Saindo", situacao: "Revogação pendente" }),
    autorizado({ pessoaAutorizadaID: 3, nome: "Aguardando termo", situacao: "Pendente" }),
    autorizado({ pessoaAutorizadaID: 4, nome: "Revogada", situacao: "Revogada" }),
  ];

  assert.deepEqual(
    compradoresDaConta(conta({ autorizados })).map((p) => p.nome),
    ["Autorizada", "Saindo"],
  );
  assert.deepEqual(compradoresDaConta(undefined), []);
});

test("pagamento à vista em dinheiro exige cobrir o total; outras formas não", () => {
  const base = { tipoVenda: TipoVenda.Normal, total: 32.5 } as const;

  assert.equal(podeProsseguirPagamento({ ...base, metodoPagamento: FormaPagamento.Dinheiro, valorRecebido: 32.5 }), true);
  assert.equal(podeProsseguirPagamento({ ...base, metodoPagamento: FormaPagamento.Dinheiro, valorRecebido: 32.49 }), false);
  assert.equal(podeProsseguirPagamento({ ...base, metodoPagamento: FormaPagamento.Cartao, valorRecebido: 0 }), true);
  assert.equal(podeProsseguirPagamento({ ...base, metodoPagamento: 0, valorRecebido: 100 }), false);
});

test("entrada do fiado pode ser zero, mas não pode quitar a venda", () => {
  const base = { tipoVenda: TipoVenda.Fiado, metodoPagamento: FormaPagamento.Dinheiro, total: 32.5 } as const;

  assert.equal(podeProsseguirPagamento({ ...base, valorRecebido: 0 }), true);
  assert.equal(podeProsseguirPagamento({ ...base, valorRecebido: 20 }), true);
  assert.equal(podeProsseguirPagamento({ ...base, valorRecebido: 32.5 }), false);
  assert.equal(podeProsseguirPagamento({ ...base, valorRecebido: 40 }), false);
});

test("valor do pagamento é o total à vista e a entrada no fiado", () => {
  assert.equal(valorDoPagamento(TipoVenda.Normal, 50, 32.5), 32.5);
  assert.equal(valorDoPagamento(TipoVenda.Fiado, 10, 32.5), 10);
});
