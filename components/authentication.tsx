"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

// The demo credentials simulate authentication without a real identity service.
const DEMO_EMAIL = "demo@catalog.com";
const DEMO_PASSWORD = "pricing123";

// Store the session in the browser and notify this tab when login state changes.
const AUTH_STORAGE_KEY = "pricing-catalog-authenticated";
const AUTH_CHANGE_EVENT = "pricing-catalog-auth-change";

interface AuthenticationState {
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthenticationContext = createContext<AuthenticationState | null>(null);

// React subscribes to both same-tab changes and localStorage changes from other tabs.
function subscribeToAuthentication(onChange: () => void) {
  window.addEventListener(AUTH_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getAuthenticationSnapshot() {
  return window.localStorage.getItem(AUTH_STORAGE_KEY) === "true";
}

export function AuthenticationProvider({ children }: { children: ReactNode }) {
  // Public pricing is rendered during SSG, then React safely restores the browser session.
  const isAuthenticated = useSyncExternalStore(
    subscribeToAuthentication,
    getAuthenticationSnapshot,
    () => false,
  );

  // Successful demo logins are persisted so they survive refreshes and navigation.
  function login(email: string, password: string) {
    const isValid = email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;

    if (isValid) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, "true");
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }

    return isValid;
  }

  // Remove the stored session and update every authentication consumer immediately.
  function logout() {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }

  return (
    <AuthenticationContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthenticationContext.Provider>
  );
}

// Components use this hook instead of reading the context directly.
export function useAuthentication() {
  const authentication = useContext(AuthenticationContext);

  if (!authentication) {
    throw new Error("useAuthentication must be used within AuthenticationProvider.");
  }

  return authentication;
}

// The login form imports these values to prefill the mock account.
export const demoCredentials = {
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
};
