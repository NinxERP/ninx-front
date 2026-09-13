export function maskCpf(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

// Aceita o CNPJ alfanumérico: letras e números nas 12 primeiras posições,
// somente números nos 2 dígitos verificadores.
export function maskCnpj(value: string): string {
  const limpo = value.toUpperCase().replace(/[^0-9A-Z]/g, "");
  const base = limpo.slice(0, 12);
  const digitos = limpo.slice(12).replace(/\D/g, "").slice(0, 2);

  return (base + digitos)
    .replace(/^(\w{2})(\w)/, "$1.$2")
    .replace(/^(\w{2}\.\w{3})(\w)/, "$1.$2")
    .replace(/^(\w{2}\.\w{3}\.\w{3})(\w)/, "$1/$2")
    .replace(/^(\w{2}\.\w{3}\.\w{3}\/\w{4})(\w)/, "$1-$2");
}

export function maskCep(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function maskTelefone(value: string): string {
  const digitos = value.replace(/\D/g, "").slice(0, 11);
  if (digitos.length <= 10) {
    return digitos.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digitos.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export function maskNumerico(value: string): string {
  return value.replace(/\D/g, "");
}

export const UF_ITEMS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
].map((uf) => ({ value: uf, label: uf }));
