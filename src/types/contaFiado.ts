export const Parentesco = {
  Conjuge: 1,
  Companheiro: 2,
  Filho: 3,
  Outro: 4,
} as const;

export const PARENTESCO_LABEL: Record<number, string> = {
  [Parentesco.Conjuge]: "Cônjuge",
  [Parentesco.Companheiro]: "Companheiro(a)",
  [Parentesco.Filho]: "Filho(a)",
  [Parentesco.Outro]: "Outro",
};

export interface PessoaAutorizadaRequest {
  nome: string;
  cpf?: string;
  parentesco: number;
  menorDeIdade: boolean;
  limitePorCompra?: number;
}

export interface PessoaAutorizadaResponse {
  pessoaAutorizadaID: number;
  nome: string;
  cpf?: string;
  parentesco: number;
  menorDeIdade: boolean;
  limitePorCompra?: number;
  criadoEm: string;
  autorizadaEm?: string;
  revogacaoSolicitadaEm?: string;
  revogadaEm?: string;
  situacao: "Pendente" | "Autorizada" | "Revogação pendente" | "Revogada";
}

export interface TermoAberturaResumoResponse {
  versao: number;
  status: "Aguardando" | "Ativo" | "Substituido" | "Cancelado";
  criadoEm: string;
  assinadoEm?: string;
  documentoGuid?: string;
}

export interface ContaFiadoResponse {
  clienteID: number;
  termoAtivo: boolean;
  termoAssinadoEm?: string;
  documentoGuidTermoAtivo?: string;
  documentoGuidTermoPendente?: string;
  precisaNovoTermo: boolean;
  autorizados: PessoaAutorizadaResponse[];
  termos: TermoAberturaResumoResponse[];
}
