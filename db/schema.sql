-- Already applied to the Neon project "autoace-zambia" (database: autoace).
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,               -- Clerk user id
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS listings (
  id BIGSERIAL PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_zmw NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS listing_images (
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_listings_owner ON listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON listing_images(listing_id);

-- Buyer requests, car-sale submissions and agent applications from the home page
CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('find','sell','agent')),
  phone TEXT NOT NULL,
  car TEXT,
  budget TEXT,
  user_id TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_kind_created ON leads(kind, created_at DESC);
