import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CmsErrorState } from "@/components/cms-error-state";
import { ProductDetails } from "@/components/product-details";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCatalogData } from "@/lib/contentful";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const catalog = await getCatalogData();

  if (catalog.status === "error") {
    return [];
  }

  return catalog.products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getCatalogData();

  if (catalog.status === "error") {
    return { title: "Catalog unavailable" };
  }

  const product = catalog.products.find((item) => item.slug === slug);
  return product
    ? { title: product.title, description: product.description }
    : { title: "Product not found" };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const catalog = await getCatalogData();

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

  if (!product) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />
      <ProductDetails product={product} />
      <SiteFooter />
    </div>
  );
}
