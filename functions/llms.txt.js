import { buildLlmsText } from "./_lib/seo.js";

export async function onRequestGet({ request, env }) {
  const origin = new URL(request.url).origin;
  const body = await buildLlmsText(env, origin);
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
