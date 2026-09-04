# Pricing Catalog

A smartphone pricing catalog built with Next.js, Contentful, TypeScript, and Tailwind CSS.

## Local development

Copy `.env.example` to `.env.local`, add the credentials (contact me if you need them for demo purpose), then run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Contentful ISR webhook
The pricing info is required to be server-rendered for this app, so I decided to implement  

The catalog uses on-demand regeneration for Contentful changes. Create a Contentful webhook with:

- Method: `POST`
- URL: `https://YOUR_DOMAIN/api/revalidate?secret=YOUR_CONTENTFUL_REVALIDATE_SECRET`
- Triggers: publish, unpublish
- Payload: customize the webhook payload to include product slug:
```
{
  "fields": {
    "slug": {
      "en-US": "{ /payload/fields/slug/en-US }"
    }
  }
}
```

Product events revalidate the homepage and the matching `/products/{slug}` page. Layout Option events revalidate the homepage.

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

Install Chromium once, then run the automated accessibility check:

```bash
npx playwright install chromium
npm run test:a11y
```

Axe checks the rendered homepage for automatically detectable WCAG 2.1 Level A and AA violations. It does not replace manual accessibility testing.

## AI multi-agent development system
See `AGENT.md` for more information.