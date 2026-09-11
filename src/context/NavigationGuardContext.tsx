import { createContext, useContext, useRef, type ReactNode } from "react";

type Guard = ((to: string) => void) | null;

const NavigationGuardContext = createContext<{
  setGuard: (guard: Guard) => void;
  requestNavigation: (to: string) => boolean;
} | null>(null);

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const guardRef = useRef<Guard>(null);

  const setGuard = (guard: Guard) => {
    guardRef.current = guard;
  };

  const requestNavigation = (to: string) => {
    if (!guardRef.current) return false;
    guardRef.current(to);
    return true;
  };

  return (
    <NavigationGuardContext.Provider value={{ setGuard, requestNavigation }}>
      {children}
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) throw new Error("useNavigationGuard must be used within a NavigationGuardProvider");
  return ctx;
}
