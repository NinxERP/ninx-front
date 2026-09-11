export enum FormaPagamento {
  Dinheiro = 1,
  Pix = 2,
  Cartao = 3,
}

export enum PlanoAssinatura {
  Mensal = 1,
  Trimestral = 3,
  Anual = 12,
}

export enum StatusAssinatura {
  Ativa = 1,
  Vencida = 2,
  Cancelada = 3,
}

export enum TipoVenda {
  Normal = 1,
  Fiado = 2,
}

export type TipoVendaLabel = "Normal" | "Fiado";
export type StatusVendaLabel = "Aberta" | "Finalizada" | "Cancelada" | "Estornada" | "Aguardando";
export type PlanoAssinaturaLabel = "Mensal" | "Trimestral" | "Anual";
export type StatusAssinaturaLabel = "Ativa" | "Vencida" | "Cancelada";
export type UnidadeMedida = "UN" | "KG" | "L" | "G";
