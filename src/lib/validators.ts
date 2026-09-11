export function validarCpf(cpf: string): boolean {
  const digitos = cpf.replace(/\D/g, "");

  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) return false;

  const multiplicador1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  const multiplicador2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

  const calcularDigito = (base: string, multiplicadores: number[]) => {
    const soma = multiplicadores.reduce((acc, mult, i) => acc + Number(base[i]) * mult, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const digito1 = calcularDigito(digitos.slice(0, 9), multiplicador1);
  const digito2 = calcularDigito(digitos.slice(0, 9) + digito1, multiplicador2);

  return digitos.endsWith(`${digito1}${digito2}`);
}

export function validarCnpj(cnpj: string): boolean {
  const digitos = cnpj.replace(/[./-]/g, "");
  return digitos.length === 14 && /^\d+$/.test(digitos);
}

export function validarCep(cep: string): boolean {
  return cep.replace(/\D/g, "").length === 8;
}
