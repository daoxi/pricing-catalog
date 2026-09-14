"use client";

import { startTransition, useEffect, useState } from "react";
import { FiChevronDown, FiDollarSign, FiGrid, FiRefreshCw, FiSearch } from "react-icons/fi";

import { useAuthentication } from "@/components/authentication";
import { ProductCard } from "@/components/product-card";
import type { CatalogLayout, Product } from "@/lib/catalog-types";

// Layout selection is browser-only UI state that should survive page refreshes.
const LAYOUT_STORAGE_KEY = "pricing-catalog-layout";
const requiredLayouts: CatalogLayout[] = ["Price First", "Specs First"];
type SortOrder = "default" | "price-asc" | "price-desc";

function isCatalogLayout(value: string | null): value is CatalogLayout {
  return value === "Price First" || value === "Specs First";
}

function isSortOrder(value: string): value is SortOrder {
  return value === "default" || value === "price-asc" || value === "price-desc";
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
  // Start with the CMS layout so the server and browser render the same HTML.
  const [layout, setLayout] = useState<CatalogLayout>(cmsLayouts[0] ?? "Price First");

  // After hydration, restore a valid saved browser preference as a non-urgent update.
  useEffect(() => {
    const storedLayout = window.localStorage.getItem(LAYOUT_STORAGE_KEY);

    if (isCatalogLayout(storedLayout)) {
      startTransition(() => setLayout(storedLayout)); // startTransition will mark it as non-urgent
    }
  }, []);

  // Keep published CMS layouts in their original order, then ensure both supported
  // layouts are available. Set removes duplicates when the CMS already includes them.
  const layouts = Array.from(new Set([...cmsLayouts, ...requiredLayouts]));

  // Extract the category from every product, remove duplicate names, and sort the
  // remaining categories alphabetically for the filter menu.
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

		// Create all the available text from product details to be searched  
    const searchableText = [
      product.title,
      product.description,
      product.category,
      product.attributes.memory,
      product.attributes.chipset,
      product.attributes.battery,
    ]
      .filter(Boolean) // .filter(Boolean) is used to remove null and undefined values from an array.
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

  // State updates the cards immediately; localStorage remembers the next visit.
  function changeLayout(nextLayout: CatalogLayout) {
    setLayout(nextLayout);
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, nextLayout);
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

      {/* Search and category filters. */}
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

      </div>

      {/* Result count and presentation controls sit outside the filter card. */}
      <div className="my-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p aria-live="polite" className="text-sm font-semibold text-slate-600">
          <span className="text-slate-950">{filteredProducts.length}</span>{" "}
          {filteredProducts.length === 1 ? "phone" : "phones"} found
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6 md:ml-auto md:justify-end">
          <label className="group block lg:flex lg:items-center lg:gap-3">
            <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold tracking-[0.08em] text-slate-600 uppercase">
              <FiDollarSign aria-hidden="true" className="text-teal-700" /> Sort by price
            </span>
            <span className="relative mt-2 block lg:mt-0">
              <select
                value={sortOrder}
                onChange={(event) => {
                  if (isSortOrder(event.target.value)) {
                    setSortOrder(event.target.value);
                  }
                }}
                className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white pr-10 pl-4 text-sm font-semibold text-slate-900 outline-none transition hover:border-slate-400 hover:bg-slate-50 focus:border-teal-600 focus:ring-3 focus:ring-teal-100 sm:w-52"
              >
                <option value="default">Default order</option>
                <option value="price-asc">Low to high</option>
                <option value="price-desc">High to low</option>
              </select>
              <FiChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-teal-700"
              />
            </span>
          </label>

          <div className="lg:flex lg:items-center lg:gap-3">
            <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-bold tracking-[0.08em] text-slate-600 uppercase">
              <FiGrid aria-hidden="true" className="text-teal-700" /> Card layout
            </span>
            <div className="mt-2 flex gap-2 lg:mt-0" role="group" aria-label="Product card layout">
              {layouts.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => changeLayout(option)}
                  aria-pressed={layout === option}
                  className={`h-11 cursor-pointer rounded-xl border px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                    layout === option
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

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
