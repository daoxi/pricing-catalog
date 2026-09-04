import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Shared page sections and the Contentful-backed catalog query used by this route.
import { CmsErrorState } from "@/components/cms-error-state";
import { ProductDetails } from "@/components/product-details";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCatalogData } from "@/lib/contentful";

// Next.js supplies the dynamic [slug] route parameter as a promise to server pages.
interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Build product pages ahead of time and reject slugs that were not returned below.
export const dynamic = "force-static";
export const dynamicParams = false;

// Tell Next.js which product URLs to pre-render from the current catalog entries.
export async function generateStaticParams() {
  const catalog = await getCatalogData();

  // Avoid generating incomplete product routes when Contentful cannot be reached.
  if (catalog.status === "error") {
    return [];
  }

  return catalog.products.map((product) => ({ slug: product.slug }));
}

// Generate search and browser metadata that matches the requested product.
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getCatalogData();

  // Use a clear fallback title when product metadata cannot be loaded from the CMS.
  if (catalog.status === "error") {
    return { title: "Catalog unavailable" };
  }

  // Use product content when the slug exists, or describe the missing route otherwise.
  const product = catalog.products.find((item) => item.slug === slug);
  return product
    ? { title: product.title, description: product.description }
    : { title: "Product not found" };
}

// Resolve the requested product and render its complete server-generated page.
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const catalog = await getCatalogData();

  // Keep the site shell visible while presenting a dedicated CMS failure state.
  if (catalog.status === "error") {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-4"><CmsErrorState /></main>
        <SiteFooter />
      </div>
    );
  }

  const product = catalog.products.find((item) => item.slug === slug);

  // Delegate unknown catalog slugs to the route's standard not-found UI.
  if (!product) {
    notFound();
  }

  // Compose the successful product view from the shared site shell and details panel.
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      <ProductDetails product={product} />
      <SiteFooter />
    </div>
  );
}
