export interface PermissaoResponse {
  permissaoID: number;
  chave: string;
  nome: string;
  descricao?: string;
}

export interface CriarCargoRequest {
  nome: string;
  permissaoIds: number[];
  comercioID?: number;
}

export interface AtualizarCargoRequest {
  nome: string;
  permissaoIds: number[];
}

export interface CargoResponse {
  cargoID: number;
  nome: string;
  ehProprietario: boolean;
  comercioID?: number;
  ativo: boolean;
  reservado: boolean;
  permissoes: PermissaoResponse[];
}
