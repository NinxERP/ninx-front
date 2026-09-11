import { useEffect, useState } from "react";

const PAGE_SIZE = 10;

export function usePagedList<T>(items: T[] | undefined) {
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    setPagina(1);
  }, [items]);

  const totalItens = items?.length ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / PAGE_SIZE));
  const paginados = items?.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE) ?? [];

  return { paginados, pagina, setPagina, totalPaginas, totalItens };
}
