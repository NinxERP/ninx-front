export interface PaginationRequest {
  pageNumber?: number;
  pageSize?: number;
  status?: string[];
  termoBusca?: string;
}

export interface MetricsSummary {
  totalGeral: number;
  totalAtivos: number;
  totalInativos: number;
  totalNormal: number;
  totalBaixo: number;
  totalZerado: number;
}

export interface PaginatedResponse<TData, TSummary = null> {
  data: TData[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  summary: TSummary | null;
}

export interface ErrorResponse {
  status: number;
  messagem: string;
}
