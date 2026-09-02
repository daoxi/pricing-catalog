import type { Metadata } from "next";

import { AuthenticationProvider } from "@/components/authentication";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PocketPrice | Smartphone catalog",
    template: "%s | PocketPrice",
  },
  description: "Compare smartphone prices and essential specifications.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 font-sans text-slate-950">
        <AuthenticationProvider>{children}</AuthenticationProvider>
      </body>
    </html>
  );
}
