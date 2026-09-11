export function montarNomeArquivo(base: string, opcoes: { comercioNome?: string; clienteNome?: string } = {}) {
  const hoje = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
  const partes = [base, opcoes.comercioNome, opcoes.clienteNome, hoje].filter(Boolean);
  return partes.join("-").replace(/[\\/:*?"<>|]/g, "").trim();
}
