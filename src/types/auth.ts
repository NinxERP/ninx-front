export interface LoginRequest {
  email: string;
  senha: string;
  comercioID?: number;
}

export interface ComercioSimplificado {
  comercioID: number;
  nome: string;
}

export interface LoginResponse {
  token?: string;
  comercios?: ComercioSimplificado[];
}

export interface JwtClaims {
  usuarioId: number;
  nome: string;
  email: string;
  comercioId: number;
  cargoId: number;
  cargoNome: string;
  cargoPeso: number;
  nomeComercio: string;
  admin: boolean;
}
