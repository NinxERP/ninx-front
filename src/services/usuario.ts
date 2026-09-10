import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/services/api/client";
import { toQueryString } from "@/lib/query";
import type {
  AtualizarUsuarioRequest,
  CriarUsuarioComercioRequest,
  CriarUsuarioRequest,
  PaginatedResponse,
  ResetarSenhaRequest,
  UsuarioListaResponse,
  UsuarioResponse,
} from "@/types";

const KEY = "usuarios";

export function useUsuariosComercio(page: number, pageSize: number, termoBusca: string, habilitado = true) {
  return useQuery({
    queryKey: [KEY, page, pageSize, termoBusca],
    queryFn: () =>
      api.get<PaginatedResponse<UsuarioListaResponse>>(
        `/api/Usuario/All${toQueryString({ pageNumber: page, pageSize, termoBusca })}`,
      ),
    enabled: habilitado,
  });
}

export function useUsuariosPlataforma(page: number, pageSize: number, termoBusca: string, habilitado: boolean) {
  return useQuery({
    queryKey: [KEY, "plataforma", page, pageSize, termoBusca],
    queryFn: () =>
      api.get<PaginatedResponse<UsuarioListaResponse>>(
        `/api/Usuario/NoComercioId/All${toQueryString({ pageNumber: page, pageSize, termoBusca })}`,
      ),
    enabled: habilitado,
  });
}

export async function buscarUsuarioPorEmail(email: string): Promise<UsuarioResponse | null> {
  try {
    return await api.get<UsuarioResponse>(`/api/Usuario/BuscarPorEmail${toQueryString({ email })}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export function useCriarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CriarUsuarioRequest) => api.post<UsuarioResponse>("/api/Usuario", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useVincularUsuarioComercio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CriarUsuarioComercioRequest) => api.post<void>("/api/UsuarioComercio", body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useAtualizarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: AtualizarUsuarioRequest }) =>
      api.put<void>(`/api/Usuario/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useRevogarAcesso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/Usuario/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useAtualizarUsuarioGlobal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: AtualizarUsuarioRequest }) =>
      api.put<UsuarioResponse>(`/api/Usuario/NoComercioId/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useResetarSenha() {
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ResetarSenhaRequest }) =>
      api.put<void>(`/api/Usuario/NoComercioId/${id}/Senha`, body),
  });
}

export function useDesativarGlobal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/api/Usuario/NoComercioId/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}
