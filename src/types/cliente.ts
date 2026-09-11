export interface ClienteRequest {
  nome: string;
  telefone?: string;
  cpf: string;
  email?: string;
  enderecoLogradouro: string;
  enderecoNumero: string;
  enderecoComplemento?: string;
  enderecoBairro: string;
  enderecoCidade: string;
  enderecoUF: string;
  enderecoCEP: string;
  limiteCredito?: number;
}

export interface ClienteResponse extends ClienteRequest {
  clienteID: number;
  comercioID: number;
  ativo: boolean;
  criadoEm: string;
  comercioNome: string;
  saldoDevedor: number;
}
