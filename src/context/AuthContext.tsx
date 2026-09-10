import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, setAuthToken, setUnauthorizedHandler } from "@/services/api/client";
import { decodeJwt } from "@/lib/jwt";
import { buscarComerciosDoUsuario } from "@/services/comercio";
import type { ComercioResponse, ComercioSimplificado, LoginResponse } from "@/types";

interface RawJwtClaims {
  usuarioId: string;
  nome: string;
  email: string;
  comercioId: string;
  cargoId: string;
  cargoNome: string;
  cargoPeso: string;
  nomeComercio: string;
  admin: string;
}

export interface SessionUser {
  usuarioId: number;
  nome: string;
  email: string;
  comercioId: number;
  cargoId: number;
  cargoNome: string;
  cargoPeso: number;
  nomeComercio: string;
  admin: boolean;
}

function parseClaims(token: string): SessionUser {
  const raw = decodeJwt<RawJwtClaims>(token);
  return {
    usuarioId: Number(raw.usuarioId),
    nome: raw.nome,
    email: raw.email,
    comercioId: Number(raw.comercioId),
    cargoId: Number(raw.cargoId),
    cargoNome: raw.cargoNome,
    cargoPeso: Number(raw.cargoPeso),
    nomeComercio: raw.nomeComercio,
    admin: raw.admin === "True",
  };
}

interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
  availableComercios: ComercioResponse[];
  login: (email: string, senha: string, comercioID?: number) => Promise<ComercioSimplificado[] | null>;
  trocarComercio: (comercioId: number) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [availableComercios, setAvailableComercios] = useState<ComercioResponse[]>([]);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setAvailableComercios([]);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const applyToken = (token: string) => {
    setAuthToken(token);
    const sessionUser = parseClaims(token);
    setUser(sessionUser);
    buscarComerciosDoUsuario(sessionUser.usuarioId)
      .then(setAvailableComercios)
      .catch(() => setAvailableComercios([]));
  };

  const login = useCallback(async (email: string, senha: string, comercioID?: number) => {
    const response = await api.post<LoginResponse>("/api/Login", { email, senha, comercioID });

    if (response.token) {
      applyToken(response.token);
      return null;
    }

    if (response.comercios && response.comercios.length > 0) {
      return response.comercios;
    }

    throw new Error("Não foi possível autenticar.");
  }, []);

  const trocarComercio = useCallback(async (comercioId: number) => {
    const response = await api.post<{ token: string }>(`/api/TrocarComercio/${comercioId}`);
    applyToken(response.token);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, availableComercios, login, trocarComercio, logout }),
    [user, availableComercios, login, trocarComercio, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
