"use client";

import { useState, useSyncExternalStore } from "react";
import { FiRefreshCw, FiSearch, FiSliders } from "react-icons/fi";

import { useAuthentication } from "@/components/authentication";
import { ProductCard } from "@/components/product-card";
import type { CatalogLayout, Product } from "@/lib/catalog-types";

// Layout selection is browser-only UI state that should survive page refreshes.
const LAYOUT_STORAGE_KEY = "pricing-catalog-layout";
const LAYOUT_CHANGE_EVENT = "pricing-catalog-layout-change";
const requiredLayouts: CatalogLayout[] = ["Price First", "Specs First"];
type SortOrder = "default" | "price-asc" | "price-desc";

function isCatalogLayout(value: string | null): value is CatalogLayout {
  return value === "Price First" || value === "Specs First";
}

function isSortOrder(value: string): value is SortOrder {
  return value === "default" || value === "price-asc" || value === "price-desc";
}

// Listen for layout changes made in this tab or another browser tab.
function subscribeToLayout(onChange: () => void) {
  window.addEventListener(LAYOUT_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(LAYOUT_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// Read localStorage through React's external-store API so hydration can keep the
// CMS layout in static HTML, then safely switch to the saved browser preference.
function useSavedLayout(defaultLayout: CatalogLayout) {
  return useSyncExternalStore(
    subscribeToLayout,
    () => {
      const storedLayout = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
      return isCatalogLayout(storedLayout) ? storedLayout : defaultLayout;
    },
    () => defaultLayout,
  );
}

interface CatalogFilterProps {
  products: Product[];
  cmsLayouts: CatalogLayout[];
}

export function CatalogFilter({ products, cmsLayouts }: CatalogFilterProps) {
  const { isAuthenticated } = useAuthentication();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const layout = useSavedLayout(cmsLayouts[0] ?? "Price First");

  // Include CMS options first, then add either required option if it is not published.
  const layouts = Array.from(new Set([...cmsLayouts, ...requiredLayouts]));
  const categories = Array.from(new Set(products.map((product) => product.category))).sort();
  const normalizedSearch = search.trim().toLowerCase();

  // Apply role visibility, category, and text search in one readable filter pass.
  const filteredProducts = products.filter((product) => {
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

  // Sort a copy so the filtered results and their original CMS order remain intact.
  const sortedProducts =
    sortOrder === "default"
      ? filteredProducts
      : [...filteredProducts].sort((firstProduct, secondProduct) => {
          const firstPrice = isAuthenticated ? firstProduct.priceAuthenticated : firstProduct.priceLoggedOut;
          const secondPrice = isAuthenticated ? secondProduct.priceAuthenticated : secondProduct.priceLoggedOut;
          const priceDifference = firstPrice - secondPrice;

          return sortOrder === "price-asc" ? priceDifference : -priceDifference;
        });

  const hasFilters = Boolean(search) || category !== "All";

  // Reset both filter controls to their initial values.
  function clearFilters() {
    setSearch("");
    setCategory("All");
  }

  // Update the cards immediately and remember the choice for the next visit.
  function changeLayout(nextLayout: CatalogLayout) {
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, nextLayout);
    window.dispatchEvent(new Event(LAYOUT_CHANGE_EVENT));
  }

  return (
    <section aria-labelledby="catalog-heading" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      {/* Catalog heading. */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold tracking-[0.16em] text-teal-700 uppercase">
            {isAuthenticated ? "Member catalog" : "Public catalog"}
          </p>
          <h2 id="catalog-heading" className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Find your next phone</h2>
        </div>
      </div>

      {/* Search, category, clear, and layout controls. */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
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

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-end sm:justify-end">
          <label className="block text-sm font-bold text-slate-700">
            Sort by
            <select
              value={sortOrder}
              onChange={(event) => {
                if (isSortOrder(event.target.value)) {
                  setSortOrder(event.target.value);
                }
              }}
              className="mt-2 w-full cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-normal outline-none transition focus:border-teal-600 focus:ring-3 focus:ring-teal-100 sm:w-52"
            >
              <option value="default">Default order</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </label>

          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-700"><FiSliders aria-hidden="true" /> Card layout</span>
            <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" aria-label="Product card layout">
              {layouts.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => changeLayout(option)}
                  aria-pressed={layout === option}
                  className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-bold transition sm:px-4 sm:text-sm ${
                    layout === option ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p aria-live="polite" className="mt-3 mb-8 text-sm font-medium text-slate-500">
        {filteredProducts.length} {filteredProducts.length === 1 ? "phone" : "phones"}
      </p>

      {/* Show matching cards, or a useful empty state when no products match. */}
      {filteredProducts.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sortedProducts.map((product) => (
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
