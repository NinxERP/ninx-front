export interface CriarCargoRequest {
  nome: string;
  peso: number;
  comercioID?: number;
}

export interface AtualizarCargoRequest {
  nome: string;
  peso: number;
}

export interface CargoResponse {
  cargoID: number;
  nome: string;
  peso: number;
  comercioID?: number;
  ativo: boolean;
  reservado: boolean;
}
