import { useState } from "react";
import { formatarMoedaMask, formatarNumero, parseMoeda } from "@/lib/currency";

export function useCurrencyInput(valorInicial = 0) {
  const [formatted, setFormatted] = useState(formatarNumero(valorInicial));
  const [value, setValue] = useState(valorInicial);

  const onInputChange = (raw: string) => {
    const mask = formatarMoedaMask(raw);
    setFormatted(mask);
    setValue(parseMoeda(mask));
  };

  const reset = (novoValor: number) => {
    setFormatted(formatarNumero(novoValor));
    setValue(novoValor);
  };

  return { formatted, value, onInputChange, reset };
}
