import { test } from "node:test";
import assert from "node:assert/strict";
import { dataDaApi } from "../../src/lib/datas.ts";

test("horário sem fuso vindo da API é lido como UTC", () => {
  assert.equal(dataDaApi("2026-09-29T00:07:13").toISOString(), "2026-09-29T00:07:13.000Z");
  // o SQL Server devolve sete casas decimais
  assert.equal(dataDaApi("2026-09-29T00:07:13.5809631").toISOString(), "2026-09-29T00:07:13.580Z");
});

test("horário que já traz fuso não é alterado", () => {
  assert.equal(dataDaApi("2026-09-29T00:07:13Z").toISOString(), "2026-09-29T00:07:13.000Z");
  assert.equal(dataDaApi("2026-09-28T21:07:13-03:00").toISOString(), "2026-09-29T00:07:13.000Z");
});

test("coluna de data pura (meia-noite exata) mantém o dia, em qualquer fuso", () => {
  const validade = dataDaApi("2026-10-10T00:00:00");
  assert.equal(validade.getDate(), 10);
  assert.equal(validade.getHours(), 0);

  assert.equal(dataDaApi("2026-10-10").getDate(), 10);
});

test("em Brasília, uma venda das 21h do dia 28 aparece no dia 28", () => {
  const anterior = process.env.TZ;
  process.env.TZ = "America/Sao_Paulo";
  try {
    assert.equal(dataDaApi("2026-09-29T00:07:13").toLocaleDateString("pt-BR"), "28/09/2026");
    assert.equal(dataDaApi("2026-10-10T00:00:00").toLocaleDateString("pt-BR"), "10/10/2026");
  } finally {
    if (anterior === undefined) delete process.env.TZ;
    else process.env.TZ = anterior;
  }
});
