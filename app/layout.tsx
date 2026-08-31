import type { Metadata } from "next";

import { CatalogProvider } from "@/components/catalog-provider";

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
        <CatalogProvider>{children}</CatalogProvider>
      </body>
    </html>
  );
}
