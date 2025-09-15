This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Data

- The application reads a merged dataset from `var/data/merged.json` (not public).
- To refresh or build it locally, run:

```bash
pnpm run update:data        # fetch new data and rebuild var/data/merged.json
pnpm run update:data:dry    # dry‑run plan (no writes)
pnpm run update:data:oldest # pivot from oldest date
```

The previous `public/merged.json` path is no longer used (file is not exposed publicly).

### Architecture rapide

- Front (App Router): pages dans `src/app/*`, composants UI atomiques → molécules → organismes dans `src/components/*`.
- Domaine jobs: API hooks + endpoints + utils dans `src/features/jobs/*` (séparé par `api/`, `types/`, `utils/`, `ui/`, `hooks/`).
- Serveur (server-only): lecture dataset + calculs + caches mémoire dans `src/server/jobs/*`.
- State/query: React Query v5 avec clés stables (`features/jobs/api/queryKeys.ts`).
- Validation: Zod pour schémas (requêtes API et données).
- Accessibilité: composants avec ARIA, focus-visible, et navigation clavier.

## Export limits

- API route `/api/export` streams CSV for large exports to reduce memory usage.
- XLSX export is allowed up to a configurable limit (default 50,000 rows).
  - Configure with `EXPORT_XLSX_LIMIT` env var (min 1,000, max 250,000).

## Admin: cache refresh

Expose a simple admin endpoint to clear in-memory caches (dataset repo cache, facets cache, analytics caches):

- Set an environment variable `ADMIN_SECRET`.
- Call `POST /api/admin/cache/refresh` with header `x-admin-secret: <ADMIN_SECRET>`.
- Optional query `?warm=true` will precompute facets after clearing.
- Security: POST-only, header-only auth (no query secret).

Example (curl):

```bash
curl -X POST \
  -H "x-admin-secret: $ADMIN_SECRET" \
  "http://localhost:3000/api/admin/cache/refresh?warm=true"
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
