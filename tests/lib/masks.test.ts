import { test } from "node:test";
import assert from "node:assert/strict";
import { maskCep, maskCnpj, maskCpf, maskNumerico, maskTelefone } from "../../src/lib/masks.ts";

test("máscara de CPF, completa e parcial", () => {
  assert.equal(maskCpf("52998224725"), "529.982.247-25");
  assert.equal(maskCpf("5299"), "529.9");
  assert.equal(maskCpf("529.982.247-25999"), "529.982.247-25");
});

test("máscara de CNPJ numérico mantém o formato anterior", () => {
  assert.equal(maskCnpj("11222333000181"), "11.222.333/0001-81");
  assert.equal(maskCnpj("112223"), "11.222.3");
  assert.equal(maskCnpj("1122"), "11.22");
});

test("máscara de CNPJ aceita letras nas 12 primeiras posições", () => {
  assert.equal(maskCnpj("12abc34501de35"), "12.ABC.345/01DE-35");
});

test("máscara de CNPJ descarta letras nos dígitos verificadores", () => {
  assert.equal(maskCnpj("12ABC34501DEX5"), "12.ABC.345/01DE-5");
});

test("máscara de CNPJ limita a 14 caracteres", () => {
  assert.equal(maskCnpj("11222333000181999"), "11.222.333/0001-81");
});

test("máscara de CEP", () => {
  assert.equal(maskCep("38183000"), "38183-000");
  assert.equal(maskCep("38183"), "38183");
});

test("máscara de telefone fixo e celular", () => {
  assert.equal(maskTelefone("3436610000"), "(34) 3661-0000");
  assert.equal(maskTelefone("34991234567"), "(34) 99123-4567");
});

test("máscara numérica remove tudo que não é dígito", () => {
  assert.equal(maskNumerico("a1b2-3"), "123");
});
