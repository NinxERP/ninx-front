import { test } from "node:test";
import assert from "node:assert/strict";
import { toQueryString } from "../../src/lib/query.ts";
import { decodeJwt } from "../../src/lib/jwt.ts";
import { statusProduto } from "../../src/lib/produtoStatus.ts";
import { montarNomeArquivo } from "../../src/lib/exportFilename.ts";

test("query string ignora vazios e repete a chave em listas (formato do ASP.NET)", () => {
  assert.equal(toQueryString({}), "");
  assert.equal(toQueryString({ pagina: 2, busca: "", filtro: undefined }), "?pagina=2");
  assert.equal(toQueryString({ status: ["ok", "baixo"] }), "?status=ok&status=baixo");
});

test("decodeJwt lê claims com acentuação (UTF-8)", () => {
  const payload = Buffer.from(JSON.stringify({ nome: "José Conceição", cargoEhProprietario: "True" })).toString("base64url");
  const token = `cabecalho.${payload}.assinatura`;
  const claims = decodeJwt<{ nome: string; cargoEhProprietario: string }>(token);
  assert.equal(claims.nome, "José Conceição");
  assert.equal(claims.cargoEhProprietario, "True");
});

test("status de produto segue a mesma prioridade em todas as telas", () => {
  assert.deepEqual(statusProduto({ ativo: false, quantidade: 0, quantidadeMinima: 5 }), { tone: "neutral", texto: "Desativado" });
  assert.deepEqual(statusProduto({ ativo: true, quantidade: 0, quantidadeMinima: 5 }), { tone: "danger", texto: "Sem Estoque" });
  assert.deepEqual(statusProduto({ ativo: true, quantidade: 3, quantidadeMinima: 5 }), { tone: "warning", texto: "Abaixo do Mín" });
  assert.deepEqual(statusProduto({ ativo: true, quantidade: 5, quantidadeMinima: 5 }), { tone: "ok", texto: "Normal" });
});

test("nome de arquivo exportado remove caracteres inválidos no Windows", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date(2026, 8, 12, 12, 0, 0) });
  const nome = montarNomeArquivo("Recibo", { comercioNome: "Padaria A/B", clienteNome: 'Maria "Zé"' });
  assert.equal(nome, "Recibo-Padaria AB-Maria Zé-12-09-2026");
});
