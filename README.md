# PocketPrice

A statically generated smartphone pricing catalog built with Next.js, Contentful, TypeScript, and Tailwind CSS.

## Local development

Copy `.env.example` to `.env.local`, add the Contentful delivery credentials and a long random revalidation secret, then run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Contentful ISR webhook

The catalog uses eager on-demand regeneration for Contentful changes. Create a Contentful webhook with:

- Method: `POST`
- URL: `https://YOUR_DOMAIN/api/revalidate?secret=YOUR_CONTENTFUL_REVALIDATE_SECRET`
- Triggers: publish, unpublish, and delete events for Product and Layout Option entries
- Payload: Contentful's default entry payload

Product events revalidate the homepage and the matching `/products/{slug}` page. Layout Option events revalidate the homepage. For a custom or deletion payload that does not include `fields.slug`, append `&slug=product-slug` to revalidate that product path explicitly.

For local testing, use:

```text
http://localhost:3000/api/revalidate?secret=YOUR_CONTENTFUL_REVALIDATE_SECRET
```

Do not expose the secret in client-side code or commit it to the repository.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm run build
```
