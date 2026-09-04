# Pricing Catalog

A smartphone pricing catalog built with Next.js, Contentful, TypeScript, and Tailwind CSS.

Deployed live on Vercel at:

[https://pricing-catalog.vercel.app](http://pricing-catalog.vercel.app)

## Local development

Copy `.env.example` to `.env.local`, add the credentials (contact me if you need them for demo purpose), then run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## SSR/SSG Approach (Contentful ISR webhook)
The pricing info is required to be server-rendered for this app, so I decided to implement on-demand Incremental Static Regeneration (ISR) for Contentful changes, because ISR has the performance of SSG (Static Site Generation) and flexibility of traditional SSR (Server-Side Rendering).

Create a Contentful webhook with:
- Method: `POST`
- URL: `https://YOUR_DOMAIN/api/revalidate?secret=YOUR_CONTENTFUL_REVALIDATE_SECRET`
- Triggers: publish, unpublish
- Payload: customize the webhook payload to include the product slug, structured like the following:
```
{
  "fields": {
    "slug": {
      "en-US": "{ /payload/fields/slug/en-US }"
    }
  }
}
```

When auto-triggered, this webhook will revalidate the homepage and the matching `/products/{slug}` page, causing them to be re-rendered on the server side.

## Validation

```bash
npm run lint
npm run build
```

Install Chromium (for Playwright) once, then run the automated accessibility check:

```bash
npx playwright install chromium
npm run test:a11y
```

The Playwright setup uses Axe which checks the rendered page for automatically detectable WCAG 2.1 Level A and AA violations.

## AI multi-agent development system
See `AGENT.md` for more information.

## Architecture decisions

- Contentful is the source of data for products info and layout options, static rendering with on-demand ISR is used, providing fast pages while allowing Contentful webhooks to refresh changed content.
- Next.js codebase is broken into smaller and reusable components to keep it organized, and Tailwind CSS provides all component styling.
- For architecture decisions for the multi-agent development system, refer to `AGENT.md`.

## What I would improve
- Add pagination or infinite scrolling as the product catalog grows.
- Add unit and integration tests for filtering, authentication, and revalidation behavior.
- For the multi-agent system, split the programmer role into a few more specialized dev roles and run them in parallel in the workflow, allow human intervention while the workflow is still running.

