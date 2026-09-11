import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { toQueryString } from "@/lib/query";
import type { CategoriaProdutoRequest, CategoriaProdutoResponse, PaginatedResponse } from "@/types";

const KEY = "categorias-produto";

export function useCategorias(page: number, pageSize: number, termoBusca: string) {
  return useQuery({
    queryKey: [KEY, page, pageSize, termoBusca],
    queryFn: () =>
      api.get<PaginatedResponse<CategoriaProdutoResponse>>(
        `/api/CategoriaProduto/All${toQueryString({ pageNumber: page, pageSize, termoBusca })}`,
      ),
  });
}

export function useCriarCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CategoriaProdutoRequest) =>
      api.post<CategoriaProdutoResponse>("/api/CategoriaProduto", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useAtualizarCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: CategoriaProdutoRequest }) =>
      api.put<void>(`/api/CategoriaProduto/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useExcluirCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/CategoriaProduto/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
