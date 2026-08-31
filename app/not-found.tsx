import Link from "next/link";
import { FiArrowLeft, FiSearch } from "react-icons/fi";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-16 sm:px-6">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <FiSearch aria-hidden="true" className="mx-auto mb-5 text-4xl text-teal-700" />
          <p className="text-xs font-bold tracking-[0.18em] text-teal-700 uppercase">404 error</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Product not found</h1>
          <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">That product link is invalid or the phone is no longer in the catalog.</p>
          <Link href="/" className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600">
            <FiArrowLeft aria-hidden="true" /> Back to catalog
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
