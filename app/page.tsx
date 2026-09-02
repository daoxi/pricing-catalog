import { CatalogFilter } from "@/components/catalog-filter";
import { CmsErrorState } from "@/components/cms-error-state";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCatalogData } from "@/lib/contentful";

export const dynamic = "force-static";

export default async function HomePage() {
  const catalog = await getCatalogData();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-12 lg:px-8 lg:pt-20">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold tracking-[0.2em] text-teal-700 uppercase">Clear prices. Smart choices.</p>
            <h1 className="text-4xl leading-[1.08] font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              The right phone, at the right price.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Compare the essentials, find your fit, and log in to unlock member-only phones and pricing.
            </p>
          </div>
        </section>

        {catalog.status === "error" ? (
          <div className="px-4 sm:px-6"><CmsErrorState /></div>
        ) : (
          <CatalogFilter products={catalog.products} cmsLayouts={catalog.layouts} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
