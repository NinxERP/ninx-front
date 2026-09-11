export interface CriarUsuarioRequest {
  nome: string;
  email: string;
  senha: string;
  cargoID: number;
  comercioId: number;
}

export interface AtualizarUsuarioRequest {
  nome: string;
  email: string;
  cargoID?: number;
}

export interface ResetarSenhaRequest {
  novaSenha: string;
}

export interface UsuarioResponse {
  usuarioID: number;
  nome: string;
  email: string;
  admin: boolean;
  ativo: boolean;
  criadoEm: string;
  cargoNome?: string;
}

export interface UsuarioListaResponse {
  usuarioID: number;
  nome: string;
  email: string;
  ativo: boolean;
  criadoEm: string;
  comercioID: number;
  comercioNome: string;
  cargoNome: string;
}

export interface CriarUsuarioComercioRequest {
  usuarioID: number;
  comercioID: number;
  cargoID: number;
}

export interface AtualizarUsuarioComercioRequest {
  usuarioID: number;
  comercioID: number;
  cargoID: number;
  ativo?: boolean;
}

export interface UsuarioComercioResponse {
  usuarioComercioID: number;
  usuarioID: number;
  comercioID: number;
  cargoID: number;
  cargoNome: string;
  cargoPeso: number;
  ativo: boolean;
}
