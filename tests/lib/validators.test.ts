import { test } from "node:test";
import assert from "node:assert/strict";
import { validarCep, validarCnpj, validarCpf } from "../../src/lib/validators.ts";

// Valores válidos calculados e conferidos à parte pelo algoritmo oficial.

test("CPF válido, com e sem máscara", () => {
  assert.equal(validarCpf("529.982.247-25"), true);
  assert.equal(validarCpf("52998224725"), true);
  assert.equal(validarCpf("111.444.777-35"), true);
});

test("CPF com dígito verificador errado é recusado", () => {
  assert.equal(validarCpf("529.982.247-24"), false);
  assert.equal(validarCpf("111.444.777-53"), false);
});

test("CPF com todos os dígitos iguais é recusado, mesmo fechando a conta", () => {
  assert.equal(validarCpf("111.111.111-11"), false);
  assert.equal(validarCpf("00000000000"), false);
});

test("CPF com tamanho errado é recusado", () => {
  assert.equal(validarCpf("5299822472"), false);
  assert.equal(validarCpf(""), false);
});

test("CNPJ numérico válido, com e sem máscara", () => {
  assert.equal(validarCnpj("11.222.333/0001-81"), true);
  assert.equal(validarCnpj("11222333000181"), true);
  assert.equal(validarCnpj("45.533.120/0001-92"), true);
});

test("CNPJ alfanumérico válido (exemplo oficial da Receita Federal)", () => {
  assert.equal(validarCnpj("12.ABC.345/01DE-35"), true);
  assert.equal(validarCnpj("12ABC34501DE35"), true);
  assert.equal(validarCnpj("A1.B2C.3D4/0001-93"), true);
});

test("CNPJ alfanumérico aceita letras minúsculas, normalizando", () => {
  assert.equal(validarCnpj("12.abc.345/01de-35"), true);
});

test("CNPJ com dígito verificador errado é recusado", () => {
  assert.equal(validarCnpj("11.222.333/0001-82"), false);
  assert.equal(validarCnpj("12.ABC.345/01DE-36"), false);
});

test("CNPJ que só confere o tamanho não passa mais (defeito da versão anterior)", () => {
  // 14 dígitos quaisquer: a versão anterior aceitava.
  assert.equal(validarCnpj("12345678901234"), false);
});

test("CNPJ com todos os caracteres iguais é recusado", () => {
  assert.equal(validarCnpj("00.000.000/0000-00"), false);
  assert.equal(validarCnpj("11111111111111"), false);
});

test("CNPJ com letra nos dígitos verificadores é recusado", () => {
  assert.equal(validarCnpj("12ABC34501DE3A"), false);
});

test("CNPJ com tamanho ou caractere inválido é recusado", () => {
  assert.equal(validarCnpj("1122233300018"), false);
  assert.equal(validarCnpj("11 222 333 0001 81"), false);
  assert.equal(validarCnpj(""), false);
});

test("CEP exige 8 dígitos", () => {
  assert.equal(validarCep("38183-000"), true);
  assert.equal(validarCep("38183000"), true);
  assert.equal(validarCep("3818300"), false);
});
