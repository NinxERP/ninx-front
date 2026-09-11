import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/services/api/client";
import { montarNomeArquivo } from "@/lib/exportFilename";
import type { AssinaturaEletronicaResponse } from "@/types";

function baixarBase64ComoPdf(base64: string, nomeArquivo: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${nomeArquivo}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export function useDocumentoAssinado(guid: string | null) {
  return useQuery({
    queryKey: ["assinatura-eletronica", guid],
    queryFn: () => api.get<AssinaturaEletronicaResponse>(`/api/AssinaturaEletronica/comercio/${guid}`),
    enabled: guid !== null,
  });
}

export function useVerificarAssinatura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (guid: string) => {
      try {
        await api.get<void>(`/api/AssinaturaEletronica/assinado/${guid}`);
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.status === 400) return false;
        throw err;
      }
    },
    onSuccess: (assinado) => {
      if (assinado) queryClient.invalidateQueries({ queryKey: ["vendas"] });
    },
  });
}

export function useBaixarDocumentoPdf() {
  return useMutation({
    mutationFn: async ({
      guid,
      assinado,
      nomeArquivo,
      comercioNome,
      clienteNome,
    }: {
      guid: string;
      assinado: boolean;
      nomeArquivo: string;
      comercioNome?: string;
      clienteNome?: string;
    }) => {
      const path = assinado ? `/api/AssinaturaEletronica/comercio/${guid}` : `/api/AssinaturaEletronica/${guid}`;
      const doc = await api.get<AssinaturaEletronicaResponse>(path);
      const base64 = assinado ? doc.documentoAssinadoBase64 : doc.documentoBase64;
      if (!base64) throw new Error("Documento indisponível para download.");
      baixarBase64ComoPdf(base64, montarNomeArquivo(nomeArquivo, { comercioNome, clienteNome }));
    },
    onSuccess: () => toast.success("PDF baixado com sucesso."),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Erro ao baixar o PDF."),
  });
}
