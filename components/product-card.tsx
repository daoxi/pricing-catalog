import Link from "next/link";
import { FiArrowUpRight, FiBatteryCharging, FiCpu, FiHardDrive } from "react-icons/fi";

import { ProductImage } from "@/components/product-image";
import type { CatalogLayout, Product } from "@/lib/catalog-types";

interface ProductCardProps {
  product: Product;
  layout: CatalogLayout;
  isAuthenticated: boolean;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function ProductCard({ product, layout, isAuthenticated }: ProductCardProps) {
  const price = isAuthenticated ? product.priceAuthenticated : product.priceLoggedOut;
  const specsFirst = layout === "Specs First";
  const cardSpecs = [
    { label: "Memory", value: product.attributes.memory, Icon: FiHardDrive },
    { label: "Chipset", value: product.attributes.chipset, Icon: FiCpu },
    { label: "Battery", value: product.attributes.battery, Icon: FiBatteryCharging },
  ];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="relative aspect-[4/3] overflow-hidden border-b border-slate-100 bg-slate-50">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">{product.category}</span>
          {product.cardSet === "B" && (
            <span className="rounded-full bg-teal-700 px-2.5 py-1 text-xs font-bold text-white shadow-sm">Member only</span>
          )}
        </div>
        <ProductImage image={product.image} productTitle={product.title} />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-5">
          <h3 className="text-xl font-bold tracking-tight text-slate-950">{product.title}</h3>
          {product.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{product.description}</p>}
        </div>

        <div className={`mb-5 ${specsFirst ? "order-2" : "order-1"}`}>
          <p className="text-xs font-bold tracking-[0.14em] text-teal-700 uppercase">
            {isAuthenticated ? "Member price" : "Public price"}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-3xl font-black tracking-tight text-slate-950">{formatPrice(price)}</p>
            {isAuthenticated && product.priceAuthenticated < product.priceLoggedOut && (
              <p className="text-sm font-medium text-slate-400 line-through">{formatPrice(product.priceLoggedOut)}</p>
            )}
          </div>
          {isAuthenticated && product.priceAuthenticated < product.priceLoggedOut && (
            <p className="mt-1 text-xs font-semibold text-emerald-700">
              Save {formatPrice(product.priceLoggedOut - product.priceAuthenticated)}
            </p>
          )}
        </div>

        <dl className={`mb-6 space-y-3 border-y border-slate-100 py-4 ${specsFirst ? "order-1" : "order-2"}`}>
          {cardSpecs.map(({ label, value, Icon }) => (
            <div key={label} className="grid grid-cols-[20px_68px_1fr] items-start gap-2 text-sm">
              <Icon aria-hidden="true" className="mt-0.5 text-teal-700" />
              <dt className="font-semibold text-slate-500">{label}</dt>
              <dd className="text-right leading-5 font-medium text-slate-800">{value ?? "Not listed"}</dd>
            </div>
          ))}
        </dl>

        <Link
          href={`/products/${product.slug}`}
          className="order-3 mt-auto flex cursor-pointer items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-900 transition group-hover:bg-slate-950 group-hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        >
          View full details <FiArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
