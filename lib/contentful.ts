import "server-only";

import { createClient } from "contentful";
import { cache } from "react";

import type {
  CatalogData,
  CatalogLayout,
  Product,
  ProductImageData,
  SmartphoneAttributes,
} from "@/lib/catalog-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRecord(value: unknown, key: string): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const nestedValue = value[key];
  return isRecord(nestedValue) ? nestedValue : undefined;
}

function getString(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const nestedValue = value[key];
  return typeof nestedValue === "string" && nestedValue.trim()
    ? nestedValue.trim()
    : undefined;
}

function getNumber(value: unknown, key: string): number | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const nestedValue = value[key];
  return typeof nestedValue === "number" && Number.isFinite(nestedValue)
    ? nestedValue
    : undefined;
}

function normalizeImage(value: unknown, productTitle: string): ProductImageData | undefined {
  const fields = getRecord(value, "fields");
  const file = getRecord(fields, "file");
  const rawUrl = getString(file, "url");

  if (!rawUrl) {
    return undefined;
  }

  const details = getRecord(file, "details");
  const dimensions = getRecord(details, "image");

  return {
    url: rawUrl.startsWith("//") ? `https:${rawUrl}` : rawUrl,
    alt: getString(fields, "description") ?? getString(fields, "title") ?? productTitle,
    width: getNumber(dimensions, "width") ?? 800,
    height: getNumber(dimensions, "height") ?? 800,
  };
}

function normalizeAttributes(value: unknown): SmartphoneAttributes {
  return {
    weight: getString(value, "weight"),
    build: getString(value, "build"),
    resolution: getString(value, "resolution"),
    chipset: getString(value, "chipset"),
    memory: getString(value, "memory"),
    headphoneJack: getString(value, "headphoneJack"),
    battery: getString(value, "battery"),
    repairability: getString(value, "repairability"),
  };
}

function normalizeProduct(entry: unknown): Product | undefined {
  const sys = getRecord(entry, "sys");
  const fields = getRecord(entry, "fields");
  const id = getString(sys, "id");
  const title = getString(fields, "title");
  const slug = getString(fields, "slug");
  const category = getString(fields, "category");
  const priceLoggedOut = getNumber(fields, "priceLoggedOut");
  const priceAuthenticated = getNumber(fields, "priceAuthenticated");
  const cardSet = getString(fields, "cardSet");

  // Skip malformed CMS records rather than letting one entry break the catalog.
  if (
    !id ||
    !title ||
    !slug ||
    (category !== "Android" && category !== "iOS") ||
    priceLoggedOut === undefined ||
    priceAuthenticated === undefined ||
    (cardSet !== "A" && cardSet !== "B")
  ) {
    return undefined;
  }

  return {
    id,
    title,
    slug,
    description: getString(fields, "description") ?? "",
    category,
    priceLoggedOut,
    priceAuthenticated,
    cardSet,
    attributes: normalizeAttributes(fields?.attributes),
    image: normalizeImage(fields?.image, title),
  };
}

function normalizeLayout(entry: unknown): CatalogLayout | undefined {
  const layout = getString(getRecord(entry, "fields"), "layout");
  return layout === "Price First" || layout === "Specs First" ? layout : undefined;
}

async function fetchCatalogData(): Promise<CatalogData> {
  const space = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;

  if (!space || !accessToken) {
    console.error("Contentful credentials are not configured.");
    return { status: "error", products: [], layouts: [] };
  }

  try {
    const client = createClient({ space, accessToken });
    const [productEntries, layoutEntries] = await Promise.all([
      client.getEntries({ content_type: "product", include: 1 }),
      client.getEntries({ content_type: "layoutOption" }),
    ]);

    const products = productEntries.items
      .map(normalizeProduct)
      .filter((product): product is Product => product !== undefined);
    const layouts = layoutEntries.items
      .map(normalizeLayout)
      .filter((layout): layout is CatalogLayout => layout !== undefined);

    return { status: "success", products, layouts };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown Contentful error";
    console.error(`Unable to load the Contentful catalog: ${message}`);
    return { status: "error", products: [], layouts: [] };
  }
}

// React cache de-duplicates CMS reads shared by metadata, static params, and pages.
export const getCatalogData = cache(fetchCatalogData);
