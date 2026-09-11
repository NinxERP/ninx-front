import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import type { ConfirmarRedefinicaoSenhaRequest, SolicitarRedefinicaoSenhaRequest } from "@/types";

export function useSolicitarRedefinicao() {
  return useMutation({
    mutationFn: (body: SolicitarRedefinicaoSenhaRequest) => api.post<void>("/api/RedefinicaoSenha/Solicitar", body),
  });
}

export function useConfirmarRedefinicao() {
  return useMutation({
    mutationFn: (body: ConfirmarRedefinicaoSenhaRequest) => api.post<void>("/api/RedefinicaoSenha/Confirmar", body),
  });
}
