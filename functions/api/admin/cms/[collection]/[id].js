import { json } from "../../../../_lib/auth.js";
import { requireAdmin } from "../../../../_lib/admin.js";
import {
  deleteCmsCollectionItem,
  normalizeCmsCollectionItem,
  saveCmsCollectionItem,
} from "../../../../_lib/cms.js";

const collections = new Set(["vehicles", "banners", "deals", "articles", "faqs"]);

export async function onRequestPatch({ request, env, params }) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const collection = params.collection;
  if (!collections.has(collection)) return json({ error: "Unknown CMS collection" }, 404);
  const body = await request.json().catch(() => null);
  const normalized = normalizeCmsCollectionItem(collection, body || {});
  if (normalized.error) return json({ error: normalized.error }, 400);

  const item = await saveCmsCollectionItem(env, collection, body || {}, params.id);
  if (!item) return json({ error: "CMS item not found" }, 404);
  return json({ item });
}

export async function onRequestDelete({ request, env, params }) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const collection = params.collection;
  if (!collections.has(collection)) return json({ error: "Unknown CMS collection" }, 404);
  const deleted = await deleteCmsCollectionItem(env, collection, params.id);
  if (!deleted) return json({ error: "CMS item not found" }, 404);
  return json({ ok: true });
}
