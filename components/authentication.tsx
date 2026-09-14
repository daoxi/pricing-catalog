"use client";

import {
	createContext,
	startTransition,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";

// The demo credentials simulate authentication without a real identity service.
const DEMO_EMAIL = "demo@catalog.com";
const DEMO_PASSWORD = "pricing123";

// Store the demo session in the browser so it survives page refreshes.
const AUTH_STORAGE_KEY = "pricing-catalog-authenticated";

interface AuthenticationState {
	isAuthenticated: boolean;
	login: (email: string, password: string) => boolean;
	logout: () => void;
}

const AuthenticationContext = createContext<AuthenticationState | null>(null);

export function AuthenticationProvider({ children }: { children: ReactNode }) {
	// Start logged out so the server and browser render the same HTML during hydration.
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	// Restore the saved browser session after hydration as a non-urgent update.
	useEffect(() => {
		const hasSavedSession =
			window.localStorage.getItem(AUTH_STORAGE_KEY) === "true";

		if (hasSavedSession) {
			startTransition(() => setIsAuthenticated(true)); // startTransition will mark it as non-urgent
		}
	}, []);

	// Successful demo logins are persisted so they survive refreshes and navigation.
	function login(email: string, password: string) {
		const isValid =
			email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;

		if (isValid) {
			setIsAuthenticated(true);
			window.localStorage.setItem(AUTH_STORAGE_KEY, "true");
		}

		return isValid;
	}

	// Remove the stored session and update every authentication consumer immediately.
	function logout() {
		setIsAuthenticated(false);
		window.localStorage.removeItem(AUTH_STORAGE_KEY);
	}

	return (
		<AuthenticationContext.Provider value={{ isAuthenticated, login, logout }}>
			{children}
		</AuthenticationContext.Provider>
	);
}

// Centralize context access so consumers get a typed authentication value and a clear error if they are rendered outside AuthenticationProvider.
export function useAuthentication() {
	const authentication = useContext(AuthenticationContext);

	if (!authentication) {
		throw new Error(
			"useAuthentication must be used within AuthenticationProvider.",
		);
	}

	return authentication;
}

// The login form imports these values to prefill the mock account.
export const demoCredentials = {
	email: DEMO_EMAIL,
	password: DEMO_PASSWORD,
};
