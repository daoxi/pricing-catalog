"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const AUTH_STORAGE_KEY = "pricing-catalog-authenticated";
const DEMO_EMAIL = "demo@catalog.com";
const DEMO_PASSWORD = "pricing123";

interface CatalogSession {
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const CatalogSessionContext = createContext<CatalogSession | null>(null);
const authListeners = new Set<() => void>();

function emitAuthChange() {
  authListeners.forEach((listener) => listener());
}

function subscribeToAuth(listener: () => void) {
  authListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === AUTH_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    authListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function getAuthSnapshot() {
  return window.localStorage.getItem(AUTH_STORAGE_KEY) === "true";
}

function getServerAuthSnapshot() {
  return false;
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useSyncExternalStore(
    subscribeToAuth,
    getAuthSnapshot,
    getServerAuthSnapshot,
  );

  const session = useMemo<CatalogSession>(
    () => ({
      isAuthenticated,
      login(email, password) {
        const isValid = email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;

        if (isValid) {
          window.localStorage.setItem(AUTH_STORAGE_KEY, "true");
          emitAuthChange();
        }

        return isValid;
      },
      logout() {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        emitAuthChange();
      },
    }),
    [isAuthenticated],
  );

  return <CatalogSessionContext.Provider value={session}>{children}</CatalogSessionContext.Provider>;
}

export function useCatalogSession() {
  const session = useContext(CatalogSessionContext);

  if (!session) {
    throw new Error("useCatalogSession must be used within CatalogProvider.");
  }

  return session;
}

export const demoCredentials = {
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
};
