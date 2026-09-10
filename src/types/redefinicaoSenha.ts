export interface SolicitarRedefinicaoSenhaRequest {
  email: string;
}

export interface ConfirmarRedefinicaoSenhaRequest {
  email: string;
  codigo: string;
  novaSenha: string;
}
