import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import type { EstoqueRequest } from "@/types";

const PRODUTO_KEY = "produtos";

export function useAtualizarEstoque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: EstoqueRequest }) => api.put<void>(`/api/Estoque/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUTO_KEY] }),
  });
}

export function useCriarEstoque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EstoqueRequest) => api.post<void>("/api/Estoque", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUTO_KEY] }),
  });
}
