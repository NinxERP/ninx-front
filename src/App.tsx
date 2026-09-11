import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { UpdaterProvider } from "@/context/UpdaterContext";
import { NavigationGuardProvider } from "@/context/NavigationGuardContext";
import { RequireAuth } from "@/routes/RequireAuth";
import { RequireOwner } from "@/routes/RequireOwner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Login } from "@/pages/Login";
import { AppUpdateGate } from "@/components/AppUpdateGate";

const ForgotPassword = lazy(() => import("@/pages/ForgotPassword").then((m) => ({ default: m.ForgotPassword })));
const MainPage = lazy(() => import("@/pages/MainPage").then((m) => ({ default: m.MainPage })));
const Management = lazy(() => import("@/pages/Management").then((m) => ({ default: m.Management })));
const CategoriaProdutoGestao = lazy(() =>
  import("@/pages/gestao/CategoriaProdutoGestao").then((m) => ({ default: m.CategoriaProdutoGestao })),
);
const CargoGestao = lazy(() => import("@/pages/gestao/CargoGestao").then((m) => ({ default: m.CargoGestao })));
const ComercioGestao = lazy(() => import("@/pages/gestao/ComercioGestao").then((m) => ({ default: m.ComercioGestao })));
const UsuariosGestao = lazy(() => import("@/pages/gestao/UsuariosGestao").then((m) => ({ default: m.UsuariosGestao })));
const MinhaAssinatura = lazy(() => import("@/pages/MinhaAssinatura").then((m) => ({ default: m.MinhaAssinatura })));
const ProdutoEstoque = lazy(() => import("@/pages/ProdutoEstoque").then((m) => ({ default: m.ProdutoEstoque })));
const Cliente = lazy(() => import("@/pages/Cliente").then((m) => ({ default: m.Cliente })));
const Venda = lazy(() => import("@/pages/Venda").then((m) => ({ default: m.Venda })));
const Relatorio = lazy(() => import("@/pages/Relatorio").then((m) => ({ default: m.Relatorio })));

const queryClient = new QueryClient();

function PageFallback() {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Carregando...</div>;
}

function AppShell() {
  const { theme } = useTheme();

  return (
    <>
      <HashRouter>
        <NavigationGuardProvider>
          <div className="h-screen w-screen overflow-hidden">
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                <Route element={<RequireAuth />}>
                  <Route element={<AppLayout />}>
                    <Route path="/mainpage" element={<MainPage />} />
                    <Route path="/mainpage/produtosestoque" element={<ProdutoEstoque />} />
                    <Route path="/mainpage/clientes" element={<Cliente />} />
                    <Route path="/mainpage/venda" element={<Venda />} />

                    <Route element={<RequireOwner />}>
                      <Route path="/mainpage/relatorios" element={<Relatorio />} />
                      <Route path="/mainpage/gestao" element={<Management />} />
                      <Route path="/mainpage/gestao/categoria-produto" element={<CategoriaProdutoGestao />} />
                      <Route path="/mainpage/gestao/cargos" element={<CargoGestao />} />
                      <Route path="/mainpage/gestao/comercio" element={<ComercioGestao />} />
                      <Route path="/mainpage/gestao/usuarios" element={<UsuariosGestao />} />
                      <Route path="/mainpage/assinatura" element={<MinhaAssinatura />} />
                    </Route>
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </div>
          <AppUpdateGate />
        </NavigationGuardProvider>
      </HashRouter>
      <Toaster
        richColors
        expand
        visibleToasts={3}
        theme={theme}
        position="top-right"
        duration={4000}
        toastOptions={{
          classNames: {
            toast: "rounded-xl border shadow-lg font-sans",
            title: "text-sm font-medium",
            description: "text-sm opacity-90",
          },
        }}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UpdaterProvider>
        <AuthProvider>
          <ThemeProvider>
            <AppShell />
          </ThemeProvider>
        </AuthProvider>
      </UpdaterProvider>
    </QueryClientProvider>
  );
}

export default App;
