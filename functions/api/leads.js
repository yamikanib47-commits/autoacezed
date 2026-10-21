import { db, getUserId, json } from "../_lib/auth.js";

const KINDS = ["find", "sell", "agent"];

// POST /api/leads  { kind: "find"|"sell"|"agent", phone, car?, budget? }
// Public (no sign-in needed). If a Clerk token is sent, the user id is saved too.
export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const kind = String(b.kind || "");
  const phone = String(b.phone || "").replace(/[^\d+]/g, "");
  if (!KINDS.includes(kind)) return json({ error: "Invalid request type" }, 400);
  if (phone.length < 9 || phone.length > 15) return json({ error: "Please enter a valid phone number" }, 400);

  const car = String(b.car || "").trim().slice(0, 120) || null;
  const budget = String(b.budget || "").trim().slice(0, 40) || null;
  const userId = await getUserId(request, env);

  await db(env)`INSERT INTO leads (kind, phone, car, budget, user_id) VALUES (${kind}, ${phone}, ${car}, ${budget}, ${userId})`;
  return json({ ok: true }, 201);
}
