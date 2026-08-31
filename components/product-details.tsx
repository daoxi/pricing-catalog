"use client";

import Link from "next/link";
import { FiArrowLeft, FiLock } from "react-icons/fi";

import { useCatalogSession } from "@/components/catalog-provider";
import { ProductImage } from "@/components/product-image";
import type { Product } from "@/lib/catalog-types";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function ProductDetails({ product }: { product: Product }) {
  const { isAuthenticated } = useCatalogSession();

  if (product.cardSet === "B" && !isAuthenticated) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-16 sm:px-6">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FiLock aria-hidden="true" className="mx-auto mb-4 text-3xl text-teal-700" />
          <h1 className="text-2xl font-bold text-slate-950">This phone is part of the member catalog</h1>
          <p className="mt-3 text-slate-600">Log in with the demo account to view its details and authenticated price.</p>
          <Link href="/" className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
            <FiArrowLeft aria-hidden="true" /> Back to catalog
          </Link>
        </section>
      </main>
    );
  }

  const price = isAuthenticated ? product.priceAuthenticated : product.priceLoggedOut;
  const specifications = [
    ["Weight", product.attributes.weight],
    ["Build", product.attributes.build],
    ["Resolution", product.attributes.resolution],
    ["Chipset", product.attributes.chipset],
    ["Memory", product.attributes.memory],
    ["Headphone jack", product.attributes.headphoneJack],
    ["Battery", product.attributes.battery],
    ["Repairability", product.attributes.repairability],
  ];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link href="/" className="mb-6 inline-flex cursor-pointer items-center gap-2 rounded-lg text-sm font-bold text-slate-600 transition hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">
        <FiArrowLeft aria-hidden="true" /> Back to catalog
      </Link>

      <article className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-2">
        <div className="relative min-h-80 border-b border-slate-100 bg-slate-50 sm:min-h-120 lg:border-r lg:border-b-0">
          <ProductImage image={product.image} productTitle={product.title} priority />
        </div>
        <div className="p-6 sm:p-10 lg:p-12">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{product.category}</span>
            {product.cardSet === "B" && <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">Member only</span>}
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{product.title}</h1>
          {product.description && <p className="mt-4 leading-7 text-slate-600">{product.description}</p>}

          <div className="my-8 rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-xs font-bold tracking-[0.15em] text-teal-300 uppercase">{isAuthenticated ? "Member price" : "Public price"}</p>
            <div className="mt-1 flex items-baseline gap-3">
              <p className="text-4xl font-black tracking-tight">{formatPrice(price)}</p>
              {isAuthenticated && product.priceAuthenticated < product.priceLoggedOut && (
                <p className="text-slate-400 line-through">{formatPrice(product.priceLoggedOut)}</p>
              )}
            </div>
          </div>

          <section aria-labelledby="specifications-heading">
            <h2 id="specifications-heading" className="text-xl font-bold text-slate-950">Full specifications</h2>
            <dl className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
              {specifications.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[120px_1fr] gap-4 py-3.5 text-sm sm:grid-cols-[150px_1fr]">
                  <dt className="font-semibold text-slate-500">{label}</dt>
                  <dd className="text-right font-medium text-slate-900">{value ?? "Not listed"}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </article>
    </main>
  );
}
