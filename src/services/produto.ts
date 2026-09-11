import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/services/api/client";
import { toQueryString } from "@/lib/query";
import type { AtualizarProdutoRequest, CriarProdutoRequest, MetricsSummary, PaginatedResponse, ProdutoResponse } from "@/types";

const KEY = "produtos";

export function useProdutos(page: number, pageSize: number, status: string[], termoBusca: string) {
  return useQuery({
    queryKey: [KEY, page, pageSize, status, termoBusca],
    queryFn: () =>
      api.get<PaginatedResponse<ProdutoResponse, MetricsSummary>>(
        `/api/Produto/GetAllPaginated${toQueryString({ pageNumber: page, pageSize, status, termoBusca })}`,
      ),
    placeholderData: keepPreviousData,
  });
}

export function useCriarProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CriarProdutoRequest) => api.post<ProdutoResponse>("/api/Produto", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useAtualizarProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: AtualizarProdutoRequest }) => api.put<void>(`/api/Produto/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export async function buscarProdutoPorCodigoBarras(codigoBarras: string): Promise<ProdutoResponse | null> {
  try {
    return await api.get<ProdutoResponse>(`/api/Produto/codigo-barras/${encodeURIComponent(codigoBarras)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export function useExcluirProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/Produto/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
