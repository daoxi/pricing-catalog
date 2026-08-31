"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { FiRefreshCw, FiSearch, FiSliders } from "react-icons/fi";

import { useCatalogSession } from "@/components/catalog-provider";
import { ProductCard } from "@/components/product-card";
import type { CatalogLayout, Product } from "@/lib/catalog-types";

const LAYOUT_STORAGE_KEY = "pricing-catalog-layout";
const requiredLayouts: CatalogLayout[] = ["Price First", "Specs First"];
const layoutListeners = new Set<() => void>();

function isCatalogLayout(value: string | null): value is CatalogLayout {
  return value === "Price First" || value === "Specs First";
}

function subscribeToLayout(listener: () => void) {
  layoutListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === LAYOUT_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    layoutListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function setStoredLayout(layout: CatalogLayout) {
  window.localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
  layoutListeners.forEach((listener) => listener());
}

function useStoredLayout(defaultLayout: CatalogLayout) {
  return useSyncExternalStore(
    subscribeToLayout,
    () => {
      const storedLayout = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
      return isCatalogLayout(storedLayout) ? storedLayout : defaultLayout;
    },
    () => defaultLayout,
  );
}

interface CatalogBrowserProps {
  products: Product[];
  cmsLayouts: CatalogLayout[];
}

export function CatalogBrowser({ products, cmsLayouts }: CatalogBrowserProps) {
  const { isAuthenticated } = useCatalogSession();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const defaultLayout = cmsLayouts[0] ?? "Price First";
  const layout = useStoredLayout(defaultLayout);
  const layouts = Array.from(new Set([...cmsLayouts, ...requiredLayouts]));

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      if (product.cardSet === "B" && !isAuthenticated) {
        return false;
      }

      if (category !== "All" && product.category !== category) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        product.title,
        product.description,
        product.category,
        product.attributes.memory,
        product.attributes.chipset,
        product.attributes.battery,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [category, isAuthenticated, products, search]);

  const hasFilters = Boolean(search) || category !== "All";

  function clearFilters() {
    setSearch("");
    setCategory("All");
  }

  return (
    <section aria-labelledby="catalog-heading" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold tracking-[0.16em] text-teal-700 uppercase">
            {isAuthenticated ? "Member catalog" : "Public catalog"}
          </p>
          <h2 id="catalog-heading" className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Find your next phone</h2>
        </div>
        <p aria-live="polite" className="text-sm font-medium text-slate-500">
          {filteredProducts.length} {filteredProducts.length === 1 ? "phone" : "phones"}
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px_auto] lg:items-end">
          <label className="block text-sm font-bold text-slate-700">
            Search phones
            <span className="relative mt-2 block">
              <FiSearch aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search model or spec"
                className="w-full rounded-xl border border-slate-300 py-3 pr-4 pl-10 font-normal outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-3 focus:ring-teal-100"
              />
            </span>
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-2 w-full cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal outline-none transition focus:border-teal-600 focus:ring-3 focus:ring-teal-100"
            >
              <option value="All">All phones</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
          >
            <FiRefreshCw aria-hidden="true" /> Clear filters
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiSliders aria-hidden="true" /> Card layout</span>
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" aria-label="Product card layout">
            {layouts.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStoredLayout(option)}
                aria-pressed={layout === option}
                className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-bold transition sm:px-4 sm:text-sm ${
                  layout === option ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} layout={layout} isAuthenticated={isAuthenticated} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
          <FiSearch aria-hidden="true" className="mx-auto mb-4 text-3xl text-slate-400" />
          <h3 className="text-xl font-bold text-slate-950">No phones match your search</h3>
          <p className="mt-2 text-slate-600">Try a different term or clear your filters to see every available phone.</p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 cursor-pointer rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </section>
  );
}
