// GET /api/files/<key> -> streams an object from R2
export async function onRequestGet({ params, env }) {
  const key = [].concat(params.key).join("/");
  const obj = await env.FILES.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, { headers: { "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream" } });
}
