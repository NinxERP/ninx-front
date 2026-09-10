import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { toQueryString } from "@/lib/query";
import type { ComercioRequest, ComercioResponse, PaginatedResponse } from "@/types";

const KEY = "comercio";

export function buscarComerciosDoUsuario(usuarioId: number): Promise<ComercioResponse[]> {
  return api.get<ComercioResponse[]>(`/api/Comercio/usuario/${usuarioId}`);
}

export function useComercio(comercioId?: number) {
  return useQuery({
    queryKey: [KEY, comercioId],
    queryFn: () => api.get<ComercioResponse>(`/api/Comercio/${comercioId}`),
    enabled: comercioId !== undefined,
  });
}

export function useComerciosPlataforma(page: number, pageSize: number, enabled: boolean) {
  return useQuery({
    queryKey: [KEY, "all", page, pageSize],
    queryFn: () =>
      api.get<PaginatedResponse<ComercioResponse>>(`/api/Comercio/All${toQueryString({ pageNumber: page, pageSize })}`),
    enabled,
  });
}

export function useAtualizarComercio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ComercioRequest }) => api.put<void>(`/api/Comercio/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useExcluirComercio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/Comercio/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
