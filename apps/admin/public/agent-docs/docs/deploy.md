# Deploy Shirtat admin on Vercel

This app is the `apps/admin` directory of the Shirtat shop repo. Create a **separate** Vercel project with its root directory set to `apps/admin`. Do not deploy it as part of the storefront project. The storefront theme and the admin theme stay in different projects.

The app is TanStack Start on Vite. Production builds use Nitro's `vercel` preset, which writes `.vercel/output`. `vercel.json` sets `"framework": null` so Vercel does not treat the directory as Next.js.

## Project settings

| Setting | Value |
| --- | --- |
| Root Directory | `apps/admin` |
| Framework Preset | Other (`vercel.json` sets `framework` to `null`) |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | Leave empty. Nitro writes `.vercel/output`. |
| Node.js | 22 or newer |

Do not add a Wrangler build, a Cloudflare target, or an Output Directory that points at `dist`.

## Environment variables

Set these on the Vercel project. Do not commit them. None of the auth or database values use a `NEXT_PUBLIC_` or `VITE_` prefix.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes, for auth | Neon Postgres **pooled** URL (`-pooler` in the host, `sslmode=require`). The app sets `prepare: false` for pooler hosts. |
| `BETTER_AUTH_SECRET` | Yes, in production | `openssl rand -base64 32`. At least 32 characters. Production (`VERCEL_ENV=production`) refuses to boot without it. |
| `BETTER_AUTH_URL` | Yes, for auth | Exact `https` origin of this admin app, path `/` only. Example: `https://admin.shirtat.co`. |
| `OWNER_EMAIL` | For the owner script | Defaults to `moe@10claws.com` when unset. |
| `OWNER_PASSWORD` | For the owner script | Used only by `npm run auth:ensure-owner`. Never printed and never committed. |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | For catalog and sitemap counts | Same name the storefront uses, for example `shirtatco.myshopify.com`. Read on the server. |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | For catalog and sitemap counts | Storefront API token. Read on the server. Unset shows Not connected. |
| `GSC_CLIENT_ID` | Optional | Search Console OAuth client. Unset shows Not connected. |
| `GSC_CLIENT_SECRET` | Optional | Search Console OAuth secret. |
| `GSC_REFRESH_TOKEN` | Optional | Search Console refresh token for `sc-domain:shirtat.co`. |

`DATA_SOURCE=db` is invalid. Leave `DATA_SOURCE` unset. A missing `BETTER_AUTH_SECRET` outside production is demo mode: the SEO page renders without a database. Do not rely on that in production.

## Database

Provision Neon from the Vercel Marketplace. You need two URLs:

1. **Pooled** URL as `DATABASE_URL` on the Vercel project (the running app).
2. **Direct** (non-pooler) URL for migrations. From a private shell, with that direct URL exported as `DATABASE_URL`:

```sh
cd apps/admin
npm ci
npm run db:migrate -- --allow-remote
```

That command applies every migration in `src/server/db/migrations`, including `seo_task_check`. Until that table exists, `/dashboard/seo` stays read-only and shows the plan statuses.

Then create the owner. Export the pooled or direct URL, the auth secret, `BETTER_AUTH_URL`, `OWNER_EMAIL` and `OWNER_PASSWORD` in the same private shell:

```sh
npm run auth:ensure-owner
```

The command prints the email and whether the account was created. It does not print the password. Public sign-up is closed. The owner invites designers from the Designers page; that page shows the generated password once.

There is no email provider. Share the one-time password through a channel you already trust.

## Storefront handoff

The shop route `/admin/seo` stays in place. Set `SHIRTAT_ADMIN_URL` on the **storefront** project to this app's origin when you want owners to be redirected. Leave it unset until this project is live.

## Local demo

```sh
cd apps/admin
npm ci
npm run dev
```

Open `http://localhost:3000/`. With no `BETTER_AUTH_SECRET`, `/` redirects to the SEO plan and `/auth/v2/login` shows the invite-only sign-in form without creating a session.
