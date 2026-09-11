import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { toQueryString } from "@/lib/query";
import type { AtualizarCargoRequest, CargoResponse, CriarCargoRequest } from "@/types";

const KEY = "cargos";

export function useCargos(comercioId?: number) {
  return useQuery({
    queryKey: [KEY, comercioId],
    queryFn: () => api.get<CargoResponse[]>(`/api/Cargo${toQueryString({ comercioId })}`),
  });
}

export function useCriarCargo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CriarCargoRequest) => api.post<CargoResponse>("/api/Cargo", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useAtualizarCargo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: AtualizarCargoRequest }) =>
      api.put<void>(`/api/Cargo/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useExcluirCargo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/Cargo/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
