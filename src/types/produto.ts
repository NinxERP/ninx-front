import type { UnidadeMedida } from "./enums";

export interface CriarProdutoRequest {
  comercioID: number;
  categoriaID?: number;
  nome: string;
  codigoBarras?: string;
  precoVenda: number;
  precoCusto?: number;
  unidadeMedida: UnidadeMedida;
  validade?: string;
  estoqueInicial: number;
  quantidadeMinima: number;
}

export interface AtualizarProdutoRequest {
  categoriaID?: number;
  nome: string;
  codigoBarras?: string;
  precoVenda: number;
  precoCusto?: number;
  unidadeMedida: UnidadeMedida;
  validade?: string;
  ativo: boolean;
}

export interface ProdutoResponse {
  produtoID: number;
  comercioID: number;
  categoriaID?: number;
  categoriaNome?: string;
  nome: string;
  codigoBarras?: string;
  precoVenda: number;
  precoCusto?: number;
  unidadeMedida: UnidadeMedida;
  validade?: string;
  ativo: boolean;
  criadoEm: string;
  estoqueID: number;
  quantidade: number;
  quantidadeMinima: number;
}
