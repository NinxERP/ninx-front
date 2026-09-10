export interface EstoqueRequest {
  produtoID: number;
  quantidade: number;
  quantidadeMinima: number;
}

export interface EstoqueResponse {
  estoqueID: number;
  produtoID: number;
  comercioID: number;
  quantidade: number;
  quantidadeMinima: number;
  ultimaAtualizacao: string;
  atualizadoEm?: string;
}
