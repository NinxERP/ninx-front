import { useNavigate } from "react-router-dom";
import { Package, ShoppingCart, Users, BarChart3, CreditCard, Settings } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

const cards = [
  { to: "/mainpage/produtosestoque", icon: Package, title: "Produtos e Estoque", description: "Gerencie produtos e quantidades", ownerOnly: false },
  { to: "/mainpage/venda", icon: ShoppingCart, title: "Realizar Venda", description: "Abrir o ponto de venda", ownerOnly: false, highlight: true },
  { to: "/mainpage/clientes", icon: Users, title: "Meus Clientes", description: "Cadastro e fiado de clientes", ownerOnly: false },
  { to: "/mainpage/relatorios", icon: BarChart3, title: "Relatórios", description: "Vendas, financeiro e estoque", ownerOnly: true },
  { to: "/mainpage/assinatura", icon: CreditCard, title: "Minha Assinatura", description: "Plano e histórico de pagamentos", ownerOnly: true },
  { to: "/mainpage/gestao", icon: Settings, title: "Gestão", description: "Usuários, cargos, categorias, comércio", ownerOnly: true },
];

export function MainPage() {
  const { user } = useAuth();
  const { isOwnerOrHigher } = usePermissions();
  const navigate = useNavigate();

  return (
    <div className="scroll-styled flex h-full flex-col overflow-y-auto p-6">
      <h1 className="mb-1 text-2xl font-semibold">Olá, {user?.nome}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{user?.nomeComercio}</p>

      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards
          .filter((c) => !c.ownerOnly || isOwnerOrHigher)
          .map((c) => (
            <Card
              key={c.to}
              onClick={() => navigate(c.to)}
              className={`h-full cursor-pointer transition-colors hover:bg-accent ${c.highlight ? "ring-primary/40" : ""}`}
            >
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
