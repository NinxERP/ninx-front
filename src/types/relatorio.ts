export interface RelatorioDashboardRequest {
  inicio?: string;
  fim?: string;
}

export interface RelatorioClientesInativosRequest {
  diasSemComprar: number;
}

export interface RelatorioProdutosVencendoRequest {
  diasLimite: number;
}

export interface FaturamentoResumo {
  total: number;
  quantidadeVendas: number;
  ticketMedio: number;
}

export interface FormaPagamentoResumo {
  formaPagamento: string;
  valor: number;
  quantidade: number;
}

export interface FiadoResumo {
  saldoDevedorTotal: number;
  vendasEmAberto: number;
}

export interface ProdutoVendidoResumo {
  produtoID: number;
  produtoNome: string;
  quantidadeVendida: number;
  valorTotal: number;
}

export interface EstoqueBaixoResumo {
  produtoID: number;
  produtoNome: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
}

export interface CancelamentoResumo {
  quantidade: number;
  valorCancelado: number;
}

export interface RelatorioDashboardResponse {
  inicio: string;
  fim: string;
  faturamento: FaturamentoResumo;
  formasPagamento: FormaPagamentoResumo[];
  fiado: FiadoResumo;
  produtosMaisVendidos: ProdutoVendidoResumo[];
  produtosMenosVendidos: ProdutoVendidoResumo[];
  estoqueBaixo: EstoqueBaixoResumo[];
  cancelamentos: CancelamentoResumo;
}

export interface ProdutoCurvaAbcResponse {
  produtoID: number;
  produtoNome: string;
  quantidadeVendida: number;
  valorTotal: number;
  percentualReceita: number;
  percentualAcumulado: number;
  classificacao: string;
}

export interface ProdutoMargemResumo {
  produtoID: number;
  produtoNome: string;
  quantidadeVendida: number;
  receitaTotal: number;
  custoTotal: number;
  lucroTotal: number;
  margemPercentual: number;
}

export interface CategoriaMargemResumo {
  categoriaID?: number;
  categoriaNome: string;
  receitaTotal: number;
  custoTotal: number;
  lucroTotal: number;
  margemPercentual: number;
}

export interface RelatorioMargemResponse {
  produtos: ProdutoMargemResumo[];
  categorias: CategoriaMargemResumo[];
  produtosSemPrecoCusto: number;
}

export interface AgingBucketResumo {
  valor: number;
  quantidade: number;
}

export interface VendaEmAbertoResumo {
  vendaID: number;
  clienteID?: number;
  clienteNome: string;
  saldoDevedor: number;
  criadoEm: string;
  diasEmAberto: number;
  bucket: "0-30" | "31-60" | "60+";
}

export interface RelatorioAgingResponse {
  ate30Dias: AgingBucketResumo;
  de31a60Dias: AgingBucketResumo;
  acima60Dias: AgingBucketResumo;
  vendas: VendaEmAbertoResumo[];
}

export interface VendedorDesempenhoResumo {
  usuarioID: number;
  usuarioNome: string;
  quantidadeVendas: number;
  valorTotal: number;
  ticketMedio: number;
}

export interface PicoPorHoraResumo {
  hora: number;
  quantidadeVendas: number;
  valorTotal: number;
}

export interface PicoPorDiaSemanaResumo {
  diaSemana: string;
  quantidadeVendas: number;
  valorTotal: number;
}

export interface RelatorioPicoVendasResponse {
  porHora: PicoPorHoraResumo[];
  porDiaSemana: PicoPorDiaSemanaResumo[];
}

export interface ClienteInativoResumo {
  clienteID: number;
  clienteNome: string;
  telefone?: string;
  ultimaCompra?: string;
  diasSemComprar?: number;
  nuncaComprou: boolean;
}

export interface ClienteLimiteCreditoResumo {
  clienteID: number;
  clienteNome: string;
  limiteCredito: number;
  saldoDevedor: number;
  limiteDisponivel: number;
  percentualUtilizado: number;
}

export interface GiroEstoqueResumo {
  produtoID: number;
  produtoNome: string;
  quantidadeVendida: number;
  estoqueAtual: number;
  giro: number;
}

export interface ProdutoParadoResumo {
  produtoID: number;
  produtoNome: string;
  estoqueAtual: number;
  ultimaVenda?: string;
  diasSemVender?: number;
}

export interface RelatorioGiroEstoqueResponse {
  produtos: GiroEstoqueResumo[];
  produtosParados: ProdutoParadoResumo[];
}

export function ordenarProdutosParados(produtos: ProdutoParadoResumo[]) {
  return [...produtos].sort((a, b) => {
    if (a.diasSemVender == null) return 1;
    if (b.diasSemVender == null) return -1;
    return b.diasSemVender - a.diasSemVender;
  });
}

export interface ProdutoVencendoResumo {
  produtoID: number;
  produtoNome: string;
  validade: string;
  diasParaVencer: number;
  quantidadeEmEstoque: number;
  vencido: boolean;
}

export interface ComercioComparativoResumo {
  comercioID: number;
  comercioNome: string;
  faturamentoTotal: number;
  quantidadeVendas: number;
  ticketMedio: number;
}

export interface RelatorioComparativoComerciosResponse {
  comercios: ComercioComparativoResumo[];
}
