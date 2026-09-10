import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}

export function Pagination({ paginaAtual, totalPaginas, totalItens, itemLabel, onPageChange }: PaginationProps) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-base text-muted-foreground">
      <span>
        {totalItens} {itemLabel}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={paginaAtual <= 1}
          onClick={() => onPageChange(paginaAtual - 1)}
        >
          <ChevronLeft />
        </Button>
        <span>
          {paginaAtual} / {totalPaginas}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={paginaAtual >= totalPaginas}
          onClick={() => onPageChange(paginaAtual + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
