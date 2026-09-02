"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { FiLogIn, FiLogOut, FiShield, FiX } from "react-icons/fi";

import { demoCredentials, useAuthentication } from "@/components/authentication";

export function SiteHeader() {
  const { isAuthenticated, login, logout } = useAuthentication();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState(demoCredentials.email);
  const [password, setPassword] = useState(demoCredentials.password);
  const [error, setError] = useState("");

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!login(email, password)) {
      setError("Those credentials do not match the demo account.");
      return;
    }

    setError("");
    setIsLoginOpen(false);
  }

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">
            <span className="block text-3xl font-bold text-slate-950">Pricing Catalog</span>
            <span className="block text-lg font-semibold text-teal-700">Browse smartphone prices</span>
          </Link>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <span className="hidden items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 sm:flex">
                  <FiShield aria-hidden="true" /> Member pricing
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                >
                  <FiLogOut aria-hidden="true" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                <FiLogIn aria-hidden="true" /> Log in
              </button>
            )}
          </div>
        </div>
      </header>

      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close login"
            onClick={() => setIsLoginOpen(false)}
            className="absolute inset-0 cursor-pointer bg-slate-950/55 backdrop-blur-sm"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              aria-label="Close login"
              onClick={() => setIsLoginOpen(false)}
              className="absolute top-4 right-4 cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-600"
            >
              <FiX aria-hidden="true" />
            </button>
            <div className="mb-6 pr-10">
              <p className="mb-2 text-xs font-bold tracking-[0.16em] text-teal-700 uppercase">Account Login</p>
              <h2 id="login-title" className="text-2xl font-bold tracking-tight text-slate-950">Unlock member offers</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Use the prefilled demo credentials to view authenticated pricing.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <label className="block text-sm font-semibold text-slate-800">
                Email
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3.5 py-3 font-normal outline-none transition focus:border-teal-600 focus:ring-3 focus:ring-teal-100"
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-slate-800">
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3.5 py-3 font-normal outline-none transition focus:border-teal-600 focus:ring-3 focus:ring-teal-100"
                  required
                />
              </label>
              {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
              <button
                type="submit"
                className="w-full cursor-pointer rounded-lg bg-teal-700 px-4 py-3 font-bold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                View member pricing
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
