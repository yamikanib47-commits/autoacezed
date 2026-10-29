-- Autoace Zambia schema. Already applied to Neon project "autoace-zambia" (database: autoace). All tables start empty.

-- Mirror of Clerk users (created on first admin sign-in or first listing)
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, full_name TEXT, phone TEXT, role TEXT NOT NULL DEFAULT 'customer', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS listings (id BIGSERIAL PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT, price_zmw NUMERIC(12,2), status TEXT NOT NULL DEFAULT 'draft', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS listing_images (id BIGSERIAL PRIMARY KEY, listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE, r2_key TEXT NOT NULL, sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now());

-- Leads: buy requests, sell submissions, agent applications (type-specific fields live in details JSONB)
CREATE TABLE leads (id BIGSERIAL PRIMARY KEY, reference_id TEXT NOT NULL UNIQUE, kind TEXT NOT NULL CHECK (kind IN ('buy','sell','agent')), status TEXT NOT NULL, name TEXT NOT NULL, whatsapp TEXT NOT NULL, location TEXT, notes TEXT, details JSONB NOT NULL DEFAULT '{}'::jsonb, user_id TEXT, ip_hash TEXT, assigned_to TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX idx_leads_kind_status_created ON leads(kind, status, created_at DESC);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_leads_whatsapp ON leads(whatsapp, created_at DESC);
CREATE INDEX idx_leads_ip ON leads(ip_hash, created_at DESC);
CREATE TABLE lead_events (id BIGSERIAL PRIMARY KEY, lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE, actor TEXT, action TEXT NOT NULL, from_status TEXT, to_status TEXT, note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX idx_lead_events_lead ON lead_events(lead_id, created_at DESC);
CREATE TABLE lead_photos (id BIGSERIAL PRIMARY KEY, lead_id BIGINT REFERENCES leads(id) ON DELETE CASCADE, r2_key TEXT NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now());

-- Showroom
CREATE TABLE dealers (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT, whatsapp TEXT, address TEXT, town TEXT, status TEXT NOT NULL DEFAULT 'active', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE vehicles (id BIGSERIAL PRIMARY KEY, slug TEXT NOT NULL UNIQUE, dealer_id BIGINT REFERENCES dealers(id) ON DELETE SET NULL, make TEXT NOT NULL, model TEXT NOT NULL, trim TEXT, body_style TEXT, fuel_type TEXT, gearbox TEXT, engine_size TEXT, year INT, mileage_km INT, price_zmw NUMERIC(14,2), monthly_zmw NUMERIC(14,2), condition TEXT NOT NULL DEFAULT 'Used', location TEXT, features TEXT[] NOT NULL DEFAULT '{}', tags TEXT[] NOT NULL DEFAULT '{}', description TEXT, specs JSONB NOT NULL DEFAULT '[]'::jsonb, status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','sold')), sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX idx_vehicles_status_sort ON vehicles(status, sort_order, created_at DESC);
CREATE TABLE vehicle_images (id BIGSERIAL PRIMARY KEY, vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE, r2_key TEXT NOT NULL, sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX idx_vehicle_images_vehicle ON vehicle_images(vehicle_id, sort_order);

-- CMS content (nothing shows on the site until active / published)
CREATE TABLE banners (id BIGSERIAL PRIMARY KEY, slot TEXT NOT NULL, title TEXT, body TEXT, image_key TEXT, link_url TEXT, active BOOLEAN NOT NULL DEFAULT false, sort_order INT NOT NULL DEFAULT 0, starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX idx_banners_slot ON banners(slot, active, sort_order);
CREATE TABLE deals (id BIGSERIAL PRIMARY KEY, title TEXT NOT NULL, image_key TEXT, tag TEXT, budget_query TEXT, active BOOLEAN NOT NULL DEFAULT false, sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE articles (id BIGSERIAL PRIMARY KEY, kind TEXT NOT NULL CHECK (kind IN ('review','news','video')), title TEXT NOT NULL, summary TEXT, body TEXT, image_key TEXT, meta TEXT, video_url TEXT, status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')), sort_order INT NOT NULL DEFAULT 0, published_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX idx_articles_kind_status ON articles(kind, status, sort_order);
CREATE TABLE faqs (id BIGSERIAL PRIMARY KEY, question TEXT NOT NULL, answer TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT true, sort_order INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE media (id BIGSERIAL PRIMARY KEY, r2_key TEXT NOT NULL UNIQUE, kind TEXT NOT NULL DEFAULT 'content', mime TEXT, size_bytes INT, alt TEXT, uploaded_by TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
