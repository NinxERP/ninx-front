// A API grava todo horário em UTC, mas o EF o devolve sem marcar o fuso ("2026-09-29T00:07:13").
// O JavaScript lê uma data-hora sem fuso como horário local, então uma venda das 21h do dia 28
// aparecia datada do dia 29. Aqui o horário sem fuso é lido como UTC.
const SEM_FUSO = /^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)$/;
const SO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const MEIA_NOITE = /^00:00(?::00(?:\.0+)?)?$/;

/**
 * Converte uma data vinda da API em `Date`, para exibir no horário local.
 *
 * Colunas de data pura (validade, início e fim de plano) chegam como meia-noite exata e não
 * têm hora de verdade: são mantidas como estão, senão recuariam um dia. Um horário real cair
 * exatamente à meia-noite UTC, com precisão de tick, não acontece na prática.
 */
export function dataDaApi(iso: string): Date {
  if (SO_DATA.test(iso)) return new Date(`${iso}T00:00:00`); // sem isso o JS lê como UTC e recua um dia
  const partes = SEM_FUSO.exec(iso);
  if (!partes) return new Date(iso); // já traz "Z" ou deslocamento
  return new Date(MEIA_NOITE.test(partes[1]) ? iso : `${iso}Z`);
}
