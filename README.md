# Autoace Zambia

## Live deployment

- Site: <https://autoacezambia.pages.dev>
- Cloudflare Pages project: `autoacezambia`
- Production branch: `main` (a push to GitHub `main` triggers deployment)

## Stack

| Layer | Service |
|---|---|
| Frontend | Vite, React and TypeScript on Cloudflare Pages |
| API | Cloudflare Pages Functions |
| Database | Neon Postgres (`autoace-zambia`) |
| Authentication | Clerk |
| Email notifications | Resend (optional) |
| Media storage | Cloudflare R2 (`autoace-zambia-files`, binding `FILES`) |

## Admin

- `/admin` is the lead CRM for buy, sell and agent enquiries.
- `/admin/cms` manages vehicles, banners, deals, articles and FAQs.
- Both admin pages require Clerk sign-in and an address in the production `ADMIN_EMAILS` allowlist. Keep that allowlist in Cloudflare; do not commit it or replace its existing admin address.
- The admin pages load Clerk from `VITE_CLERK_PUBLISHABLE_KEY` at request time. Production Pages deployments require live Clerk keys; the server validates sessions using `CLERK_SECRET_KEY`.
- No sample cars, reviews, banners, articles or FAQs are seeded. Empty CMS collections stay empty on the public site until real content is published.

## Configuration

Production bindings and variables are managed in Cloudflare Pages. The current variables are `DATABASE_URL`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `ADMIN_EMAILS` and `RESEND_API_KEY`. `FILES` is the R2 bucket binding. Optional local/server settings include `EMAIL_FROM` and `IP_SALT`.

For local development, install with `npm ci`, set the Vite key in `.env`, and set the server bindings in `.dev.vars` using `.env.example` as a guide. Keep both files out of Git. `npm run dev` runs Vite; `npm run build && npm run preview` runs the built site with Pages Functions.

## Data flow

- `POST /api/leads/buy`, `/api/leads/sell` and `/api/leads/agent` save form submissions to Neon. The admin CRM reads and updates them through authenticated `/api/admin/leads` endpoints.
- `GET /api/vehicles` and `GET /api/site-content` return published CMS entries only.
- `/api/upload` and `/api/files/<key>` handle media stored in R2.
- The legacy `/api/listings` endpoint remains separate from the managed vehicle catalogue.

For a manual production deploy, run `npm run deploy`; it targets the existing `autoacezambia` Pages project.
