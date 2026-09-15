import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import type { ContaFiadoResponse, PessoaAutorizadaRequest, PessoaAutorizadaResponse } from "@/types";

const KEY = "conta-fiado";

export function useContaFiado(clienteId: number | null) {
  return useQuery({
    queryKey: [KEY, clienteId],
    queryFn: () => api.get<ContaFiadoResponse>(`/api/Cliente/${clienteId}/conta-fiado`),
    enabled: clienteId !== null,
  });
}

function useInvalidarConta() {
  const queryClient = useQueryClient();
  return (clienteId: number) => queryClient.invalidateQueries({ queryKey: [KEY, clienteId] });
}

export function useAdicionarAutorizado() {
  const invalidar = useInvalidarConta();
  return useMutation({
    mutationFn: ({ clienteId, body }: { clienteId: number; body: PessoaAutorizadaRequest }) =>
      api.post<PessoaAutorizadaResponse>(`/api/Cliente/${clienteId}/autorizados`, body),
    onSuccess: (_, { clienteId }) => invalidar(clienteId),
  });
}

export function useRevogarAutorizado() {
  const invalidar = useInvalidarConta();
  return useMutation({
    mutationFn: ({ clienteId, autorizadoId }: { clienteId: number; autorizadoId: number }) =>
      api.delete<void>(`/api/Cliente/${clienteId}/autorizados/${autorizadoId}`),
    onSuccess: (_, { clienteId }) => invalidar(clienteId),
  });
}

export function useGerarTermoAbertura() {
  const invalidar = useInvalidarConta();
  return useMutation({
    mutationFn: (clienteId: number) =>
      api.post<{ documentoGuid: string }>(`/api/Cliente/${clienteId}/termo-abertura`),
    onSuccess: (_, clienteId) => invalidar(clienteId),
  });
}
