import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api/client";
import { toQueryString } from "@/lib/query";
import type {
  ClienteInativoResumo,
  ClienteLimiteCreditoResumo,
  ProdutoCurvaAbcResponse,
  ProdutoVencendoResumo,
  RelatorioAgingResponse,
  RelatorioComparativoComerciosResponse,
  RelatorioDashboardResponse,
  RelatorioGiroEstoqueResponse,
  RelatorioMargemResponse,
  RelatorioPicoVendasResponse,
  VendedorDesempenhoResumo,
} from "@/types";

export interface Periodo {
  inicio?: string;
  fim?: string;
}

const KEY = "relatorio";

export function useDashboard(periodo: Periodo) {
  return useQuery({
    queryKey: [KEY, "dashboard", periodo],
    queryFn: () => api.get<RelatorioDashboardResponse>(`/api/Relatorio/dashboard${toQueryString({ ...periodo })}`),
  });
}

export function useCurvaAbc(periodo: Periodo) {
  return useQuery({
    queryKey: [KEY, "curva-abc", periodo],
    queryFn: () => api.get<ProdutoCurvaAbcResponse[]>(`/api/Relatorio/curva-abc${toQueryString({ ...periodo })}`),
  });
}

export function useDesempenhoVendedores(periodo: Periodo) {
  return useQuery({
    queryKey: [KEY, "desempenho-vendedores", periodo],
    queryFn: () => api.get<VendedorDesempenhoResumo[]>(`/api/Relatorio/desempenho-vendedores${toQueryString({ ...periodo })}`),
  });
}

export function usePicoVendas(periodo: Periodo) {
  return useQuery({
    queryKey: [KEY, "pico-vendas", periodo],
    queryFn: () => api.get<RelatorioPicoVendasResponse>(`/api/Relatorio/pico-vendas${toQueryString({ ...periodo })}`),
  });
}

export function useMargem(periodo: Periodo) {
  return useQuery({
    queryKey: [KEY, "margem", periodo],
    queryFn: () => api.get<RelatorioMargemResponse>(`/api/Relatorio/margem${toQueryString({ ...periodo })}`),
  });
}

export function useAgingRecebiveis() {
  return useQuery({
    queryKey: [KEY, "aging-recebiveis"],
    queryFn: () => api.get<RelatorioAgingResponse>("/api/Relatorio/aging-recebiveis"),
  });
}

export function useLimiteCredito() {
  return useQuery({
    queryKey: [KEY, "limite-credito"],
    queryFn: () => api.get<ClienteLimiteCreditoResumo[]>("/api/Relatorio/limite-credito"),
  });
}

export function useGiroEstoque(periodo: Periodo) {
  return useQuery({
    queryKey: [KEY, "giro-estoque", periodo],
    queryFn: () => api.get<RelatorioGiroEstoqueResponse>(`/api/Relatorio/giro-estoque${toQueryString({ ...periodo })}`),
  });
}

export function useProdutosVencendo(diasLimite: number) {
  return useQuery({
    queryKey: [KEY, "produtos-vencendo", diasLimite],
    queryFn: () => api.get<ProdutoVencendoResumo[]>(`/api/Relatorio/produtos-vencendo${toQueryString({ diasLimite })}`),
  });
}

export function useComparativoComercios(periodo: Periodo, enabled: boolean) {
  return useQuery({
    queryKey: [KEY, "comparativo-comercios", periodo],
    queryFn: () =>
      api.get<RelatorioComparativoComerciosResponse>(`/api/Relatorio/comparativo-comercios${toQueryString({ ...periodo })}`),
    enabled,
  });
}

export function useClientesInativos(diasSemComprar: number) {
  return useQuery({
    queryKey: [KEY, "clientes-inativos", diasSemComprar],
    queryFn: () => api.get<ClienteInativoResumo[]>(`/api/Relatorio/clientes-inativos${toQueryString({ diasSemComprar })}`),
  });
}
