import type { PlanoAssinaturaLabel, StatusAssinaturaLabel } from "./enums";

export interface AssinaturaPlanoResponse {
  comercioID: number;
  plano: PlanoAssinaturaLabel;
  status: StatusAssinaturaLabel;
  dataInicio: string;
  dataFim: string;
  criadoEm: string;
  atualizadoEm?: string;
  cancelamentoSolicitadoEm?: string;
}

export interface PagamentoHistoricoAssinaturaPlanoRequest {
  comercioId: number;
  valor: number;
}

export interface PagamentoHistoricoAssinaturaPlanoResponse {
  pagamentoAssinaturaID: number;
  assinaturaID: number;
  valor: number;
  dataPagamento: string;
  dataVencimento: string;
}
