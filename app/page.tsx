import { createClient } from "contentful";

export const dynamic = "force-static";

export default async function Page() {
  const { items } = await createClient({
    space: process.env.CONTENTFUL_SPACE_ID!,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
  }).getEntries({ content_type: "product" });

  const products = JSON.stringify(items).replaceAll("<", "\\u003c");

  return (
    <main className="p-8">
      Check the browser console for Contentful products.
      <script
        dangerouslySetInnerHTML={{
          __html: `console.log("Contentful products:", ${products})`,
        }}
      />
    </main>
  );
}
