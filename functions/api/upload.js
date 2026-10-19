import { getUserId, json } from "../_lib/auth.js";

// POST /api/upload  (multipart form field "file") -> stores in R2, returns the key.
export async function onRequestPost({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return json({ error: "file required" }, 400);

  const key = `${userId}/${crypto.randomUUID()}-${file.name}`;
  await env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return json({ key }, 201);
}
