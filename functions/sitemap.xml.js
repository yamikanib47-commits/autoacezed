import { buildSitemapXml } from "./_lib/seo.js";

export async function onRequestGet({ request, env }) {
  const origin = new URL(request.url).origin;
  const body = await buildSitemapXml(env, origin);
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
