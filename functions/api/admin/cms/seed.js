import { json } from "../../../_lib/auth.js";
import { requireAdmin } from "../../../_lib/admin.js";
import { normalizeCmsCollectionItem, seedCmsContent } from "../../../_lib/cms.js";

const collections = ["vehicles", "banners", "deals", "articles", "faqs"];

export async function onRequestPost({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (admin instanceof Response) return admin;

  const body = await request.json().catch(() => null);
  if (!body || body.version !== 1 || collections.some((name) => !Array.isArray(body[name]) || body[name].length > 200)) {
    return json({ error: "Invalid current-site content import." }, 400);
  }

  for (const collection of collections) {
    for (const item of body[collection]) {
      const normalized = normalizeCmsCollectionItem(collection, item);
      if (normalized.error) return json({ error: `${collection}: ${normalized.error}` }, 400);
    }
  }

  try {
    const result = await seedCmsContent(env, body);
    if (result.already) return json({ alreadySeeded: true, added: {} });
    if (result.conflict) return json({ error: result.reason }, 409);
    return json({ alreadySeeded: false, added: result.counts || {} });
  } catch (error) {
    console.error("CMS content import failed", error);
    return json({ error: "Content import failed. No partial import was saved; please try again." }, 500);
  }
}
