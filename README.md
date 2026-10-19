# Autoace Zambia

$0 MVP stack:

| Layer    | Service                          |
|----------|----------------------------------|
| Frontend | Cloudflare Pages (Vite + React)  |
| API      | Cloudflare Pages Functions       |
| Database | Neon Postgres (`autoace-zambia`, eu-central-1) |
| Auth     | Clerk                            |
| Email    | Resend                           |
| Storage  | Cloudflare R2 (`autoace-zambia-files`) |

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` (for `VITE_CLERK_PUBLISHABLE_KEY`) and to `.dev.vars` (for the server secrets).
3. Get `DATABASE_URL` from the Neon console (project `autoace-zambia`). Schema is in `db/schema.sql` and is already applied.
4. Enable R2 in the Cloudflare dashboard, then create the bucket: `npx wrangler r2 bucket create autoace-zambia-files`.
5. Run locally: `npm run build && npm run preview` (Pages Functions + R2), or `npm run dev` with `npm run preview` running alongside.
6. Deploy: `npm run deploy`, then add the secrets in the Pages project settings.

## API

- `GET /api/listings` public list
- `POST /api/listings` create (Clerk auth required; also mirrors the user into Neon and sends a welcome email)
- `POST /api/upload` upload a file to R2 (auth required)
- `GET /api/files/<key>` read a file from R2
