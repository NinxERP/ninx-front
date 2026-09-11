export interface ComercioRequest {
  nome: string;
  endereco?: string;
  enderecoLogradouro?: string;
  enderecoNumero?: string;
  enderecoComplemento?: string;
  enderecoBairro?: string;
  enderecoCidade?: string;
  enderecoUF?: string;
  enderecoCEP?: string;
  cnpj?: string;
  assinaturaResponsavelBase64?: string;
  limiteCreditoPadrao?: number;
}

export interface ComercioResponse {
  comercioID: number;
  nomeComercio?: string;
  endereco?: string;
  enderecoLogradouro?: string;
  enderecoNumero?: string;
  enderecoComplemento?: string;
  enderecoBairro?: string;
  enderecoCidade?: string;
  enderecoUF?: string;
  enderecoCEP?: string;
  cnpj?: string;
  assinaturaResponsavelBase64?: string;
  limiteCreditoPadrao?: number;
}
