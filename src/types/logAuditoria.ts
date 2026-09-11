export interface LogAuditoriaResponse {
  logAuditoriaID: number;
  usuarioID: number;
  usuarioNome: string;
  comercioID?: number;
  acao: string;
  entidade: string;
  entidadeID: number;
  detalhes?: string;
  criadoEm: string;
}
