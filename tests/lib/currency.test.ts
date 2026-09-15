import { test } from "node:test";
import assert from "node:assert/strict";
import { formatarMoedaMask, formatarNumero, parseMoeda } from "../../src/lib/currency.ts";

test("máscara de moeda digita centavos primeiro", () => {
  assert.equal(formatarMoedaMask(""), "0,00");
  assert.equal(formatarMoedaMask("5"), "0,05");
  assert.equal(formatarMoedaMask("50"), "0,50");
  assert.equal(formatarMoedaMask("350"), "3,50");
  assert.equal(formatarMoedaMask("123456"), "1.234,56");
});

test("máscara de moeda ignora zeros à esquerda e caracteres não numéricos", () => {
  assert.equal(formatarMoedaMask("000123"), "1,23");
  assert.equal(formatarMoedaMask("R$ 1.234,56"), "1.234,56");
});

test("máscara de moeda limita a 10 dígitos, mantendo os últimos", () => {
  assert.equal(formatarMoedaMask("12345678901"), "23.456.789,01");
});

test("parseMoeda converte o formato brasileiro em número", () => {
  assert.equal(parseMoeda("1.234,56"), 1234.56);
  assert.equal(parseMoeda("3,50"), 3.5);
  assert.equal(parseMoeda(""), 0);
  assert.equal(parseMoeda("abc"), 0);
});

test("máscara e parse são inversos para valores digitados", () => {
  for (const digitado of ["1", "99", "350", "100000", "9999999999"]) {
    const formatado = formatarMoedaMask(digitado);
    assert.equal(parseMoeda(formatado), Number(digitado) / 100);
  }
});

test("formatarNumero usa duas casas e separador brasileiro", () => {
  assert.equal(formatarNumero(1234.5), "1.234,50");
  assert.equal(formatarNumero(0), "0,00");
});
