import { useNavigate } from "react-router-dom";
import { UserCog, Shield, Tag, Store, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const cards = [
  { to: "/mainpage/gestao/usuarios", icon: UserCog, title: "Usuários", description: "Equipe e vínculos por comércio" },
  { to: "/mainpage/gestao/cargos", icon: Shield, title: "Cargos", description: "Hierarquia de permissões" },
  { to: "/mainpage/gestao/categoria-produto", icon: Tag, title: "Categorias de Produto", description: "Organização do catálogo" },
  { to: "/mainpage/gestao/comercio", icon: Store, title: "Comércio", description: "Dados e limite de crédito padrão" },
];

export function Management() {
  const navigate = useNavigate();

  return (
    <div className="scroll-styled flex h-full flex-col overflow-y-auto p-6">
      <Button variant="ghost" size="sm" className="mb-4 w-fit" onClick={() => navigate("/mainpage")}>
        <ArrowLeft /> Voltar
      </Button>
      <h1 className="mb-6 text-2xl font-semibold">Gestão</h1>

      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.to} onClick={() => navigate(c.to)} className="h-full cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="flex h-full flex-col items-center justify-center gap-1 text-center">
              <c.icon className="mb-3 size-16 text-primary" />
              <CardTitle className="text-2xl">{c.title}</CardTitle>
              <CardDescription className="text-lg">{c.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
