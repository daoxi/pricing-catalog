import type { NextApiRequest, NextApiResponse } from "next";

// This Pages API route is intentionally kept alongside the App Router pages.
// Next.js exposes res.revalidate() here, allowing Contentful to eagerly rebuild
// static catalog pages as soon as an entry changes.
interface RevalidationResponse {
  revalidated?: boolean;
  paths?: string[];
  message?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// Webhook payloads are external input, so read nested values through type guards
// instead of assuming that Contentful always sends the expected object shape.
function getRecord(value: unknown, key: string): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const nestedValue = value[key];
  return isRecord(nestedValue) ? nestedValue : undefined;
}

function getLocalizedString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (!isRecord(value)) {
    return undefined;
  }

  // Default Contentful payloads store fields by locale, for example:
  // { "en-US": "apple-iphone-17" }. Use the first populated locale.
  return Object.values(value).find(
    (localizedValue): localizedValue is string =>
      typeof localizedValue === "string" && Boolean(localizedValue.trim()),
  )?.trim();
}

function getQueryValue(value: string | string[] | undefined): string | undefined {
  // Next.js query parameters can be repeated and therefore typed as an array.
  return Array.isArray(value) ? value[0] : value;
}

function getContentType(body: unknown): string | undefined {
  // Contentful identifies the model at sys.contentType.sys.id.
  const sys = getRecord(body, "sys");
  const contentType = getRecord(sys, "contentType");
  const contentTypeSys = getRecord(contentType, "sys");
  const id = contentTypeSys?.id;

  return typeof id === "string" ? id : undefined;
}

function getProductSlug(body: unknown): string | undefined {
  const fields = getRecord(body, "fields");
  return getLocalizedString(fields?.slug);
}

function isValidSlug(slug: string): boolean {
  // Only permit catalog-style slugs so webhook input cannot target arbitrary paths.
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<RevalidationResponse>,
) {
  // Contentful webhooks are configured as POST requests; reject all other methods.
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ message: "Method not allowed" });
  }

  const configuredSecret = process.env.CONTENTFUL_REVALIDATE_SECRET;

  // Fail closed when the server secret is missing or does not match the webhook URL.
  if (!configuredSecret) {
    return response.status(503).json({ message: "Revalidation secret is not configured" });
  }

  if (getQueryValue(request.query.secret) !== configuredSecret) {
    return response.status(401).json({ message: "Invalid revalidation secret" });
  }

  const body: unknown = request.body;
  const contentType = getContentType(body);
  // The optional query slug supports custom deletion/unpublish payloads that no
  // longer contain fields.slug. Normal publish events read the slug from the body.
  const requestedSlug = getQueryValue(request.query.slug);
  const productSlug = requestedSlug ?? getProductSlug(body);

  // Every CMS change can affect catalog cards or layout options, so the homepage
  // is always regenerated. A Set prevents duplicate path work.
  const paths = new Set<string>(["/"]);

  // Product events refresh both the catalog and the affected static detail page.
  if ((!contentType || contentType === "product") && productSlug && isValidSlug(productSlug)) {
    paths.add(`/products/${productSlug}`);
  }

  try {
    // Eagerly regenerate each exact SSG path now, rather than waiting for a visitor.
    for (const path of paths) {
      await response.revalidate(path);
    }

    return response.status(200).json({ revalidated: true, paths: Array.from(paths) });
  } catch (error: unknown) {
    // Next.js keeps serving the last successful static version if regeneration fails.
    const message = error instanceof Error ? error.message : "Unknown revalidation error";
    console.error(`Contentful webhook revalidation failed: ${message}`);
    return response.status(500).json({ message: "Unable to revalidate catalog pages" });
  }
}
