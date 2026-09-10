import { Button } from "@/components/ui/button";
import type { Periodo } from "@/services/relatorio";

function isoData(data: Date): string {
  return data.toISOString().slice(0, 10);
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

export function PeriodoSelector({ periodo, onChange }: { periodo: Periodo; onChange: (p: Periodo) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => (
        <Button key={preset.label} variant="outline" size="sm" onClick={() => onChange(preset.get())}>
          {preset.label}
        </Button>
      ))}
      <input
        type="date"
        className="rounded-md border bg-background px-2 py-1 text-sm"
        value={periodo.inicio ?? ""}
        onChange={(e) => onChange({ ...periodo, inicio: e.target.value })}
      />
      <span className="text-sm text-muted-foreground">até</span>
      <input
        type="date"
        className="rounded-md border bg-background px-2 py-1 text-sm"
        value={periodo.fim ?? ""}
        onChange={(e) => onChange({ ...periodo, fim: e.target.value })}
      />
    </div>
  );
}

export { ultimosDias };
