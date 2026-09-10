import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import type { CriarVendaRequest, ReceberPagamentoFiadoRequest, VendaResponse } from "@/types";

const KEY = "vendas";
const CLIENTE_KEY = "clientes";

export function useVendasCliente(clienteId: number, habilitado: boolean) {
  return useQuery({
    queryKey: [KEY, "cliente", clienteId],
    queryFn: () => api.get<VendaResponse[]>(`/api/Venda/cliente/${clienteId}`),
    enabled: habilitado,
  });
}

export function useCriarVenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CriarVendaRequest) => api.post<VendaResponse>("/api/Venda", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useEstornarVenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vendaId: number) => api.post<void>(`/api/Venda/${vendaId}/estorno`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useReceberPagamentoFiado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vendaId, body }: { vendaId: number; body: ReceberPagamentoFiadoRequest }) =>
      api.post<string>(`/api/Venda/${vendaId}/pagamento-fiado`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [CLIENTE_KEY] });
    },
  });
}

export function useReceberPagamentoGeralFiado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clienteId, body }: { clienteId: number; body: ReceberPagamentoFiadoRequest }) =>
      api.post<string>(`/api/Venda/cliente/${clienteId}/pagamento-geral-fiado`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [CLIENTE_KEY] });
    },
  });
}
