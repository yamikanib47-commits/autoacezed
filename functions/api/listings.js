import { db, getUserId, ensureUser, json } from "../_lib/auth.js";

export async function onRequestGet({ env }) {
  const rows = await db(env)`SELECT id, title, description, price_zmw, status FROM listings ORDER BY created_at DESC LIMIT 50`;
  return json(rows);
}

export async function onRequestPost({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ error: "Unauthorized" }, 401);
  await ensureUser(userId, env);

  const { title, description = null, price_zmw = null } = await request.json();
  if (!title) return json({ error: "title required" }, 400);

  const [row] = await db(env)`
    INSERT INTO listings (owner_id, title, description, price_zmw, status)
    VALUES (${userId}, ${title}, ${description}, ${price_zmw}, 'published')
    RETURNING id, title`;
  return json(row, 201);
}
