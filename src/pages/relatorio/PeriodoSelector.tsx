import { useRef, useState } from "react";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Periodo } from "@/services/relatorio";

function isoData(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function dataBr(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function hoje(): Periodo {
  const hoje = new Date();
  return { inicio: isoData(hoje), fim: isoData(hoje) };
}

function ultimosDias(dias: number): Periodo {
  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - dias);
  return { inicio: isoData(inicio), fim: isoData(fim) };
}

function mesAtual(): Periodo {
  const agora = new Date();
  return { inicio: isoData(new Date(agora.getFullYear(), agora.getMonth(), 1)), fim: isoData(agora) };
}

function anoAtual(): Periodo {
  const agora = new Date();
  return { inicio: isoData(new Date(agora.getFullYear(), 0, 1)), fim: isoData(agora) };
}

const PRESETS: { label: string; get: () => Periodo }[] = [
  { label: "Hoje", get: hoje },
  { label: "7 dias", get: () => ultimosDias(7) },
  { label: "30 dias", get: () => ultimosDias(30) },
  { label: "Mês atual", get: mesAtual },
  { label: "Ano atual", get: anoAtual },
];

function mesmoPeriodo(a: Periodo, b: Periodo): boolean {
  return a.inicio === b.inicio && a.fim === b.fim;
}

export function PeriodoSelector({ periodo, onChange }: { periodo: Periodo; onChange: (p: Periodo) => void }) {
  const presetAtivo = PRESETS.find((preset) => mesmoPeriodo(preset.get(), periodo));
  const [modoCustom, setModoCustom] = useState(false);
  const exibirCustom = modoCustom || !presetAtivo;
  const fimRef = useRef<HTMLInputElement>(null);
  const rotulo =
    !modoCustom && presetAtivo
      ? presetAtivo.label
      : periodo.inicio && periodo.fim
        ? `${dataBr(periodo.inicio)} – ${dataBr(periodo.fim)}`
        : "Selecionar período";

  return (
    <Popover>
      <PopoverTrigger render={<Button type="button" variant="outline" size="sm" className="gap-2" />}>
        <CalendarRange className="size-4" />
        {rotulo}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex flex-col gap-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setModoCustom(false);
                onChange(preset.get());
              }}
              className={cn(
                "rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                !modoCustom && presetAtivo?.label === preset.label && "bg-accent font-medium",
              )}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setModoCustom(true);
              onChange(periodo);
            }}
            className={cn(
              "rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
              exibirCustom && "bg-accent font-medium",
            )}
          >
            Personalizado
          </button>
        </div>
        {exibirCustom && (
          <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t pt-2">
            <input
              type="date"
              className="w-full min-w-0 rounded-md border bg-background px-2 py-1 text-sm"
              value={periodo.inicio ?? ""}
              max={periodo.fim}
              onChange={(e) => {
                if (!periodo.inicio && e.target.value) fimRef.current?.focus();
                onChange({ ...periodo, inicio: e.target.value });
              }}
            />
            <span className="text-sm text-muted-foreground">até</span>
            <input
              ref={fimRef}
              type="date"
              className="w-full min-w-0 rounded-md border bg-background px-2 py-1 text-sm"
              value={periodo.fim ?? ""}
              min={periodo.inicio}
              onChange={(e) => onChange({ ...periodo, fim: e.target.value })}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { ultimosDias };
