import { db, json } from "../../../_lib/auth.js";
import { requireAdmin } from "../../../_lib/admin.js";
import {
  cleanCmsText,
  loadCmsCollection,
  normalizeCmsCollectionItem,
  saveCmsCollectionItem,
} from "../../../_lib/cms.js";

const collections = new Set(["vehicles", "banners", "deals", "articles", "faqs"]);

export async function onRequestGet({ request, env, params }) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const collection = params.collection;
  if (!collections.has(collection)) return json({ error: "Unknown CMS collection" }, 404);

  const url = new URL(request.url);
  const query = cleanCmsText(url.searchParams.get("q"), 120);
  const status = cleanCmsText(url.searchParams.get("status"), 24);
  const items = await loadCmsCollection(env, collection, { query, status });
  const [seed] = await db(env)`SELECT value FROM settings WHERE key = 'cms_seed_v1'`;
  return json({ items, count: items.length, seeded: seed?.value === "complete" });
}

export async function onRequestPost({ request, env, params }) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const collection = params.collection;
  if (!collections.has(collection)) return json({ error: "Unknown CMS collection" }, 404);

  const body = await request.json().catch(() => null);
  const normalized = normalizeCmsCollectionItem(collection, body || {});
  if (normalized.error) return json({ error: normalized.error }, 400);

  const item = await saveCmsCollectionItem(env, collection, body || {});
  return json({ item }, 201);
}
