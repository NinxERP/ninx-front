import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { toQueryString } from "@/lib/query";
import type { AssinaturaPlanoResponse, PagamentoHistoricoAssinaturaPlanoResponse, PaginatedResponse } from "@/types";

const KEY = "assinatura-plano";

export function useAssinaturaPlano() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () => api.get<AssinaturaPlanoResponse>("/api/AssinaturaPlano/comercio"),
  });
}

export function useHistoricoPagamentos(page: number, pageSize: number) {
  return useQuery({
    queryKey: [KEY, "historico", page, pageSize],
    queryFn: () =>
      api.get<PaginatedResponse<PagamentoHistoricoAssinaturaPlanoResponse>>(
        `/api/PagamentoAssinatura/historico${toQueryString({ pageNumber: page, pageSize })}`,
      ),
  });
}

export function useCancelarAssinatura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>("/api/AssinaturaPlano/cancelar"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
