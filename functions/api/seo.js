import { json } from "../_lib/auth.js";
import { resolvePageSeo } from "../_lib/seo.js";
import { normalizeRoutePath } from "../_lib/seo-paths.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const path = normalizeRoutePath(url.searchParams.get("path") || "/");
  const seo = path ? await resolvePageSeo(env, path, url.origin) : null;
  if (!seo) return json({ error: "Unknown public page." }, 404);

  const status = seo.status || (seo.notFound ? 404 : 200);
  const response = json({
    title: seo.title,
    description: seo.description,
    canonicalUrl: seo.canonicalUrl,
    imageUrl: seo.imageUrl,
    imageAlt: seo.imageAlt,
    robots: seo.robots,
    siteName: seo.siteName,
    structuredData: seo.structuredData,
  }, status);
  response.headers.set("Cache-Control", status === 200 ? "public, max-age=0, s-maxage=60, stale-while-revalidate=300" : "no-store");
  return response;
}
