import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  const secret = process.env.CONTENTFUL_REVALIDATE_SECRET;

  // Only requests containing the configured Contentful webhook secret may revalidate pages.
  if (!secret || request.query.secret !== secret) {
    return response.status(401).json({ message: "Invalid revalidation secret" });
  }

  try {
    // Every Contentful change can affect the catalog homepage.
    const paths = ["/"];
    const slug: unknown = request.body?.fields?.slug?.["en-US"];

    // Product payloads include a localized slug, so refresh that detail page as well.
    if (typeof slug === "string" && slug) {
      paths.push(`/products/${slug}`);
    }

    for (const path of paths) {
      await response.revalidate(path);
    }

    return response.status(200).json({ revalidated: true, paths });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown revalidation error";
    console.error(`Contentful webhook revalidation failed: ${message}`);
    return response.status(500).json({ message: "Unable to revalidate catalog pages" });
  }
}
