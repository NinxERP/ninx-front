import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  CreditCard,
  UserCog,
  Shield,
  Tag,
  Store,
  Moon,
  Sun,
  LogOut,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useTheme } from "@/context/ThemeContext";
import { useNavigationGuard } from "@/context/NavigationGuardContext";
import { TrocarComercioDialog } from "@/components/layout/TrocarComercioDialog";

const navItemClass =
  "flex items-center gap-3 rounded-md px-3 py-2.5 text-base text-muted-foreground hover:bg-accent hover:text-foreground [&.active]:bg-accent [&.active]:text-foreground [&.active]:font-semibold";

function Item({ to, icon: Icon, label }: { to: string; icon: typeof Home; label: string }) {
  const { requestNavigation } = useNavigationGuard();

  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) => cn(navItemClass, isActive && "active")}
      onClick={(e) => {
        if (requestNavigation(to)) e.preventDefault();
      }}
    >
      <Icon className="size-5 shrink-0" />
      {label}
    </NavLink>
  );
}

export function Sidebar() {
  const { user, logout, availableComercios } = useAuth();
  const { isOwnerOrHigher } = usePermissions();
  const { theme, toggleTheme } = useTheme();
  const [trocarComercioAberto, setTrocarComercioAberto] = useState(false);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-card">
      <div className="flex items-center gap-3 border-b px-4 py-4">
        <img src="/images/nina_logo_clean.png" alt="Ninx" className="size-11 shrink-0 rounded-full bg-white p-0.5 object-contain" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold">Ninx</p>
          <p className="truncate text-sm text-muted-foreground">{user?.nomeComercio}</p>
        </div>
        {availableComercios.length > 1 && (
          <button
            type="button"
            onClick={() => setTrocarComercioAberto(true)}
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Trocar comércio"
          >
            <ArrowLeftRight className="size-4" />
          </button>
        )}
      </div>
      <TrocarComercioDialog open={trocarComercioAberto} onOpenChange={setTrocarComercioAberto} />

      <nav className="scroll-styled flex-1 space-y-1 overflow-y-auto p-3">
        <Item to="/mainpage" icon={Home} label="Início" />
        <Item to="/mainpage/produtosestoque" icon={Package} label="Produtos e Estoque" />
        <Item to="/mainpage/venda" icon={ShoppingCart} label="Realizar Venda" />
        <Item to="/mainpage/clientes" icon={Users} label="Meus Clientes" />

        {isOwnerOrHigher && (
          <>
            <p className="px-3 pt-5 pb-1 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Gestão
            </p>
            <Item to="/mainpage/relatorios" icon={BarChart3} label="Relatórios" />
            <Item to="/mainpage/assinatura" icon={CreditCard} label="Minha Assinatura" />
            <Item to="/mainpage/gestao/usuarios" icon={UserCog} label="Usuários" />
            <Item to="/mainpage/gestao/cargos" icon={Shield} label="Cargos" />
            <Item to="/mainpage/gestao/categoria-produto" icon={Tag} label="Categorias" />
            <Item to="/mainpage/gestao/comercio" icon={Store} label="Comércio" />
          </>
        )}
      </nav>

      <div className="flex items-center justify-between border-t p-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Alternar tema"
        >
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-base text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <LogOut className="size-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
