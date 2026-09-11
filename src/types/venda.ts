import type { FormaPagamento, StatusVendaLabel, TipoVendaLabel, UnidadeMedida } from "./enums";

export interface ItemVendaRequest {
  produtoID: number;
  quantidade: number;
  unidadeMedida: UnidadeMedida;
  comercioId: number;
}

export interface PagamentoVendaRequest {
  formaPagamento: FormaPagamento;
  valor: number;
}

export interface CriarVendaRequest {
  comercioID: number;
  usuarioID: number;
  clienteID?: number;
  observacoes?: string;
  tipoVenda: number;
  itensVenda: ItemVendaRequest[];
  pagamentos: PagamentoVendaRequest[];
}

export interface ReceberPagamentoFiadoRequest {
  valorPago: number;
  formaPagamento: FormaPagamento;
}

export interface DocumentoAssinaturaResponse {
  documentoGuid: string;
  assinado: boolean;
}

export interface VendaResponse {
  vendaID: number;
  comercioID: number;
  usuarioID: number;
  total: number;
  tipoVenda?: TipoVendaLabel;
  status?: StatusVendaLabel;
  criadoEm?: string;
  documentos: DocumentoAssinaturaResponse[];
  valorPago: number;
  saldoDevedor: number;
}

export interface FiltroRequest {
  inicio: string;
  fim: string;
  comercioID: number;
  usuarioID: number;
}
