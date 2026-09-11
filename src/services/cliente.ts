import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/services/api/client";
import { toQueryString } from "@/lib/query";
import type { ClienteRequest, ClienteResponse, MetricsSummary, PaginatedResponse } from "@/types";

const KEY = "clientes";

export async function buscarClientesPorNome(nome: string): Promise<ClienteResponse[]> {
  try {
    return await api.get<ClienteResponse[]>(`/api/Cliente/nome/${encodeURIComponent(nome)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

export function useClientes(page: number, pageSize: number, status: string[], termoBusca: string) {
  return useQuery({
    queryKey: [KEY, page, pageSize, status, termoBusca],
    queryFn: () =>
      api.get<PaginatedResponse<ClienteResponse, MetricsSummary>>(
        `/api/Cliente/All${toQueryString({ pageNumber: page, pageSize, status, termoBusca })}`,
      ),
    placeholderData: keepPreviousData,
  });
}

export function useCriarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ClienteRequest) => api.post<ClienteResponse>("/api/Cliente", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useAtualizarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ClienteRequest }) => api.put<ClienteResponse>(`/api/Cliente/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDesativarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/Cliente/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
