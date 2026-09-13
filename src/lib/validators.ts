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

// Desde julho de 2026 a Receita Federal emite CNPJ alfanumérico (IN RFB 2.229/2024):
// as 12 primeiras posições aceitam letras maiúsculas e números, e os 2 dígitos
// verificadores continuam numéricos. O cálculo abaixo vale para os dois formatos,
// porque um dígito convertido por (código ASCII − 48) é o próprio dígito.
export function validarCnpj(cnpj: string): boolean {
  const valor = cnpj.toUpperCase().replace(/[./-]/g, "");

  if (!/^[0-9A-Z]{12}\d{2}$/.test(valor) || /^(.)\1{13}$/.test(valor)) return false;

  const calcularDigito = (base: string) => {
    let soma = 0;
    let peso = 2;
    for (let i = base.length - 1; i >= 0; i--) {
      soma += (base.charCodeAt(i) - 48) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const digito1 = calcularDigito(valor.slice(0, 12));
  const digito2 = calcularDigito(valor.slice(0, 12) + digito1);

  return valor.endsWith(`${digito1}${digito2}`);
}

export function validarCep(cep: string): boolean {
  return cep.replace(/\D/g, "").length === 8;
}
