export function formatarMoedaMask(valorDigitado: string): string {
  let digits = valorDigitado.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length > 10) digits = digits.slice(-10);

  if (digits.length === 0) return "0,00";
  if (digits.length === 1) return `0,0${digits}`;
  if (digits.length === 2) return `0,${digits}`;

  const decimais = digits.slice(-2);
  const inteiro = Number(digits.slice(0, -2)).toLocaleString("pt-BR");

  return `${inteiro},${decimais}`;
}

export function parseMoeda(valor: string): number {
  if (!valor) return 0;
  const normalizado = valor.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalizado);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatarNumero(valor: number): string {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
